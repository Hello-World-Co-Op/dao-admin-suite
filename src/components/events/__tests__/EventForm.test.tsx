/**
 * Tests for EventForm Component
 *
 * Story BL-025.2: dao-admin-suite Event Management Page
 * Task 8.2: EventForm tests
 *
 * @see AC3 - Create event via EventForm modal
 * @see AC4 - Edit event via EventForm pre-populated
 * @see AC6 - Recurring toggle shows/hides RRULE field
 * @see AC7 - Timezone selector with minimum 7 IANA timezones
 * @see AC9 - Form validation with inline errors
 * @see AC10 - 0 skipped tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { EventForm } from '../EventForm';
import type { EventItem } from '@/services/event-service';

vi.mock('@hello-world-co-op/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { userId: 'current-admin-id', roles: ['admin'] },
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
  useRoles: () => ['admin'],
}));

describe('EventForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('renders all fields in create mode', () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />,
    );

    expect(screen.getByTestId('event-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('event-description-input')).toBeInTheDocument();
    expect(screen.getByTestId('event-location-input')).toBeInTheDocument();
    expect(screen.getByTestId('event-location-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('event-start-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('event-start-time-input')).toBeInTheDocument();
    expect(screen.getByTestId('event-end-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('event-end-time-input')).toBeInTheDocument();
    expect(screen.getByTestId('event-timezone-select')).toBeInTheDocument();
    expect(screen.getByTestId('event-is-recurring-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('event-is-public-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('event-max-attendees-input')).toBeInTheDocument();
  });

  it('renders with pre-populated values in edit mode', () => {
    const initialValues: EventItem = {
      id: 'evt-1',
      title: 'DAO Meetup',
      description: 'Monthly meeting',
      location: 'Virtual',
      location_url: 'https://zoom.us/j/123',
      start_time: '2026-03-15T14:00:00.000Z',
      end_time: '2026-03-15T15:00:00.000Z',
      timezone: 'America/New_York',
      is_recurring: true,
      recurrence_rule: 'FREQ=MONTHLY;BYDAY=1SA',
      created_by: 'admin-1',
      is_public: true,
      max_attendees: 50,
      attendee_count: 3,
      rsvp_status: null,
      created_at: '2026-03-01T10:00:00Z',
      updated_at: '2026-03-01T10:00:00Z',
    };

    render(
      <EventForm
        initialValues={initialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />,
    );

    expect(screen.getByTestId('event-title-input')).toHaveValue('DAO Meetup');
    expect(screen.getByTestId('event-description-input')).toHaveValue(
      'Monthly meeting',
    );
    expect(screen.getByTestId('event-location-input')).toHaveValue('Virtual');
    expect(screen.getByTestId('event-location-url-input')).toHaveValue(
      'https://zoom.us/j/123',
    );
    expect(screen.getByTestId('event-timezone-select')).toHaveValue(
      'America/New_York',
    );
    expect(screen.getByTestId('event-is-recurring-checkbox')).toBeChecked();
    expect(screen.getByTestId('event-recurrence-rule-input')).toHaveValue(
      'FREQ=MONTHLY;BYDAY=1SA',
    );
    expect(screen.getByTestId('event-is-public-checkbox')).toBeChecked();
    expect(screen.getByTestId('event-max-attendees-input')).toHaveValue(50);
  });

  it('shows RRULE field when is_recurring toggled on, hides when off', () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />,
    );

    // Initially hidden
    expect(
      screen.queryByTestId('event-recurrence-rule-input'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('rrule-helper-text')).not.toBeInTheDocument();

    // Toggle on
    fireEvent.click(screen.getByTestId('event-is-recurring-checkbox'));
    expect(
      screen.getByTestId('event-recurrence-rule-input'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('rrule-helper-text')).toBeInTheDocument();

    // Toggle off
    fireEvent.click(screen.getByTestId('event-is-recurring-checkbox'));
    expect(
      screen.queryByTestId('event-recurrence-rule-input'),
    ).not.toBeInTheDocument();
  });

  it('timezone select contains all 8 required IANA options', () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />,
    );

    const select = screen.getByTestId('event-timezone-select');
    const options = select.querySelectorAll('option');
    const values = Array.from(options).map((o) => o.value);

    expect(values).toContain('UTC');
    expect(values).toContain('America/New_York');
    expect(values).toContain('America/Chicago');
    expect(values).toContain('America/Denver');
    expect(values).toContain('America/Los_Angeles');
    expect(values).toContain('Europe/London');
    expect(values).toContain('Europe/Paris');
    expect(values).toContain('Asia/Tokyo');
    expect(values.length).toBeGreaterThanOrEqual(8);
  });

  it('shows inline error for empty title on submit', async () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />,
    );

    fireEvent.click(screen.getByTestId('event-submit-btn'));

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows inline error "End time must be after start time" when end <= start', async () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />,
    );

    fireEvent.change(screen.getByTestId('event-title-input'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByTestId('event-start-date-input'), {
      target: { value: '2026-03-15' },
    });
    fireEvent.change(screen.getByTestId('event-start-time-input'), {
      target: { value: '15:00' },
    });
    fireEvent.change(screen.getByTestId('event-end-date-input'), {
      target: { value: '2026-03-15' },
    });
    fireEvent.change(screen.getByTestId('event-end-time-input'), {
      target: { value: '14:00' },
    });

    fireEvent.click(screen.getByTestId('event-submit-btn'));

    await waitFor(() => {
      expect(
        screen.getByText('End time must be after start time'),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows inline error when is_recurring=true and recurrence_rule is empty', async () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />,
    );

    fireEvent.change(screen.getByTestId('event-title-input'), {
      target: { value: 'Recurring Event' },
    });
    fireEvent.change(screen.getByTestId('event-start-date-input'), {
      target: { value: '2026-03-15' },
    });
    fireEvent.change(screen.getByTestId('event-start-time-input'), {
      target: { value: '14:00' },
    });
    fireEvent.change(screen.getByTestId('event-end-date-input'), {
      target: { value: '2026-03-15' },
    });
    fireEvent.change(screen.getByTestId('event-end-time-input'), {
      target: { value: '15:00' },
    });
    // Toggle recurring on
    fireEvent.click(screen.getByTestId('event-is-recurring-checkbox'));

    // Submit without filling recurrence rule
    fireEvent.click(screen.getByTestId('event-submit-btn'));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Recurrence rule is required for recurring events',
        ),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows inline error for location_url not starting with https://', async () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />,
    );

    fireEvent.change(screen.getByTestId('event-title-input'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByTestId('event-start-date-input'), {
      target: { value: '2026-03-15' },
    });
    fireEvent.change(screen.getByTestId('event-start-time-input'), {
      target: { value: '14:00' },
    });
    fireEvent.change(screen.getByTestId('event-end-date-input'), {
      target: { value: '2026-03-15' },
    });
    fireEvent.change(screen.getByTestId('event-end-time-input'), {
      target: { value: '15:00' },
    });
    fireEvent.change(screen.getByTestId('event-location-url-input'), {
      target: { value: 'http://bad-url.com' },
    });

    fireEvent.click(screen.getByTestId('event-submit-btn'));

    await waitFor(() => {
      expect(
        screen.getByText('Location URL must start with https://'),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with correct payload on valid submit', async () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />,
    );

    fireEvent.change(screen.getByTestId('event-title-input'), {
      target: { value: 'Team Standup' },
    });
    fireEvent.change(screen.getByTestId('event-description-input'), {
      target: { value: 'Daily sync' },
    });
    fireEvent.change(screen.getByTestId('event-start-date-input'), {
      target: { value: '2026-03-15' },
    });
    fireEvent.change(screen.getByTestId('event-start-time-input'), {
      target: { value: '14:00' },
    });
    fireEvent.change(screen.getByTestId('event-end-date-input'), {
      target: { value: '2026-03-15' },
    });
    fireEvent.change(screen.getByTestId('event-end-time-input'), {
      target: { value: '15:00' },
    });

    fireEvent.click(screen.getByTestId('event-submit-btn'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Team Standup',
        description: 'Daily sync',
        start_time: '2026-03-15T14:00:00',
        end_time: '2026-03-15T15:00:00',
        timezone: 'UTC',
        is_public: true,
      });
    });
  });

  it('disables submit button when isSubmitting=true', () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />,
    );

    const submitBtn = screen.getByTestId('event-submit-btn');
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent('Saving...');
  });

  it('calls onCancel when cancel button clicked', () => {
    render(
      <EventForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />,
    );

    fireEvent.click(screen.getByTestId('event-cancel-btn'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
