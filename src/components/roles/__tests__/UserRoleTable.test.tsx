/**
 * Tests for UserRoleTable Component
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 5.8: Unit tests for UserRoleTable
 *
 * @see AC2 - User list with display name, email, verified, role badges
 * @see AC4 - Clicking Manage Roles opens panel
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserRoleTable } from '../UserRoleTable';
import type { UserWithRoles } from '@/services/roles-client';

describe('UserRoleTable', () => {
  const mockUsers: UserWithRoles[] = [
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
      roles: [],
    },
    {
      user_id: 'user-3',
      display_name: 'Carol Coder',
      email_preview: 'car***@example.com',
      verified: true,
      submitted_at: '2026-01-17T08:00:00Z',
      roles: ['moderator', 'developer'],
    },
  ];

  const defaultProps = {
    users: mockUsers,
    loading: false,
    onManageRoles: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table headers', () => {
    render(<UserRoleTable {...defaultProps} />);
    expect(screen.getByText('Display Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders user display names', () => {
    render(<UserRoleTable {...defaultProps} />);
    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getByText('Bob Builder')).toBeInTheDocument();
    expect(screen.getByText('Carol Coder')).toBeInTheDocument();
  });

  it('renders email previews', () => {
    render(<UserRoleTable {...defaultProps} />);
    expect(screen.getByText('ali***@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob***@example.com')).toBeInTheDocument();
  });

  it('shows role badges with correct coloring', () => {
    render(<UserRoleTable {...defaultProps} />);
    const adminCell = screen.getByTestId('user-roles-cell-user-1');
    expect(adminCell.querySelector('.bg-red-100')).toBeInTheDocument();

    const carolCell = screen.getByTestId('user-roles-cell-user-3');
    expect(carolCell.querySelector('.bg-yellow-100')).toBeInTheDocument();
    expect(carolCell.querySelector('.bg-blue-100')).toBeInTheDocument();
  });

  it('shows "No special roles" for user with empty roles', () => {
    render(<UserRoleTable {...defaultProps} />);
    const bobCell = screen.getByTestId('user-roles-cell-user-2');
    expect(bobCell).toHaveTextContent('No special roles');
  });

  it('shows verified checkmark for verified users', () => {
    render(<UserRoleTable {...defaultProps} />);
    const verifiedCell = screen.getByTestId('user-verified-user-1');
    expect(verifiedCell).toHaveTextContent('Verified');
  });

  it('shows pending indicator for unverified users', () => {
    render(<UserRoleTable {...defaultProps} />);
    const pendingCell = screen.getByTestId('user-verified-user-2');
    expect(pendingCell).toHaveTextContent('Pending');
  });

  it('calls onManageRoles when manage roles button is clicked', () => {
    render(<UserRoleTable {...defaultProps} />);
    fireEvent.click(screen.getByTestId('manage-roles-btn-user-1'));
    expect(defaultProps.onManageRoles).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('renders loading skeleton when loading is true', () => {
    render(<UserRoleTable {...defaultProps} loading />);
    expect(screen.getByTestId('table-loading-skeleton')).toBeInTheDocument();
    // Table should not render
    expect(screen.queryByTestId('user-role-table')).not.toBeInTheDocument();
  });

  it('renders empty state when users array is empty', () => {
    render(<UserRoleTable {...defaultProps} users={[]} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('highlights the selected user row', () => {
    const { container } = render(<UserRoleTable {...defaultProps} selectedUserId="user-1" />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0].className).toContain('bg-blue-50');
    expect(rows[1].className).not.toContain('bg-blue-50');
  });
});
