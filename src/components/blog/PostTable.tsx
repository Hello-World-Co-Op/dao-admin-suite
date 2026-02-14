/**
 * PostTable Component
 *
 * Sortable table displaying blog posts with columns:
 * Title, Author, Status, Updated, Published
 *
 * Supports row actions: Edit, Publish, Schedule, Archive
 *
 * @see BL-008.3.5 Task 5 - PostTable component
 * @see AC2 - PostTable with sortable headers
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostStatusBadge, type PostStatus } from './PostStatusBadge';
import { formatDate } from '@/utils/formatDate';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  author: string;
  author_name: string;
  status: PostStatus;
  tags: string[];
  updated_at: number;
  published_at: number | null;
  scheduled_at: number | null;
}

type SortColumn = 'title' | 'author' | 'status' | 'updated' | 'published';
type SortDirection = 'asc' | 'desc';

interface PostTableProps {
  posts: BlogPost[];
  onPublish: (postId: number) => void;
  onSchedule: (postId: number) => void;
  onArchive: (postId: number) => void;
  isAdmin: boolean;
}

export function PostTable({ posts, onPublish, onSchedule, onArchive, isAdmin }: PostTableProps) {
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = useState<SortColumn>('updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = useCallback((column: SortColumn) => {
    setSortColumn((prev) => {
      if (prev === column) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        return column;
      }
      setSortDirection('asc');
      return column;
    });
  }, []);

  const sortedPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'author':
          comparison = a.author_name.localeCompare(b.author_name);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'updated':
          comparison = (a.updated_at || 0) - (b.updated_at || 0);
          break;
        case 'published':
          comparison = (a.published_at || 0) - (b.published_at || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [posts, sortColumn, sortDirection]);

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return ' \u2195'; // up-down arrows
    return sortDirection === 'asc' ? ' \u2191' : ' \u2193'; // up or down arrow
  };

  const getAriaSortValue = (column: SortColumn): 'ascending' | 'descending' | 'none' => {
    if (sortColumn !== column) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500" data-testid="post-table-empty">
        <p className="text-lg">No posts found</p>
        <p className="text-sm mt-1">Create your first post to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="post-table">
      <table className="min-w-full divide-y divide-gray-200">
        <caption className="sr-only">Blog posts table</caption>
        <thead className="bg-gray-50">
          <tr>
            {(['title', 'author', 'status', 'updated', 'published'] as SortColumn[]).map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                aria-sort={getAriaSortValue(col)}
                onClick={() => handleSort(col)}
                data-testid={`sort-header-${col}`}
              >
                {col.charAt(0).toUpperCase() + col.slice(1)}
                <span aria-hidden="true">{getSortIcon(col)}</span>
              </th>
            ))}
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedPosts.map((post) => (
            <tr key={post.id} className="hover:bg-gray-50" data-testid={`post-row-${post.id}`}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                {post.title}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {post.author_name}
              </td>
              <td className="px-4 py-3 text-sm">
                <PostStatusBadge status={post.status} />
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {formatDate(post.updated_at)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {formatDate(post.published_at)}
              </td>
              <td className="px-4 py-3 text-sm text-right space-x-2">
                <button
                  type="button"
                  onClick={() => navigate(`/blog/editor/${post.slug}`)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  data-testid={`edit-post-${post.id}`}
                >
                  Edit
                </button>
                {isAdmin && post.status === 'Draft' && (
                  <>
                    <button
                      type="button"
                      onClick={() => onPublish(post.id)}
                      className="text-green-600 hover:text-green-800 font-medium"
                      data-testid={`publish-post-${post.id}`}
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      onClick={() => onSchedule(post.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      data-testid={`schedule-post-${post.id}`}
                    >
                      Schedule
                    </button>
                  </>
                )}
                {isAdmin && post.status === 'Published' && (
                  <button
                    type="button"
                    onClick={() => onArchive(post.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                    data-testid={`archive-post-${post.id}`}
                  >
                    Archive
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
