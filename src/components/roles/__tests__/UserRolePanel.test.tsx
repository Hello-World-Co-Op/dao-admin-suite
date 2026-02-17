/**
 * Tests for UserRolePanel Component
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 4.10: Unit tests for UserRolePanel
 *
 * @see AC4 - Panel shows user info
 * @see AC5 - Assign dropdown with non-assigned roles
 * @see AC6 - Revoke buttons on role badges
 * @see AC10 - Self-revoke guard for admin
 * @see AC11 - Only admin/moderator/developer assignable
 * @see AC12 - Warning banner
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserRolePanel } from '../UserRolePanel';
import type { UserWithRoles } from '@/services/roles-client';

vi.mock('@/services/roles-client', () => ({
  getUserRoles: vi.fn(),
  assignRole: vi.fn(),
  revokeRole: vi.fn(),
}));

import { getUserRoles, assignRole, revokeRole } from '@/services/roles-client';

const mockGetUserRoles = vi.mocked(getUserRoles);
const mockAssignRole = vi.mocked(assignRole);
const mockRevokeRole = vi.mocked(revokeRole);

describe('UserRolePanel', () => {
  const mockUser: UserWithRoles = {
    user_id: 'user-123-abc-def',
    display_name: 'Test User',
    email_preview: 'tes***@example.com',
    verified: true,
    submitted_at: '2026-01-15T14:30:00Z',
    roles: ['admin', 'moderator'],
  };

  const defaultProps = {
    user: mockUser,
    currentUserId: 'different-user-id',
    onClose: vi.fn(),
    onRoleChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserRoles.mockResolvedValue(mockUser);
    mockAssignRole.mockResolvedValue({ success: true, user_id: 'user-123-abc-def', role: 'developer', message: 'Assigned' });
    mockRevokeRole.mockResolvedValue({ success: true, user_id: 'user-123-abc-def', role: 'moderator', message: 'Revoked' });
  });

  it('renders user info (display name, email, truncated user_id, status)', () => {
    render(<UserRolePanel {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('tes***@example.com')).toBeInTheDocument();
    expect(screen.getByText('user-123...')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('renders current role badges', () => {
    render(<UserRolePanel {...defaultProps} />);
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('moderator')).toBeInTheDocument();
  });

  it('disables revoke button for admin role when user is self (AC10)', () => {
    render(<UserRolePanel {...defaultProps} currentUserId="user-123-abc-def" />);
    const disabledBtn = screen.getByTestId('revoke-btn-admin-disabled');
    expect(disabledBtn).toBeDisabled();
    expect(disabledBtn).toHaveAttribute('title', 'Cannot revoke your own admin role');
  });

  it('shows only non-assigned roles in the dropdown (AC5, AC11)', () => {
    render(<UserRolePanel {...defaultProps} />);
    const select = screen.getByTestId('add-role-select');
    expect(select).toBeInTheDocument();

    // Only developer should appear (admin and moderator already assigned)
    const options = select.querySelectorAll('option');
    const optionValues = Array.from(options).map((o) => o.value);
    expect(optionValues).toContain('developer');
    expect(optionValues).not.toContain('admin');
    expect(optionValues).not.toContain('moderator');
    // member and user are never in dropdown
    expect(optionValues).not.toContain('member');
    expect(optionValues).not.toContain('user');
  });

  it('hides dropdown when all 3 assignable roles are present', () => {
    const allRolesUser = { ...mockUser, roles: ['admin', 'moderator', 'developer'] };
    render(<UserRolePanel {...defaultProps} user={allRolesUser} />);
    expect(screen.queryByTestId('add-role-select')).not.toBeInTheDocument();
  });

  it('shows warning banner (AC12)', () => {
    render(<UserRolePanel {...defaultProps} />);
    expect(screen.getByTestId('session-warning-banner')).toBeInTheDocument();
    expect(
      screen.getByText('Assigning or revoking a role will immediately log this user out of all active sessions.'),
    ).toBeInTheDocument();
  });

  it('shows "No special roles" for user with no roles', () => {
    const noRolesUser = { ...mockUser, roles: [] };
    render(<UserRolePanel {...defaultProps} user={noRolesUser} />);
    expect(screen.getByText('No special roles')).toBeInTheDocument();
  });

  it('clicking revoke button opens confirm modal', () => {
    render(<UserRolePanel {...defaultProps} />);
    const revokeBtn = screen.getByTestId('revoke-btn-moderator');
    fireEvent.click(revokeBtn);
    expect(screen.getByTestId('role-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Revoke moderator')).toBeInTheDocument();
  });

  it('clicking assign triggers confirm modal when role is selected', () => {
    render(<UserRolePanel {...defaultProps} />);
    const select = screen.getByTestId('add-role-select');
    fireEvent.change(select, { target: { value: 'developer' } });

    const assignBtn = screen.getByTestId('assign-role-btn');
    fireEvent.click(assignBtn);
    expect(screen.getByTestId('role-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Assign developer')).toBeInTheDocument();
  });

  it('successful assign calls onRoleChange and refreshes roles', async () => {
    const updatedUser = { ...mockUser, roles: ['admin', 'moderator', 'developer'] };
    mockGetUserRoles.mockResolvedValueOnce(updatedUser);

    render(<UserRolePanel {...defaultProps} />);
    const select = screen.getByTestId('add-role-select');
    fireEvent.change(select, { target: { value: 'developer' } });
    fireEvent.click(screen.getByTestId('assign-role-btn'));

    // Confirm in modal
    fireEvent.click(screen.getByTestId('role-confirm-btn'));

    await waitFor(() => {
      expect(mockAssignRole).toHaveBeenCalledWith('user-123-abc-def', 'developer');
      expect(mockGetUserRoles).toHaveBeenCalledWith('user-123-abc-def');
      expect(defaultProps.onRoleChange).toHaveBeenCalled();
    });
  });

  it('shows Pending status for unverified user', () => {
    const unverifiedUser = { ...mockUser, verified: false };
    render(<UserRolePanel {...defaultProps} user={unverifiedUser} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows member role as read-only badge (no revoke button)', () => {
    const memberUser = { ...mockUser, roles: ['admin', 'member'] };
    render(<UserRolePanel {...defaultProps} user={memberUser} />);
    expect(screen.getByText('member')).toBeInTheDocument();
    // member should NOT have a revoke button
    expect(screen.queryByTestId('revoke-btn-member')).not.toBeInTheDocument();
  });
});
