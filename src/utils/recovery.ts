/**
 * Crash recovery utilities for blog editor localStorage backup
 *
 * Timestamp normalization:
 * - Canister: IC nanoseconds / 1_000_000 = milliseconds
 * - localStorage: Date.now() in milliseconds
 * - Tolerance: 5000ms (don't show recovery prompt if timestamps within 5 seconds)
 *
 * @see BL-008.3.4 AC6, AC7
 */

/** Tolerance window in milliseconds for timestamp comparison */
export const RECOVERY_TOLERANCE_MS = 5_000;

/**
 * Normalize IC nanosecond timestamp to JavaScript milliseconds.
 */
export function normalizeICTimestamp(nanoseconds: number): number {
  return Math.floor(nanoseconds / 1_000_000);
}

/**
 * Check if localStorage backup is newer than canister version.
 * Returns the backup body if recovery should be offered, null otherwise.
 */
export function checkForRecovery(
  postId: number,
  canisterUpdatedAt: number
): { body: string; timestamp: number } | null {
  try {
    const backupKey = `blog-draft-backup-${postId}`;
    const raw = localStorage.getItem(backupKey);
    if (!raw) return null;

    const backup = JSON.parse(raw) as { body: string; timestamp: number };
    if (!backup.body || typeof backup.timestamp !== 'number') return null;

    const canisterMs = normalizeICTimestamp(canisterUpdatedAt);
    const diff = backup.timestamp - canisterMs;

    // Only offer recovery if local backup is newer by more than tolerance
    if (diff > RECOVERY_TOLERANCE_MS) {
      return backup;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clear localStorage backup for a post.
 */
export function clearBackup(postId: number): void {
  try {
    localStorage.removeItem(`blog-draft-backup-${postId}`);
  } catch {
    // Ignore storage errors
  }
}
