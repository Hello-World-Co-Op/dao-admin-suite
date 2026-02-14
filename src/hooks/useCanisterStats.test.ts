/**
 * Tests for useCanisterStats hook
 *
 * Covers:
 * - Initial loading state
 * - Successful fetch and data display
 * - Error handling
 * - Manual refresh
 * - Auto-refresh interval setup and cleanup
 *
 * @see BL-008.7.3 Task 5.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCanisterStats, type CanisterStats } from './useCanisterStats';

const mockStats: CanisterStats = {
  total_posts: 25,
  published_count: 15,
  draft_count: 5,
  scheduled_count: 3,
  archived_count: 2,
  storage_usage_bytes: 12_500_000,
};

describe('useCanisterStats', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with loading state', () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    } as Response);

    const { result } = renderHook(() => useCanisterStats());
    expect(result.current.loading).toBe(true);
    expect(result.current.stats.total_posts).toBe(0);
  });

  it('should fetch and set stats on mount', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    } as Response);

    const { result } = renderHook(() => useCanisterStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCanisterStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.stats.total_posts).toBe(0);
  });

  it('should handle non-OK response', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useCanisterStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch canister stats: 500');
  });

  it('should refresh stats on manual refresh call', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    } as Response);

    const { result } = renderHook(() => useCanisterStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedStats = { ...mockStats, total_posts: 30 };
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => updatedStats,
    } as Response);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.stats.total_posts).toBe(30);
    });
  });

  it('should clean up interval on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    } as Response);

    const { unmount } = renderHook(() => useCanisterStats());

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    unmount();

    // Verify clearInterval was called on unmount
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should clear error on successful refresh', async () => {
    // First call fails
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCanisterStats());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    // Second call succeeds
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    } as Response);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.stats).toEqual(mockStats);
    });
  });

  it('should call fetch with correct URL', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    } as Response);

    renderHook(() => useCanisterStats());

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const callArgs = fetchSpy.mock.calls[0];
    expect(callArgs[0]).toContain('/api/blog/canister-stats');
    expect(callArgs[1]).toEqual({ credentials: 'include' });
  });
});
