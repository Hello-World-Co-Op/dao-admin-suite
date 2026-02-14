/**
 * Tests for AltTextModal Component
 *
 * Story BL-008.4.2: Client-Side Image Processing and Editor Integration
 *
 * @see AC4 - Alt text required before image insertion (WCAG 2.1 AA)
 * @see NFR25 - WCAG 2.1 AA compliance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AltTextModal } from '../AltTextModal';

describe('AltTextModal', () => {
  const defaultProps = {
    visible: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when visible', () => {
    render(<AltTextModal {...defaultProps} />);
    expect(screen.getByTestId('alt-text-modal')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<AltTextModal {...defaultProps} visible={false} />);
    expect(screen.queryByTestId('alt-text-modal')).not.toBeInTheDocument();
  });

  it('shows the title and description', () => {
    render(<AltTextModal {...defaultProps} />);
    expect(screen.getByText('Add Image Alt Text')).toBeInTheDocument();
    expect(
      screen.getByText(/Describe the image for screen reader users/)
    ).toBeInTheDocument();
  });

  it('shows image preview when imagePreviewUrl is provided', () => {
    render(
      <AltTextModal
        {...defaultProps}
        imagePreviewUrl="blob:http://localhost/test-image"
        fileName="photo.jpg"
      />
    );
    expect(screen.getByTestId('alt-text-image-preview')).toBeInTheDocument();
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
  });

  it('requires alt text before confirmation (cannot insert empty)', async () => {
    const user = userEvent.setup();
    render(<AltTextModal {...defaultProps} />);

    const confirmButton = screen.getByTestId('alt-text-confirm');
    await user.click(confirmButton);

    expect(screen.getByTestId('alt-text-error')).toBeInTheDocument();
    expect(screen.getByText('Alt text is required for accessibility')).toBeInTheDocument();
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('requires alt text - whitespace-only is rejected', async () => {
    const user = userEvent.setup();
    render(<AltTextModal {...defaultProps} />);

    const input = screen.getByTestId('alt-text-input');
    await user.type(input, '   ');
    await user.click(screen.getByTestId('alt-text-confirm'));

    expect(screen.getByTestId('alt-text-error')).toBeInTheDocument();
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm with trimmed alt text', async () => {
    const user = userEvent.setup();
    render(<AltTextModal {...defaultProps} />);

    const input = screen.getByTestId('alt-text-input');
    await user.type(input, '  A photo of a sunset  ');
    await user.click(screen.getByTestId('alt-text-confirm'));

    expect(defaultProps.onConfirm).toHaveBeenCalledWith('A photo of a sunset');
  });

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<AltTextModal {...defaultProps} />);

    await user.click(screen.getByTestId('alt-text-cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('closes on Escape key', () => {
    render(<AltTextModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('closes when clicking backdrop', async () => {
    const user = userEvent.setup();
    render(<AltTextModal {...defaultProps} />);

    const backdrop = screen.getByTestId('alt-text-modal');
    await user.click(backdrop);
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(<AltTextModal {...defaultProps} />);

    const dialog = screen.getByTestId('alt-text-modal');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'alt-text-modal-title');

    const input = screen.getByTestId('alt-text-input');
    expect(input).toHaveAttribute('aria-label', 'Alternative text for screen readers');
  });

  it('shows error state with aria-invalid on validation failure', async () => {
    const user = userEvent.setup();
    render(<AltTextModal {...defaultProps} />);

    await user.click(screen.getByTestId('alt-text-confirm'));

    const input = screen.getByTestId('alt-text-input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears error when user starts typing', async () => {
    const user = userEvent.setup();
    render(<AltTextModal {...defaultProps} />);

    // Trigger error
    await user.click(screen.getByTestId('alt-text-confirm'));
    expect(screen.getByTestId('alt-text-error')).toBeInTheDocument();

    // Start typing
    const input = screen.getByTestId('alt-text-input');
    await user.type(input, 'Some text');

    expect(screen.queryByTestId('alt-text-error')).not.toBeInTheDocument();
  });

  it('submits on Enter key in the input field', async () => {
    const user = userEvent.setup();
    render(<AltTextModal {...defaultProps} />);

    const input = screen.getByTestId('alt-text-input');
    await user.type(input, 'A description');
    await user.keyboard('{Enter}');

    expect(defaultProps.onConfirm).toHaveBeenCalledWith('A description');
  });
});
