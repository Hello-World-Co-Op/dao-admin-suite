/**
 * Event Management API Client
 *
 * Typed fetch client for the oracle-bridge event management endpoints.
 * All endpoints require admin session (credentials: 'include').
 *
 * Story BL-025.2: dao-admin-suite Event Management Page
 * Task 1: Create event-service.ts
 *
 * @see BL-025.1 - Oracle-bridge events API (CRUD + RSVP)
 */

// --- Type definitions matching oracle-bridge response shapes ---

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  location_url: string | null;
  start_time: string; // ISO string (JSON serialized Date)
  end_time: string; // ISO string
  timezone: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  created_by: string;
  is_public: boolean;
  max_attendees: number | null;
  attendee_count: number;
  rsvp_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventDetail extends EventItem {
  attendees?: { user_id: string; status: string }[];
}

export interface EventsListResponse {
  events: EventItem[];
  total: number;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  location?: string;
  location_url?: string;
  start_time: string;
  end_time: string;
  timezone: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  is_public?: boolean;
  max_attendees?: number;
}

export type UpdateEventPayload = Partial<CreateEventPayload>;

export interface RsvpEntry {
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
}

// --- Error class ---

export class EventApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'EventApiError';
  }
}

// --- Helper ---

function getOracleBridgeUrl(): string {
  return import.meta.env.VITE_ORACLE_BRIDGE_URL || '';
}

// --- API functions ---

/**
 * Fetch events within a date range.
 *
 * GET /api/events?from=...&to=...&page=1&page_size=200
 *
 * @param from - ISO date string for range start
 * @param to - ISO date string for range end
 * @throws EventApiError on non-2xx response
 */
export async function listEvents(
  from?: string,
  to?: string,
): Promise<EventsListResponse> {
  const params = new URLSearchParams({ page: '1', page_size: '200' });
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const url = `${getOracleBridgeUrl()}/api/events?${params}`;
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new EventApiError(
      body?.error || `Failed to fetch events: ${response.status}`,
      response.status,
      body,
    );
  }

  return response.json();
}

/**
 * Fetch event detail including attendees (admin only).
 *
 * GET /api/events/:id
 *
 * @throws EventApiError on non-2xx response
 */
export async function getEventDetail(id: string): Promise<EventDetail> {
  const url = `${getOracleBridgeUrl()}/api/events/${id}`;
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new EventApiError(
      body?.error || `Failed to fetch event detail: ${response.status}`,
      response.status,
      body,
    );
  }

  return response.json();
}

/**
 * Create a new event.
 *
 * POST /api/events
 *
 * @throws EventApiError on non-2xx response
 */
export async function createEvent(
  payload: CreateEventPayload,
): Promise<EventItem> {
  const url = `${getOracleBridgeUrl()}/api/events`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new EventApiError(
      body?.error || `Failed to create event: ${response.status}`,
      response.status,
      body,
    );
  }

  return response.json();
}

/**
 * Update an existing event.
 *
 * PUT /api/events/:id
 *
 * @throws EventApiError on non-2xx response
 */
export async function updateEvent(
  id: string,
  payload: UpdateEventPayload,
): Promise<EventItem> {
  const url = `${getOracleBridgeUrl()}/api/events/${id}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new EventApiError(
      body?.error || `Failed to update event: ${response.status}`,
      response.status,
      body,
    );
  }

  return response.json();
}

/**
 * Delete an event.
 *
 * DELETE /api/events/:id
 *
 * @throws EventApiError on non-2xx response
 */
export async function deleteEvent(id: string): Promise<void> {
  const url = `${getOracleBridgeUrl()}/api/events/${id}`;
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new EventApiError(
      body?.error || `Failed to delete event: ${response.status}`,
      response.status,
      body,
    );
  }
}
