/**
 * Tests for ViewsTrendChart component
 *
 * Story BL-020.3: Admin Analytics Dashboard UI
 * Task 3.7: Unit tests for ViewsTrendChart
 *
 * @see AC4 - SVG bar chart renders daily view counts
 * @see AC9 - Empty state when no data
 * @see AC10 - Minimum 2 tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ViewsTrendChart } from '../ViewsTrendChart';

describe('ViewsTrendChart', () => {
  it('renders without crashing when given valid data array', () => {
    const data = [
      { date: '2026-02-14', count: 10 },
      { date: '2026-02-15', count: 25 },
      { date: '2026-02-16', count: 15 },
    ];

    render(<ViewsTrendChart data={data} loading={false} />);

    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-2026-02-14')).toBeInTheDocument();
    expect(screen.getByTestId('bar-2026-02-15')).toBeInTheDocument();
    expect(screen.getByTestId('bar-2026-02-16')).toBeInTheDocument();
  });

  it('renders empty state when data array is empty', () => {
    render(<ViewsTrendChart data={[]} loading={false} />);

    expect(screen.getByTestId('chart-empty')).toBeInTheDocument();
    expect(screen.getByText(/no view data available/i)).toBeInTheDocument();
  });

  it('renders loading state when loading=true', () => {
    render(<ViewsTrendChart data={[]} loading={true} />);

    expect(screen.getByTestId('chart-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('chart-container')).not.toBeInTheDocument();
  });
});
