/**
 * SEOPreview Component
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel
 * Task 13: Create SEOPreview component
 *
 * Features:
 * - Google search result card preview (blue title, green URL, gray excerpt)
 * - Title truncated at 60 chars, excerpt at 160 chars
 * - Social media card preview with OG image placeholder
 * - Reactive updates when title/slug/excerpt change
 *
 * @see AC2 - MetadataPanel components
 */

interface SEOPreviewProps {
  title: string;
  slug: string;
  excerpt: string;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

export function SEOPreview({ title, slug, excerpt }: SEOPreviewProps) {
  const displayTitle = truncate(title || 'Untitled Post', 60);
  const displayUrl = `www.helloworlddao.com/blog/${slug || 'your-slug'}`;
  const displayExcerpt = truncate(excerpt || 'No excerpt provided. The first paragraph of your post will be used as the default excerpt.', 160);

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

      {/* Social Media Card Preview */}
      <div className="p-3 border border-gray-200 rounded-md bg-white" data-testid="social-preview">
        <p className="text-xs text-gray-500 mb-1">Social Media Card Preview</p>
        <div className="border border-gray-200 rounded-md overflow-hidden">
          {/* OG Image placeholder */}
          <div
            className="h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-sm"
            data-testid="og-image-placeholder"
          >
            OG Image (set in future story)
          </div>
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
