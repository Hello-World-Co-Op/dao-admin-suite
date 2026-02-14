/**
 * PostStatusBadge Tests
 *
 * @see BL-008.3.5 Task 7 - PostStatusBadge component
 * @see AC2 - PostTable with PostStatusBadge
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostStatusBadge } from './PostStatusBadge';

describe('PostStatusBadge', () => {
  it('renders Draft status with gray styling', () => {
    render(<PostStatusBadge status="Draft" />);
    const badge = screen.getByTestId('post-status-badge');
    expect(badge).toHaveTextContent('Draft');
    expect(badge).toHaveAttribute('role', 'status');
    expect(badge).toHaveAttribute('aria-label', 'Post is in draft status');
    expect(badge.className).toContain('bg-gray-100');
  });

  it('renders Published status with green styling', () => {
    render(<PostStatusBadge status="Published" />);
    const badge = screen.getByTestId('post-status-badge');
    expect(badge).toHaveTextContent('Published');
    expect(badge.className).toContain('bg-green-100');
  });

  it('renders Scheduled status with blue styling and clock icon', () => {
    render(<PostStatusBadge status="Scheduled" />);
    const badge = screen.getByTestId('post-status-badge');
    expect(badge).toHaveTextContent('Scheduled');
    expect(badge.className).toContain('bg-blue-100');
    // Clock icon should be present
    const svg = badge.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders Archived status with red styling', () => {
    render(<PostStatusBadge status="Archived" />);
    const badge = screen.getByTestId('post-status-badge');
    expect(badge).toHaveTextContent('Archived');
    expect(badge.className).toContain('bg-red-100');
  });
});
