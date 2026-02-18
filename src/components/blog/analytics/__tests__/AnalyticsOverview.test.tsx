/**
 * Tests for AnalyticsOverview component
 *
 * Story BL-020.3: Admin Analytics Dashboard UI
 * Task 2.8: Unit tests for AnalyticsOverview
 *
 * @see AC3 - Stat cards with values
 * @see AC8 - Loading state
 * @see AC9 - Empty state
 * @see AC10 - Minimum 2 tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsOverview } from '../AnalyticsOverview';
import type { OverviewStats } from '@/services/blog-analytics-client';

const mockData: OverviewStats = {
  total_views: 1234,
  unique_slugs_viewed: 42,
  avg_read_time_seconds: 84,
  views_by_day: [
    { date: '2026-02-15', count: 10 },
    { date: '2026-02-16', count: 15 },
  ],
};

describe('AnalyticsOverview', () => {
  it('shows loading skeleton when loading=true', () => {
    render(<AnalyticsOverview data={null} loading={true} period="30d" />);

    expect(screen.getByTestId('overview-loading')).toBeInTheDocument();
    // Should not show stat values
    expect(screen.queryByTestId('stat-total-views')).not.toBeInTheDocument();
  });

  it('renders stat card values from data', () => {
    render(<AnalyticsOverview data={mockData} loading={false} period="30d" />);

    expect(screen.getByTestId('stat-total-views')).toHaveTextContent('1,234');
    expect(screen.getByTestId('stat-unique-posts')).toHaveTextContent('42');
    expect(screen.getByTestId('stat-avg-read-time')).toHaveTextContent('1m 24s');
  });

  it('shows empty state when not loading and no data', () => {
    render(<AnalyticsOverview data={null} loading={false} period="30d" />);

    expect(screen.getByTestId('overview-empty')).toBeInTheDocument();
    expect(screen.getByText(/no analytics data yet/i)).toBeInTheDocument();
  });
});
