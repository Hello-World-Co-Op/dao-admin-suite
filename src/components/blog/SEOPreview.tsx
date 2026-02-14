/**
 * SEOPreview Component
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel (base)
 * Story BL-008.3.6: Enhanced with length warnings and OG image display (AC4)
 *
 * Features:
 * - Google SERP-style card: blue title, green URL, gray description
 * - Title truncation at 60 chars with ellipsis
 * - Description truncation at 155-160 chars (sentence boundary preferred)
 * - URL structure: www.helloworlddao.com/blog/{slug}
 * - Real-time updates as title/excerpt/slug change
 * - Visual indicator (yellow warning) if title > 60 chars
 * - Visual indicator (yellow warning) if excerpt < 100 or > 160 chars
 * - Social media card preview with OG image
 *
 * @see AC4 - SEOPreview in MetadataPanel
 */

interface SEOPreviewProps {
  title: string;
  slug: string;
  excerpt: string;
  /** Optional OG image URL for social card preview */
  ogImageUrl?: string | null;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

export function SEOPreview({ title, slug, excerpt, ogImageUrl }: SEOPreviewProps) {
  const displayTitle = truncate(title || 'Untitled Post', 60);
  const displayUrl = `www.helloworlddao.com/blog/${slug || 'your-slug'}`;
  const displayExcerpt = truncate(excerpt || 'No excerpt provided. The first paragraph of your post will be used as the default excerpt.', 160);

  const titleLength = (title || '').length;
  const excerptLength = (excerpt || '').length;
  const isTitleTooLong = titleLength > 60;
  const isExcerptTooShort = excerptLength > 0 && excerptLength < 100;
  const isExcerptTooLong = excerptLength > 160;

  return (
    <div className="space-y-3" data-testid="seo-preview">
      <h4 className="text-sm font-medium text-gray-700">SEO Preview</h4>

      {/* Google Search Result Preview */}
      <div className="p-3 border border-gray-200 rounded-md bg-white" data-testid="google-preview">
        <p className="text-xs text-gray-500 mb-1">Google Search Preview</p>
        <h3
          className="text-lg text-blue-700 hover:underline cursor-pointer leading-tight"
          data-testid="seo-title"
        >
          {displayTitle}
        </h3>
        <p className="text-sm text-green-700 truncate" data-testid="seo-url">
          {displayUrl}
        </p>
        <p className="text-sm text-gray-600 mt-1 leading-snug" data-testid="seo-excerpt">
          {displayExcerpt}
        </p>
      </div>

      {/* Length warnings */}
      <div className="space-y-1">
        {isTitleTooLong && (
          <p
            className="text-xs text-yellow-600 flex items-center gap-1"
            data-testid="seo-title-warning"
          >
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
            Title is {titleLength} chars (recommended: 60 max for Google SERP)
          </p>
        )}
        {isExcerptTooShort && (
          <p
            className="text-xs text-yellow-600 flex items-center gap-1"
            data-testid="seo-excerpt-short-warning"
          >
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
            Excerpt is {excerptLength} chars (recommended: 100-160 for search snippets)
          </p>
        )}
        {isExcerptTooLong && (
          <p
            className="text-xs text-yellow-600 flex items-center gap-1"
            data-testid="seo-excerpt-long-warning"
          >
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
            Excerpt is {excerptLength} chars (recommended: max 160 for search snippets)
          </p>
        )}
      </div>

      {/* Social Media Card Preview */}
      <div className="p-3 border border-gray-200 rounded-md bg-white" data-testid="social-preview">
        <p className="text-xs text-gray-500 mb-1">Social Media Card Preview</p>
        <div className="border border-gray-200 rounded-md overflow-hidden">
          {/* OG Image */}
          {ogImageUrl ? (
            <img
              src={ogImageUrl}
              alt="OG image preview"
              className="w-full h-32 object-cover"
              data-testid="og-image-social"
            />
          ) : (
            <div
              className="h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-sm"
              data-testid="og-image-placeholder"
            >
              No OG image set
            </div>
          )}
          <div className="p-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{displayUrl}</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{displayTitle}</p>
            <p className="text-xs text-gray-600 mt-0.5">{truncate(excerpt || '', 100)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
