/**
 * EventsPage - Event Management Page
 *
 * Story BL-025.2: dao-admin-suite Event Management Page
 * Task 6: Page-level state management and orchestration
 *
 * Manages event list, create/edit/delete modals, attendee panel,
 * and toast notifications for the admin event management workflow.
 *
 * @see AC1 - /events route, role-gated
 * @see AC2 - Event list sorted by start_time
 * @see AC3-5 - CRUD operations
 * @see AC8 - Attendee panel
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { EventItem, CreateEventPayload } from '@/services/event-service';
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  EventApiError,
} from '@/services/event-service';
import { EventForm } from '@/components/events/EventForm';
import { EventList } from '@/components/events/EventList';
import { DeleteConfirmModal } from '@/components/events/DeleteConfirmModal';
import { EventAttendees } from '@/components/events/EventAttendees';

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [attendeesTarget, setAttendeesTarget] = useState<EventItem | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, isError = false) => {
    setToastMessage(message);
    setToastIsError(isError);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Clean up toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);
      const to = new Date();
      to.setFullYear(to.getFullYear() + 2);
      const result = await listEvents(from.toISOString(), to.toISOString());
      // Sort ascending by start_time
      const sorted = [...result.events].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );
      setEvents(sorted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Create
  function handleCreate() {
    setEditingEvent(null);
    setFormError(null);
    setModalMode('create');
  }

  // Edit
  function handleEdit(event: EventItem) {
    setEditingEvent(event);
    setFormError(null);
    setModalMode('edit');
  }

  // Form submit (create or update)
  async function handleFormSubmit(payload: CreateEventPayload) {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (modalMode === 'create') {
        await createEvent(payload);
        showToast('Event created.');
      } else if (modalMode === 'edit' && editingEvent) {
        await updateEvent(editingEvent.id, payload);
        showToast('Event updated.');
      }
      setModalMode(null);
      setEditingEvent(null);
      await fetchEvents();
    } catch (e) {
      if (e instanceof EventApiError) {
        setFormError(e.message);
      } else {
        setFormError(
          e instanceof Error ? e.message : 'An unexpected error occurred',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Delete
  function handleDeleteRequest(event: EventItem) {
    setDeleteTarget(event);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteEvent(deleteTarget.id);
      setDeleteTarget(null);
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      showToast('Event deleted.');
    } catch (e) {
      if (e instanceof EventApiError && e.status === 404) {
        showToast('Event not found.', true);
      } else {
        showToast(
          e instanceof Error ? e.message : 'Failed to delete event',
          true,
        );
      }
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  // Attendees
  function handleViewAttendees(event: EventItem) {
    setAttendeesTarget(event);
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="events-page">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Events Management
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage co-op events
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              data-testid="create-event-btn"
            >
              Create Event
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
            data-testid="events-error"
          >
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <EventList
            events={events}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onViewAttendees={handleViewAttendees}
          />
        </div>
      </main>

      {/* Create/Edit Modal */}
      {modalMode && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-form-dialog-title"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 id="event-form-dialog-title" className="text-lg font-semibold text-gray-900 mb-4">
              {modalMode === 'create' ? 'Create Event' : 'Edit Event'}
            </h2>
            <EventForm
              initialValues={
                modalMode === 'edit' && editingEvent
                  ? editingEvent
                  : undefined
              }
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setModalMode(null);
                setEditingEvent(null);
                setFormError(null);
              }}
              isSubmitting={isSubmitting}
              formError={formError}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        eventTitle={deleteTarget?.title ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />

      {/* Attendees Panel */}
      <EventAttendees
        event={attendeesTarget}
        onClose={() => setAttendeesTarget(null)}
      />

      {/* Toast */}
      {toastMessage && (
        <div
          data-testid="toast"
          className={`fixed bottom-4 right-4 text-white px-4 py-2 rounded shadow ${toastIsError ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
