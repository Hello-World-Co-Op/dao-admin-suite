/**
 * Tests for EventList Component
 *
 * Story BL-025.2: dao-admin-suite Event Management Page
 * Task 8.3: EventList tests
 *
 * @see AC2 - Event list sorted by start_time, past events de-emphasized
 * @see AC10 - 0 skipped tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { EventList } from '../EventList';
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

function createMockEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: 'evt-1',
    title: 'DAO Meetup',
    description: null,
    location: 'Virtual',
    location_url: null,
    start_time: '2099-03-15T14:00:00.000Z', // Future by default
    end_time: '2099-03-15T15:00:00.000Z',
    timezone: 'UTC',
    is_recurring: false,
    recurrence_rule: null,
    created_by: 'admin-1',
    is_public: true,
    max_attendees: null,
    attendee_count: 5,
    rsvp_status: null,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    ...overrides,
  };
}

describe('EventList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnViewAttendees = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders table headers', () => {
    render(
      <EventList
        events={[createMockEvent()]}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewAttendees={mockOnViewAttendees}
      />,
    );

    const table = screen.getByTestId('event-table');
    const headers = table.querySelectorAll('th');
    const headerTexts = Array.from(headers).map((h) => h.textContent);

    expect(headerTexts).toContain('Title');
    expect(headerTexts).toContain('Start Time');
    expect(headerTexts).toContain('Location');
    expect(headerTexts).toContain('Type');
    expect(headerTexts).toContain('Attendees');
    expect(headerTexts).toContain('Actions');
  });

  it('renders event rows with correct data', () => {
    const event = createMockEvent({
      id: 'evt-1',
      title: 'Board Meeting',
      location: 'Room A',
      attendee_count: 12,
    });

    render(
      <EventList
        events={[event]}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewAttendees={mockOnViewAttendees}
      />,
    );

    expect(screen.getByText('Board Meeting')).toBeInTheDocument();
    expect(screen.getByText('Room A')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('past events have "Ended" badge and opacity-60 class', () => {
    const pastEvent = createMockEvent({
      id: 'evt-past',
      title: 'Past Event',
      start_time: '2020-01-01T10:00:00.000Z',
    });

    render(
      <EventList
        events={[pastEvent]}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewAttendees={mockOnViewAttendees}
      />,
    );

    expect(screen.getByText('Ended')).toBeInTheDocument();
    const row = screen.getByTestId('event-row-evt-past');
    expect(row.className).toContain('opacity-60');
  });

  it('recurring events show "Recurring" badge', () => {
    const recurringEvent = createMockEvent({
      id: 'evt-rec',
      title: 'Weekly Sync',
      is_recurring: true,
    });

    render(
      <EventList
        events={[recurringEvent]}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewAttendees={mockOnViewAttendees}
      />,
    );

    expect(screen.getByText('Recurring')).toBeInTheDocument();
  });

  it('loading state shows skeleton rows', () => {
    render(
      <EventList
        events={[]}
        loading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewAttendees={mockOnViewAttendees}
      />,
    );

    expect(screen.getByTestId('table-loading-skeleton')).toBeInTheDocument();
  });

  it('empty state shows empty state message', () => {
    render(
      <EventList
        events={[]}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewAttendees={mockOnViewAttendees}
      />,
    );

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(
      screen.getByText('No events found. Create your first event.'),
    ).toBeInTheDocument();
  });

  it('"Edit" button calls onEdit with correct event', () => {
    const event = createMockEvent({ id: 'evt-edit' });

    render(
      <EventList
        events={[event]}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewAttendees={mockOnViewAttendees}
      />,
    );

    fireEvent.click(screen.getByTestId('edit-btn-evt-edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(event);
  });

  it('"Delete" button calls onDelete with correct event', () => {
    const event = createMockEvent({ id: 'evt-del' });

    render(
      <EventList
        events={[event]}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewAttendees={mockOnViewAttendees}
      />,
    );

    fireEvent.click(screen.getByTestId('delete-btn-evt-del'));
    expect(mockOnDelete).toHaveBeenCalledWith(event);
  });

  it('"Attendees" button calls onViewAttendees with correct event', () => {
    const event = createMockEvent({ id: 'evt-att' });

    render(
      <EventList
        events={[event]}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onViewAttendees={mockOnViewAttendees}
      />,
    );

    fireEvent.click(screen.getByTestId('attendees-btn-evt-att'));
    expect(mockOnViewAttendees).toHaveBeenCalledWith(event);
  });
});
