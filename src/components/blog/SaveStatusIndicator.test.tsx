/**
 * Tests for SaveStatusIndicator component
 *
 * Story BL-008.3.4 - Auto-Save, Crash Recovery, and Save Indicators
 *
 * Validates:
 * - Idle state renders empty container (AC3)
 * - Saving state shows spinner and "Saving..." text (AC3)
 * - Saved state shows checkmark and timestamp (AC3)
 * - Error state shows red "Save failed" with retry button (AC5)
 * - ARIA live region for announcements (NFR27)
 * - Retry button calls onRetry callback (AC5)
 * - No skipped tests (AI-R24)
 *
 * @see BL-008.3.4 AC3, AC5, NFR27
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveStatusIndicator } from './SaveStatusIndicator';

describe('SaveStatusIndicator', () => {
  describe('idle state', () => {
    it('renders empty container with aria-live region', () => {
      render(<SaveStatusIndicator status="idle" />);

      const container = screen.getByTestId('save-status');
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('aria-live', 'polite');
      expect(container.textContent).toBe('');
    });
  });

  describe('saving state', () => {
    it('shows spinner with "Saving..." text', () => {
      render(<SaveStatusIndicator status="saving" />);

      expect(screen.getByTestId('save-spinner')).toBeInTheDocument();
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('spinner has role="status" and aria-label', () => {
      render(<SaveStatusIndicator status="saving" />);

      const spinner = screen.getByTestId('save-spinner');
      expect(spinner).toHaveAttribute('role', 'status');
      expect(spinner).toHaveAttribute('aria-label', 'Saving');
    });
  });

  describe('saved state', () => {
    it('shows checkmark and timestamp from server response', () => {
      render(<SaveStatusIndicator status="saved" message="2:30:15 PM" />);

      expect(screen.getByTestId('save-checkmark')).toBeInTheDocument();
      expect(screen.getByTestId('save-timestamp')).toHaveTextContent('Last saved: 2:30:15 PM');
    });

    it('checkmark is aria-hidden (decorative)', () => {
      render(<SaveStatusIndicator status="saved" message="2:30:15 PM" />);

      const checkmark = screen.getByTestId('save-checkmark');
      expect(checkmark).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('error state', () => {
    it('shows red "Save failed" text', () => {
      render(<SaveStatusIndicator status="error" />);

      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });

    it('shows retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<SaveStatusIndicator status="error" onRetry={onRetry} />);

      const retryButton = screen.getByTestId('save-retry-button');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveTextContent('Retry');
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<SaveStatusIndicator status="error" onRetry={onRetry} />);

      fireEvent.click(screen.getByTestId('save-retry-button'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('does not show retry button when onRetry is not provided', () => {
      render(<SaveStatusIndicator status="error" />);

      expect(screen.queryByTestId('save-retry-button')).not.toBeInTheDocument();
    });
  });

  describe('ARIA announcements (NFR27)', () => {
    it('has aria-live="polite" region on all states', () => {
      const { rerender } = render(<SaveStatusIndicator status="idle" />);
      expect(screen.getByTestId('save-status')).toHaveAttribute('aria-live', 'polite');

      rerender(<SaveStatusIndicator status="saving" />);
      expect(screen.getByTestId('save-status')).toHaveAttribute('aria-live', 'polite');

      rerender(<SaveStatusIndicator status="saved" message="2:30 PM" />);
      expect(screen.getByTestId('save-status')).toHaveAttribute('aria-live', 'polite');

      rerender(<SaveStatusIndicator status="error" />);
      expect(screen.getByTestId('save-status')).toHaveAttribute('aria-live', 'polite');
    });
  });
});
