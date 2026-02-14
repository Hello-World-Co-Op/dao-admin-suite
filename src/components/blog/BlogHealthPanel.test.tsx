/**
 * Tests for BlogHealthPanel component
 *
 * Covers:
 * - Scan button rendering and click handling
 * - Loading/progress state display
 * - Results table (broken, CORS, success)
 * - CORS results separated from broken results
 *
 * @see BL-008.7.3 Task 5.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BlogHealthPanel from './BlogHealthPanel';
import type { PostMetadataForScan } from '@/hooks/useBrokenImageScanner';

// Mock the useBrokenImageScanner hook
const mockScan = vi.fn();
const mockReset = vi.fn();
const mockUseBrokenImageScanner = vi.fn();

vi.mock('@/hooks/useBrokenImageScanner', async () => {
  const actual = await vi.importActual('@/hooks/useBrokenImageScanner');
  return {
    ...actual,
    useBrokenImageScanner: () => mockUseBrokenImageScanner(),
  };
});

const defaultPosts: PostMetadataForScan[] = [
  { id: 1, title: 'Post 1', slug: 'post-1', featured_image_url: 'https://a.com/img.jpg' },
  { id: 2, title: 'Post 2', slug: 'post-2', og_image_url: 'https://b.com/img.jpg' },
];

describe('BlogHealthPanel', () => {
  beforeEach(() => {
    mockUseBrokenImageScanner.mockReturnValue({
      scan: mockScan,
      scanning: false,
      results: [],
      progress: { checked: 0, total: 0 },
      reset: mockReset,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the scan button', () => {
    render(<BlogHealthPanel posts={defaultPosts} />);
    expect(screen.getByTestId('scan-button')).toBeInTheDocument();
    expect(screen.getByText('Scan for Broken Images')).toBeInTheDocument();
  });

  it('should call scan when button is clicked', () => {
    render(<BlogHealthPanel posts={defaultPosts} />);
    fireEvent.click(screen.getByTestId('scan-button'));

    expect(mockReset).toHaveBeenCalled();
    expect(mockScan).toHaveBeenCalledWith(defaultPosts);
  });

  it('should show loading state while scanning', () => {
    mockUseBrokenImageScanner.mockReturnValue({
      scan: mockScan,
      scanning: true,
      results: [],
      progress: { checked: 3, total: 10 },
      reset: mockReset,
    });

    render(<BlogHealthPanel posts={defaultPosts} />);

    expect(screen.getByText('Scanning...')).toBeInTheDocument();
    expect(screen.getByTestId('scan-progress')).toBeInTheDocument();
    expect(screen.getByText('3 of 10')).toBeInTheDocument();
  });

  it('should disable scan button while scanning', () => {
    mockUseBrokenImageScanner.mockReturnValue({
      scan: mockScan,
      scanning: true,
      results: [],
      progress: { checked: 0, total: 5 },
      reset: mockReset,
    });

    render(<BlogHealthPanel posts={defaultPosts} />);
    expect(screen.getByTestId('scan-button')).toBeDisabled();
  });

  it('should display broken image results', () => {
    mockUseBrokenImageScanner.mockReturnValue({
      scan: mockScan,
      scanning: false,
      results: [
        {
          url: 'https://broken.com/img.jpg',
          status: 404,
          postIds: [1],
          postTitles: ['Post 1'],
        },
      ],
      progress: { checked: 2, total: 2 },
      reset: mockReset,
    });

    render(<BlogHealthPanel posts={defaultPosts} />);

    expect(screen.getByTestId('scan-results')).toBeInTheDocument();
    expect(screen.getByText('Broken Images (1)')).toBeInTheDocument();
    expect(screen.getByText('HTTP 404')).toBeInTheDocument();
  });

  it('should display CORS results separately', () => {
    mockUseBrokenImageScanner.mockReturnValue({
      scan: mockScan,
      scanning: false,
      results: [
        {
          url: 'https://cors.com/img.jpg',
          status: 'cors',
          postIds: [1],
          postTitles: ['Post 1'],
        },
      ],
      progress: { checked: 1, total: 1 },
      reset: mockReset,
    });

    render(<BlogHealthPanel posts={defaultPosts} />);

    expect(screen.getByText('Unable to Verify (1)')).toBeInTheDocument();
    expect(screen.getByText('Unable to verify')).toBeInTheDocument();
  });

  it('should display timeout results as broken', () => {
    mockUseBrokenImageScanner.mockReturnValue({
      scan: mockScan,
      scanning: false,
      results: [
        {
          url: 'https://slow.com/img.jpg',
          status: 'timeout',
          postIds: [2],
          postTitles: ['Post 2'],
        },
      ],
      progress: { checked: 1, total: 1 },
      reset: mockReset,
    });

    render(<BlogHealthPanel posts={defaultPosts} />);

    expect(screen.getByText('Broken Images (1)')).toBeInTheDocument();
    expect(screen.getByText('Timeout')).toBeInTheDocument();
  });

  it('should show success message when no broken images found', () => {
    mockUseBrokenImageScanner.mockReturnValue({
      scan: mockScan,
      scanning: false,
      results: [],
      progress: { checked: 5, total: 5 },
      reset: mockReset,
    });

    render(<BlogHealthPanel posts={defaultPosts} />);

    expect(screen.getByTestId('scan-success')).toBeInTheDocument();
    expect(screen.getByText(/All 5 images are working correctly/)).toBeInTheDocument();
  });

  it('should display post title as link to editor', () => {
    mockUseBrokenImageScanner.mockReturnValue({
      scan: mockScan,
      scanning: false,
      results: [
        {
          url: 'https://broken.com/img.jpg',
          status: 404,
          postIds: [42],
          postTitles: ['My Blog Post'],
        },
      ],
      progress: { checked: 1, total: 1 },
      reset: mockReset,
    });

    render(<BlogHealthPanel posts={defaultPosts} />);

    const link = screen.getByText('My Blog Post');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/blog/editor/42');
  });

  it('should display multiple posts referencing same broken image', () => {
    mockUseBrokenImageScanner.mockReturnValue({
      scan: mockScan,
      scanning: false,
      results: [
        {
          url: 'https://broken.com/shared.jpg',
          status: 404,
          postIds: [1, 2],
          postTitles: ['Post A', 'Post B'],
        },
      ],
      progress: { checked: 1, total: 1 },
      reset: mockReset,
    });

    render(<BlogHealthPanel posts={defaultPosts} />);

    expect(screen.getByText('Post A')).toBeInTheDocument();
    expect(screen.getByText('Post B')).toBeInTheDocument();
  });
});
