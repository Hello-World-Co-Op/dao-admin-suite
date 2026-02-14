/**
 * TitleField Component
 *
 * Story BL-008.3.3: Post Creation Form and Metadata Panel
 * Task 5: Create TitleField component with validation
 *
 * Controlled title input with:
 * - Min 1 char, max 200 chars validation on blur
 * - Inline error message display
 * - Accessibility: aria-invalid, aria-describedby
 *
 * @see AC1 - Post creation form with title field
 * @see AC3 - Title validation and slug auto-generation
 */

import { useState, useCallback } from 'react';

interface TitleFieldProps {
  value: string;
  onChange: (title: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export function TitleField({ value, onChange, onBlur, disabled }: TitleFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validate = useCallback((title: string): string | null => {
    if (!title.trim()) return 'Title is required';
    if (title.length > 200) return `Title must be 200 characters or fewer (${title.length}/200)`;
    return null;
  }, []);

  const handleBlur = useCallback(() => {
    setTouched(true);
    const validationError = validate(value);
    setError(validationError);
    onBlur?.();
  }, [value, validate, onBlur]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      // Clear error while typing if previously touched
      if (touched && error) {
        const validationError = validate(newValue);
        setError(validationError);
      }
    },
    [onChange, touched, error, validate],
  );

  const hasError = touched && error !== null;

  return (
    <div className="mb-4">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="Post title..."
        className={`w-full text-2xl font-bold text-gray-900 placeholder-gray-400 border-0 border-b-2 ${
          hasError ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
        } focus:outline-none focus:ring-0 py-2 bg-transparent transition-colors`}
        aria-label="Post title"
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? 'title-error' : undefined}
        data-testid="title-field"
      />
      {hasError && (
        <p
          id="title-error"
          className="mt-1 text-sm text-red-600"
          role="alert"
          data-testid="title-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
