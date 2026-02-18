/**
 * Blog Analytics API Client
 *
 * Typed fetch client for the oracle-bridge blog analytics endpoints.
 * All endpoints require admin session (credentials: 'include').
 *
 * Story BL-020.3: Admin Analytics Dashboard UI
 * Task 1: Create blog-analytics-client.ts
 *
 * @see BL-020.1 - Oracle-bridge analytics endpoint contracts
 */

// --- Type definitions matching oracle-bridge responses ---

export interface OverviewStats {
  total_views: number;
  unique_slugs_viewed: number;
  avg_read_time_seconds: number | null;
  views_by_day: { date: string; count: number }[];
}

export interface PostAnalytics {
  slug: string;
  title?: string;
  view_count: number;
  avg_read_time_seconds: number | null;
  first_viewed: string;
  last_viewed: string;
}

export interface PostAnalyticsResponse {
  posts: PostAnalytics[];
  total: number;
  page: number;
}

export interface AuthorAnalytics {
  author_principal: string;
  display_name?: string;
  total_views: number;
  post_count: number;
  avg_views_per_post: number;
  top_post_slug: string;
}

export interface AuthorAnalyticsResponse {
  authors: AuthorAnalytics[];
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

// --- Helper ---

function getOracleBridgeUrl(): string {
  return import.meta.env.VITE_ORACLE_BRIDGE_URL || '';
}

// --- API functions ---

/**
 * Fetch overview analytics for the given period.
 *
 * GET /api/blog/analytics/overview?period={period}
 *
 * @throws Error on non-2xx response
 */
export async function getOverview(period: AnalyticsPeriod): Promise<OverviewStats> {
  const url = `${getOracleBridgeUrl()}/api/blog/analytics/overview?period=${period}`;
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics overview: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch per-post analytics for the given period.
 *
 * GET /api/blog/analytics/posts?period={period}&sort={sort}&page={page}
 *
 * @param period - Time range filter
 * @param sort - Sort field, defaults to 'views'
 * @param page - Page number, defaults to 1
 * @throws Error on non-2xx response
 */
export async function getPostAnalytics(
  period: AnalyticsPeriod,
  sort: 'views' | 'read_time' = 'views',
  page: number = 1,
): Promise<PostAnalyticsResponse> {
  const params = new URLSearchParams({
    period,
    sort,
    page: String(page),
  });
  const url = `${getOracleBridgeUrl()}/api/blog/analytics/posts?${params}`;
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    throw new Error(`Failed to fetch post analytics: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch per-author analytics for the given period.
 *
 * GET /api/blog/analytics/authors?period={period}
 *
 * @throws Error on non-2xx response
 */
export async function getAuthorAnalytics(
  period: AnalyticsPeriod,
): Promise<AuthorAnalyticsResponse> {
  const url = `${getOracleBridgeUrl()}/api/blog/analytics/authors?period=${period}`;
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    throw new Error(`Failed to fetch author analytics: ${response.status}`);
  }

  return response.json();
}
