/**
 * ExcerptEditor Component
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel
 * Task 10: Create ExcerptEditor component
 *
 * Features:
 * - Textarea for custom excerpt with character counter (max 300 chars)
 * - Auto-generated excerpt shown as placeholder
 * - Word count and character count indicators
 *
 * @see AC2 - MetadataPanel components
 * @see AC4 - Auto-excerpt from first paragraph
 */

import { useCallback } from 'react';

interface ExcerptEditorProps {
  value: string;
  onChange: (excerpt: string) => void;
  autoExcerpt: string;
}

export function ExcerptEditor({ value, onChange, autoExcerpt }: ExcerptEditorProps) {
  const maxChars = 300;
  const charCount = value.length;
  const wordCount = value ? value.split(/\s+/).filter(Boolean).length : 0;
  const isOverLimit = charCount > maxChars;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  return (
    <div className="space-y-1" data-testid="excerpt-editor">
      <label htmlFor="excerpt-input" className="block text-sm font-medium text-gray-700">
        Excerpt
      </label>
      <textarea
        id="excerpt-input"
        value={value}
        onChange={handleChange}
        placeholder={autoExcerpt ? `Auto: ${autoExcerpt}` : 'Write a custom excerpt...'}
        rows={3}
        className={`w-full px-3 py-2 text-sm border rounded-md ${
          isOverLimit ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
        } focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none`}
        aria-describedby="excerpt-counter"
        data-testid="excerpt-input"
      />
      <div
        id="excerpt-counter"
        className="flex justify-between text-xs text-gray-500"
        data-testid="excerpt-counter"
      >
        <span>{wordCount} words</span>
        <span className={isOverLimit ? 'text-red-600 font-medium' : ''}>
          {charCount}/{maxChars} chars
        </span>
      </div>
      {isOverLimit && (
        <p className="text-xs text-red-600" role="alert" data-testid="excerpt-error">
          Excerpt must be {maxChars} characters or fewer
        </p>
      )}
    </div>
  );
}
