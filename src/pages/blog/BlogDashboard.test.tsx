/**
 * BlogDashboard Tests
 *
 * Tests for admin dashboard rendering, post actions, and integration flows.
 * Updated for Story 6.3: rebuild trigger, auto-rebuild, rebuild status.
 *
 * @see BL-008.3.5 Tasks 15, 16 - Dashboard component tests
 * @see BL-008.6.3 - Admin Rebuild Trigger and Pipeline Integration
 * @see AC1 - Admin dashboard with sidebar and PostTable
 * @see AC3 - Contributor dashboard for author role
 * @see AC4-6 - Post actions (Publish, Schedule, Archive)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock useRoles from auth package
const mockUseRoles = vi.fn();
vi.mock('@hello-world-co-op/auth', () => ({
  useRoles: () => mockUseRoles(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RoleGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockPostsResponse = {
  posts: [
    {
      id: 1,
      title: 'Test Draft Post',
      slug: 'test-draft',
      author: 'author-1',
      author_name: 'Test Author',
      status: 'Draft',
      tags: [],
      updated_at: 1707800000000000,
      published_at: null,
      scheduled_at: null,
    },
    {
      id: 2,
      title: 'Test Published Post',
      slug: 'test-published',
      author: 'author-2',
      author_name: 'Another Author',
      status: 'Published',
      tags: [],
      updated_at: 1707900000000000,
      published_at: 1707850000000000,
      scheduled_at: null,
    },
    {
      id: 3,
      title: 'Ready for Review Post',
      slug: 'ready-review',
      author: 'author-1',
      author_name: 'Test Author',
      status: 'Draft',
      tags: ['ready_for_review'],
      updated_at: 1707700000000000,
      published_at: null,
      scheduled_at: null,
    },
  ],
  total: 3,
  page: 1,
  page_size: 10,
};

const mockRebuildStatusResponse = {
  last_rebuild_at: null,
  pending: false,
};

/**
 * URL-based fetch mock: routes by URL path so tests with multiple
 * concurrent fetches (posts + rebuild status) work correctly.
 */
function setupDefaultFetchMock(overrides?: Record<string, () => Promise<unknown>>) {
  mockFetch.mockImplementation((url: string, options?: RequestInit) => {
    // Check overrides first
    if (overrides) {
      for (const [pattern, handler] of Object.entries(overrides)) {
        if (url.includes(pattern)) {
          return handler();
        }
      }
    }

    // Rebuild status endpoint
    if (url.includes('/api/webhooks/blog-rebuild/status')) {
      return Promise.resolve({
        ok: true,
        json: async () => mockRebuildStatusResponse,
      });
    }

    // Rebuild trigger endpoint (POST)
    if (url.includes('/api/webhooks/blog-rebuild') && options?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 202,
        json: async () => ({ success: true, message: 'Rebuild queued with 5-minute debounce' }),
      });
    }

    // Posts endpoint
    if (url.includes('/api/blog/posts')) {
      return Promise.resolve({
        ok: true,
        json: async () => mockPostsResponse,
      });
    }

    // Publish endpoint
    if (url.includes('/api/blog/publish')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, message: 'Post published successfully' }),
      });
    }

    // Archive endpoint
    if (url.includes('/api/blog/archive')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, message: 'Post archived' }),
      });
    }

    // Default fallback
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  });
}

// Need to import after mocks are set up
import BlogDashboard from './BlogDashboard';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <BlogDashboard />
    </MemoryRouter>,
  );
}

