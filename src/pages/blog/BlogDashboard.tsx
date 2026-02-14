/**
 * BlogDashboard Page
 *
 * Admin dashboard for managing blog posts with:
 * - Sidebar navigation (admin only)
 * - PostTable with sortable columns
 * - Status filter tabs
 * - Post actions (Publish, Schedule, Archive)
 * - Pagination
 * - Manual rebuild trigger and rebuild status display (Story 6.3)
 * - Auto-rebuild on publish/archive (Story 6.3)
 * - Operations tab with rebuild monitor, author management, readiness checklist (Story 7.2)
 *
 * Renders BlogDashboard for admin role, ContributorDashboard for author role.
 *
 * @see BL-008.3.5 Task 4 - BlogDashboard layout
 * @see BL-008.6.3 - Admin Rebuild Trigger and Pipeline Integration
 * @see BL-008.7.2 - Admin Operations Dashboard
 * @see AC1 - Admin dashboard with sidebar and PostTable
 * @see AC3 - Contributor dashboard with simplified view
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRoles } from '@hello-world-co-op/auth';
import { PostTable, type BlogPost } from '@/components/blog/PostTable';
import { StatusFilterTabs, filterPostsByTab, type FilterTab } from '@/components/blog/StatusFilterTabs';
import { Pagination } from '@/components/blog/Pagination';
import { ScheduleModal } from '@/components/blog/ScheduleModal';
import { triggerRebuild, fetchRebuildStatus, type RebuildStatus } from '@/services/blog-rebuild-client';
import ContributorDashboard from './ContributorDashboard';
import RebuildStatusMonitor from '@/components/blog/RebuildStatusMonitor';
import AuthorManagement from '@/components/blog/AuthorManagement';
import ReadinessChecklist from '@/components/blog/ReadinessChecklist';
import BlogHealthPanel from '@/components/blog/BlogHealthPanel';
import CanisterHealthPanel from '@/components/blog/CanisterHealthPanel';

const PAGE_SIZE = 10;

/** Rebuild status polling interval: 30 seconds */
const REBUILD_STATUS_POLL_INTERVAL = 30_000;

function getOracleBridgeUrl(): string {
  return import.meta.env.VITE_ORACLE_BRIDGE_URL || '';
}

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function BlogDashboard() {
  const { roles } = useRoles();
  const isAdmin = roles.includes('admin');

  // If not admin, show ContributorDashboard
  if (!isAdmin) {
    return <ContributorDashboard />;
  }

  return <AdminDashboard />;
}

/**
 * Format an ISO 8601 timestamp as a human-readable relative time.
 * Simple implementation to avoid adding date-fns dependency.
 */
function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

type DashboardView = 'posts' | 'operations';

