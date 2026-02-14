/**
 * Auto-Excerpt Generation Utility
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel
 * Task 16: Implement auto-excerpt generation
 *
 * Extracts the first paragraph from editor HTML, strips tags,
 * and truncates to 300 characters with ellipsis.
 */

/**
 * Generate an auto-excerpt from HTML content.
 *
 * - Extracts the first <p> tag content
 * - Strips all HTML tags
 * - Truncates to maxLength characters with ellipsis
 *
 * @param html - HTML content from the editor
 * @param maxLength - Maximum excerpt length (default 300)
 * @returns Plain text excerpt
 */
export function generateAutoExcerpt(html: string, maxLength = 300): string {
  if (!html) return '';

  // Extract first <p> tag content
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!pMatch) {
    // If no <p> tag, use the entire content
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    if (stripped.length <= maxLength) return stripped;
    return stripped.slice(0, maxLength).trimEnd() + '...';
  }

  // Strip HTML tags from the paragraph
  const plainText = pMatch[1].replace(/<[^>]*>/g, '').trim();

  if (!plainText) return '';
  if (plainText.length <= maxLength) return plainText;
  return plainText.slice(0, maxLength).trimEnd() + '...';
}
