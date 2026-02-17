/**
 * Tests for RoleAssignConfirmModal Component
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 3.5: Unit tests for RoleAssignConfirmModal
 *
 * @see AC7 - Confirm modal before every assign/revoke
 * @see AC12 - Warning about session logout
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleAssignConfirmModal } from '../RoleAssignConfirmModal';

describe('RoleAssignConfirmModal', () => {
  const defaultProps = {
    visible: true,
    action: 'assign' as const,
    role: 'moderator',
    userName: 'John Doe',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when visible is false', () => {
    render(<RoleAssignConfirmModal {...defaultProps} visible={false} />);
    expect(screen.queryByTestId('role-confirm-modal')).not.toBeInTheDocument();
  });

  it('shows assign variant with correct title and body', () => {
    render(<RoleAssignConfirmModal {...defaultProps} action="assign" role="moderator" />);
    expect(screen.getByText('Assign moderator')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to assign the moderator role to John Doe?'),
    ).toBeInTheDocument();
  });

  it('shows revoke variant with correct title and body', () => {
    render(<RoleAssignConfirmModal {...defaultProps} action="revoke" role="admin" />);
    expect(screen.getByText('Revoke admin')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to revoke the admin role from John Doe?'),
    ).toBeInTheDocument();
  });

  it('shows session logout warning text', () => {
    render(<RoleAssignConfirmModal {...defaultProps} />);
    expect(
      screen.getByText('This will log out the user from all active sessions immediately.'),
    ).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<RoleAssignConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('role-confirm-btn'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<RoleAssignConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('role-cancel-btn'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables confirm button when isSubmitting is true', () => {
    render(<RoleAssignConfirmModal {...defaultProps} isSubmitting />);
    const confirmBtn = screen.getByTestId('role-confirm-btn');
    expect(confirmBtn).toBeDisabled();
  });

  it('shows spinner in confirm button when isSubmitting', () => {
    const { container } = render(<RoleAssignConfirmModal {...defaultProps} isSubmitting />);
    // The spinner is an SVG with animate-spin class
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
