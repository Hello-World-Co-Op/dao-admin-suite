/**
 * SlugField Component
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel
 * Task 9: Create SlugField component
 *
 * Features:
 * - Auto-generated slug display (editable for drafts, read-only for published)
 * - Validation: ^[a-z0-9-]+$ format check on blur
 * - "Auto-generate" button to regenerate from title
 * - URL preview: www.helloworlddao.com/blog/{slug}
 *
 * @see AC2 - MetadataPanel components
 * @see AC3 - Slug auto-generation
 */

import { useState, useCallback } from 'react';
import { generateSlug, isValidSlug } from '@/utils/slug-generator';

interface SlugFieldProps {
  value: string;
  onChange: (slug: string) => void;
  title: string;
  isPublished?: boolean;
  slugError?: string | null;
}

export function SlugField({ value, onChange, title, isPublished, slugError }: SlugFieldProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (value && !isValidSlug(value)) {
      setLocalError('Slug must contain only lowercase letters, numbers, and hyphens');
    } else {
      setLocalError(null);
    }
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      if (touched) {
        setLocalError(null);
      }
    },
    [onChange, touched],
  );

  const handleAutoGenerate = useCallback(() => {
    if (title) {
      const newSlug = generateSlug(title);
      onChange(newSlug);
      setLocalError(null);
    }
  }, [title, onChange]);

  const displayError = slugError || localError;
  const hasError = !!displayError;

  return (
    <div className="space-y-1" data-testid="slug-field">
      <label htmlFor="slug-input" className="block text-sm font-medium text-gray-700">
        URL Slug
      </label>
      <div className="flex gap-2">
        <input
          id="slug-input"
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isPublished}
          placeholder="auto-generated-slug"
          className={`flex-1 px-3 py-1.5 text-sm border rounded-md ${
            isPublished
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : hasError
                ? 'border-red-500'
                : 'border-gray-300 focus:border-blue-500'
          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? 'slug-error' : 'slug-preview'}
          data-testid="slug-input"
        />
        {!isPublished && (
          <button
            type="button"
            onClick={handleAutoGenerate}
            className="px-3 py-1.5 text-xs text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Auto-generate slug from title"
            data-testid="slug-auto-generate"
          >
            Auto
          </button>
        )}
      </div>
      {hasError && (
        <p id="slug-error" className="text-xs text-red-600" role="alert" data-testid="slug-error">
          {displayError}
        </p>
      )}
      <p id="slug-preview" className="text-xs text-gray-500" data-testid="slug-preview">
        www.helloworlddao.com/blog/{value || 'your-slug'}
      </p>
    </div>
  );
}
