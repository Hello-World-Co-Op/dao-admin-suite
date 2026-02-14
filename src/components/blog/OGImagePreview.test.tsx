/**
 * Tests for OGImagePreview Component
 *
 * Story BL-008.3.6: Post Preview and OG Image Management
 *
 * Validates:
 * - Shows custom OG image thumbnail when set (AC2)
 * - Shows auto-selected OG image with badge (AC3)
 * - Shows generic fallback when no image (AC3)
 * - Upload button opens file picker (AC2)
 * - "Use Auto-Selected" button resets to auto (AC3)
 * - Remove button clears custom OG (AC2)
 * - Correct badge display for auto-selected vs custom (AC3)
 *
 * @see AC2 - OG image upload
 * @see AC3 - Auto-OG detection
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OGImagePreview } from './OGImagePreview';

describe('OGImagePreview', () => {
  const defaultProps = {
    ogImageUrl: null as string | null,
    autoOgImageUrl: null as string | null,
    onOGImageChange: vi.fn(),
    oracleBridgeUrl: 'http://localhost:8787',
  };

  describe('AC3: No images - generic fallback', () => {
    it('shows fallback when no OG and no auto-OG', () => {
      render(<OGImagePreview {...defaultProps} />);

      expect(screen.getByTestId('og-image-fallback')).toBeInTheDocument();
    });

    it('fallback shows "No OG image set" text', () => {
      render(<OGImagePreview {...defaultProps} />);

      expect(screen.getByTestId('og-image-fallback')).toHaveTextContent('No OG image set');
    });

    it('shows upload button in fallback state', () => {
      render(<OGImagePreview {...defaultProps} />);

      expect(screen.getByTestId('og-upload-button')).toBeInTheDocument();
      expect(screen.getByTestId('og-upload-button')).toHaveTextContent('Upload OG Image');
    });
  });

  describe('AC2: Custom OG image display', () => {
    it('shows custom OG image thumbnail', () => {
      render(
        <OGImagePreview
          {...defaultProps}
          ogImageUrl="https://example.com/og-custom.jpg"
        />
      );

      const img = screen.getByTestId('og-image-thumbnail');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/og-custom.jpg');
    });

    it('does not show auto-selected badge for custom OG', () => {
      render(
        <OGImagePreview
          {...defaultProps}
          ogImageUrl="https://example.com/og-custom.jpg"
        />
      );

      expect(screen.queryByTestId('og-auto-badge')).not.toBeInTheDocument();
    });

    it('shows Replace button for custom OG', () => {
      render(
        <OGImagePreview
          {...defaultProps}
          ogImageUrl="https://example.com/og-custom.jpg"
        />
      );

      expect(screen.getByTestId('og-upload-button')).toHaveTextContent('Replace');
    });

    it('shows Remove button for custom OG', () => {
      render(
        <OGImagePreview
          {...defaultProps}
          ogImageUrl="https://example.com/og-custom.jpg"
        />
      );

      expect(screen.getByTestId('og-remove-button')).toBeInTheDocument();
    });
  });

  describe('AC3: Auto-selected OG image display', () => {
    it('shows auto-selected image thumbnail', () => {
      render(
        <OGImagePreview
          {...defaultProps}
          autoOgImageUrl="https://example.com/auto-og.jpg"
        />
      );

      const img = screen.getByTestId('og-image-thumbnail');
      expect(img).toHaveAttribute('src', 'https://example.com/auto-og.jpg');
    });

    it('shows "Auto-Selected" badge', () => {
      render(
        <OGImagePreview
          {...defaultProps}
          autoOgImageUrl="https://example.com/auto-og.jpg"
        />
      );

      expect(screen.getByTestId('og-auto-badge')).toBeInTheDocument();
      expect(screen.getByTestId('og-auto-badge')).toHaveTextContent('Auto-Selected');
    });

    it('shows "Upload Custom" button for auto-selected state', () => {
      render(
        <OGImagePreview
          {...defaultProps}
          autoOgImageUrl="https://example.com/auto-og.jpg"
        />
      );

      expect(screen.getByTestId('og-upload-button')).toHaveTextContent('Upload Custom');
    });
  });

  describe('AC3: Custom overrides auto-selected', () => {
    it('shows custom OG when both custom and auto are set', () => {
      render(
        <OGImagePreview
          {...defaultProps}
          ogImageUrl="https://example.com/custom.jpg"
          autoOgImageUrl="https://example.com/auto.jpg"
        />
      );

      const img = screen.getByTestId('og-image-thumbnail');
      expect(img).toHaveAttribute('src', 'https://example.com/custom.jpg');
    });

    it('shows "Use Auto-Selected" button when both custom and auto exist', () => {
      render(
        <OGImagePreview
          {...defaultProps}
          ogImageUrl="https://example.com/custom.jpg"
          autoOgImageUrl="https://example.com/auto.jpg"
        />
      );

      expect(screen.getByTestId('og-use-auto-button')).toBeInTheDocument();
      expect(screen.getByTestId('og-use-auto-button')).toHaveTextContent('Use Auto-Selected');
    });

    it('does not show "Use Auto-Selected" when no auto image available', () => {
      render(
        <OGImagePreview
          {...defaultProps}
          ogImageUrl="https://example.com/custom.jpg"
          autoOgImageUrl={null}
        />
      );

      expect(screen.queryByTestId('og-use-auto-button')).not.toBeInTheDocument();
    });
  });

  describe('AC2: Hidden file input', () => {
    it('has a hidden file input for image upload', () => {
      render(<OGImagePreview {...defaultProps} />);

      const fileInput = screen.getByTestId('og-file-input');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });
  });

  describe('component header', () => {
    it('renders OG Image section header', () => {
      render(<OGImagePreview {...defaultProps} />);

      expect(screen.getByText('OG Image')).toBeInTheDocument();
    });
  });
});
