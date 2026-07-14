import { useState, useMemo, useRef, useReducer, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import type { Event } from '@/types/event';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBD';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function isPastEvent(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  } catch {
    return false;
  }
}

export function DashboardPage() {
  const toast = useToast();
  const { data: events = [], isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'date'>('newest');
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newVenue, setNewVenue] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.venue ?? '').toLowerCase().includes(q),
      );
    }

    if (filter === 'active') {
      result = result.filter((e) => !isPastEvent(e.date));
    } else if (filter === 'past') {
      result = result.filter((e) => isPastEvent(e.date));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date': {
          const ad = a.date ? new Date(a.date).getTime() : Infinity;
          const bd = b.date ? new Date(b.date).getTime() : Infinity;
          return ad - bd;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [events, search, filter, sortBy]);

  const activeCount = useMemo(
    () => events.filter((e) => !isPastEvent(e.date)).length,
    [events],
  );

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast('Please enter an event name', 'error');
      return;
    }
    try {
      const slug = slugify(newName) || `event-${Date.now()}`;
      await createEvent.mutateAsync({
        name: newName.trim(),
        slug,
        date: newDate || null,
        venue: newVenue.trim() || null,
      });
      toast('Event created successfully', 'success');
      setCreateOpen(false);
      setNewName('');
      setNewDate('');
      setNewVenue('');
    } catch {
      toast('Failed to create event', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEvent.mutateAsync(deleteTarget.id);
      toast('Event deleted', 'success');
      setDeleteTarget(null);
    } catch {
      toast('Failed to delete event', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <style>{`
        .dash-page {
          min-height: 100vh;
          background: #F8F8F8;
          padding: 32px 24px 64px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          color: #1A1A1A;
        }
        .dash-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .dash-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .dash-create-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 24px;
          height: 44px;
          background: #1A1A1A;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .dash-create-btn:hover {
          opacity: 0.85;
        }
        .dash-create-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .dash-toolbar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .dash-search {
          flex: 1;
          min-width: 200px;
          height: 44px;
          padding: 10px 14px;
          border: 1px solid #DADADA;
          border-radius: 12px;
          background: #FFFFFF;
          font-size: 14px;
          color: #1A1A1A;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .dash-search:focus {
          border-color: #1A1A1A;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
        }
        .dash-search::placeholder {
          color: #DADADA;
        }
        .dash-sort {
          height: 44px;
          padding: 10px 14px;
          border: 1px solid #DADADA;
          border-radius: 12px;
          background: #FFFFFF;
          font-size: 14px;
          color: #1A1A1A;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
          min-width: 160px;
        }
        .dash-sort:focus {
          border-color: #1A1A1A;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
        }
        .dash-chips {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .dash-chip {
          padding: 8px 18px;
          border: 1px solid #DADADA;
          background: #FFFFFF;
          color: #4A4A4A;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .dash-chip:hover {
          border-color: #4A4A4A;
        }
        .dash-chip.active {
          background: #1A1A1A;
          color: #FFFFFF;
          border-color: #1A1A1A;
        }
        .dash-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        @media (max-width: 900px) {
          .dash-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .dash-stats { grid-template-columns: 1fr; }
        }
        .dash-stat-card {
          background: #FFFFFF;
          border: 1px solid #EFEFEF;
          border-radius: 12px;
          padding: 20px;
        }
        .dash-stat-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #4A4A4A;
          margin: 0 0 8px 0;
        }
        .dash-stat-value {
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -1px;
        }
        .dash-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 1000px) {
          .dash-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .dash-grid { grid-template-columns: 1fr; }
        }
        .dash-card {
          background: #FFFFFF;
          border: 1px solid #EFEFEF;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .dash-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }
        .dash-card-cover {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        }
        .dash-card-cover-placeholder {
          width: 100%;
          height: 160px;
          background: linear-gradient(135deg, #1A1A1A 0%, #4A4A4A 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.5);
          font-size: 40px;
          font-weight: 700;
          letter-spacing: -2px;
        }
        .dash-card-body {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .dash-card-name {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #1A1A1A;
        }
        .dash-card-meta {
          font-size: 13px;
          color: #4A4A4A;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dash-card-badges {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .dash-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dash-badge-active {
          background: #EFEFEF;
          color: #1A1A1A;
        }
        .dash-badge-past {
          background: #DADADA;
          color: #4A4A4A;
        }
        .dash-badge-count {
          background: #F8F8F8;
          color: #4A4A4A;
          border: 1px solid #EFEFEF;
        }
        .dash-card-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }
        .dash-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 14px;
          height: 38px;
          border: 1px solid #DADADA;
          background: #FFFFFF;
          color: #1A1A1A;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s;
        }
        .dash-btn:hover {
          background: #F8F8F8;
          border-color: #4A4A4A;
        }
        .dash-btn-danger:hover {
          background: #1A1A1A;
          color: #FFFFFF;
          border-color: #1A1A1A;
        }
        .dash-skeleton-card {
          background: #FFFFFF;
          border: 1px solid #EFEFEF;
          border-radius: 16px;
          overflow: hidden;
        }
        .dash-skeleton-block {
          background: linear-gradient(90deg, #EFEFEF 25%, #F8F8F8 50%, #EFEFEF 75%);
          background-size: 200% 100%;
          animation: dash-shimmer 1.5s infinite;
        }
        @keyframes dash-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .dash-skeleton-cover {
          width: 100%;
          height: 160px;
        }
        .dash-skeleton-line {
          height: 14px;
          border-radius: 4px;
          margin: 12px 20px;
        }
        .dash-skeleton-line-short {
          width: 60%;
        }
        .dash-skeleton-line-medium {
          width: 80%;
        }
        .dash-skeleton-actions {
          display: flex;
          gap: 8px;
          padding: 0 20px 20px;
        }
        .dash-skeleton-btn {
          flex: 1;
          height: 38px;
          border-radius: 10px;
        }
        .dash-empty {
          text-align: center;
          padding: 64px 24px;
          color: #4A4A4A;
        }
        .dash-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.3;
        }
        .dash-empty-title {
          font-size: 18px;
          font-weight: 600;
          color: #1A1A1A;
          margin: 0 0 8px 0;
        }
        .dash-empty-text {
          font-size: 14px;
          margin: 0 0 24px 0;
        }
        .dash-modal-field {
          margin-bottom: 16px;
        }
        .dash-modal-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1A1A1A;
          margin-bottom: 6px;
        }
        .dash-modal-input {
          width: 100%;
          height: 44px;
          padding: 10px 14px;
          border: 1px solid #DADADA;
          border-radius: 12px;
          background: #FFFFFF;
          font-size: 14px;
          color: #1A1A1A;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .dash-modal-input:focus {
          border-color: #1A1A1A;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
        }
        .dash-modal-input::placeholder {
          color: #DADADA;
        }
        .dash-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .dash-modal-btn {
          padding: 0 24px;
          height: 44px;
          border: 1px solid #DADADA;
          background: #FFFFFF;
          color: #1A1A1A;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .dash-modal-btn:hover {
          background: #F8F8F8;
        }
        .dash-modal-btn-primary {
          background: #1A1A1A;
          color: #FFFFFF;
          border-color: #1A1A1A;
        }
        .dash-modal-btn-primary:hover {
          opacity: 0.85;
          background: #1A1A1A;
        }
        .dash-modal-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .dash-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: dash-spin 0.6s linear infinite;
        }
        @keyframes dash-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="dash-page">
        <div className="dash-container">
          {/* Header */}
          <div className="dash-header">
            <h1 className="dash-title">Your Events</h1>
            <button
              className="dash-create-btn"
              onClick={() => setCreateOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Create Event
            </button>
          </div>

          {/* Toolbar */}
          <div className="dash-toolbar">
            <input
              className="dash-search"
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="dash-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name (A-Z)</option>
              <option value="date">Event date</option>
            </select>
          </div>

          {/* Filter chips */}
          <div className="dash-chips">
            <button
              className={`dash-chip ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`dash-chip ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              className={`dash-chip ${filter === 'past' ? 'active' : ''}`}
              onClick={() => setFilter('past')}
            >
              Past
            </button>
          </div>

          {/* Stats */}
          <StatsGrid events={events} />

          {/* Event cards */}
          {isLoading ? (
            <div className="dash-grid">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="dash-skeleton-card">
                  <div className="dash-skeleton-block dash-skeleton-cover" />
                  <div className="dash-skeleton-block dash-skeleton-line dash-skeleton-line-medium" />
                  <div className="dash-skeleton-block dash-skeleton-line dash-skeleton-line-short" />
                  <div className="dash-skeleton-actions">
                    <div className="dash-skeleton-block dash-skeleton-btn" />
                    <div className="dash-skeleton-block dash-skeleton-btn" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon">◇</div>
              <p className="dash-empty-title">No events found</p>
              <p className="dash-empty-text">
                {search || filter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first event.'}
              </p>
              <button
                className="dash-create-btn"
                onClick={() => setCreateOpen(true)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Create Event
              </button>
            </div>
          ) : (
            <div className="dash-grid">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onDelete={() => setDeleteTarget(event)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Event">
        <div className="dash-modal-field">
          <label className="dash-modal-label">Event Name</label>
          <input
            className="dash-modal-input"
            type="text"
            placeholder="e.g. Annual Gala Dinner 2024"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="dash-modal-field">
          <label className="dash-modal-label">Date</label>
          <input
            className="dash-modal-input"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
        <div className="dash-modal-field">
          <label className="dash-modal-label">Venue</label>
          <input
            className="dash-modal-input"
            type="text"
            placeholder="e.g. Grand Ballroom, Hotel name"
            value={newVenue}
            onChange={(e) => setNewVenue(e.target.value)}
          />
        </div>
        <div className="dash-modal-actions">
          <button
            className="dash-modal-btn"
            onClick={() => setCreateOpen(false)}
            disabled={createEvent.isPending}
          >
            Cancel
          </button>
          <button
            className="dash-modal-btn dash-modal-btn-primary"
            onClick={handleCreate}
            disabled={createEvent.isPending}
          >
            {createEvent.isPending ? (
              <>
                <span className="dash-spinner" />
                Creating...
              </>
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently remove all guests, tables, and seating assignments for this event. This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </>
  );
}

function StatsGrid({ events }: { events: Event[] }) {
  const activeCount = useMemo(
    () => events.filter((e) => !isPastEvent(e.date)).length,
    [events],
  );

  // Aggregate guest/table counts across all events.
  // Each EventCountCollector calls hooks at the top level (Rules of Hooks safe)
  // and reports counts upward via a stable callback that mutates a ref + triggers re-render.
  const countsRef = useRef({ guests: 0, tables: 0 });
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const handleCount = useCallback(
    (guests: number, tables: number) => {
      // We can't know which event this is from, so we re-sum from all collectors
      // by using a different approach: each collector writes to a shared map.
    },
    [],
  );

  // Simpler approach: use a Map keyed by event ID, and sum on each update.
  const countsMapRef = useRef<Map<string, { guests: number; tables: number }>>(new Map());

  const handleEventCount = useCallback(
    (eventId: string, guests: number, tables: number) => {
      const prev = countsMapRef.current.get(eventId);
      if (prev && prev.guests === guests && prev.tables === tables) return;
      countsMapRef.current.set(eventId, { guests, tables });
      forceUpdate();
    },
    [],
  );

  const totals = useMemo(() => {
    let guests = 0;
    let tables = 0;
    countsMapRef.current.forEach((c) => {
      guests += c.guests;
      tables += c.tables;
    });
    return { guests, tables };
  }, [countsMapRef.current, forceUpdate]);

  const stats = [
    { label: 'Total Events', value: events.length },
    { label: 'Total Guests', value: totals.guests },
    { label: 'Total Tables', value: totals.tables },
    { label: 'Active Events', value: activeCount },
  ];

  return (
    <>
      <div className="dash-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="dash-stat-card">
            <p className="dash-stat-label">{stat.label}</p>
            <p className="dash-stat-value">{stat.value}</p>
          </div>
        ))}
      </div>
      {/* Hidden collectors that call useGuests/useTables per event */}
      {events.map((event) => (
        <EventCountCollector
          key={event.id}
          eventId={event.id}
          onCount={handleEventCount}
        />
      ))}
    </>
  );
}

/**
 * Renders nothing but calls hooks for a single event and reports counts up.
 */
function EventCountCollector({
  eventId,
  onCount,
}: {
  eventId: string;
  onCount: (eventId: string, guests: number, tables: number) => void;
}) {
  const { data: guests = [] } = useGuests(eventId);
  const { data: tables = [] } = useTables(eventId);

  useEffect(() => {
    onCount(eventId, guests.length, tables.length);
  }, [eventId, guests.length, tables.length, onCount]);

  return null;
}

function EventCard({ event, onDelete }: { event: Event; onDelete: () => void }) {
  const { data: guests = [] } = useGuests(event.id);
  const { data: tables = [] } = useTables(event.id);

  const past = isPastEvent(event.date);

  return (
    <div className="dash-card">
      {event.cover_url ? (
        <img className="dash-card-cover" src={event.cover_url} alt={event.name} />
      ) : (
        <div className="dash-card-cover-placeholder">
          {event.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="dash-card-body">
        <h3 className="dash-card-name">{event.name}</h3>
        <p className="dash-card-meta">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1.5" y="3" width="11" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4 1.5v3M10 1.5v3M1.5 6h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {formatDate(event.date)}
          {event.venue ? ` · ${event.venue}` : ''}
        </p>
        <div className="dash-card-badges">
          <span className={`dash-badge ${past ? 'dash-badge-past' : 'dash-badge-active'}`}>
            {past ? 'Past' : 'Active'}
          </span>
          <span className="dash-badge dash-badge-count">
            {guests.length} Guests
          </span>
          <span className="dash-badge dash-badge-count">
            {tables.length} Tables
          </span>
        </div>
        <div className="dash-card-actions">
          <Link to={`/e/${event.id}`} className="dash-btn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Manage
          </Link>
          <button className="dash-btn dash-btn-danger" onClick={onDelete}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 4h9M5 4V2.5h4V4M3.5 4l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
