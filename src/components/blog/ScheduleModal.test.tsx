/**
 * ScheduleModal Tests
 *
 * @see BL-008.3.5 Task 9 - Schedule action with date picker
 * @see AC5 - Schedule post action
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleModal } from './ScheduleModal';

describe('ScheduleModal', () => {
  it('does not render when not visible', () => {
    render(<ScheduleModal visible={false} onSchedule={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByTestId('schedule-modal')).not.toBeInTheDocument();
  });

  it('renders modal with date picker when visible', () => {
    render(<ScheduleModal visible={true} onSchedule={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('schedule-modal')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-datetime-input')).toBeInTheDocument();
    expect(screen.getByText('Schedule Post')).toBeInTheDocument();
  });

  it('shows error when no date is selected and Schedule is clicked', () => {
    render(<ScheduleModal visible={true} onSchedule={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByTestId('schedule-confirm'));
    expect(screen.getByTestId('schedule-error')).toHaveTextContent('Please select a date and time');
  });

  it('shows error for past date', () => {
    render(<ScheduleModal visible={true} onSchedule={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByTestId('schedule-datetime-input');
    fireEvent.change(input, { target: { value: '2020-01-01T12:00' } });
    fireEvent.click(screen.getByTestId('schedule-confirm'));
    expect(screen.getByTestId('schedule-error')).toHaveTextContent('Schedule time must be in the future');
  });

  it('calls onSchedule with valid future date', () => {
    const onSchedule = vi.fn();
    render(<ScheduleModal visible={true} onSchedule={onSchedule} onCancel={vi.fn()} />);
    const input = screen.getByTestId('schedule-datetime-input');
    fireEvent.change(input, { target: { value: '2030-12-25T14:00' } });
    fireEvent.click(screen.getByTestId('schedule-confirm'));
    expect(onSchedule).toHaveBeenCalledWith('2030-12-25T14:00');
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ScheduleModal visible={true} onSchedule={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('schedule-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('has accessible role and aria attributes', () => {
    render(<ScheduleModal visible={true} onSchedule={vi.fn()} onCancel={vi.fn()} />);
    const dialog = screen.getByTestId('schedule-modal');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