function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const oracleBridgeUrl = useMemo(() => getOracleBridgeUrl(), []);

  // View state: posts (default) or operations (BL-008.7.2)
  const [activeView, setActiveView] = useState<DashboardView>(() => {
    const view = searchParams.get('view');
    return view === 'operations' ? 'operations' : 'posts';
  });

  // State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page, 10) : 1;
  });
  const [totalPosts, setTotalPosts] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>(() => {
    const status = searchParams.get('status');
    return (status as FilterTab) || 'all';
  });

  // Schedule modal state
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [schedulePostId, setSchedulePostId] = useState<number | null>(null);

  // Archive confirmation state
  const [archiveConfirmId, setArchiveConfirmId] = useState<number | null>(null);

  // Action loading state (prevents double-clicks)
  const [actionLoading, setActionLoading] = useState(false);

  // Sidebar collapsed state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Rebuild status state (Story 6.3 - Task 1.5)
  const [rebuildStatus, setRebuildStatus] = useState<RebuildStatus | null>(null);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const rebuildPollRef = useRef<number | null>(null);

  // Toast timeout ref to prevent memory leaks
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ visible: true, message, type });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
      toastTimeoutRef.current = null;
    }, 5000);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Manual rebuild handler (Story 6.3 - Task 1.2, 1.3, 1.4)
  const handleRebuildSite = useCallback(async () => {
    if (rebuildLoading) return;
    setRebuildLoading(true);

    try {
      const response = await fetch(`${oracleBridgeUrl}/api/webhooks/blog-rebuild`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 202 || response.ok) {
        showToast('Rebuild queued');
      } else {
        showToast('Failed to trigger rebuild', 'error');
      }
    } catch {
      showToast('Failed to trigger rebuild', 'error');
    } finally {
      setRebuildLoading(false);
    }
  }, [oracleBridgeUrl, showToast, rebuildLoading]);

  // Poll rebuild status (Story 6.3 - Task 1.8)
  const pollRebuildStatus = useCallback(async () => {
    try {
      const status = await fetchRebuildStatus();
      setRebuildStatus(status);
    } catch {
      // Silent failure - status display is non-critical
      console.debug('[BlogDashboard] Failed to fetch rebuild status');
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    pollRebuildStatus();

    // Poll every 30 seconds
    rebuildPollRef.current = window.setInterval(pollRebuildStatus, REBUILD_STATUS_POLL_INTERVAL);

    return () => {
      if (rebuildPollRef.current) {
        clearInterval(rebuildPollRef.current);
      }
    };
  }, [pollRebuildStatus]);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        page_size: String(PAGE_SIZE),
      });

      const response = await fetch(`${oracleBridgeUrl}/api/blog/posts?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load posts');
      }

      const data = await response.json();
      setPosts(data.posts || []);
      setTotalPosts(data.total || 0);
    } catch (err) {
      console.error('[BlogDashboard] Fetch error:', err);
      setError('Failed to load posts. Try again.');
    } finally {
      setLoading(false);
    }
  }, [oracleBridgeUrl, currentPage]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Update URL params when tab, page, or view changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeView === 'operations') params.set('view', 'operations');
    if (activeTab !== 'all') params.set('status', activeTab);
    if (currentPage > 1) params.set('page', String(currentPage));
    setSearchParams(params, { replace: true });
  }, [activeTab, currentPage, activeView, setSearchParams]);

  // Close archive dialog with Escape key
  useEffect(() => {
    if (archiveConfirmId === null) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setArchiveConfirmId(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [archiveConfirmId]);

  // Publish action
  const handlePublish = useCallback(async (postId: number) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${oracleBridgeUrl}/api/blog/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ post_id: postId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.message || 'Failed to publish post', 'error');
        return;
      }

      showToast('Post published successfully');
      // Auto-trigger rebuild on publish (Story 6.3 - Task 2.1)
      triggerRebuild();
      // Refresh posts to get updated timestamps from server
      await fetchPosts();
    } catch {
      showToast('Failed to publish post', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [oracleBridgeUrl, showToast, actionLoading, fetchPosts]);

  // Schedule action
  const handleScheduleClick = useCallback((postId: number) => {
    setSchedulePostId(postId);
    setScheduleModalVisible(true);
  }, []);

  const handleScheduleConfirm = useCallback(async (dateTimeStr: string) => {
    if (!schedulePostId || actionLoading) return;

    // Validate date BEFORE setting actionLoading
    const parsedMs = Date.parse(dateTimeStr);
    if (isNaN(parsedMs)) {
      showToast('Invalid date format', 'error');
      return;
    }

    setActionLoading(true);

    try {
      const scheduledAtNanos = BigInt(parsedMs) * 1_000_000n;

      const response = await fetch(`${oracleBridgeUrl}/api/blog/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          post_id: schedulePostId,
          scheduled_at: scheduledAtNanos.toString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.message || 'Failed to schedule post', 'error');
        return;
      }

      showToast(`Post scheduled for ${new Date(dateTimeStr).toLocaleString()}`);
      // Refresh posts to get updated timestamps from server
      await fetchPosts();
    } catch (error) {
      console.error('[BlogDashboard] Schedule error:', error);
      showToast('Failed to schedule post', 'error');
    } finally {
      setActionLoading(false);
      setScheduleModalVisible(false);
      setSchedulePostId(null);
    }
  }, [oracleBridgeUrl, schedulePostId, showToast, actionLoading, fetchPosts]);

  // Archive action
  const handleArchiveClick = useCallback((postId: number) => {
    setArchiveConfirmId(postId);
  }, []);

  const handleArchiveConfirm = useCallback(async () => {
    if (!archiveConfirmId || actionLoading) return;
    setActionLoading(true);

    try {
      const response = await fetch(`${oracleBridgeUrl}/api/blog/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ post_id: archiveConfirmId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.message || 'Failed to archive post', 'error');
        return;
      }

      showToast('Post archived');
      // Auto-trigger rebuild on archive (Story 6.3 - Task 2.2)
      triggerRebuild();
      // Refresh posts to get updated timestamps from server
      await fetchPosts();
    } catch {
      showToast('Failed to archive post', 'error');
    } finally {
      setActionLoading(false);
      setArchiveConfirmId(null);
    }
  }, [oracleBridgeUrl, archiveConfirmId, showToast, actionLoading, fetchPosts]);

  // Tab change handler
  const handleTabChange = useCallback((tab: FilterTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  // Page change handler
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const filteredPosts = useMemo(() => filterPostsByTab(posts, activeTab), [posts, activeTab]);
  const totalPages = Math.ceil(totalPosts / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="blog-dashboard">
      {/* Mobile hamburger */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
        data-testid="sidebar-toggle"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        data-testid="blog-sidebar"
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Blog</h2>
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => { setActiveView('posts'); setSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg ${
                activeView === 'posts' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
              }`}
              data-testid="sidebar-posts"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('all'); setActiveView('posts'); setSidebarOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              All Posts
            </button>
            <button
              type="button"
              onClick={() => { navigate('/blog/editor/new'); setSidebarOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              New Post
            </button>
            <button
              type="button"
              onClick={() => { setActiveView('operations'); setSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg ${
                activeView === 'operations' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
              }`}
              data-testid="sidebar-operations"
            >
              Operations
            </button>
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8" data-testid="blog-main-content">
        <div className="max-w-6xl mx-auto">
          {activeView === 'posts' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Blog Dashboard</h1>
                  {/* Rebuild status display (Story 6.3 - Task 1.5) */}
                  <p className="text-sm text-gray-500 mt-1" data-testid="rebuild-status">
                    {rebuildStatus?.pending && 'Rebuild pending... '}
                    {rebuildStatus?.last_rebuild_at
                      ? `Last rebuild: ${formatTimeAgo(rebuildStatus.last_rebuild_at)}`
                      : 'Last rebuild: Never'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRebuildSite}
                    disabled={rebuildLoading}
                    className={`px-4 py-2 border rounded-lg font-medium flex items-center gap-2 ${
                      rebuildLoading
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    data-testid="rebuild-site-button"
                  >
                    <svg className={`w-4 h-4 ${rebuildLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {rebuildLoading ? 'Rebuilding...' : 'Rebuild Site'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/blog/editor/new')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    data-testid="new-post-button"
                  >
                    New Post
                  </button>
                </div>
              </div>

              {/* Status filter tabs */}
              <StatusFilterTabs
                posts={posts}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />

              {/* Loading state */}
              {loading && (
                <div className="flex justify-center py-12" data-testid="loading-spinner">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div className="text-center py-12" data-testid="error-state">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    type="button"
                    onClick={fetchPosts}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    data-testid="retry-button"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Post table */}
              {!loading && !error && (
                <>
                  <PostTable
                    posts={filteredPosts}
                    onPublish={handlePublish}
                    onSchedule={handleScheduleClick}
                    onArchive={handleArchiveClick}
                    isAdmin={true}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalPosts}
                    pageSize={PAGE_SIZE}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </>
          )}

          {/* Operations View (BL-008.7.2 Task 4, BL-008.7.3 Task 1 & 4) */}
          {activeView === 'operations' && (
            <div data-testid="operations-view">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Operations</h1>
              <div className="space-y-6">
                <CanisterHealthPanel />
                <BlogHealthPanel posts={posts} />
                <RebuildStatusMonitor />
                <AuthorManagement />
                <ReadinessChecklist />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Schedule modal */}
      <ScheduleModal
        visible={scheduleModalVisible}
        onSchedule={handleScheduleConfirm}
        onCancel={() => { setScheduleModalVisible(false); setSchedulePostId(null); }}
      />

      {/* Archive confirmation dialog */}
      {archiveConfirmId !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="archive-confirm-dialog"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Archive Post</h2>
            <p className="text-gray-600 mb-4">
              Archive this post? It will be removed from public listings.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setArchiveConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                data-testid="archive-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchiveConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                data-testid="archive-confirm"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.visible && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
          }`}
          role="status"
          aria-live="polite"
          data-testid="dashboard-toast"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
