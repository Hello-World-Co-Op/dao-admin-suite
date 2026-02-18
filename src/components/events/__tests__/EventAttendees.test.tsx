/**
 * Tests for EventAttendees Component
 *
 * Story BL-025.2: dao-admin-suite Event Management Page
 * Task 8.5: EventAttendees tests
 *
 * @see AC8 - Attendee panel shows RSVP list
 * @see AC10 - 0 skipped tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { EventAttendees } from '../EventAttendees';
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

vi.mock('@/services/event-service', () => ({
  getEventDetail: vi.fn(),
}));

import { getEventDetail } from '@/services/event-service';

const mockGetEventDetail = vi.mocked(getEventDetail);

function createMockEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: 'evt-1',
    title: 'DAO Meetup',
    description: null,
    location: 'Virtual',
    location_url: null,
    start_time: '2026-03-15T14:00:00.000Z',
    end_time: '2026-03-15T15:00:00.000Z',
    timezone: 'UTC',
    is_recurring: false,
    recurrence_rule: null,
    created_by: 'admin-1',
    is_public: true,
    max_attendees: null,
    attendee_count: 3,
    rsvp_status: null,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    ...overrides,
  };
}

describe('EventAttendees', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading state while fetching', () => {
    // Never-resolving promise to keep loading state
    mockGetEventDetail.mockReturnValue(new Promise(() => {}));

    render(
      <EventAttendees event={createMockEvent()} onClose={mockOnClose} />,
    );

    expect(screen.getByTestId('attendees-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading attendees...')).toBeInTheDocument();
  });

  it('shows attendee list after fetch resolves', async () => {
    mockGetEventDetail.mockResolvedValue({
      ...createMockEvent(),
      attendees: [
        { user_id: 'user-abc-123-456', status: 'going' },
        { user_id: 'user-def-789-012', status: 'maybe' },
      ],
    });

    render(
      <EventAttendees event={createMockEvent()} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('attendees-table')).toBeInTheDocument();
    });

    // user_id truncated to 12 chars + "..."
    expect(screen.getByText('user-abc-123...')).toBeInTheDocument();
    expect(screen.getByText('user-def-789...')).toBeInTheDocument();
  });

  it('shows correct status badges (going=green, maybe=yellow, not_going=gray)', async () => {
    mockGetEventDetail.mockResolvedValue({
      ...createMockEvent(),
      attendees: [
        { user_id: 'user-1', status: 'going' },
        { user_id: 'user-2', status: 'maybe' },
        { user_id: 'user-3', status: 'not_going' },
      ],
    });

    render(
      <EventAttendees event={createMockEvent()} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('attendees-table')).toBeInTheDocument();
    });

    const goingBadge = screen.getByText('going');
    const maybeBadge = screen.getByText('maybe');
    const notGoingBadge = screen.getByText('not_going');

    expect(goingBadge.className).toContain('bg-green-100');
    expect(maybeBadge.className).toContain('bg-yellow-100');
    expect(notGoingBadge.className).toContain('bg-gray-100');
  });

  it('shows empty state when no attendees', async () => {
    mockGetEventDetail.mockResolvedValue({
      ...createMockEvent(),
      attendees: [],
    });

    render(
      <EventAttendees event={createMockEvent()} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('attendees-empty')).toBeInTheDocument();
    });

    expect(screen.getByText('No RSVPs yet.')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    mockGetEventDetail.mockResolvedValue({
      ...createMockEvent(),
      attendees: [],
    });

    render(
      <EventAttendees event={createMockEvent()} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('attendees-close-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('attendees-close-btn'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
