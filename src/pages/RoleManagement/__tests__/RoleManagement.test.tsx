/**
 * Tests for RoleManagement Page
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 7.11: Unit tests for RoleManagement page
 *
 * @see AC1 - /roles route protected (tested in App.test.tsx)
 * @see AC2 - User list loads on page open
 * @see AC3 - Search filters users
 * @see AC9 - Audit log tab
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import RoleManagement from '../index';
import type { PaginatedUsersResponse } from '@/services/roles-client';

// Mock auth
vi.mock('@hello-world-co-op/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { userId: 'current-admin-id', roles: ['admin'] },
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Mock roles-client
vi.mock('@/services/roles-client', () => ({
  listUsers: vi.fn(),
  getUserRoles: vi.fn(),
  assignRole: vi.fn(),
  revokeRole: vi.fn(),
  getAuditLog: vi.fn(),
}));

import { listUsers, getAuditLog } from '@/services/roles-client';

const mockListUsers = vi.mocked(listUsers);
const mockGetAuditLog = vi.mocked(getAuditLog);

describe('RoleManagement', () => {
  const mockUsersResponse: PaginatedUsersResponse = {
    users: [
      {
        user_id: 'user-1',
        display_name: 'Alice Admin',
        email_preview: 'ali***@example.com',
        verified: true,
        submitted_at: '2026-01-15T14:30:00Z',
        roles: ['admin'],
      },
      {
        user_id: 'user-2',
        display_name: 'Bob Builder',
        email_preview: 'bob***@example.com',
        verified: false,
        submitted_at: '2026-01-16T10:00:00Z',
        roles: ['developer'],
      },
    ],
    total: 2,
    page: 1,
    page_size: 25,
    has_next: false,
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    mockListUsers.mockResolvedValue(mockUsersResponse);
    mockGetAuditLog.mockResolvedValue({ entries: [], total: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders page title and subtitle', async () => {
    render(<RoleManagement />);

    await waitFor(() => {
      expect(screen.getByText('Role Management')).toBeInTheDocument();
    });

    expect(screen.getByText('Platform access role assignment and audit')).toBeInTheDocument();
    expect(screen.getByTestId('role-management-page')).toBeInTheDocument();
  });

  it('defaults to Users & Roles tab', async () => {
    render(<RoleManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-users')).toHaveClass('border-blue-500');
    });
  });

  it('loads user list on mount', async () => {
    render(<RoleManagement />);

    await waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledWith(1, 25, undefined);
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });
  });

  it('switches to audit log tab', async () => {
    render(<RoleManagement />);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-audit'));

    await waitFor(() => {
      expect(screen.getByTestId('tab-audit')).toHaveClass('border-blue-500');
    });
  });

  it('search filters users by calling listUsers with search param', async () => {
    render(<RoleManagement />);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('role-search-input');
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    // Wait for debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledWith(1, 25, 'alice');
    });
  });

  it('pagination Previous is disabled on page 1', async () => {
    render(<RoleManagement />);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    const prevBtn = screen.getByTestId('pagination-prev');
    expect(prevBtn).toBeDisabled();
  });

  it('pagination Next is disabled when has_next is false', async () => {
    render(<RoleManagement />);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    const nextBtn = screen.getByTestId('pagination-next');
    expect(nextBtn).toBeDisabled();
  });

  it('clicking manage roles opens panel', async () => {
    render(<RoleManagement />);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-roles-btn-user-1'));

    await waitFor(() => {
      expect(screen.getByTestId('user-role-panel')).toBeInTheDocument();
    });
  });

  it('clicking manage roles again on same user closes panel', async () => {
    render(<RoleManagement />);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-roles-btn-user-1'));

    await waitFor(() => {
      expect(screen.getByTestId('user-role-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-roles-btn-user-1'));

    await waitFor(() => {
      expect(screen.queryByTestId('user-role-panel')).not.toBeInTheDocument();
    });
  });

  it('shows error state with retry button on fetch failure', async () => {
    mockListUsers.mockRejectedValueOnce(new Error('Network error'));

    render(<RoleManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('users-error')).toBeInTheDocument();
    });

    expect(screen.getByTestId('users-retry-btn')).toBeInTheDocument();
  });
});
