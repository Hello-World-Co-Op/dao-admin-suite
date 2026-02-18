/**
 * TopPostsTable Component
 *
 * Shows the 10 most-viewed posts with links to the public blog.
 * Columns: Rank, Post (linked title/slug), Views, Avg Read Time.
 *
 * Story BL-020.3: Admin Analytics Dashboard UI
 * Task 4: TopPostsTable component
 *
 * @see AC5 - Top posts table with 10 most-viewed posts
 * @see AC8 - Loading state
 * @see AC9 - Empty state
 */

import type { PostAnalytics } from '@/services/blog-analytics-client';
import { formatReadTime } from './analytics-utils';

interface TopPostsTableProps {
  posts: PostAnalytics[];
  loading: boolean;
  publicBlogUrl: string;
}

export function TopPostsTable({ posts, loading, publicBlogUrl }: TopPostsTableProps) {
  // Loading state: 5 skeleton rows
  if (loading) {
    return (
      <div className="space-y-3" data-testid="top-posts-loading">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div
        className="py-6 text-center text-sm text-gray-400"
        data-testid="top-posts-empty"
      >
        No post view data available for this period.
      </div>
    );
  }

  return (
    <table className="w-full text-sm" data-testid="top-posts-table">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="py-2 pr-3 text-left text-xs font-medium text-gray-500">#</th>
          <th className="py-2 pr-3 text-left text-xs font-medium text-gray-500">Post</th>
          <th className="py-2 pr-3 text-right text-xs font-medium text-gray-500">Views</th>
          <th className="py-2 text-right text-xs font-medium text-gray-500">Avg Read</th>
        </tr>
      </thead>
      <tbody>
        {posts.slice(0, 10).map((post, index) => (
          <tr key={post.slug} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-2 pr-3 text-gray-400">{index + 1}</td>
            <td className="py-2 pr-3">
              <a
                href={`${publicBlogUrl}/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline line-clamp-1"
                data-testid={`post-link-${post.slug}`}
              >
                {post.title || post.slug}
              </a>
            </td>
            <td className="py-2 pr-3 text-right text-gray-700">
              {post.view_count.toLocaleString()}
            </td>
            <td className="py-2 text-right text-gray-500">
              {formatReadTime(post.avg_read_time_seconds)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
