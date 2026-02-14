/**
 * Slug Generator Utility
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel
 * Task 9.2: Auto-generate slug from title
 *
 * Replicates the canister's deunicode + lowercase + hyphenation logic
 * for instant client-side preview. Server validates and enforces uniqueness.
 */

/**
 * Generate a URL-safe slug from a title string.
 *
 * - Converts to lowercase
 * - Replaces non-alphanumeric characters with hyphens
 * - Collapses multiple hyphens into one
 * - Trims leading/trailing hyphens
 * - Truncates to max length
 *
 * @param title - The post title to slugify
 * @param maxLength - Maximum slug length (default 200)
 * @returns URL-safe slug string
 */
export function generateSlug(title: string, maxLength = 200): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')     // non-alnum to hyphens
    .replace(/^-+|-+$/g, '')          // trim leading/trailing hyphens
    .replace(/-{2,}/g, '-')           // collapse double hyphens
    .slice(0, maxLength);
}

/**
 * Validate slug format.
 * Must contain only lowercase letters, numbers, and hyphens.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
}
