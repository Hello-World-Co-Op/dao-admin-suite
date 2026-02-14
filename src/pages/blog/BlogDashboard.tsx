/**
 * BlogDashboard Page
 *
 * Admin dashboard for managing blog posts with:
 * - Sidebar navigation (admin only)
 * - PostTable with sortable columns
 * - Status filter tabs
 * - Post actions (Publish, Schedule, Archive)
 * - Pagination
 *
 * Renders BlogDashboard for admin role, ContributorDashboard for author role.
 *
 * @see BL-008.3.5 Task 4 - BlogDashboard layout
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
import ContributorDashboard from './ContributorDashboard';

const PAGE_SIZE = 10;

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

function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const oracleBridgeUrl = useMemo(() => getOracleBridgeUrl(), []);

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

  // Update URL params when tab or page changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('status', activeTab);
    if (currentPage > 1) params.set('page', String(currentPage));
    setSearchParams(params, { replace: true });
  }, [activeTab, currentPage, setSearchParams]);

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
              onClick={() => { navigate('/blog'); setSidebarOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('all'); setSidebarOpen(false); }}
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Blog Dashboard</h1>
            <button
              type="button"
              onClick={() => navigate('/blog/editor/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              data-testid="new-post-button"
            >
              New Post
            </button>
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
