/**
 * RebuildStatusMonitor Tests
 *
 * Story BL-008.7.2: Admin Operations Dashboard
 * Task 7.1: 5 tests covering green/amber/red status, loading, and error states
 *
 * @see AC1 - Rebuild status section with timestamp and status indicator
 * @see FR52 - Last successful rebuild timestamp and status
 * @see FR53 - Staleness warnings (amber > 30 min, red > 24 hours)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock blog-rebuild-client
const mockFetchRebuildStatus = vi.fn();
vi.mock('@/services/blog-rebuild-client', () => ({
  fetchRebuildStatus: () => mockFetchRebuildStatus(),
}));

// Mock fetch for rebuild trigger
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import RebuildStatusMonitor from './RebuildStatusMonitor';

describe('RebuildStatusMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, status: 202 });
  });

  it('shows loading state while fetching rebuild status', () => {
    // Never resolve the promise
    mockFetchRebuildStatus.mockReturnValue(new Promise(() => {}));

    render(<RebuildStatusMonitor />);

    const container = screen.getByTestId('rebuild-status-monitor');
    expect(container).toBeInTheDocument();
    // Should show loading skeleton
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows green "Healthy" badge when last rebuild was < 30 minutes ago (AC1, FR52)', async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    mockFetchRebuildStatus.mockResolvedValue({
      last_rebuild_at: tenMinutesAgo,
      pending: false,
    });

    render(<RebuildStatusMonitor />);

    await waitFor(() => {
      expect(screen.getByTestId('staleness-badge')).toHaveTextContent('Healthy');
    });

    // Badge should have green styling
    const badge = screen.getByTestId('staleness-badge');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-800');

    // Timestamp should show "Last rebuilt:"
    expect(screen.getByTestId('rebuild-timestamp')).toHaveTextContent('Last rebuilt:');
  });

  it('shows amber "Stale" badge when last rebuild was 30 min - 24 hours ago (AC1, FR53)', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    mockFetchRebuildStatus.mockResolvedValue({
      last_rebuild_at: twoHoursAgo,
      pending: false,
    });

    render(<RebuildStatusMonitor />);

    await waitFor(() => {
      expect(screen.getByTestId('staleness-badge')).toHaveTextContent('Stale');
    });

    const badge = screen.getByTestId('staleness-badge');
    expect(badge.className).toContain('bg-amber-100');
    expect(badge.className).toContain('text-amber-800');
  });

  it('shows red "Critical" badge when last rebuild was > 24 hours ago (AC1, FR53)', async () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    mockFetchRebuildStatus.mockResolvedValue({
      last_rebuild_at: twoDaysAgo,
      pending: false,
    });

    render(<RebuildStatusMonitor />);

    await waitFor(() => {
      expect(screen.getByTestId('staleness-badge')).toHaveTextContent('Critical');
    });

    const badge = screen.getByTestId('staleness-badge');
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-800');
  });

  it('shows error message when fetch fails', async () => {
    mockFetchRebuildStatus.mockRejectedValue(new Error('Network error'));

    render(<RebuildStatusMonitor />);

    await waitFor(() => {
      expect(screen.getByTestId('rebuild-status-error')).toBeInTheDocument();
    });

    expect(screen.getByTestId('rebuild-status-error')).toHaveTextContent('Failed to fetch rebuild status');
  });

  it('shows "Last rebuilt: Never" when no rebuild has occurred', async () => {
    mockFetchRebuildStatus.mockResolvedValue({
      last_rebuild_at: null,
      pending: false,
    });

    render(<RebuildStatusMonitor />);

    await waitFor(() => {
      expect(screen.getByTestId('rebuild-timestamp')).toHaveTextContent('Last rebuilt: Never');
    });

    // Badge should show "Unknown"
    expect(screen.getByTestId('staleness-badge')).toHaveTextContent('Unknown');
  });

  it('shows "Rebuild pending..." when a rebuild is in progress', async () => {
    mockFetchRebuildStatus.mockResolvedValue({
      last_rebuild_at: new Date().toISOString(),
      pending: true,
    });

    render(<RebuildStatusMonitor />);

    await waitFor(() => {
      expect(screen.getByTestId('rebuild-pending')).toHaveTextContent('Rebuild pending...');
    });
  });

  it('triggers rebuild on button click and shows success toast', async () => {
    mockFetchRebuildStatus.mockResolvedValue({
      last_rebuild_at: new Date().toISOString(),
      pending: false,
    });
    mockFetch.mockResolvedValue({ ok: true, status: 202 });

    render(<RebuildStatusMonitor />);

    await waitFor(() => {
      expect(screen.getByTestId('rebuild-now-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('rebuild-now-button'));

    await waitFor(() => {
      expect(screen.getByTestId('rebuild-toast')).toHaveTextContent('Rebuild triggered successfully');
    });
  });
});
