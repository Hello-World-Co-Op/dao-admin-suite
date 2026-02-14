/**
 * Tests for ErrorDisplay - BlogError to UX Feedback Mapping
 *
 * Story BL-008.3.6: Post Preview and OG Image Management
 *
 * Validates:
 * - mapBlogError maps each variant correctly (AC5)
 * - NotFound -> redirect to /blog + toast (AC5)
 * - Unauthorized -> redirect to /login (AC5)
 * - InvalidInput -> inline field error with aria-describedby (AC5)
 * - SlugTaken -> inline slug field error (AC5)
 * - PostTooLarge -> inline editor error (AC5)
 * - StaleEdit -> persistent banner (AC5)
 * - ScheduleInPast -> inline date picker error (AC5)
 * - InternalError -> toast + console.error (AC5)
 * - InlineFieldError accessibility (NFR26)
 *
 * @see AC5 - BlogError -> UX Feedback mapping
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InlineFieldError } from './ErrorDisplay';
import { mapBlogError } from '@/utils/blogErrorMapper';
import type { BlogError } from '@/utils/blogErrorMapper';

describe('mapBlogError', () => {
  describe('AC5: NotFound error mapping', () => {
    it('maps NotFound to redirect to /blog with toast', () => {
      const error: BlogError = { variant: 'NotFound' };
      const feedback = mapBlogError(error);

      expect(feedback.type).toBe('redirect');
      expect(feedback.message).toBe('Post not found');
      expect(feedback.redirectTo).toBe('/blog');
    });
  });

  describe('AC5: Unauthorized error mapping', () => {
    it('maps Unauthorized to redirect to /login', () => {
      const error: BlogError = { variant: 'Unauthorized' };
      const feedback = mapBlogError(error);

      expect(feedback.type).toBe('redirect');
      expect(feedback.message).toBe('Permission denied');
      expect(feedback.redirectTo).toBe('/login');
    });
  });

  describe('AC5: InvalidInput error mapping', () => {
    it('maps InvalidInput to inline field error', () => {
      const error: BlogError = { variant: 'InvalidInput', field: 'title', message: 'Title is too short' };
      const feedback = mapBlogError(error);

      expect(feedback.type).toBe('inline');
      expect(feedback.message).toBe('Title is too short');
      expect(feedback.field).toBe('title');
    });

    it('uses default message when none provided', () => {
      const error: BlogError = { variant: 'InvalidInput', field: 'body' };
      const feedback = mapBlogError(error);

      expect(feedback.message).toBe('Invalid input');
    });
  });

  describe('AC5: SlugTaken error mapping', () => {
    it('maps SlugTaken to inline slug field error', () => {
      const error: BlogError = { variant: 'SlugTaken' };
      const feedback = mapBlogError(error);

      expect(feedback.type).toBe('inline');
      expect(feedback.message).toBe('This URL is already in use');
      expect(feedback.field).toBe('slug');
    });
  });

  describe('AC5: PostTooLarge error mapping', () => {
    it('maps PostTooLarge to inline editor error', () => {
      const error: BlogError = { variant: 'PostTooLarge' };
      const feedback = mapBlogError(error);

      expect(feedback.type).toBe('inline');
      expect(feedback.message).toBe('Post exceeds 500KB limit. Remove images or reduce content.');
      expect(feedback.field).toBe('editor');
    });
  });

  describe('AC5: StaleEdit error mapping', () => {
    it('maps StaleEdit to persistent banner', () => {
      const error: BlogError = { variant: 'StaleEdit' };
      const feedback = mapBlogError(error);

      expect(feedback.type).toBe('banner');
      expect(feedback.message).toBe('Modified in another session. Reload to see latest.');
    });
  });

  describe('AC5: ScheduleInPast error mapping', () => {
    it('maps ScheduleInPast to inline date picker error', () => {
      const error: BlogError = { variant: 'ScheduleInPast' };
      const feedback = mapBlogError(error);

      expect(feedback.type).toBe('inline');
      expect(feedback.message).toBe('Schedule time must be in the future');
      expect(feedback.field).toBe('schedule');
    });
  });

  describe('AC5: InternalError error mapping', () => {
    it('maps InternalError to toast', () => {
      const error: BlogError = { variant: 'InternalError' };
      const feedback = mapBlogError(error);

      expect(feedback.type).toBe('toast');
      expect(feedback.message).toBe('Something went wrong. Try again.');
    });
  });

  describe('all variants are covered', () => {
    it('every BlogError variant produces a valid feedback', () => {
      const variants = [
        'NotFound', 'Unauthorized', 'InvalidInput', 'SlugTaken',
        'PostTooLarge', 'StaleEdit', 'ScheduleInPast', 'InternalError',
      ] as const;

      for (const variant of variants) {
        const feedback = mapBlogError({ variant });
        expect(feedback.type).toBeTruthy();
        expect(feedback.message).toBeTruthy();
      }
    });
  });
});

describe('InlineFieldError', () => {
  describe('AC5: Accessibility with aria-describedby', () => {
    it('renders error message when visible', () => {
      render(<InlineFieldError fieldId="slug" message="This URL is already in use" visible={true} />);

      const error = screen.getByTestId('inline-error-slug');
      expect(error).toBeInTheDocument();
      expect(error).toHaveTextContent('This URL is already in use');
    });

    it('sets correct id for aria-describedby linking', () => {
      render(<InlineFieldError fieldId="slug" message="Error" visible={true} />);

      const error = screen.getByTestId('inline-error-slug');
      expect(error).toHaveAttribute('id', 'slug-error');
    });

    it('has role="alert" for screen readers', () => {
      render(<InlineFieldError fieldId="title" message="Required" visible={true} />);

      const error = screen.getByTestId('inline-error-title');
      expect(error).toHaveAttribute('role', 'alert');
    });

    it('does not render when not visible', () => {
      render(<InlineFieldError fieldId="slug" message="Error" visible={false} />);

      expect(screen.queryByTestId('inline-error-slug')).not.toBeInTheDocument();
    });

    it('uses red text for visibility', () => {
      render(<InlineFieldError fieldId="test" message="Error" visible={true} />);

      const error = screen.getByTestId('inline-error-test');
      expect(error).toHaveClass('text-red-600');
    });
  });
});
