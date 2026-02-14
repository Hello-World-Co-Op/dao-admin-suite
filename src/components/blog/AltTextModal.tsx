/**
 * Alt Text Modal Component
 *
 * Story BL-008.4.2: Client-Side Image Processing and Editor Integration
 * Task 2.5: Show alt text input modal before inserting image into editor (WCAG requirement)
 *
 * Features:
 * - Required alt text validation (cannot submit empty)
 * - Keyboard accessible: Escape to close, Enter to confirm
 * - Auto-focuses input on open
 * - ARIA labels for screen readers
 * - Image preview thumbnail
 *
 * @see AC4 - Alt text required before image insertion (WCAG 2.1 AA)
 * @see NFR25 - WCAG 2.1 AA compliance
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface AltTextModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Preview URL of the image (blob or data URL) */
  imagePreviewUrl?: string;
  /** File name for display */
  fileName?: string;
  /** Called when user confirms with alt text */
  onConfirm: (altText: string) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

export function AltTextModal({
  visible,
  imagePreviewUrl,
  fileName,
  onConfirm,
  onCancel,
}: AltTextModalProps) {
  const [altText, setAltText] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (visible) {
      setAltText('');
      setError('');
      // Use requestAnimationFrame to ensure DOM is rendered before focusing
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [visible]);

  // Handle Escape key to close
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onCancel]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const trimmed = altText.trim();
      if (!trimmed) {
        setError('Alt text is required for accessibility');
        inputRef.current?.focus();
        return;
      }

      if (trimmed.length > 200) {
        setError('Alt text should be concise (max 200 characters)');
        inputRef.current?.focus();
        return;
      }

      onConfirm(trimmed);
    },
    [altText, onConfirm]
  );

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alt-text-modal-title"
      data-testid="alt-text-modal"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 pt-5 pb-3">
            <h3
              id="alt-text-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              Add Image Alt Text
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Describe the image for screen reader users (required for accessibility).
            </p>
          </div>

          {/* Image Preview */}
          {imagePreviewUrl && (
            <div className="px-6 pb-3">
              <img
                src={imagePreviewUrl}
                alt="Preview of image to be uploaded"
                className="w-full h-32 object-contain bg-gray-100 rounded-md border border-gray-200"
                data-testid="alt-text-image-preview"
              />
              {fileName && (
                <p className="text-xs text-gray-500 mt-1 truncate">{fileName}</p>
              )}
            </div>
          )}

          {/* Alt Text Input */}
          <div className="px-6 pb-4">
            <label htmlFor="alt-text-input" className="sr-only">
              Alternative text for screen readers
            </label>
            <input
              ref={inputRef}
              id="alt-text-input"
              type="text"
              value={altText}
              onChange={(e) => {
                setAltText(e.target.value);
                if (error) setError('');
              }}
              placeholder="Describe what this image shows..."
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-400 focus:ring-red-500' : 'border-gray-300'
              }`}
              aria-label="Alternative text for screen readers"
              aria-describedby={error ? 'alt-text-error' : undefined}
              aria-invalid={!!error}
              data-testid="alt-text-input"
            />
            <div className="flex justify-between items-center mt-1">
              <div className="flex-1">
                {error && (
                  <p
                    id="alt-text-error"
                    className="text-xs text-red-600"
                    role="alert"
                    data-testid="alt-text-error"
                  >
                    {error}
                  </p>
                )}
              </div>
              <p
                className={`text-xs ${
                  altText.length > 200 ? 'text-red-600' : 'text-gray-500'
                }`}
                data-testid="alt-text-char-count"
              >
                {altText.length}/200
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 px-6 pb-5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="alt-text-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="alt-text-confirm"
            >
              Insert Image
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