describe('BlogDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Admin view (AC1)', () => {
    beforeEach(() => {
      mockUseRoles.mockReturnValue({ roles: ['admin'] });
      setupDefaultFetchMock();
    });

    it('renders admin BlogDashboard with sidebar and PostTable (Task 15.1)', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('blog-dashboard')).toBeInTheDocument();
      });

      // Sidebar is present
      expect(screen.getByTestId('blog-sidebar')).toBeInTheDocument();
      // Post table is present
      expect(screen.getByTestId('post-table')).toBeInTheDocument();
      // Filter tabs are present
      expect(screen.getByTestId('status-filter-tabs')).toBeInTheDocument();
    });

    it('shows status filter tabs with counts', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('All Posts (3)')).toBeInTheDocument();
      });
      expect(screen.getByText('Drafts (2)')).toBeInTheDocument();
      expect(screen.getByText('Published (1)')).toBeInTheDocument();
    });

    it('filters posts by status tab (Task 15.4)', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('post-table')).toBeInTheDocument();
      });

      // Click Drafts tab
      fireEvent.click(screen.getByTestId('filter-tab-Draft'));

      // Should show only draft posts
      await waitFor(() => {
        expect(screen.getByText('Test Draft Post')).toBeInTheDocument();
        expect(screen.queryByText('Test Published Post')).not.toBeInTheDocument();
      });
    });

    it('filters Ready for Review posts by tag (Task 15.9)', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('post-table')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('filter-tab-ready_for_review'));

      await waitFor(() => {
        expect(screen.getByText('Ready for Review Post')).toBeInTheDocument();
        expect(screen.queryByText('Test Draft Post')).not.toBeInTheDocument();
      });
    });

    it('publishes a post and shows success toast (Task 15.5, Task 16.2)', async () => {
      setupDefaultFetchMock();

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('publish-post-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('publish-post-1'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-toast')).toHaveTextContent('Post published successfully');
      });

      // Verify the API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/blog/publish'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('opens schedule modal when Schedule button clicked (Task 15.6, Task 16.3)', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('schedule-post-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('schedule-post-1'));

      await waitFor(() => {
        expect(screen.getByTestId('schedule-modal')).toBeInTheDocument();
      });
    });

    it('shows archive confirmation when Archive button clicked (Task 15.7, Task 16.4)', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('archive-post-2')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('archive-post-2'));

      await waitFor(() => {
        expect(screen.getByTestId('archive-confirm-dialog')).toBeInTheDocument();
        expect(screen.getByText(/removed from public listings/)).toBeInTheDocument();
      });
    });

    it('archives post after confirmation (Task 16.4)', async () => {
      setupDefaultFetchMock();

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('archive-post-2')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('archive-post-2'));

      await waitFor(() => {
        expect(screen.getByTestId('archive-confirm')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('archive-confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-toast')).toHaveTextContent('Post archived');
      });
    });

    it('shows error toast on failed post fetch (Task 15.10)', async () => {
      setupDefaultFetchMock({
        '/api/blog/posts': () => Promise.resolve({ ok: false, json: async () => ({}) }),
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load posts/)).toBeInTheDocument();
      });
    });

    it('shows retry button on error state', async () => {
      setupDefaultFetchMock({
        '/api/blog/posts': () => Promise.resolve({ ok: false, json: async () => ({}) }),
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });
    });

    it('shows loading spinner while fetching', () => {
      mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
      renderDashboard();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Contributor view (AC3)', () => {
    beforeEach(() => {
      mockUseRoles.mockReturnValue({ roles: ['author'] });
      setupDefaultFetchMock();
    });

    it('renders ContributorDashboard for author role (Task 15.2)', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('contributor-dashboard')).toBeInTheDocument();
      });

      // Should NOT have sidebar
      expect(screen.queryByTestId('blog-sidebar')).not.toBeInTheDocument();
      // Should have Write a Post card and My Drafts card
      expect(screen.getByTestId('write-post-card')).toBeInTheDocument();
      expect(screen.getByTestId('my-drafts-card')).toBeInTheDocument();
    });

    it('shows drafts in My Drafts card', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('drafts-list')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling (Task 16.6)', () => {
    beforeEach(() => {
      mockUseRoles.mockReturnValue({ roles: ['admin'] });
    });

    it('shows error toast on publish failure', async () => {
      setupDefaultFetchMock({
        '/api/blog/publish': () => Promise.resolve({
          ok: false,
          json: async () => ({ message: 'Unauthorized' }),
        }),
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('publish-post-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('publish-post-1'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-toast')).toHaveTextContent('Unauthorized');
      });
    });
  });

  // ==========================================================================
  // Story 6.3: Rebuild Integration Tests
  // ==========================================================================

  describe('Rebuild Site button (AC1)', () => {
    beforeEach(() => {
      mockUseRoles.mockReturnValue({ roles: ['admin'] });
      setupDefaultFetchMock();
    });

    it('renders Rebuild Site button in toolbar (Task 1.1)', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('rebuild-site-button')).toBeInTheDocument();
      });

      expect(screen.getByTestId('rebuild-site-button')).toHaveTextContent('Rebuild Site');
    });

    it('calls webhook and shows success toast on manual rebuild (Task 1.2, 1.3)', async () => {
      setupDefaultFetchMock();

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('rebuild-site-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('rebuild-site-button'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-toast')).toHaveTextContent('Rebuild queued');
      });

      // Verify the webhook was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/webhooks/blog-rebuild'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
    });

    it('shows error toast on rebuild failure (Task 1.4)', async () => {
      setupDefaultFetchMock({
        '/api/webhooks/blog-rebuild': () => Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal Server Error' }),
        }),
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('rebuild-site-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('rebuild-site-button'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-toast')).toHaveTextContent('Failed to trigger rebuild');
      });
    });
  });

  describe('Auto-trigger rebuild (AC2)', () => {
    beforeEach(() => {
      mockUseRoles.mockReturnValue({ roles: ['admin'] });
      setupDefaultFetchMock();
    });

    it('triggers rebuild after publish action (Task 2.1)', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('publish-post-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('publish-post-1'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-toast')).toHaveTextContent('Post published successfully');
      });

      // Verify rebuild webhook was called (fire-and-forget from triggerRebuild utility)
      const rebuildCalls = mockFetch.mock.calls.filter(
        (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('/api/webhooks/blog-rebuild') && !call[0].includes('/status') && (call[1] as RequestInit)?.method === 'POST',
      );
      expect(rebuildCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('triggers rebuild after archive action (Task 2.2)', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('archive-post-2')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('archive-post-2'));

      await waitFor(() => {
        expect(screen.getByTestId('archive-confirm')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('archive-confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-toast')).toHaveTextContent('Post archived');
      });

      // Verify rebuild webhook was called
      const rebuildCalls = mockFetch.mock.calls.filter(
        (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('/api/webhooks/blog-rebuild') && !call[0].includes('/status') && (call[1] as RequestInit)?.method === 'POST',
      );
      expect(rebuildCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Rebuild status display (AC3)', () => {
    beforeEach(() => {
      mockUseRoles.mockReturnValue({ roles: ['admin'] });
    });

    it('displays "Last rebuild: Never" when no rebuild has occurred (Task 1.5)', async () => {
      setupDefaultFetchMock();

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('rebuild-status')).toBeInTheDocument();
      });

      expect(screen.getByTestId('rebuild-status')).toHaveTextContent('Last rebuild: Never');
    });

    it('displays last rebuild timestamp when available (Task 1.5)', async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      setupDefaultFetchMock({
        '/api/webhooks/blog-rebuild/status': () => Promise.resolve({
          ok: true,
          json: async () => ({ last_rebuild_at: fiveMinutesAgo, pending: false }),
        }),
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('rebuild-status')).toHaveTextContent('Last rebuild: 5 minutes ago');
      });
    });

    it('shows pending indicator when rebuild is pending', async () => {
      setupDefaultFetchMock({
        '/api/webhooks/blog-rebuild/status': () => Promise.resolve({
          ok: true,
          json: async () => ({ last_rebuild_at: null, pending: true }),
        }),
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('rebuild-status')).toHaveTextContent('Rebuild pending...');
      });
    });

    it('polls rebuild status every 30 seconds (Task 1.8)', async () => {
      setupDefaultFetchMock();

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('rebuild-status')).toBeInTheDocument();
      });

      // Count initial status calls
      const initialStatusCalls = mockFetch.mock.calls.filter(
        (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('/api/webhooks/blog-rebuild/status'),
      ).length;

      // Advance timer by 30 seconds
      vi.advanceTimersByTime(30_000);

      await waitFor(() => {
        const afterCalls = mockFetch.mock.calls.filter(
          (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('/api/webhooks/blog-rebuild/status'),
        ).length;
        expect(afterCalls).toBeGreaterThan(initialStatusCalls);
      });
    });

    it('cleans up polling on unmount (Task 1.8)', async () => {
      setupDefaultFetchMock();

      const { unmount } = renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('rebuild-status')).toBeInTheDocument();
      });

      unmount();

      const callsBeforeAdvance = mockFetch.mock.calls.length;

      // Advance time — should NOT trigger new calls after unmount
      vi.advanceTimersByTime(60_000);

      // Allow any pending promises to resolve
      await vi.advanceTimersByTimeAsync(100);

      const callsAfterAdvance = mockFetch.mock.calls.length;
      expect(callsAfterAdvance).toBe(callsBeforeAdvance);
    });
  });
});
