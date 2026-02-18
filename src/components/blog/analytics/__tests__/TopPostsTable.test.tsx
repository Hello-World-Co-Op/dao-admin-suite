/**
 * Tests for TopPostsTable component
 *
 * Story BL-020.3: Admin Analytics Dashboard UI
 * Task 4.7: Unit tests for TopPostsTable
 *
 * @see AC5 - Top posts table with slug/title
 * @see AC9 - Empty state
 * @see AC10 - Minimum 2 tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopPostsTable } from '../TopPostsTable';
import type { PostAnalytics } from '@/services/blog-analytics-client';

const mockPosts: PostAnalytics[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started with DAOs',
    view_count: 500,
    avg_read_time_seconds: 120,
    first_viewed: '2026-02-10T00:00:00Z',
    last_viewed: '2026-02-16T00:00:00Z',
  },
  {
    slug: 'no-title-post',
    view_count: 200,
    avg_read_time_seconds: null,
    first_viewed: '2026-02-12T00:00:00Z',
    last_viewed: '2026-02-15T00:00:00Z',
  },
];

describe('TopPostsTable', () => {
  it('renders post rows with slug when title is missing', () => {
    render(
      <TopPostsTable
        posts={mockPosts}
        loading={false}
        publicBlogUrl="https://www.helloworlddao.com"
      />,
    );

    // First post uses title
    const titleLink = screen.getByTestId('post-link-getting-started');
    expect(titleLink).toHaveTextContent('Getting Started with DAOs');
    expect(titleLink).toHaveAttribute(
      'href',
      'https://www.helloworlddao.com/blog/getting-started',
    );
    expect(titleLink).toHaveAttribute('target', '_blank');

    // Second post uses slug as fallback
    const slugLink = screen.getByTestId('post-link-no-title-post');
    expect(slugLink).toHaveTextContent('no-title-post');
  });

  it('renders empty state when posts array is empty', () => {
    render(
      <TopPostsTable
        posts={[]}
        loading={false}
        publicBlogUrl="https://www.helloworlddao.com"
      />,
    );

    expect(screen.getByTestId('top-posts-empty')).toBeInTheDocument();
    expect(screen.getByText(/no post view data available/i)).toBeInTheDocument();
  });

  it('renders loading state when loading=true', () => {
    render(
      <TopPostsTable
        posts={[]}
        loading={true}
        publicBlogUrl="https://www.helloworlddao.com"
      />,
    );

    expect(screen.getByTestId('top-posts-loading')).toBeInTheDocument();
  });
});
