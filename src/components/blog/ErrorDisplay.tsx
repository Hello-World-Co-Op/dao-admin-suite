/**
 * ErrorDisplay - Blog Error UI Components
 *
 * Story BL-008.3.6: Post Preview and OG Image Management
 * Task: Implement BlogError -> UX Feedback mapping (AC5)
 *
 * Components for rendering error feedback patterns:
 * - InlineFieldError: inline field error with aria-describedby (NFR26)
 *
 * Pure mapping function and types live in @/utils/blogErrorMapper.ts.
 * Import mapBlogError and types from there directly.
 *
 * @see AC5 - BlogError -> UX Feedback mapping
 */

/**
 * InlineFieldError - Displays inline error below a form field with aria-describedby.
 * Required by NFR26 for accessibility.
 */
interface InlineFieldErrorProps {
  fieldId: string;
  message: string;
  visible: boolean;
}

export function InlineFieldError({ fieldId, message, visible }: InlineFieldErrorProps) {
  if (!visible) return null;

  const errorId = `${fieldId}-error`;

  return (
    <p
      id={errorId}
      className="mt-1 text-xs text-red-600"
      role="alert"
      data-testid={`inline-error-${fieldId}`}
    >
      {message}
    </p>
  );
}
