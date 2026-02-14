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
 *
 * Uses default 'cors' mode so we can read actual HTTP status codes.
 * - Same-origin images (IC asset canister): return real HTTP status -> detect 404
 * - Cross-origin with CORS headers: return real HTTP status -> detect 404
 * - Cross-origin without CORS headers: throw TypeError -> categorize as "cors" (unable to verify)
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
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
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

    // TypeError from fetch = CORS or network error — treat as "unable to verify"
    return {
      url,
      status: 'cors',
      postIds: postInfo.postIds,
      postTitles: postInfo.postTitles,
    };
  }
}

function getOracleBridgeUrl(): string {
  return import.meta.env.VITE_ORACLE_BRIDGE_URL || '';
}

/**
 * Fetch all published posts from the blog canister via oracle-bridge.
 * Uses a large page size to get all posts in a single request,
 * with status=Published filter applied server-side.
 */
export async function fetchAllPublishedPosts(): Promise<PostMetadataForScan[]> {
  const oracleBridgeUrl = getOracleBridgeUrl();
  const params = new URLSearchParams({
    page: '1',
    page_size: '1000',
    status: 'Published',
  });

  const response = await fetch(`${oracleBridgeUrl}/api/blog/posts?${params}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch published posts: ${response.status}`);
  }

  const data = await response.json();
  return (data.posts || []) as PostMetadataForScan[];
}

export function useBrokenImageScanner() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<BrokenImageResult[]>([]);
  const [progress, setProgress] = useState<ScanProgress>({ checked: 0, total: 0 });
  const [fetchError, setFetchError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    setScanning(true);
    setResults([]);
    setFetchError(null);

    let posts: PostMetadataForScan[];
    try {
      posts = await fetchAllPublishedPosts();
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch posts');
      setScanning(false);
      return;
    }

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
    setFetchError(null);
  }, []);

  return { scan, scanning, results, progress, reset, fetchError };
}
