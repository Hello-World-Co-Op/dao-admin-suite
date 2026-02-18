/**
 * AuthorLeaderboard Component
 *
 * Shows per-author totals sorted by total views descending.
 * Columns: Author, Total Views, Posts, Avg Views/Post.
 *
 * Story BL-020.3: Admin Analytics Dashboard UI
 * Task 5: AuthorLeaderboard component
 *
 * @see AC6 - Author leaderboard with per-author totals
 * @see AC8 - Loading state
 * @see AC9 - Empty state
 */

import type { AuthorAnalytics } from '@/services/blog-analytics-client';
import { truncatePrincipal } from './analytics-utils';

interface AuthorLeaderboardProps {
  authors: AuthorAnalytics[];
  loading: boolean;
}

export function AuthorLeaderboard({ authors, loading }: AuthorLeaderboardProps) {
  // Loading state: 3 skeleton rows
  if (loading) {
    return (
      <div className="space-y-3" data-testid="author-leaderboard-loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state
  if (authors.length === 0) {
    return (
      <div
        className="py-6 text-center text-sm text-gray-400"
        data-testid="author-leaderboard-empty"
      >
        No author view data available for this period.
      </div>
    );
  }

  return (
    <table className="w-full text-sm" data-testid="author-leaderboard-table">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="py-2 pr-3 text-left text-xs font-medium text-gray-500">Author</th>
          <th className="py-2 pr-3 text-right text-xs font-medium text-gray-500">Total Views</th>
          <th className="py-2 pr-3 text-right text-xs font-medium text-gray-500">Posts</th>
          <th className="py-2 text-right text-xs font-medium text-gray-500">Avg Views/Post</th>
        </tr>
      </thead>
      <tbody>
        {authors.map((author) => (
          <tr key={author.author_principal} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-2 pr-3 text-gray-900" data-testid={`author-name-${author.author_principal}`}>
              {author.display_name || truncatePrincipal(author.author_principal)}
            </td>
            <td className="py-2 pr-3 text-right text-gray-700">
              {author.total_views.toLocaleString()}
            </td>
            <td className="py-2 pr-3 text-right text-gray-700">
              {author.post_count}
            </td>
            <td className="py-2 text-right text-gray-500">
              {Math.round(author.avg_views_per_post).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
