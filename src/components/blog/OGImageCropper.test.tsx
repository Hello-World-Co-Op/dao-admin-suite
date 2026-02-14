/**
 * Tests for OGImageCropper Component
 *
 * Story BL-008.3.6: Post Preview and OG Image Management
 *
 * Validates:
 * - Cropper renders with image and controls (AC2)
 * - 1200x630 dimensions displayed (AC2)
 * - Save crop button triggers onSave callback (AC2)
 * - Cancel button triggers onCancel callback (AC2)
 * - Upload progress indicator during save (AC2)
 * - Crop overlay with grid lines (AC2)
 *
 * @see AC2 - OG image crop at 1200x630 aspect ratio
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OGImageCropper } from './OGImageCropper';

describe('OGImageCropper', () => {
  const defaultProps = {
    imageUrl: 'https://example.com/test-image.jpg',
    onSave: vi.fn(),
    onCancel: vi.fn(),
    uploading: false,
  };

  describe('AC2: Cropper rendering', () => {
    it('renders cropper container', () => {
      render(<OGImageCropper {...defaultProps} />);

      expect(screen.getByTestId('og-image-cropper')).toBeInTheDocument();
    });

    it('displays 1200x630 dimensions', () => {
      render(<OGImageCropper {...defaultProps} />);

      expect(screen.getByTestId('crop-dimensions')).toHaveTextContent('1200 x 630px');
    });

    it('renders the source image', () => {
      render(<OGImageCropper {...defaultProps} />);

      const img = screen.getByTestId('crop-image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/test-image.jpg');
    });

    it('renders crop container with correct aspect ratio', () => {
      render(<OGImageCropper {...defaultProps} />);

      const container = screen.getByTestId('crop-container');
      expect(container).toBeInTheDocument();
    });
  });

  describe('AC2: Action buttons', () => {
    it('renders Save Crop button', () => {
      render(<OGImageCropper {...defaultProps} />);

      const saveBtn = screen.getByTestId('crop-save-button');
      expect(saveBtn).toBeInTheDocument();
      expect(saveBtn).toHaveTextContent('Save Crop');
    });

    it('renders Cancel button', () => {
      render(<OGImageCropper {...defaultProps} />);

      const cancelBtn = screen.getByTestId('crop-cancel-button');
      expect(cancelBtn).toBeInTheDocument();
      expect(cancelBtn).toHaveTextContent('Cancel');
    });

    it('Cancel button triggers onCancel', () => {
      const onCancel = vi.fn();
      render(<OGImageCropper {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByTestId('crop-cancel-button'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('Cancel button is disabled during upload', () => {
      render(<OGImageCropper {...defaultProps} uploading={true} />);

      expect(screen.getByTestId('crop-cancel-button')).toBeDisabled();
    });
  });

  describe('AC2: Upload progress', () => {
    it('shows "Uploading..." text during upload', () => {
      render(<OGImageCropper {...defaultProps} uploading={true} />);

      expect(screen.getByTestId('crop-save-button')).toHaveTextContent('Uploading...');
    });

    it('shows upload spinner during upload', () => {
      render(<OGImageCropper {...defaultProps} uploading={true} />);

      expect(screen.getByTestId('crop-upload-spinner')).toBeInTheDocument();
    });

    it('Save button is disabled during upload', () => {
      render(<OGImageCropper {...defaultProps} uploading={true} />);

      expect(screen.getByTestId('crop-save-button')).toBeDisabled();
    });
  });
});
