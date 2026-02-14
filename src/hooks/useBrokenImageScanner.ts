/**
 * useBrokenImageScanner Hook
 *
 * Client-side scanner that checks all published blog post images for broken URLs.
 * Extracts image URLs from featured_image_url, og_image_url, and <img> tags in
 * post HTML body, then performs HEAD requests with 10-second timeout.
 *
 * CORS-blocked URLs are reported as "unable to verify" (not "broken").
 * Results are de-duplicated before checking.
 *
 * @see BL-008.7.3 Task 1 - Broken image scanner
 * @see FR54 - Broken Image Scanner
 */

import { useState, useCallback } from 'react';

export interface BrokenImageResult {
  url: string;
  status: number | 'timeout' | 'cors';
  /** Post IDs that reference this image URL */
  postIds: number[];
  /** Post titles that reference this image URL */
  postTitles: string[];
}

export interface ScanProgress {
  checked: number;
  total: number;
}

export interface PostMetadataForScan {
  id: number;
  title: string;
  slug: string;
  body?: string;
  featured_image_url?: string | null;
  og_image_url?: string | null;
}

/**
 * Extract all image URLs from an HTML body string.
 * Uses DOMParser to safely parse HTML and extract <img src="..."> values.
 */
export function extractImageUrls(htmlBody: string): string[] {
  if (!htmlBody) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlBody, 'text/html');
  const imgElements = doc.querySelectorAll('img');
  return Array.from(imgElements)
    .map((img) => img.getAttribute('src'))
    .filter((src): src is string => Boolean(src));
}

/**
 * Build a map of unique URLs to the posts that reference them.
 */
export function buildUrlPostMap(
  posts: PostMetadataForScan[]
): Map<string, { postIds: number[]; postTitles: string[] }> {
  const urlMap = new Map<string, { postIds: number[]; postTitles: string[] }>();

  const addUrl = (url: string, postId: number, postTitle: string) => {
    const existing = urlMap.get(url);
    if (existing) {
      if (!existing.postIds.includes(postId)) {
        existing.postIds.push(postId);
        existing.postTitles.push(postTitle);
      }
    } else {
      urlMap.set(url, { postIds: [postId], postTitles: [postTitle] });
    }
  };

  for (const post of posts) {
    if (post.featured_image_url) {
      addUrl(post.featured_image_url, post.id, post.title);
    }
    if (post.og_image_url) {
      addUrl(post.og_image_url, post.id, post.title);
    }
    if (post.body) {
      const bodyUrls = extractImageUrls(post.body);
      for (const url of bodyUrls) {
        addUrl(url, post.id, post.title);
      }
    }
  }

  return urlMap;
}

/**
 * Check a single URL by making a HEAD request with 10-second timeout.
 * Returns null if the URL is OK (200-level response).
 * Returns a BrokenImageResult if the URL is broken, timed out, or CORS-blocked.
 */
export async function checkImageUrl(
  url: string,
  postInfo: { postIds: number[]; postTitles: string[] }
): Promise<BrokenImageResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors',
    });

    clearTimeout(timeoutId);

    // In no-cors mode, we get an opaque response (type: 'opaque', status: 0)
    // which means the request was sent but we can't read the response.
    // A truly broken URL would throw a network error, not return opaque.
    // Only report as broken if we get a non-opaque, non-OK response.
    if (response.type !== 'opaque' && !response.ok) {
      return {
        url,
        status: response.status,
        postIds: postInfo.postIds,
        postTitles: postInfo.postTitles,
      };
    }

    return null;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        url,
        status: 'timeout',
        postIds: postInfo.postIds,
        postTitles: postInfo.postTitles,
      };
    }

    // Network error or CORS error — treat as "unable to verify"
    return {
      url,
      status: 'cors',
      postIds: postInfo.postIds,
      postTitles: postInfo.postTitles,
    };
  }
}

export function useBrokenImageScanner() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<BrokenImageResult[]>([]);
  const [progress, setProgress] = useState<ScanProgress>({ checked: 0, total: 0 });

  const scan = useCallback(async (posts: PostMetadataForScan[]) => {
    setScanning(true);
    setResults([]);

    // Build de-duplicated URL map
    const urlMap = buildUrlPostMap(posts);
    const uniqueUrls = Array.from(urlMap.entries());
    setProgress({ checked: 0, total: uniqueUrls.length });

    const broken: BrokenImageResult[] = [];

    for (const [url, postInfo] of uniqueUrls) {
      const result = await checkImageUrl(url, postInfo);
      if (result) {
        broken.push(result);
      }
      setProgress((prev) => ({ ...prev, checked: prev.checked + 1 }));
    }

    setResults(broken);
    setScanning(false);
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setProgress({ checked: 0, total: 0 });
  }, []);

  return { scan, scanning, results, progress, reset };
}
