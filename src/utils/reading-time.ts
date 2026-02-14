/**
 * Reading Time Calculation Utility
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel
 * Task 15: Implement reading time calculation
 *
 * Formula: Math.ceil(wordCount / 200) minutes
 * Strips HTML tags before counting words.
 */

/**
 * Strip HTML tags from content, returning plain text.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Count words in plain text.
 * Splits by whitespace and filters empty strings.
 */
export function countWords(text: string): number {
  const plain = stripHtml(text);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

/**
 * Calculate reading time in minutes from HTML content.
 * Uses 200 words per minute as the average reading speed.
 *
 * @param html - HTML content from the editor
 * @returns Reading time in minutes (minimum 1 if content exists)
 */
export function calculateReadingTime(html: string): number {
  const words = countWords(html);
  if (words === 0) return 0;
  return Math.ceil(words / 200);
}
