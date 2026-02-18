/**
 * CategoryBreakdown Component
 *
 * Shows views per blog category as horizontal bars. Currently renders a
 * placeholder because PostAnalytics does not include a category field from
 * the oracle-bridge response (BL-020.1). This is a future enhancement.
 *
 * Story BL-020.3: Admin Analytics Dashboard UI
 * Task 6: CategoryBreakdown component
 *
 * @see AC7 - Category breakdown with placeholder if data unavailable
 * @see AC8 - Loading state
 * @see AC9 - Empty state
 */

import type { PostAnalytics } from '@/services/blog-analytics-client';

interface CategoryBreakdownProps {
  postStats: PostAnalytics[];
  loading: boolean;
}

export function CategoryBreakdown({ loading }: CategoryBreakdownProps) {
  // Loading state
  if (loading) {
    return (
      <div className="space-y-3" data-testid="category-loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // PostAnalytics from oracle-bridge does not include a category field.
  // Render a placeholder. Future enhancement: integrate blog canister
  // category metadata to enable actual category breakdown.
  try {
    return (
      <div
        className="py-6 text-center text-sm text-gray-400"
        data-testid="category-breakdown-placeholder"
      >
        Category breakdown requires blog category data integration.
      </div>
    );
  } catch {
    // Defensive: never throw from this component
    return (
      <div className="py-6 text-center text-sm text-gray-400" data-testid="category-breakdown-placeholder">
        Category data unavailable.
      </div>
    );
  }
}
