/**
 * Shared analytics utilities
 *
 * Story BL-020.3: Admin Analytics Dashboard UI
 * Task 4.5: Extract shared helpers to avoid duplication
 *
 * @see AC3 - formatReadTime for avg read time display
 * @see AC6 - truncatePrincipal for author display fallback
 */

/**
 * Format seconds into a human-readable read time string.
 *
 * Note: avg_read_time_seconds from oracle-bridge may be slightly overestimated
 * for multi-tab-switch sessions due to cumulative beacon reporting (see BL-020.2
 * code review Issue 5). Display the value as-is.
 *
 * @param seconds - Read time in seconds, or null if unavailable
 * @returns Formatted string like "1m 24s", "45s", "2m", or dash if null/zero
 */
export function formatReadTime(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '\u2014';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

/**
 * Truncate a principal string for display.
 *
 * @param principal - Full IC principal string
 * @returns First 8 characters + "..."
 */
export function truncatePrincipal(principal: string): string {
  if (principal.length <= 8) return principal;
  return `${principal.slice(0, 8)}...`;
}
