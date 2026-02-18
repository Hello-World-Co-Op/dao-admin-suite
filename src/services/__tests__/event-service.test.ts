/**
 * Tests for Event Service API Client
 *
 * Story BL-025.2: dao-admin-suite Event Management Page
 * Task 8.1: Service layer tests
 *
 * @see AC10 - Vitest + Testing Library unit tests, 0 skipped
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listEvents,
  getEventDetail,
  createEvent,
  updateEvent,
  deleteEvent,
  validateRrule,
  EventApiError,
} from '../event-service';

// Mock import.meta.env
vi.stubEnv('VITE_ORACLE_BRIDGE_URL', 'https://oracle.test');

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('event-service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('listEvents', () => {
    it('fetches events with correct URL and credentials', async () => {
      const mockResponse = { events: [], total: 0 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await listEvents('2025-01-01T00:00:00Z', '2027-01-01T00:00:00Z');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://oracle.test/api/events?'),
        { credentials: 'include' },
      );
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('page_size=200');
      expect(calledUrl).toContain('from=2025-01-01T00%3A00%3A00Z');
      expect(calledUrl).toContain('to=2027-01-01T00%3A00%3A00Z');
      expect(result).toEqual(mockResponse);
    });

    it('throws EventApiError on 403', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Forbidden' }),
      });

      await expect(listEvents()).rejects.toThrow(EventApiError);
      await expect(listEvents()).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('createEvent', () => {
    it('creates event with correct method and body', async () => {
      const payload = {
        title: 'Test Event',
        start_time: '2026-03-15T14:00:00',
        end_time: '2026-03-15T15:00:00',
        timezone: 'UTC',
      };

      const mockCreated = { ...payload, id: 'new-id' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockCreated),
      });

      const result = await createEvent(payload);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oracle.test/api/events',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );
      expect(result).toEqual(mockCreated);
    });

    it('throws EventApiError on 400 validation error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Title is required' }),
      });

      await expect(
        createEvent({
          title: '',
          start_time: '2026-03-15T14:00:00',
          end_time: '2026-03-15T15:00:00',
          timezone: 'UTC',
        }),
      ).rejects.toThrow(EventApiError);

      try {
        await createEvent({
          title: '',
          start_time: '2026-03-15T14:00:00',
          end_time: '2026-03-15T15:00:00',
          timezone: 'UTC',
        });
      } catch (e) {
        expect(e).toBeInstanceOf(EventApiError);
        expect((e as EventApiError).status).toBe(400);
      }
    });
  });

  describe('updateEvent', () => {
    it('updates event with PUT method', async () => {
      const payload = { title: 'Updated Title' };
      const mockUpdated = { id: 'evt-1', ...payload };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdated),
      });

      const result = await updateEvent('evt-1', payload);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oracle.test/api/events/evt-1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );
      expect(result).toEqual(mockUpdated);
    });

    it('throws EventApiError on 404 not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Event not found' }),
      });

      await expect(updateEvent('missing-id', { title: 'x' })).rejects.toThrow(
        EventApiError,
      );

      try {
        await updateEvent('missing-id', { title: 'x' });
      } catch (e) {
        expect((e as EventApiError).status).toBe(404);
      }
    });
  });

  describe('deleteEvent', () => {
    it('deletes event with DELETE method', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve(undefined),
      });

      await expect(deleteEvent('evt-1')).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oracle.test/api/events/evt-1',
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
    });

    it('throws EventApiError on 404 not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Event not found' }),
      });

      await expect(deleteEvent('missing-id')).rejects.toThrow(EventApiError);

      try {
        await deleteEvent('missing-id');
      } catch (e) {
        expect((e as EventApiError).status).toBe(404);
      }
    });
  });

  describe('validateRrule', () => {
    it('sends POST with rrule, dtstart, and count', async () => {
      const mockResponse = {
        valid: true,
        next_occurrences: [
          '2026-03-17T14:00:00Z',
          '2026-03-24T14:00:00Z',
          '2026-03-31T14:00:00Z',
        ],
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await validateRrule('FREQ=WEEKLY;BYDAY=TU', '2026-03-15T14:00:00', 3);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oracle.test/api/events/validate-rrule',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            rrule: 'FREQ=WEEKLY;BYDAY=TU',
            dtstart: '2026-03-15T14:00:00',
            count: 3,
          }),
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('defaults count to 5', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ valid: true, next_occurrences: [] }),
      });

      await validateRrule('FREQ=DAILY', '2026-03-15T14:00:00');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.count).toBe(5);
    });

    it('throws EventApiError on 400 invalid rrule', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid RRULE syntax' }),
      });

      await expect(
        validateRrule('BAD_RRULE', '2026-03-15T14:00:00'),
      ).rejects.toThrow(EventApiError);

      try {
        await validateRrule('BAD_RRULE', '2026-03-15T14:00:00');
      } catch (e) {
        expect((e as EventApiError).status).toBe(400);
      }
    });
  });

  describe('getEventDetail', () => {
    it('fetches event detail including attendees for admin', async () => {
      const mockDetail = {
        id: 'evt-1',
        title: 'Test Event',
        attendees: [
          { user_id: 'user-1', status: 'going' },
          { user_id: 'user-2', status: 'maybe' },
        ],
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDetail),
      });

      const result = await getEventDetail('evt-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oracle.test/api/events/evt-1',
        { credentials: 'include' },
      );
      expect(result.attendees).toHaveLength(2);
      expect(result.attendees?.[0].status).toBe('going');
    });
  });
});
