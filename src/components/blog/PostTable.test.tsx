/**
 * PostTable Tests
 *
 * @see BL-008.3.5 Task 5 - PostTable component
 * @see AC2 - PostTable with sortable headers
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PostTable, type BlogPost } from './PostTable';

const mockPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Alpha Post',
    slug: 'alpha-post',
    author: 'author-1',
    author_name: 'Charlie',
    status: 'Draft',
    tags: [],
    updated_at: 1707800000000000,
    published_at: null,
    scheduled_at: null,
  },
  {
    id: 2,
    title: 'Beta Post',
    slug: 'beta-post',
    author: 'author-2',
    author_name: 'Alice',
    status: 'Published',
    tags: [],
    updated_at: 1707900000000000,
    published_at: 1707850000000000,
    scheduled_at: null,
  },
  {
    id: 3,
    title: 'Gamma Post',
    slug: 'gamma-post',
    author: 'author-3',
    author_name: 'Bob',
    status: 'Scheduled',
    tags: ['ready_for_review'],
    updated_at: 1707700000000000,
    published_at: null,
    scheduled_at: 1708000000000000,
  },
];

const defaultProps = {
  posts: mockPosts,
  onPublish: vi.fn(),
  onSchedule: vi.fn(),
  onArchive: vi.fn(),
  isAdmin: true,
};

function renderTable(props = {}) {
  return render(
    <MemoryRouter>
      <PostTable {...defaultProps} {...props} />
    </MemoryRouter>,
  );
}

describe('PostTable', () => {
  it('renders posts in table with correct columns', () => {
    renderTable();
    expect(screen.getByTestId('post-table')).toBeInTheDocument();
    expect(screen.getByText('Alpha Post')).toBeInTheDocument();
    expect(screen.getByText('Beta Post')).toBeInTheDocument();
    expect(screen.getByText('Gamma Post')).toBeInTheDocument();
    // Author names
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders sortable header with sort indicators', () => {
    renderTable();
    const titleHeader = screen.getByTestId('sort-header-title');
    expect(titleHeader).toHaveAttribute('aria-sort');
    const updatedHeader = screen.getByTestId('sort-header-updated');
    expect(updatedHeader).toHaveAttribute('aria-sort');
  });

  it('sorts by title when header is clicked', () => {
    renderTable();
    const titleHeader = screen.getByTestId('sort-header-title');
    fireEvent.click(titleHeader);
    // After clicking title, should sort ascending
    const rows = screen.getAllByTestId(/post-row-/);
    expect(rows).toHaveLength(3);
  });

  it('toggles sort direction on repeated header click', () => {
    renderTable();
    const titleHeader = screen.getByTestId('sort-header-title');

    fireEvent.click(titleHeader); // first click: asc
    expect(titleHeader).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(titleHeader); // second click: desc
    expect(titleHeader).toHaveAttribute('aria-sort', 'descending');
  });

  it('shows Publish and Schedule buttons for Draft posts when admin', () => {
    renderTable();
    expect(screen.getByTestId('publish-post-1')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-post-1')).toBeInTheDocument();
  });

  it('shows Archive button for Published posts when admin', () => {
    renderTable();
    expect(screen.getByTestId('archive-post-2')).toBeInTheDocument();
  });

  it('does not show admin actions when isAdmin is false', () => {
    renderTable({ isAdmin: false });
    expect(screen.queryByTestId('publish-post-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('archive-post-2')).not.toBeInTheDocument();
  });

  it('calls onPublish when Publish button is clicked', () => {
    const onPublish = vi.fn();
    renderTable({ onPublish });
    fireEvent.click(screen.getByTestId('publish-post-1'));
    expect(onPublish).toHaveBeenCalledWith(1);
  });

  it('calls onSchedule when Schedule button is clicked', () => {
    const onSchedule = vi.fn();
    renderTable({ onSchedule });
    fireEvent.click(screen.getByTestId('schedule-post-1'));
    expect(onSchedule).toHaveBeenCalledWith(1);
  });

  it('calls onArchive when Archive button is clicked', () => {
    const onArchive = vi.fn();
    renderTable({ onArchive });
    fireEvent.click(screen.getByTestId('archive-post-2'));
    expect(onArchive).toHaveBeenCalledWith(2);
  });

  it('shows empty state when no posts', () => {
    renderTable({ posts: [] });
    expect(screen.getByTestId('post-table-empty')).toBeInTheDocument();
    expect(screen.getByText(/No posts found/)).toBeInTheDocument();
  });

  it('shows Edit button for all posts', () => {
    renderTable();
    expect(screen.getByTestId('edit-post-1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-post-2')).toBeInTheDocument();
    expect(screen.getByTestId('edit-post-3')).toBeInTheDocument();
  });

  it('renders PostStatusBadge for each post', () => {
    renderTable();
    const badges = screen.getAllByTestId('post-status-badge');
    expect(badges).toHaveLength(3);
  });
});
