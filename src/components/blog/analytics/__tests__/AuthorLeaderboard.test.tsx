/**
 * Tests for AuthorLeaderboard component
 *
 * Story BL-020.3: Admin Analytics Dashboard UI
 * Task 5.6: Unit tests for AuthorLeaderboard
 *
 * @see AC6 - Author leaderboard with display name fallback
 * @see AC9 - Empty state
 * @see AC10 - Minimum 2 tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthorLeaderboard } from '../AuthorLeaderboard';
import type { AuthorAnalytics } from '@/services/blog-analytics-client';

const mockAuthors: AuthorAnalytics[] = [
  {
    author_principal: 'abcdefghijklmnop',
    display_name: 'Alice Author',
    total_views: 500,
    post_count: 5,
    avg_views_per_post: 100,
    top_post_slug: 'best-post',
  },
  {
    author_principal: 'xyz12345longprincipal',
    total_views: 200,
    post_count: 3,
    avg_views_per_post: 66.67,
    top_post_slug: 'another-post',
  },
];

describe('AuthorLeaderboard', () => {
  it('renders author with display_name when available', () => {
    render(<AuthorLeaderboard authors={mockAuthors} loading={false} />);

    // Author with display_name shows display_name
    expect(screen.getByTestId('author-name-abcdefghijklmnop')).toHaveTextContent('Alice Author');

    // Author without display_name shows truncated principal
    expect(screen.getByTestId('author-name-xyz12345longprincipal')).toHaveTextContent('xyz12345...');
  });

  it('renders empty state when authors array is empty', () => {
    render(<AuthorLeaderboard authors={[]} loading={false} />);

    expect(screen.getByTestId('author-leaderboard-empty')).toBeInTheDocument();
    expect(screen.getByText(/no author view data available/i)).toBeInTheDocument();
  });

  it('renders loading state when loading=true', () => {
    render(<AuthorLeaderboard authors={[]} loading={true} />);

    expect(screen.getByTestId('author-leaderboard-loading')).toBeInTheDocument();
  });
});
