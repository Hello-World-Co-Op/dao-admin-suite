/**
 * useAutoSave - Custom hook for auto-saving blog drafts
 *
 * Implements trailing debounce (60s) + max-wait (5min) timer pattern
 * per architecture spec (BL-008 Auto-Save Timer).
 *
 * - Each Tiptap onUpdate sets dirtyRef = true, clears/restarts 60s debounce
 * - Max-wait timer: if dirtyRef && now - lastSave > 300_000ms, force save
 * - On successful save: update lastSave, clear dirty, store new updated_at
 * - On StaleEdit: stop both timers
 * - On network error: keep timers running for retry
 * - On Unauthorized: show inline re-auth prompt, keep content
 *
 * @see BL-008.3.4 - Auto-Save, Crash Recovery, and Save Indicators
 */

import { useRef, useCallback, useEffect } from 'react';

/** Save result from oracle-bridge */
export interface SaveResult {
  success: boolean;
  updated_at?: number;
  error?: 'StaleEdit' | 'Unauthorized' | 'NetworkError' | 'PostTooLarge' | 'InternalError';
  message?: string;
}

/** Save status for UI indicators */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'stale' | 'unauthorized';

/** Options for useAutoSave hook */
export interface UseAutoSaveOptions {
  /** Post ID (null for new/unsaved posts) */
  postId: number | null;
  /** Current expected_updated_at value */
  expectedUpdatedAt: number;
  /** Function to get current editor HTML */
  getContent: () => string;
  /** Function to call oracle-bridge save endpoint */
  saveFn: (body: string, expectedUpdatedAt: number) => Promise<SaveResult>;
  /** Callback when save succeeds with new updated_at */
  onSaveSuccess: (updatedAt: number) => void;
  /** Callback when save status changes */
  onStatusChange: (status: SaveStatus, message?: string) => void;
  /** Debounce delay in ms (default 60000 = 60s) */
  debounceMs?: number;
  /** Max wait time in ms (default 300000 = 5min) */
  maxWaitMs?: number;
  /** Whether auto-save is enabled (false for new unsaved posts) */
  enabled: boolean;
}

/** Return type for useAutoSave hook */
export interface UseAutoSaveReturn {
  /** Mark content as dirty (call on editor update) */
  markDirty: () => void;
  /** Trigger a manual save */
  triggerSave: () => void;
  /** Whether content has unsaved changes */
  isDirty: boolean;
}

/**
 * Auto-save hook with trailing debounce + max-wait pattern.
 */
export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const {
    postId,
    expectedUpdatedAt,
    getContent,
    saveFn,
    onSaveSuccess,
    onStatusChange,
    debounceMs = 60_000,
    maxWaitMs = 300_000,
    enabled,
  } = options;

  const dirtyRef = useRef(false);
  const lastSaveRef = useRef(Date.now());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);
  const savingRef = useRef(false);

  // Store latest refs for callbacks to avoid stale closures
  const expectedUpdatedAtRef = useRef(expectedUpdatedAt);
  expectedUpdatedAtRef.current = expectedUpdatedAt;

  const getContentRef = useRef(getContent);
  getContentRef.current = getContent;

  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  const onSaveSuccessRef = useRef(onSaveSuccess);
  onSaveSuccessRef.current = onSaveSuccess;

  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  const postIdRef = useRef(postId);
  postIdRef.current = postId;

  /** Execute the actual save */
  const executeSave = useCallback(async () => {
    if (!dirtyRef.current || savingRef.current || stoppedRef.current) return;
    if (postIdRef.current === null) return;

    savingRef.current = true;
    onStatusChangeRef.current('saving');

    const body = getContentRef.current();

    // Backup to localStorage before saving
    try {
      const backupKey = `blog-draft-backup-${postIdRef.current}`;
      localStorage.setItem(
        backupKey,
        JSON.stringify({ body, timestamp: Date.now() })
      );
    } catch {
      // localStorage may be full or unavailable - continue with save
    }

    try {
      const result = await saveFnRef.current(body, expectedUpdatedAtRef.current);

      if (result.success && result.updated_at !== undefined) {
        dirtyRef.current = false;
        lastSaveRef.current = Date.now();
        savingRef.current = false;
        onSaveSuccessRef.current(result.updated_at);
        onStatusChangeRef.current('saved', new Date().toLocaleTimeString());
        return;
      }

      savingRef.current = false;

      if (result.error === 'StaleEdit') {
        stoppedRef.current = true;
        // Clear timers on StaleEdit
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        if (maxWaitTimerRef.current) {
          clearInterval(maxWaitTimerRef.current);
          maxWaitTimerRef.current = null;
        }
        onStatusChangeRef.current('stale', result.message);
        return;
      }

      if (result.error === 'Unauthorized') {
        onStatusChangeRef.current('unauthorized', result.message);
        // Keep timers running but don't retry until re-auth
        return;
      }

      // Network error or other: show error, keep timers for retry
      onStatusChangeRef.current('error', result.message || 'Save failed');
    } catch {
      savingRef.current = false;
      onStatusChangeRef.current('error', 'Save failed');
    }
  }, []);

  /** Mark content as dirty and restart debounce timer */
  const markDirty = useCallback(() => {
    dirtyRef.current = true;

    if (!enabled || stoppedRef.current || postIdRef.current === null) return;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      executeSave();
    }, debounceMs);
  }, [enabled, debounceMs, executeSave]);

  /** Manual save trigger (e.g., retry button) */
  const triggerSave = useCallback(() => {
    if (stoppedRef.current) return;
    dirtyRef.current = true;
    executeSave();
  }, [executeSave]);

  // Set up max-wait timer
  useEffect(() => {
    if (!enabled || postId === null) return;

    // Check every 10 seconds if max-wait has been exceeded
    maxWaitTimerRef.current = setInterval(() => {
      if (stoppedRef.current) return;
      if (dirtyRef.current && Date.now() - lastSaveRef.current > maxWaitMs) {
        // Clear debounce since we're force-saving
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        executeSave();
      }
    }, 10_000);

    return () => {
      if (maxWaitTimerRef.current) {
        clearInterval(maxWaitTimerRef.current);
        maxWaitTimerRef.current = null;
      }
    };
  }, [enabled, postId, maxWaitMs, executeSave]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (maxWaitTimerRef.current) {
        clearInterval(maxWaitTimerRef.current);
        maxWaitTimerRef.current = null;
      }
    };
  }, []);

  // Reset stopped state when postId changes (e.g., after reload)
  useEffect(() => {
    stoppedRef.current = false;
  }, [postId]);

  return {
    markDirty,
    triggerSave,
    get isDirty() {
      return dirtyRef.current;
    },
  };
}
