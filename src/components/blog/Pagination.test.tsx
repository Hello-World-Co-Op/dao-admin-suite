/**
 * Pagination Tests
 *
 * @see BL-008.3.5 Task 13 - Pagination for post listing
 * @see AC1, AC2 - Dashboard pagination
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('does not render when totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} totalItems={5} pageSize={10} onPageChange={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders pagination with page numbers', () => {
    render(
      <Pagination currentPage={1} totalPages={3} totalItems={25} pageSize={10} onPageChange={vi.fn()} />,
    );
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-1')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-2')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-3')).toBeInTheDocument();
  });

  it('shows correct range text', () => {
    render(
      <Pagination currentPage={2} totalPages={5} totalItems={45} pageSize={10} onPageChange={vi.fn()} />,
    );
    expect(screen.getByText('11')).toBeInTheDocument(); // startItem
    expect(screen.getByText('20')).toBeInTheDocument(); // endItem
    expect(screen.getByText('45')).toBeInTheDocument(); // total
  });

  it('disables Previous on first page', () => {
    render(
      <Pagination currentPage={1} totalPages={3} totalItems={25} pageSize={10} onPageChange={vi.fn()} />,
    );
    const prev = screen.getByTestId('pagination-prev');
    expect(prev).toBeDisabled();
  });

  it('disables Next on last page', () => {
    render(
      <Pagination currentPage={3} totalPages={3} totalItems={25} pageSize={10} onPageChange={vi.fn()} />,
    );
    const next = screen.getByTestId('pagination-next');
    expect(next).toBeDisabled();
  });

  it('calls onPageChange when page button is clicked (Task 15.8)', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={1} totalPages={3} totalItems={25} pageSize={10} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByTestId('pagination-page-2'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when Next is clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={1} totalPages={3} totalItems={25} pageSize={10} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByTestId('pagination-next'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('highlights current page', () => {
    render(
      <Pagination currentPage={2} totalPages={3} totalItems={25} pageSize={10} onPageChange={vi.fn()} />,
    );
    const page2 = screen.getByTestId('pagination-page-2');
    expect(page2.className).toContain('bg-blue-600');
    expect(page2).toHaveAttribute('aria-current', 'page');
  });
});
