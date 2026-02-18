/**
 * AnalyticsOverview Component
 *
 * Renders three stat cards: Total Views, Unique Posts Viewed, Average Read Time.
 * Supports loading skeleton, empty state, and data state.
 *
 * Story BL-020.3: Admin Analytics Dashboard UI
 * Task 2: AnalyticsOverview component
 *
 * @see AC3 - Three stat cards with formatted values
 * @see AC8 - Loading state during data refresh
 * @see AC9 - Empty state when no data exists
 */

import type { OverviewStats, AnalyticsPeriod } from '@/services/blog-analytics-client';
import { formatReadTime } from './analytics-utils';

interface AnalyticsOverviewProps {
  data: OverviewStats | null;
  loading: boolean;
  period: AnalyticsPeriod;
}

export function AnalyticsOverview({ data, loading }: AnalyticsOverviewProps) {
  // Loading state: 3 skeleton cards
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="overview-loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!data) {
    return (
      <div className="text-center py-8 text-sm text-gray-500" data-testid="overview-empty">
        No analytics data yet. Views will appear once blog posts are visited.
      </div>
    );
  }

  // Data state: 3 stat cards
  const stats = [
    { key: 'total-views', label: 'Total Views', value: data.total_views.toLocaleString() },
    { key: 'unique-posts', label: 'Unique Posts', value: data.unique_slugs_viewed.toLocaleString() },
    { key: 'avg-read-time', label: 'Avg Read Time', value: formatReadTime(data.avg_read_time_seconds) },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="overview-stats">
      {stats.map(({ key, label, value }) => (
        <div key={key} className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900" data-testid={`stat-${key}`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
