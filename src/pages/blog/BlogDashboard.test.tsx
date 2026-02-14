/**
 * BlogDashboard Tests
 *
 * Tests for admin dashboard rendering, post actions, and integration flows.
 *
 * @see BL-008.3.5 Tasks 15, 16 - Dashboard component tests
 * @see AC1 - Admin dashboard with sidebar and PostTable
 * @see AC3 - Contributor dashboard for author role
 * @see AC4-6 - Post actions (Publish, Schedule, Archive)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  });

  describe('Admin view (AC1)', () => {
    beforeEach(() => {
      mockUseRoles.mockReturnValue({ roles: ['admin'] });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockPostsResponse,
      });
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
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockPostsResponse }) // initial load
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Post published successfully' }),
        }); // publish call

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
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockPostsResponse })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Post archived' }),
        });

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
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load posts/)).toBeInTheDocument();
      });
    });

    it('shows retry button on error state', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

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
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockPostsResponse,
      });
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
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockPostsResponse })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Unauthorized' }),
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
});
