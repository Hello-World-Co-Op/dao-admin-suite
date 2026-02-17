/**
 * Tests for RoleAuditLog Component
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 6.8: Unit tests for RoleAuditLog
 *
 * @see AC9 - Audit log tab with auto-refresh every 30 seconds
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RoleAuditLog } from '../RoleAuditLog';
import type { AuditLogResponse } from '@/services/roles-client';

vi.mock('@/services/roles-client', () => ({
  getAuditLog: vi.fn(),
}));

import { getAuditLog } from '@/services/roles-client';

const mockGetAuditLog = vi.mocked(getAuditLog);

describe('RoleAuditLog', () => {
  const mockAuditResponse: AuditLogResponse = {
    entries: [
      {
        id: 'audit-1',
        action: 'ROLE_ASSIGNED',
        table_name: 'user_roles',
        record_id: 'user-123-abc-def',
        user_role: 'admin',
        details: { role: 'moderator', performed_by: 'admin-456-xyz-ghi' },
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
      },
      {
        id: 'audit-2',
        action: 'ROLE_REVOKED',
        table_name: 'user_roles',
        record_id: 'user-789-jkl-mno',
        user_role: 'admin',
        details: { role: 'developer', performed_by: 'admin-456-xyz-ghi' },
        created_at: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
      },
    ],
    total: 2,
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    mockGetAuditLog.mockResolvedValue(mockAuditResponse);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders audit entries', async () => {
    render(<RoleAuditLog active />);

    await waitFor(() => {
      expect(screen.getByTestId('audit-log-table')).toBeInTheDocument();
    });

    expect(screen.getByText('moderator')).toBeInTheDocument();
    expect(screen.getByText('developer')).toBeInTheDocument();
  });

  it('shows Assigned badge for ROLE_ASSIGNED', async () => {
    render(<RoleAuditLog active />);

    await waitFor(() => {
      const badges = screen.getAllByTestId('audit-action-badge');
      expect(badges[0]).toHaveTextContent('Assigned');
    });
  });

  it('shows Revoked badge for ROLE_REVOKED', async () => {
    render(<RoleAuditLog active />);

    await waitFor(() => {
      const badges = screen.getAllByTestId('audit-action-badge');
      expect(badges[1]).toHaveTextContent('Revoked');
    });
  });

  it('fetches audit log on mount when active', async () => {
    render(<RoleAuditLog active />);

    await waitFor(() => {
      expect(mockGetAuditLog).toHaveBeenCalledTimes(1);
    });
  });

  it('does not fetch when active is false', async () => {
    render(<RoleAuditLog active={false} />);

    // Wait a bit to ensure no fetch happens
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(mockGetAuditLog).not.toHaveBeenCalled();
  });

  it('polls every 30 seconds when active', async () => {
    render(<RoleAuditLog active />);

    await waitFor(() => {
      expect(mockGetAuditLog).toHaveBeenCalledTimes(1);
    });

    // Advance to trigger polling
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(mockGetAuditLog).toHaveBeenCalledTimes(2);
  });

  it('shows Load More button when total > entries', async () => {
    mockGetAuditLog.mockResolvedValueOnce({
      entries: mockAuditResponse.entries,
      total: 100,
    });

    render(<RoleAuditLog active />);

    await waitFor(() => {
      expect(screen.getByTestId('load-more-btn')).toBeInTheDocument();
    });

    expect(screen.getByText(/98 remaining/)).toBeInTheDocument();
  });

  it('Load More button triggers fetch with increased limit', async () => {
    mockGetAuditLog.mockResolvedValueOnce({
      entries: mockAuditResponse.entries,
      total: 100,
    });

    render(<RoleAuditLog active />);

    await waitFor(() => {
      expect(screen.getByTestId('load-more-btn')).toBeInTheDocument();
    });

    mockGetAuditLog.mockResolvedValueOnce({
      entries: [...mockAuditResponse.entries, ...mockAuditResponse.entries],
      total: 100,
    });

    fireEvent.click(screen.getByTestId('load-more-btn'));

    await waitFor(() => {
      expect(mockGetAuditLog).toHaveBeenCalledWith(100); // 50 + 50
    });
  });

  it('shows loading skeleton initially', () => {
    mockGetAuditLog.mockReturnValue(new Promise(() => {})); // never resolves
    render(<RoleAuditLog active />);
    expect(screen.getByTestId('audit-loading-skeleton')).toBeInTheDocument();
  });

  it('shows error state with retry button on fetch failure', async () => {
    mockGetAuditLog.mockRejectedValueOnce(new Error('Network error'));

    render(<RoleAuditLog active />);

    await waitFor(() => {
      expect(screen.getByTestId('audit-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load audit log')).toBeInTheDocument();
    expect(screen.getByTestId('audit-retry-btn')).toBeInTheDocument();
  });
});
