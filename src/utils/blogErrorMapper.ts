/**
 * Blog Error Mapper - Pure functions for BlogError to UX Feedback mapping
 *
 * Story BL-008.3.6: Post Preview and OG Image Management
 * Task: Implement BlogError -> UX Feedback mapping (AC5)
 *
 * Separated from ErrorDisplay.tsx components to satisfy react-refresh/only-export-components rule.
 *
 * @see AC5 - BlogError -> UX Feedback mapping
 */

/** All possible BlogError variants from the canister */
export type BlogErrorVariant =
  | 'NotFound'
  | 'Unauthorized'
  | 'InvalidInput'
  | 'SlugTaken'
  | 'PostTooLarge'
  | 'StaleEdit'
  | 'ScheduleInPast'
  | 'InternalError';

/** Structured blog error from canister response */
export interface BlogError {
  variant: BlogErrorVariant;
  field?: string;
  message?: string;
}

/** Display pattern types */
export type ErrorDisplayType = 'toast' | 'inline' | 'banner' | 'redirect';

/** Mapped UX feedback for a BlogError */
export interface ErrorFeedback {
  type: ErrorDisplayType;
  message: string;
  field?: string;
  redirectTo?: string;
}

/**
 * Map a BlogError to the correct UX feedback pattern.
 * This is the authoritative mapping per the architecture spec.
 */
export function mapBlogError(error: BlogError): ErrorFeedback {
  switch (error.variant) {
    case 'NotFound':
      return {
        type: 'redirect',
        message: 'Post not found',
        redirectTo: '/blog',
      };

    case 'Unauthorized':
      return {
        type: 'redirect',
        message: 'Permission denied',
        redirectTo: '/login',
      };

    case 'InvalidInput':
      return {
        type: 'inline',
        message: error.message || 'Invalid input',
        field: error.field,
      };

    case 'SlugTaken':
      return {
        type: 'inline',
        message: 'This URL is already in use',
        field: 'slug',
      };

    case 'PostTooLarge':
      return {
        type: 'inline',
        message: 'Post exceeds 500KB limit. Remove images or reduce content.',
        field: 'editor',
      };

    case 'StaleEdit':
      return {
        type: 'banner',
        message: 'Modified in another session. Reload to see latest.',
      };

    case 'ScheduleInPast':
      return {
        type: 'inline',
        message: 'Schedule time must be in the future',
        field: 'schedule',
      };

    case 'InternalError':
      return {
        type: 'toast',
        message: 'Something went wrong. Try again.',
      };
  }
}
