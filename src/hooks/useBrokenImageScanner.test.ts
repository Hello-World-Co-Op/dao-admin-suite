/**
 * Tests for useBrokenImageScanner hook
 *
 * Covers:
 * - URL extraction from HTML body (DOMParser-based)
 * - URL de-duplication across posts
 * - HEAD request handling (OK, 404, timeout, CORS)
 * - Scan progress tracking
 * - Edge cases (empty posts, no images)
 *
 * @see BL-008.7.3 Task 5.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  extractImageUrls,
  buildUrlPostMap,
  checkImageUrl,
  useBrokenImageScanner,
  type PostMetadataForScan,
} from './useBrokenImageScanner';

// ============================================================================
// extractImageUrls tests
// ============================================================================

describe('extractImageUrls', () => {
  it('should extract src from img tags', () => {
    const html = '<p>text</p><img src="https://example.com/img.png" /><p>more</p>';
    const urls = extractImageUrls(html);
    expect(urls).toEqual(['https://example.com/img.png']);
  });

  it('should extract multiple img src values', () => {
    const html = `
      <img src="https://a.com/1.jpg" />
      <p>text</p>
      <img src="https://b.com/2.png" />
      <img src="https://c.com/3.webp" />
    `;
    const urls = extractImageUrls(html);
    expect(urls).toEqual([
      'https://a.com/1.jpg',
      'https://b.com/2.png',
      'https://c.com/3.webp',
    ]);
  });

  it('should return empty array for empty string', () => {
    expect(extractImageUrls('')).toEqual([]);
  });

  it('should return empty array for null-like input', () => {
    expect(extractImageUrls(undefined as unknown as string)).toEqual([]);
  });

  it('should return empty array for HTML without images', () => {
    const html = '<p>No images here</p><a href="/link">link</a>';
    expect(extractImageUrls(html)).toEqual([]);
  });

  it('should ignore img tags without src attribute', () => {
    const html = '<img alt="no-src" /><img src="https://valid.com/img.png" />';
    const urls = extractImageUrls(html);
    expect(urls).toEqual(['https://valid.com/img.png']);
  });

  it('should handle complex HTML with nested elements', () => {
    const html = `
      <div class="blog-content">
        <h1>Title</h1>
        <figure>
          <img src="https://cdn.example.com/hero.jpg" alt="Hero" />
          <figcaption>Caption</figcaption>
        </figure>
        <p>Some text with an inline <img src="https://cdn.example.com/inline.png" /> image.</p>
      </div>
    `;
    const urls = extractImageUrls(html);
    expect(urls).toEqual([
      'https://cdn.example.com/hero.jpg',
      'https://cdn.example.com/inline.png',
    ]);
  });
});

// ============================================================================
// buildUrlPostMap tests
// ============================================================================

describe('buildUrlPostMap', () => {
  it('should collect featured_image_url', () => {
    const posts: PostMetadataForScan[] = [
      { id: 1, title: 'Post 1', slug: 'post-1', featured_image_url: 'https://a.com/img.jpg' },
    ];
    const map = buildUrlPostMap(posts);
    expect(map.size).toBe(1);
    expect(map.get('https://a.com/img.jpg')).toEqual({
      postIds: [1],
      postTitles: ['Post 1'],
    });
  });

  it('should collect og_image_url', () => {
    const posts: PostMetadataForScan[] = [
      { id: 1, title: 'Post 1', slug: 'post-1', og_image_url: 'https://a.com/og.jpg' },
    ];
    const map = buildUrlPostMap(posts);
    expect(map.has('https://a.com/og.jpg')).toBe(true);
  });

  it('should collect images from HTML body', () => {
    const posts: PostMetadataForScan[] = [
      {
        id: 1,
        title: 'Post 1',
        slug: 'post-1',
        body: '<img src="https://a.com/body.jpg" />',
      },
    ];
    const map = buildUrlPostMap(posts);
    expect(map.has('https://a.com/body.jpg')).toBe(true);
  });

  it('should de-duplicate URLs across posts', () => {
    const posts: PostMetadataForScan[] = [
      { id: 1, title: 'Post 1', slug: 'post-1', featured_image_url: 'https://shared.com/img.jpg' },
      { id: 2, title: 'Post 2', slug: 'post-2', featured_image_url: 'https://shared.com/img.jpg' },
    ];
    const map = buildUrlPostMap(posts);
    expect(map.size).toBe(1);
    expect(map.get('https://shared.com/img.jpg')).toEqual({
      postIds: [1, 2],
      postTitles: ['Post 1', 'Post 2'],
    });
  });

  it('should de-duplicate within same post', () => {
    const posts: PostMetadataForScan[] = [
      {
        id: 1,
        title: 'Post 1',
        slug: 'post-1',
        featured_image_url: 'https://a.com/img.jpg',
        og_image_url: 'https://a.com/img.jpg',
        body: '<img src="https://a.com/img.jpg" />',
      },
    ];
    const map = buildUrlPostMap(posts);
    expect(map.size).toBe(1);
    expect(map.get('https://a.com/img.jpg')?.postIds).toEqual([1]);
  });

  it('should handle posts with no images', () => {
    const posts: PostMetadataForScan[] = [
      { id: 1, title: 'Post 1', slug: 'post-1', body: '<p>No images</p>' },
    ];
    const map = buildUrlPostMap(posts);
    expect(map.size).toBe(0);
  });

  it('should handle null/undefined image fields', () => {
    const posts: PostMetadataForScan[] = [
      {
        id: 1,
        title: 'Post 1',
        slug: 'post-1',
        featured_image_url: null,
        og_image_url: undefined,
      },
    ];
    const map = buildUrlPostMap(posts);
    expect(map.size).toBe(0);
  });
});

// ============================================================================
// checkImageUrl tests
// ============================================================================

describe('checkImageUrl', () => {
  const mockPostInfo = { postIds: [1], postTitles: ['Test Post'] };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null for successful response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      type: 'basic',
      status: 200,
    } as Response);

    const result = await checkImageUrl('https://example.com/ok.jpg', mockPostInfo);
    expect(result).toBeNull();
  });

  it('should return null for opaque response (no-cors success)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      type: 'opaque',
      status: 0,
    } as Response);

    const result = await checkImageUrl('https://example.com/cors.jpg', mockPostInfo);
    expect(result).toBeNull();
  });

  it('should return broken result for 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      type: 'basic',
      status: 404,
    } as Response);

    const result = await checkImageUrl('https://example.com/missing.jpg', mockPostInfo);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(404);
    expect(result?.url).toBe('https://example.com/missing.jpg');
    expect(result?.postIds).toEqual([1]);
  });

  it('should return broken result for 500', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      type: 'basic',
      status: 500,
    } as Response);

    const result = await checkImageUrl('https://example.com/error.jpg', mockPostInfo);
    expect(result?.status).toBe(500);
  });

  it('should return timeout for AbortError', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);

    const result = await checkImageUrl('https://slow.com/img.jpg', mockPostInfo);
    expect(result).not.toBeNull();
    expect(result?.status).toBe('timeout');
  });

  it('should return cors for network errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));

    const result = await checkImageUrl('https://blocked.com/img.jpg', mockPostInfo);
    expect(result).not.toBeNull();
    expect(result?.status).toBe('cors');
  });
});

// ============================================================================
// useBrokenImageScanner hook tests
// ============================================================================

describe('useBrokenImageScanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with empty state', () => {
    const { result } = renderHook(() => useBrokenImageScanner());

    expect(result.current.scanning).toBe(false);
    expect(result.current.results).toEqual([]);
    expect(result.current.progress).toEqual({ checked: 0, total: 0 });
  });

  it('should scan posts and find broken images', async () => {
    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { ok: false, type: 'basic', status: 404 } as Response;
      }
      return { ok: true, type: 'basic', status: 200 } as Response;
    });

    const posts: PostMetadataForScan[] = [
      {
        id: 1,
        title: 'Post 1',
        slug: 'post-1',
        featured_image_url: 'https://broken.com/missing.jpg',
      },
      {
        id: 2,
        title: 'Post 2',
        slug: 'post-2',
        featured_image_url: 'https://ok.com/good.jpg',
      },
    ];

    const { result } = renderHook(() => useBrokenImageScanner());

    await act(async () => {
      await result.current.scan(posts);
    });

    expect(result.current.scanning).toBe(false);
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].status).toBe(404);
    expect(result.current.progress.checked).toBe(2);
    expect(result.current.progress.total).toBe(2);
  });

  it('should handle empty post list', async () => {
    const { result } = renderHook(() => useBrokenImageScanner());

    await act(async () => {
      await result.current.scan([]);
    });

    expect(result.current.scanning).toBe(false);
    expect(result.current.results).toEqual([]);
    expect(result.current.progress).toEqual({ checked: 0, total: 0 });
  });

  it('should reset results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      type: 'basic',
      status: 404,
    } as Response);

    const posts: PostMetadataForScan[] = [
      { id: 1, title: 'Post 1', slug: 'p1', featured_image_url: 'https://x.com/img.jpg' },
    ];

    const { result } = renderHook(() => useBrokenImageScanner());

    await act(async () => {
      await result.current.scan(posts);
    });

    expect(result.current.results).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.progress).toEqual({ checked: 0, total: 0 });
  });
});
