/**
 * ContributorDashboard Page
 *
 * Simplified dashboard for authors (non-admin) with:
 * - "Write a Post" card linking to /blog/editor/new
 * - "My Drafts" card listing author's draft posts
 * - No sidebar navigation
 *
 * @see BL-008.3.5 Task 11 - ContributorDashboard component
 * @see AC3 - Contributor dashboard with simplified view
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BlogPost } from '@/components/blog/PostTable';
import { formatDate } from '@/utils/formatDate';

function getOracleBridgeUrl(): string {
  return import.meta.env.VITE_ORACLE_BRIDGE_URL || '';
}

export default function ContributorDashboard() {
  const navigate = useNavigate();
  const oracleBridgeUrl = useMemo(() => getOracleBridgeUrl(), []);
  const [drafts, setDrafts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch posts from blog canister via oracle-bridge.
      // PRIVACY: The canister's list_posts_admin method filters by author for non-admin users
      // (see blog/src/lib.rs lines 1312-1322). Authors only see their own posts, so client-side
      // filtering here is safe and does not expose other authors' drafts.
      const response = await fetch(`${oracleBridgeUrl}/api/blog/posts?page=1&page_size=50`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load drafts');
      }

      const data = await response.json();
      const allPosts: BlogPost[] = data.posts || [];
      // Filter for drafts only on the client side
      setDrafts(allPosts.filter((p) => p.status === 'Draft'));
    } catch (err) {
      console.error('[ContributorDashboard] Fetch error:', err);
      setError('Failed to load your drafts. Try again.');
    } finally {
      setLoading(false);
    }
  }, [oracleBridgeUrl]);

  useEffect(() => {
    fetchMyDrafts();
  }, [fetchMyDrafts]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8" data-testid="contributor-dashboard">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Blog</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Write a Post card */}
          <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            data-testid="write-post-card"
          >
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Write a Post</h2>
            </div>
            <p className="text-gray-600 mb-4">Start writing a new blog post with the rich text editor.</p>
            <button
              type="button"
              onClick={() => navigate('/blog/editor/new')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              data-testid="write-post-button"
            >
              Create New Post
            </button>
          </div>

          {/* My Drafts card */}
          <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            data-testid="my-drafts-card"
          >
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">My Drafts</h2>
            </div>

            {loading && (
              <div className="flex justify-center py-4" data-testid="drafts-loading">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
              </div>
            )}

            {error && !loading && (
              <div className="text-center py-4" data-testid="drafts-error">
                <p className="text-red-600 text-sm mb-2">{error}</p>
                <button
                  type="button"
                  onClick={fetchMyDrafts}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && drafts.length === 0 && (
              <p className="text-gray-500 text-sm py-4" data-testid="no-drafts">
                No drafts found. Create your first post!
              </p>
            )}

            {!loading && !error && drafts.length > 0 && (
              <ul className="divide-y divide-gray-100" data-testid="drafts-list">
                {drafts.map((draft) => (
                  <li key={draft.id} className="py-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/blog/editor/${draft.slug}`)}
                      className="w-full text-left hover:bg-gray-50 rounded px-2 py-1 -mx-2"
                      data-testid={`draft-item-${draft.id}`}
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{draft.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Updated {formatDate(draft.updated_at)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
