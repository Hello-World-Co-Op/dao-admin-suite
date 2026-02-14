/**
 * MetadataPanel Component
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel (base)
 * Story BL-008.3.6: Extended with OG image section (AC2, AC3)
 *
 * Features:
 * - Collapsible panel with expand/collapse toggle
 * - Contains: SlugField, ExcerptEditor, CategorySelector, TagInput, OGImagePreview, SEOPreview
 * - Default collapsed for new posts, expanded for existing posts with metadata
 * - Reading time display in header
 * - OG image preview with auto-detection support
 * - Accessibility: aria-expanded, role="region", aria-labelledby
 *
 * @see BL-008.3.3 AC2 - MetadataPanel components
 * @see BL-008.3.6 AC2 - OG image upload
 * @see BL-008.3.6 AC3 - Auto-OG detection
 */

import { useState, useCallback } from 'react';
import { SlugField } from './SlugField';
import { ExcerptEditor } from './ExcerptEditor';
import { CategorySelector } from './CategorySelector';
import { TagInput } from './TagInput';
import { SEOPreview } from './SEOPreview';
import { OGImagePreview } from './OGImagePreview';

interface MetadataPanelProps {
  title: string;
  slug: string;
  onSlugChange: (slug: string) => void;
  excerpt: string;
  onExcerptChange: (excerpt: string) => void;
  autoExcerpt: string;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  readingTime: number;
  isPublished?: boolean;
  isExpanded?: boolean;
  slugError?: string | null;
  oracleBridgeUrl?: string;
  /** Called when a metadata field loses focus, to persist changes to canister */
  onMetadataBlur?: () => void;
  /** Custom OG image URL */
  ogImageUrl?: string | null;
  /** Auto-detected OG image URL from post body */
  autoOgImageUrl?: string | null;
  /** Called when OG image changes */
  onOGImageChange?: (url: string | null) => void;
}

export function MetadataPanel({
  title,
  slug,
  onSlugChange,
  excerpt,
  onExcerptChange,
  autoExcerpt,
  categories,
  onCategoriesChange,
  tags,
  onTagsChange,
  readingTime,
  isPublished,
  isExpanded: defaultExpanded,
  slugError,
  oracleBridgeUrl,
  onMetadataBlur,
  ogImageUrl,
  autoOgImageUrl,
  onOGImageChange,
}: MetadataPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);

  // Only fire onMetadataBlur when focus actually leaves the panel entirely,
  // not when focus moves between child inputs within the panel.
  const handlePanelBlur = useCallback((e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      onMetadataBlur?.();
    }
  }, [onMetadataBlur]);

  const displayOgUrl = ogImageUrl || autoOgImageUrl || null;

  return (
    <div
      className="border border-gray-200 rounded-lg bg-white"
      data-testid="metadata-panel"
    >
      {/* Panel Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={expanded}
        aria-controls="metadata-content"
        id="metadata-header"
        data-testid="metadata-toggle"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900">Post Metadata</span>
          {readingTime > 0 && (
            <span
              className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
              data-testid="reading-time"
            >
              {readingTime} min read
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel Content */}
      {expanded && (
        <div
          id="metadata-content"
          role="region"
          aria-labelledby="metadata-header"
          className="px-4 pb-4 space-y-4 border-t border-gray-200"
          data-testid="metadata-content"
          onBlur={handlePanelBlur}
        >
          <div className="pt-4">
            <SlugField
              value={slug}
              onChange={onSlugChange}
              title={title}
              isPublished={isPublished}
              slugError={slugError}
            />
          </div>

          <ExcerptEditor
            value={excerpt}
            onChange={onExcerptChange}
            autoExcerpt={autoExcerpt}
          />

          <CategorySelector
            selected={categories}
            onChange={onCategoriesChange}
            oracleBridgeUrl={oracleBridgeUrl}
          />

          <TagInput
            tags={tags}
            onChange={onTagsChange}
          />

          {/* OG Image Section (BL-008.3.6 AC2, AC3) */}
          {onOGImageChange && (
            <OGImagePreview
              ogImageUrl={ogImageUrl ?? null}
              autoOgImageUrl={autoOgImageUrl ?? null}
              onOGImageChange={onOGImageChange}
              oracleBridgeUrl={oracleBridgeUrl || ''}
            />
          )}

          <SEOPreview
            title={title}
            slug={slug}
            excerpt={excerpt || autoExcerpt}
            ogImageUrl={displayOgUrl}
          />
        </div>
      )}
    </div>
  );
}
