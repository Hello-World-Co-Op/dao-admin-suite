/**
 * Tests for useAutoSave hook
 *
 * Story BL-008.3.4 - Auto-Save, Crash Recovery, and Save Indicators
 *
 * Validates:
 * - Trailing debounce behavior (60s default) (AC1)
 * - Debounce timer resets on each markDirty call (AC1)
 * - Max-wait timer fires after 5 minutes of continuous editing (AC2)
 * - Cleanup on unmount (no memory leaks)
 * - Dirty flag management
 * - StaleEdit stops both timers (AC4)
 * - Network error keeps timers running (AC5)
 * - Unauthorized triggers status change (AC8)
 * - localStorage backup on save (AC6)
 * - No skipped tests (AI-R24)
 *
 * @see BL-008.3.4 AC1, AC2, AC4, AC5, AC6, AC8
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';
import type { UseAutoSaveOptions, SaveResult } from './useAutoSave';

describe('useAutoSave', () => {
  let mockSaveFn: ReturnType<typeof vi.fn>;
  let mockOnSaveSuccess: ReturnType<typeof vi.fn>;
  let mockOnStatusChange: ReturnType<typeof vi.fn>;
  let mockGetContent: ReturnType<typeof vi.fn>;

  const defaultOptions: UseAutoSaveOptions = {
    postId: 42,
    expectedUpdatedAt: 1000,
    getContent: () => '<p>test content</p>',
    saveFn: vi.fn(),
    onSaveSuccess: vi.fn(),
    onStatusChange: vi.fn(),
    debounceMs: 60_000,
    maxWaitMs: 300_000,
    enabled: true,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();

    mockSaveFn = vi.fn<(body: string, expectedUpdatedAt: number) => Promise<SaveResult>>().mockResolvedValue({
      success: true,
      updated_at: 2000,
    });
    mockOnSaveSuccess = vi.fn();
    mockOnStatusChange = vi.fn();
    mockGetContent = vi.fn().mockReturnValue('<p>test content</p>');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function getOptions(overrides?: Partial<UseAutoSaveOptions>): UseAutoSaveOptions {
    return {
      ...defaultOptions,
      saveFn: mockSaveFn,
      onSaveSuccess: mockOnSaveSuccess,
      onStatusChange: mockOnStatusChange,
      getContent: mockGetContent,
      ...overrides,
    };
  }

  describe('AC1: Debounce behavior', () => {
    it('does not save immediately when markDirty is called', () => {
      const { result } = renderHook(() => useAutoSave(getOptions()));

      act(() => {
        result.current.markDirty();
      });

      expect(mockSaveFn).not.toHaveBeenCalled();
    });

    it('saves after debounce period (60s) elapses', async () => {
      const { result } = renderHook(() => useAutoSave(getOptions({ debounceMs: 1000 })));

      act(() => {
        result.current.markDirty();
      });

      // Advance past debounce time
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockSaveFn).toHaveBeenCalledTimes(1);
      expect(mockSaveFn).toHaveBeenCalledWith('<p>test content</p>', 1000);
    });

    it('resets debounce timer on each markDirty call (trailing debounce)', async () => {
      const { result } = renderHook(() => useAutoSave(getOptions({ debounceMs: 1000 })));

      act(() => {
        result.current.markDirty();
      });

      // Advance 800ms (not enough)
      act(() => {
        vi.advanceTimersByTime(800);
      });

      // Mark dirty again - should reset timer
      act(() => {
        result.current.markDirty();
      });

      // Advance another 800ms (1600ms total, but only 800ms since last mark)
      act(() => {
        vi.advanceTimersByTime(800);
      });

      expect(mockSaveFn).not.toHaveBeenCalled();

      // Advance remaining 200ms for the reset timer to fire
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(mockSaveFn).toHaveBeenCalledTimes(1);
    });

    it('does not save when not dirty', async () => {
      renderHook(() => useAutoSave(getOptions({ debounceMs: 1000 })));

      // Don't call markDirty, just advance time
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockSaveFn).not.toHaveBeenCalled();
    });

    it('does not save when disabled', async () => {
      const { result } = renderHook(() => useAutoSave(getOptions({ enabled: false, debounceMs: 1000 })));

      act(() => {
        result.current.markDirty();
      });

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockSaveFn).not.toHaveBeenCalled();
    });

    it('does not save when postId is null', async () => {
      const { result } = renderHook(() => useAutoSave(getOptions({ postId: null, debounceMs: 1000 })));

      act(() => {
        result.current.markDirty();
      });

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockSaveFn).not.toHaveBeenCalled();
    });
  });

  describe('AC2: Max-wait timer', () => {
    it('forces save after max-wait period (5min) regardless of debounce', async () => {
      const { result } = renderHook(() =>
        useAutoSave(getOptions({ debounceMs: 60_000, maxWaitMs: 300_000 }))
      );

      // Mark dirty once to set the dirty flag
      act(() => {
        result.current.markDirty();
      });

      // Keep resetting the debounce by marking dirty every 50 seconds
      // This simulates continuous editing
      for (let i = 0; i < 5; i++) {
        act(() => {
          vi.advanceTimersByTime(50_000);
        });
        act(() => {
          result.current.markDirty(); // reset debounce
        });
      }

      // At this point, ~250s have passed, debounce hasn't fired
      expect(mockSaveFn).not.toHaveBeenCalled();

      // Advance enough for max-wait check to detect > 300s
      await act(async () => {
        vi.advanceTimersByTime(60_000); // total 310s, over 300s max-wait
      });

      expect(mockSaveFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('AC3: Save success handling', () => {
    it('calls onSaveSuccess with new updated_at on successful save', async () => {
      const { result } = renderHook(() => useAutoSave(getOptions({ debounceMs: 1000 })));

      act(() => {
        result.current.markDirty();
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnSaveSuccess).toHaveBeenCalledWith(2000);
    });

    it('updates status to saving then saved', async () => {
      const { result } = renderHook(() => useAutoSave(getOptions({ debounceMs: 1000 })));

      act(() => {
        result.current.markDirty();
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Check status progression
      expect(mockOnStatusChange).toHaveBeenCalledWith('saving');
      expect(mockOnStatusChange).toHaveBeenCalledWith('saved', expect.any(String));
    });
  });

  describe('AC4: StaleEdit handling', () => {
    it('stops timers and reports stale status on StaleEdit error', async () => {
      mockSaveFn.mockResolvedValue({
        success: false,
        error: 'StaleEdit',
        message: 'This post was modified in another session.',
      });

      const { result } = renderHook(() => useAutoSave(getOptions({ debounceMs: 1000 })));

      act(() => {
        result.current.markDirty();
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnStatusChange).toHaveBeenCalledWith('stale', 'This post was modified in another session.');

      // Reset mock to verify no more saves happen
      mockSaveFn.mockClear();

      // Mark dirty again and wait - should NOT save (timers stopped)
      act(() => {
        result.current.markDirty();
      });

      await act(async () => {
        vi.advanceTimersByTime(120_000);
      });

      expect(mockSaveFn).not.toHaveBeenCalled();
    });
  });

  describe('AC5: Network error handling', () => {
    it('reports error status on network failure', async () => {
      mockSaveFn.mockResolvedValue({
        success: false,
        error: 'NetworkError',
        message: 'Save failed',
      });

      const { result } = renderHook(() => useAutoSave(getOptions({ debounceMs: 1000 })));

      act(() => {
        result.current.markDirty();
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnStatusChange).toHaveBeenCalledWith('error', 'Save failed');
    });

    it('keeps timers running on network error for retry', async () => {
      let callCount = 0;
      mockSaveFn.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { success: false, error: 'NetworkError' as const, message: 'Save failed' };
        }
        return { success: true, updated_at: 3000 };
      });

      const { result } = renderHook(() => useAutoSave(getOptions({ debounceMs: 1000 })));

      // First attempt: mark dirty and wait for debounce
      act(() => {
        result.current.markDirty();
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(callCount).toBe(1);

      // Second attempt: mark dirty again for retry
      act(() => {
        result.current.markDirty();
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(callCount).toBe(2);
      expect(mockOnSaveSuccess).toHaveBeenCalledWith(3000);
    });
  });

  describe('AC6: localStorage backup', () => {
    it('backs up content to localStorage on save attempt', async () => {
      const { result } = renderHook(() => useAutoSave(getOptions({ debounceMs: 1000 })));

      act(() => {
        result.current.markDirty();
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      const backup = JSON.parse(localStorage.getItem('blog-draft-backup-42') || '{}');
      expect(backup.body).toBe('<p>test content</p>');
      expect(typeof backup.timestamp).toBe('number');
    });
  });

  describe('AC8: Unauthorized handling', () => {
    it('reports unauthorized status on 401/403 error', async () => {
      mockSaveFn.mockResolvedValue({
        success: false,
        error: 'Unauthorized',
        message: 'Session expired',
      });

      const { result } = renderHook(() => useAutoSave(getOptions({ debounceMs: 1000 })));

      act(() => {
        result.current.markDirty();
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnStatusChange).toHaveBeenCalledWith('unauthorized', 'Session expired');
    });
  });

  describe('Cleanup and unmount', () => {
    it('clears all timers on unmount', async () => {
      const { result, unmount } = renderHook(() => useAutoSave(getOptions({ debounceMs: 1000 })));

      act(() => {
        result.current.markDirty();
      });

      // Unmount before debounce fires
      unmount();

      // Advance time - no save should happen
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockSaveFn).not.toHaveBeenCalled();
    });
  });

  describe('Manual trigger', () => {
    it('triggerSave executes save immediately', async () => {
      const { result } = renderHook(() => useAutoSave(getOptions()));

      await act(async () => {
        result.current.triggerSave();
      });

      expect(mockSaveFn).toHaveBeenCalledTimes(1);
    });

    it('triggerSave does nothing when stopped (StaleEdit)', async () => {
      mockSaveFn.mockResolvedValueOnce({
        success: false,
        error: 'StaleEdit',
        message: 'Stale',
      });

      const { result } = renderHook(() => useAutoSave(getOptions({ debounceMs: 1000 })));

      // Trigger StaleEdit
      act(() => {
        result.current.markDirty();
      });
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      mockSaveFn.mockClear();

      // Try manual trigger - should not save
      await act(async () => {
        result.current.triggerSave();
      });

      expect(mockSaveFn).not.toHaveBeenCalled();
    });
  });
});
