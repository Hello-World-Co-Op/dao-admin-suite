/**
 * Tests for EventsPage
 *
 * Story BL-025.2: dao-admin-suite Event Management Page
 * Task 8.6: Page-level tests
 *
 * @see AC1 - /events route, role-gated (route tested in App, page tests here)
 * @see AC2 - Event list loads on mount
 * @see AC3 - Create event flow
 * @see AC4 - Edit event flow
 * @see AC5 - Delete event flow
 * @see AC10 - 0 skipped tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import EventsPage from '../EventsPage';
import type { EventItem } from '@/services/event-service';
import { EventApiError } from '@/services/event-service';

// Mock auth
vi.mock('@hello-world-co-op/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { userId: 'current-admin-id', roles: ['admin'] },
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
  useRoles: () => ['admin'],
}));

// Mock event-service
vi.mock('@/services/event-service', () => ({
  listEvents: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  getEventDetail: vi.fn(),
  EventApiError: class EventApiError extends Error {
    status: number;
    body?: unknown;
    constructor(message: string, status: number, body?: unknown) {
      super(message);
      this.name = 'EventApiError';
      this.status = status;
      this.body = body;
    }
  },
}));

import {
  listEvents,
  createEvent,
  deleteEvent,
} from '@/services/event-service';

const mockListEvents = vi.mocked(listEvents);
const mockCreateEvent = vi.mocked(createEvent);
const mockDeleteEvent = vi.mocked(deleteEvent);

function createMockEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: 'evt-1',
    title: 'DAO Meetup',
    description: null,
    location: 'Virtual',
    location_url: null,
    start_time: '2099-03-15T14:00:00.000Z',
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

describe('EventsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockListEvents.mockResolvedValue({
      events: [createMockEvent()],
      total: 1,
    });
  });

  it('renders "Events Management" heading', async () => {
    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Events Management')).toBeInTheDocument();
    });
  });

  it('calls listEvents on mount', async () => {
    render(<EventsPage />);

    await waitFor(() => {
      expect(mockListEvents).toHaveBeenCalled();
    });
  });

  it('shows EventList with fetched events', async () => {
    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('DAO Meetup')).toBeInTheDocument();
    });
  });

  it('"Create Event" button opens EventForm modal in create mode', async () => {
    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('DAO Meetup')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('create-event-btn'));

    await waitFor(() => {
      expect(screen.getByText('Create Event', { selector: 'h2' })).toBeInTheDocument();
      expect(screen.getByTestId('event-form')).toBeInTheDocument();
    });
  });

  it('successful create: closes modal, calls listEvents again, shows toast', async () => {
    const newEvent = createMockEvent({ id: 'evt-new', title: 'New Event' });
    mockCreateEvent.mockResolvedValue(newEvent);
    // Second call returns both events
    mockListEvents
      .mockResolvedValueOnce({ events: [createMockEvent()], total: 1 })
      .mockResolvedValueOnce({
        events: [createMockEvent(), newEvent],
        total: 2,
      });

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('DAO Meetup')).toBeInTheDocument();
    });

    // Open create modal
    fireEvent.click(screen.getByTestId('create-event-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('event-form')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByTestId('event-title-input'), {
      target: { value: 'New Event' },
    });
    fireEvent.change(screen.getByTestId('event-start-date-input'), {
      target: { value: '2026-04-01' },
    });
    fireEvent.change(screen.getByTestId('event-start-time-input'), {
      target: { value: '10:00' },
    });
    fireEvent.change(screen.getByTestId('event-end-date-input'), {
      target: { value: '2026-04-01' },
    });
    fireEvent.change(screen.getByTestId('event-end-time-input'), {
      target: { value: '11:00' },
    });

    // Submit
    fireEvent.click(screen.getByTestId('event-submit-btn'));

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalled();
    });

    await waitFor(() => {
      // Modal closed
      expect(screen.queryByTestId('event-form')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      // Toast shown
      expect(screen.getByTestId('toast')).toHaveTextContent('Event created.');
    });

    // listEvents called again (initial + refresh)
    expect(mockListEvents).toHaveBeenCalledTimes(2);
  });

  it('API error on create: shows error in form', async () => {
    mockCreateEvent.mockRejectedValue(
      new EventApiError('Title too long', 400),
    );

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('DAO Meetup')).toBeInTheDocument();
    });

    // Open create modal
    fireEvent.click(screen.getByTestId('create-event-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('event-form')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByTestId('event-title-input'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByTestId('event-start-date-input'), {
      target: { value: '2026-04-01' },
    });
    fireEvent.change(screen.getByTestId('event-start-time-input'), {
      target: { value: '10:00' },
    });
    fireEvent.change(screen.getByTestId('event-end-date-input'), {
      target: { value: '2026-04-01' },
    });
    fireEvent.change(screen.getByTestId('event-end-time-input'), {
      target: { value: '11:00' },
    });

    // Submit
    fireEvent.click(screen.getByTestId('event-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent(
        'Title too long',
      );
    });
  });

  it('Edit button: opens EventForm with pre-populated values', async () => {
    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('DAO Meetup')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('edit-btn-evt-1'));

    await waitFor(() => {
      expect(screen.getByText('Edit Event')).toBeInTheDocument();
      expect(screen.getByTestId('event-title-input')).toHaveValue(
        'DAO Meetup',
      );
    });
  });

  it('Delete button: opens DeleteConfirmModal', async () => {
    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('DAO Meetup')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-btn-evt-1'));

    await waitFor(() => {
      expect(
        screen.getByTestId('delete-confirm-modal'),
      ).toBeInTheDocument();
    });
  });

  it('successful delete: closes modal, shows toast', async () => {
    mockDeleteEvent.mockResolvedValue(undefined);

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('DAO Meetup')).toBeInTheDocument();
    });

    // Open delete modal
    fireEvent.click(screen.getByTestId('delete-btn-evt-1'));

    await waitFor(() => {
      expect(
        screen.getByTestId('delete-confirm-modal'),
      ).toBeInTheDocument();
    });

    // Confirm delete
    fireEvent.click(screen.getByTestId('delete-confirm-btn'));

    await waitFor(() => {
      expect(mockDeleteEvent).toHaveBeenCalledWith('evt-1');
    });

    await waitFor(() => {
      // Modal closed
      expect(
        screen.queryByTestId('delete-confirm-modal'),
      ).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('toast')).toHaveTextContent('Event deleted.');
    });
  });
});
