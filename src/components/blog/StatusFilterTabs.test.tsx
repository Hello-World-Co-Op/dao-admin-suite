/**
 * StatusFilterTabs Tests
 *
 * @see BL-008.3.5 Task 6 - Status filter tabs
 * @see AC2 - Status filter tabs
 * @see AC7 - Ready for Review tab
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusFilterTabs, filterPostsByTab } from './StatusFilterTabs';
import type { BlogPost } from './PostTable';

const mockPosts: BlogPost[] = [
  { id: 1, title: 'Draft 1', slug: 'd1', author: 'a1', author_name: 'A', status: 'Draft', tags: [], updated_at: 0, published_at: null, scheduled_at: null },
  { id: 2, title: 'Draft 2', slug: 'd2', author: 'a1', author_name: 'A', status: 'Draft', tags: ['ready_for_review'], updated_at: 0, published_at: null, scheduled_at: null },
  { id: 3, title: 'Published', slug: 'p1', author: 'a2', author_name: 'B', status: 'Published', tags: [], updated_at: 0, published_at: 1, scheduled_at: null },
  { id: 4, title: 'Scheduled', slug: 's1', author: 'a1', author_name: 'A', status: 'Scheduled', tags: [], updated_at: 0, published_at: null, scheduled_at: 1 },
  { id: 5, title: 'Archived', slug: 'ar1', author: 'a2', author_name: 'B', status: 'Archived', tags: [], updated_at: 0, published_at: null, scheduled_at: null },
];

describe('StatusFilterTabs', () => {
  it('renders all filter tabs with counts', () => {
    render(<StatusFilterTabs posts={mockPosts} activeTab="all" onTabChange={vi.fn()} />);
    expect(screen.getByTestId('status-filter-tabs')).toBeInTheDocument();
    expect(screen.getByText('All Posts (5)')).toBeInTheDocument();
    expect(screen.getByText('Drafts (2)')).toBeInTheDocument();
    expect(screen.getByText('Published (1)')).toBeInTheDocument();
    expect(screen.getByText('Scheduled (1)')).toBeInTheDocument();
    expect(screen.getByText('Archived (1)')).toBeInTheDocument();
    expect(screen.getByText('Ready for Review (1)')).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<StatusFilterTabs posts={mockPosts} activeTab="Draft" onTabChange={vi.fn()} />);
    const draftTab = screen.getByTestId('filter-tab-Draft');
    expect(draftTab.className).toContain('border-blue-500');
    expect(draftTab).toHaveAttribute('aria-current', 'page');
  });

  it('calls onTabChange when tab is clicked', () => {
    const onTabChange = vi.fn();
    render(<StatusFilterTabs posts={mockPosts} activeTab="all" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByTestId('filter-tab-Published'));
    expect(onTabChange).toHaveBeenCalledWith('Published');
  });
});

describe('filterPostsByTab', () => {
  it('returns all posts for "all" tab', () => {
    expect(filterPostsByTab(mockPosts, 'all')).toHaveLength(5);
  });

  it('filters drafts correctly', () => {
    const result = filterPostsByTab(mockPosts, 'Draft');
    expect(result).toHaveLength(2);
    result.forEach((p) => expect(p.status).toBe('Draft'));
  });

  it('filters published correctly', () => {
    const result = filterPostsByTab(mockPosts, 'Published');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Published');
  });

  it('filters ready_for_review by tag', () => {
    const result = filterPostsByTab(mockPosts, 'ready_for_review');
    expect(result).toHaveLength(1);
    expect(result[0].tags).toContain('ready_for_review');
  });
});
