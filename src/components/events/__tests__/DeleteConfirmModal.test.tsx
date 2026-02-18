/**
 * Tests for DeleteConfirmModal Component
 *
 * Story BL-025.2: dao-admin-suite Event Management Page
 * Task 8.4: DeleteConfirmModal tests
 *
 * @see AC5 - Delete event with confirmation
 * @see AC10 - 0 skipped tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

describe('DeleteConfirmModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders event title in body text', () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        eventTitle="Monthly Meetup"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    expect(
      screen.getByText(
        /Are you sure you want to delete 'Monthly Meetup'\?/,
      ),
    ).toBeInTheDocument();
  });

  it('"Cancel" calls onCancel', () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        eventTitle="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    fireEvent.click(screen.getByTestId('delete-cancel-btn'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('"Delete" calls onConfirm', () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        eventTitle="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    fireEvent.click(screen.getByTestId('delete-confirm-btn'));
    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('Delete button shows "Deleting..." and is disabled when isDeleting=true', () => {
    render(
      <DeleteConfirmModal
        isOpen={true}
        eventTitle="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={true}
      />,
    );

    const deleteBtn = screen.getByTestId('delete-confirm-btn');
    expect(deleteBtn).toBeDisabled();
    expect(deleteBtn).toHaveTextContent('Deleting...');
  });

  it('does not render when isOpen=false', () => {
    render(
      <DeleteConfirmModal
        isOpen={false}
        eventTitle="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />,
    );

    expect(
      screen.queryByTestId('delete-confirm-modal'),
    ).not.toBeInTheDocument();
  });
});
