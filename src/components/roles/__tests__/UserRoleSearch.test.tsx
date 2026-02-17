/**
 * Tests for UserRoleSearch Component
 *
 * Story BL-019.2: Platform Role Management Page
 * Task 2.4: Unit tests for UserRoleSearch
 *
 * @see AC3 - Search input with 300ms debounce
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UserRoleSearch } from '../UserRoleSearch';

describe('UserRoleSearch', () => {
  const defaultProps = {
    onSearch: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the search input', () => {
    render(<UserRoleSearch {...defaultProps} />);
    expect(screen.getByTestId('role-search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();
  });

  it('debounces onSearch call by 300ms', () => {
    render(<UserRoleSearch {...defaultProps} />);
    const input = screen.getByTestId('role-search-input');

    fireEvent.change(input, { target: { value: 'test' } });

    // Not called immediately
    expect(defaultProps.onSearch).not.toHaveBeenCalled();

    // Called after 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(defaultProps.onSearch).toHaveBeenCalledWith('test');
    expect(defaultProps.onSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onSearch with empty string when input is cleared', () => {
    render(<UserRoleSearch {...defaultProps} />);
    const input = screen.getByTestId('role-search-input');

    fireEvent.change(input, { target: { value: 'test' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    fireEvent.change(input, { target: { value: '' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(defaultProps.onSearch).toHaveBeenCalledWith('');
  });

  it('disables input when disabled prop is true', () => {
    render(<UserRoleSearch {...defaultProps} disabled />);
    const input = screen.getByTestId('role-search-input');
    expect(input).toBeDisabled();
  });

  it('resets debounce timer on rapid input changes', () => {
    render(<UserRoleSearch {...defaultProps} />);
    const input = screen.getByTestId('role-search-input');

    fireEvent.change(input, { target: { value: 'a' } });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.change(input, { target: { value: 'ab' } });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.change(input, { target: { value: 'abc' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Only the last value should be called
    expect(defaultProps.onSearch).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSearch).toHaveBeenCalledWith('abc');
  });
});
