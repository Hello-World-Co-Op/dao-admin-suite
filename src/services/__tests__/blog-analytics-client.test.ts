/**
 * Tests for blog-analytics-client service module
 *
 * Story BL-020.3: Admin Analytics Dashboard UI
 * Task 1.7: Unit tests for analytics client functions
 *
 * @see AC10 - Minimum 3 tests for blog-analytics-client.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getOverview,
  getPostAnalytics,
  getAuthorAnalytics,
} from '../blog-analytics-client';
import type {
  OverviewStats,
  PostAnalyticsResponse,
  AuthorAnalyticsResponse,
} from '../blog-analytics-client';

describe('blog-analytics-client', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    vi.stubEnv('VITE_ORACLE_BRIDGE_URL', 'https://oracle.test');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('getOverview', () => {
    it('fetches correct URL with period param and returns data', async () => {
      const mockData: OverviewStats = {
        total_views: 1234,
        unique_slugs_viewed: 42,
        avg_read_time_seconds: 84,
        views_by_day: [
          { date: '2026-02-15', count: 10 },
          { date: '2026-02-16', count: 15 },
        ],
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), { status: 200 }),
      );

      const result = await getOverview('30d');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://oracle.test/api/blog/analytics/overview?period=30d',
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(result.total_views).toBe(1234);
      expect(result.unique_slugs_viewed).toBe(42);
      expect(result.avg_read_time_seconds).toBe(84);
      expect(result.views_by_day).toHaveLength(2);
    });
  });

  describe('getPostAnalytics', () => {
    it('fetches with sort and page params', async () => {
      const mockData: PostAnalyticsResponse = {
        posts: [
          {
            slug: 'test-post',
            title: 'Test Post Title',
            view_count: 100,
            avg_read_time_seconds: 60,
            first_viewed: '2026-02-10T00:00:00Z',
            last_viewed: '2026-02-16T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), { status: 200 }),
      );

      const result = await getPostAnalytics('7d', 'views', 2);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('period=7d'),
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('sort=views'),
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].slug).toBe('test-post');
    });
  });

  describe('getAuthorAnalytics', () => {
    it('throws when non-2xx response (401 error)', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 }),
      );

      await expect(getAuthorAnalytics('30d')).rejects.toThrow(
        'Failed to fetch author analytics: 401',
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://oracle.test/api/blog/analytics/authors?period=30d',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    it('fetches author analytics and returns data', async () => {
      const mockData: AuthorAnalyticsResponse = {
        authors: [
          {
            author_principal: 'abc123def456',
            display_name: 'Alice Author',
            total_views: 500,
            post_count: 5,
            avg_views_per_post: 100,
            top_post_slug: 'best-post',
          },
        ],
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), { status: 200 }),
      );

      const result = await getAuthorAnalytics('90d');

      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].display_name).toBe('Alice Author');
      expect(result.authors[0].total_views).toBe(500);
    });
  });
});
