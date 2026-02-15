/**
 * Tests for CanisterHealthPanel component
 *
 * Covers:
 * - Stats display (total, published, drafts, scheduled, archived)
 * - Storage color indicators (green <50MB, yellow 50-75MB, red >75MB)
 * - Refresh button
 * - GitHub Actions pipeline link
 * - Loading state
 * - Error state
 *
 * @see BL-008.7.3 Task 5.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CanisterHealthPanel, { getStorageColor } from './CanisterHealthPanel';
import type { CanisterStats } from '@/hooks/useCanisterStats';

// Mock the useCanisterStats hook
const mockRefresh = vi.fn();
const mockUseCanisterStats = vi.fn();

vi.mock('@/hooks/useCanisterStats', () => ({
  useCanisterStats: () => mockUseCanisterStats(),
}));

const defaultStats: CanisterStats = {
  total_posts: 25,
  published_count: 15,
  draft_count: 5,
  scheduled_count: 3,
  archived_count: 2,
  storage_usage_bytes: 12_500_000,
};

describe('getStorageColor', () => {
  it('should return green for storage under 50MB', () => {
    expect(getStorageColor(0)).toBe('green');
    expect(getStorageColor(10_000_000)).toBe('green');
    expect(getStorageColor(49_999_999)).toBe('green');
    expect(getStorageColor(50_000_000)).toBe('green');
  });

  it('should return yellow for storage between 50-75MB', () => {
    expect(getStorageColor(50_000_001)).toBe('yellow');
    expect(getStorageColor(60_000_000)).toBe('yellow');
    expect(getStorageColor(75_000_000)).toBe('yellow');
  });

  it('should return red for storage over 75MB', () => {
    expect(getStorageColor(75_000_001)).toBe('red');
    expect(getStorageColor(100_000_000)).toBe('red');
  });
});

describe('CanisterHealthPanel', () => {
  beforeEach(() => {
    mockUseCanisterStats.mockReturnValue({
      stats: defaultStats,
      loading: false,
      error: null,
      refresh: mockRefresh,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the panel with stats', () => {
    render(<CanisterHealthPanel />);

    expect(screen.getByTestId('canister-health-panel')).toBeInTheDocument();
    expect(screen.getByText('Blog Canister Health')).toBeInTheDocument();
  });

  it('should display all stat values', () => {
    render(<CanisterHealthPanel />);

    expect(screen.getByTestId('stat-total-posts')).toHaveTextContent('25');
    expect(screen.getByTestId('stat-published')).toHaveTextContent('15');
    expect(screen.getByTestId('stat-drafts')).toHaveTextContent('5');
    expect(screen.getByTestId('stat-scheduled')).toHaveTextContent('3');
    expect(screen.getByTestId('stat-archived')).toHaveTextContent('2');
  });

  it('should display storage in MB', () => {
    render(<CanisterHealthPanel />);

    expect(screen.getByTestId('stat-storage')).toHaveTextContent('12.50 MB');
  });

  it('should show green storage indicator for low usage', () => {
    render(<CanisterHealthPanel />);

    const storage = screen.getByTestId('stat-storage');
    expect(storage.className).toContain('green');
  });

  it('should show yellow storage indicator for medium usage', () => {
    mockUseCanisterStats.mockReturnValue({
      stats: { ...defaultStats, storage_usage_bytes: 60_000_000 },
      loading: false,
      error: null,
      refresh: mockRefresh,
    });

    render(<CanisterHealthPanel />);

    const storage = screen.getByTestId('stat-storage');
    expect(storage.className).toContain('yellow');
  });

  it('should show red storage indicator for high usage', () => {
    mockUseCanisterStats.mockReturnValue({
      stats: { ...defaultStats, storage_usage_bytes: 80_000_000 },
      loading: false,
      error: null,
      refresh: mockRefresh,
    });

    render(<CanisterHealthPanel />);

    const storage = screen.getByTestId('stat-storage');
    expect(storage.className).toContain('red');
  });

  it('should render refresh button', () => {
    render(<CanisterHealthPanel />);

    expect(screen.getByTestId('refresh-stats-button')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('should call refresh on button click', () => {
    render(<CanisterHealthPanel />);

    fireEvent.click(screen.getByTestId('refresh-stats-button'));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should disable refresh button while loading', () => {
    mockUseCanisterStats.mockReturnValue({
      stats: defaultStats,
      loading: true,
      error: null,
      refresh: mockRefresh,
    });

    render(<CanisterHealthPanel />);

    expect(screen.getByTestId('refresh-stats-button')).toBeDisabled();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render GitHub Actions link', () => {
    render(<CanisterHealthPanel />);

    const link = screen.getByTestId('pipeline-link');
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/Hello-World-Co-Op/marketing-suite/actions'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveTextContent('View Pipeline History');
  });

  it('should display error state', () => {
    mockUseCanisterStats.mockReturnValue({
      stats: defaultStats,
      loading: false,
      error: 'Failed to fetch canister stats',
      refresh: mockRefresh,
    });

    render(<CanisterHealthPanel />);

    expect(screen.getByTestId('stats-error')).toHaveTextContent('Failed to fetch canister stats');
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should show loading spinner on initial load', () => {
    mockUseCanisterStats.mockReturnValue({
      stats: { ...defaultStats, total_posts: 0 },
      loading: true,
      error: null,
      refresh: mockRefresh,
    });

    render(<CanisterHealthPanel />);

    expect(screen.getByTestId('stats-loading')).toBeInTheDocument();
  });

  it('should show stats grid when loaded', () => {
    render(<CanisterHealthPanel />);

    expect(screen.getByTestId('stats-grid')).toBeInTheDocument();
  });

  it('should display zero storage as 0.00 MB', () => {
    mockUseCanisterStats.mockReturnValue({
      stats: { ...defaultStats, storage_usage_bytes: 0 },
      loading: false,
      error: null,
      refresh: mockRefresh,
    });

    render(<CanisterHealthPanel />);

    expect(screen.getByTestId('stat-storage')).toHaveTextContent('0.00 MB');
  });
});
