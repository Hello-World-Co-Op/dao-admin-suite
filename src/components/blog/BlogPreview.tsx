/**
 * BlogPreview Component
 *
 * Story BL-008.3.6: Post Preview and OG Image Management
 * Task: Create BlogPreview component (AC1)
 *
 * Features:
 * - Renders Tiptap HTML content with identical typography to published blog
 * - Uses blog-typography.css scoped under .blog-content class
 * - Modal overlay with close button
 * - Shows post title and reading time in preview header
 * - Identical visual rendering to marketing-suite public blog
 *
 * @see AC1 - Preview renders with same typography as published posts
 */

import '@/styles/blog-typography.css';

interface BlogPreviewProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  htmlContent: string;
  readingTime: number;
}

export function BlogPreview({ visible, onClose, title, htmlContent, readingTime }: BlogPreviewProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Post preview"
      data-testid="blog-preview-modal"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl my-8 mx-4 max-w-3xl w-full" data-testid="blog-preview-content">
        {/* Preview header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Preview
            </span>
            {readingTime > 0 && (
              <span className="text-sm text-gray-400" data-testid="preview-reading-time">
                {readingTime} min read
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
            aria-label="Close preview"
            data-testid="preview-close-button"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview body with blog typography */}
        <div className="px-6 py-8">
          {title && (
            <h1
              className="text-3xl font-bold text-gray-900 mb-6"
              style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
              data-testid="preview-title"
            >
              {title}
            </h1>
          )}
          <div
            className="blog-content"
            data-testid="preview-body"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </div>
  );
}
