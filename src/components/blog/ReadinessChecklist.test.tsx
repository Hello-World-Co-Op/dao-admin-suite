/**
 * ReadinessChecklist Tests
 *
 * Story BL-008.7.2: Admin Operations Dashboard
 * Task 7.3: 6 tests covering progress calculation, category flags, loading, and empty state
 *
 * @see AC3 - Pre-launch readiness checklist showing progress toward 6 posts and 3+ categories
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock blogApi
const mockFetchReadinessData = vi.fn();
vi.mock('@/utils/blogApi', () => ({
  fetchReadinessData: () => mockFetchReadinessData(),
}));

import ReadinessChecklist from './ReadinessChecklist';

describe('ReadinessChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching readiness data', () => {
    mockFetchReadinessData.mockReturnValue(new Promise(() => {}));

    render(<ReadinessChecklist />);

    const container = screen.getByTestId('readiness-checklist');
    expect(container).toBeInTheDocument();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    mockFetchReadinessData.mockRejectedValue(new Error('Network error'));

    render(<ReadinessChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId('readiness-error')).toBeInTheDocument();
    });

    expect(screen.getByTestId('readiness-error')).toHaveTextContent('Failed to load readiness data');
  });

  it('calculates and displays correct progress when partially complete (AC3)', async () => {
    mockFetchReadinessData.mockResolvedValue({
      publishedPostCount: 3,
      totalPosts: 5,
      categories: [
        { name: 'Tech', slug: 'tech', post_count: 2 },
        { name: 'Design', slug: 'design', post_count: 1 },
        { name: 'Culture', slug: 'culture', post_count: 0 },
      ],
    });

    render(<ReadinessChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId('posts-progress')).toBeInTheDocument();
    });

    // Posts: 3/6
    expect(screen.getByTestId('posts-progress')).toHaveTextContent('3/6');

    // Categories with content: 2/3 (Tech and Design have posts)
    expect(screen.getByTestId('categories-progress')).toHaveTextContent('2/3');

    // Readiness: (3/6 + 2/3) / 2 = (0.5 + 0.667) / 2 = 0.583 = 58%
    expect(screen.getByTestId('readiness-percentage')).toHaveTextContent('58%');
  });

  it('shows green progress when targets are met (AC3)', async () => {
    mockFetchReadinessData.mockResolvedValue({
      publishedPostCount: 8,
      totalPosts: 10,
      categories: [
        { name: 'Tech', slug: 'tech', post_count: 3 },
        { name: 'Design', slug: 'design', post_count: 2 },
        { name: 'Culture', slug: 'culture', post_count: 2 },
        { name: 'News', slug: 'news', post_count: 1 },
      ],
    });

    render(<ReadinessChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId('readiness-percentage')).toHaveTextContent('100%');
    });

    // Posts: 8/6 (capped at 100%)
    expect(screen.getByTestId('posts-progress')).toHaveTextContent('8/6');

    // Categories with content: 4/3 (all have posts)
    expect(screen.getByTestId('categories-progress')).toHaveTextContent('4/3');
  });

  it('flags categories with no content using "Needs content" badge (AC3)', async () => {
    mockFetchReadinessData.mockResolvedValue({
      publishedPostCount: 2,
      totalPosts: 3,
      categories: [
        { name: 'Tech', slug: 'tech', post_count: 2 },
        { name: 'Empty Cat', slug: 'empty-cat', post_count: 0 },
      ],
    });

    render(<ReadinessChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId('category-list')).toBeInTheDocument();
    });

    // Tech has green badge
    const techBadge = screen.getByTestId('category-badge-tech');
    expect(techBadge.className).toContain('bg-green-100');

    // Empty Cat has amber badge with "Needs content"
    const emptyBadge = screen.getByTestId('category-badge-empty-cat');
    expect(emptyBadge.className).toContain('bg-amber-100');
    expect(screen.getByTestId('needs-content-empty-cat')).toHaveTextContent('Needs content');
  });

  it('shows "No categories defined yet" when no categories exist', async () => {
    mockFetchReadinessData.mockResolvedValue({
      publishedPostCount: 0,
      totalPosts: 0,
      categories: [],
    });

    render(<ReadinessChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId('no-categories')).toBeInTheDocument();
    });

    expect(screen.getByTestId('no-categories')).toHaveTextContent('No categories defined yet');
    expect(screen.getByTestId('readiness-percentage')).toHaveTextContent('0%');
  });
});
