/**
 * Date formatting utility for blog posts
 *
 * Handles IC nanosecond timestamps by converting to milliseconds.
 */

/**
 * Format a timestamp as a localized date string.
 * Handles both millisecond and nanosecond timestamps (IC time).
 *
 * @param timestamp - Unix timestamp in milliseconds or nanoseconds (IC time)
 * @returns Formatted date string like "Jan 15, 2024" or "-" if null/invalid
 */
export function formatDate(timestamp: number | null): string {
  if (!timestamp) return '-';

  try {
    // IC nanosecond timestamps need to be divided by 1_000_000 to get milliseconds
    const ms = timestamp > 1e15 ? timestamp / 1_000_000 : timestamp;
    return new Date(ms).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('[formatDate] Error formatting date:', error);
    return '-';
  }
}
