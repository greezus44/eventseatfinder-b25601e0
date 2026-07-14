import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import type { Event } from '@/types/event';

type SortKey = 'newest' | 'oldest' | 'name';
type FilterKey = 'all' | 'active' | 'past';

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4)
  );
}

function isEventActive(event: Event): boolean {
  if (!event.date) return true;
  const eventDate = new Date(event.date);
  if (Number.isNaN(eventDate.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate >= today;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBD';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const DASH_CSS = `
.dash-root { min-height: 100vh; background: #F8F8F8; font-family: 'Inter', sans-serif; color: #1A1A1A; }
.dash-container { max-width: 1100px; margin: 0 auto; padding: 40px 32px 64px; }

/* ---- Header ---- */
.dash-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.dash-header-left h1 { margin: 0 0 4px; font-size: 28px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.5px; }
.dash-header-left p { margin: 0; font-size: 14px; color: #4A4A4A; }
.dash-create-btn {
  display: inline-flex; align-items: center; gap: 8px;
  height: 44px; padding: 0 20px;
  border: none; border-radius: 12px;
  background: #1A1A1A; color: #FFFFFF;
  font-size: 14px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: background 200ms ease, transform 100ms ease;
  white-space: nowrap;
}
.dash-create-btn:hover { background: #333333; }
.dash-create-btn:active { transform: scale(0.98); }
.dash-create-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ---- Toolbar ---- */
.dash-toolbar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  margin-bottom: 20px;
}
.dash-search { flex: 1; min-width: 220px; position: relative; }
.dash-search input {
  width: 100%; height: 44px; padding: 10px 14px 10px 40px;
  border: 1px solid #DADADA; border-radius: 12px;
  background: #FFFFFF; font-size: 14px; color: #1A1A1A;
  outline: none; transition: border-color 200ms ease, box-shadow 200ms ease;
  box-sizing: border-box; font-family: inherit;
}
.dash-search input::placeholder { color: #B0B0B0; }
.dash-search input:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.dash-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #B0B0B0; pointer-events: none; display: flex; }

.dash-sort { position: relative; }
.dash-sort select {
  height: 44px; padding: 10px 36px 10px 14px;
  border: 1px solid #DADADA; border-radius: 12px;
  background: #FFFFFF; font-size: 14px; color: #1A1A1A;
  cursor: pointer; outline: none; appearance: none; font-family: inherit;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.dash-sort select:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.dash-sort-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #4A4A4A; pointer-events: none; display: flex; }

/* ---- Filter chips ---- */
.dash-chips { display: flex; gap: 8px; margin-bottom: 28px; }
.dash-chip {
  padding: 8px 16px; border: 1px solid #DADADA; border-radius: 999px;
  background: #FFFFFF; color: #4A4A4A; font-size: 13px; font-weight: 500;
  cursor: pointer; font-family: inherit; transition: all 200ms ease;
}
.dash-chip:hover { border-color: #4A4A4A; color: #1A1A1A; }
.dash-chip--active { background: #1A1A1A; color: #FFFFFF; border-color: #1A1A1A; }
.dash-chip--active:hover { color: #FFFFFF; }

/* ---- Stat cards ---- */
.dash-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 36px; }
.dash-stat {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 14px;
  padding: 20px; display: flex; flex-direction: column; gap: 6px;
}
.dash-stat-label { font-size: 12px; font-weight: 600; color: #4A4A4A; text-transform: uppercase; letter-spacing: 0.5px; }
.dash-stat-value { font-size: 32px; font-weight: 700; color: #1A1A1A; line-height: 1; }

/* ---- Event grid ---- */
.dash-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

.dash-card {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 16px;
  overflow: hidden; display: flex; flex-direction: column;
  transition: box-shadow 200ms ease, border-color 200ms ease;
}
.dash-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.08); border-color: #DADADA; }

.dash-card-cover { height: 140px; position: relative; overflow: hidden; }
.dash-card-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dash-card-cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #1A1A1A 0%, #4A4A4A 100%); }
.dash-card-badges { position: absolute; top: 10px; left: 10px; display: flex; gap: 6px; flex-wrap: wrap; }
.dash-badge {
  padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
  background: rgba(255,255,255,0.92); color: #1A1A1A; backdrop-filter: blur(4px);
}
.dash-badge--active { background: #1A1A1A; color: #FFFFFF; }
.dash-badge--past { background: #FFFFFF; color: #4A4A4A; }

.dash-card-body { padding: 18px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
.dash-card-name { font-size: 17px; font-weight: 600; color: #1A1A1A; margin: 0; line-height: 1.3; }
.dash-card-date { font-size: 13px; color: #4A4A4A; margin: 0; }
.dash-card-venue { font-size: 13px; color: #4A4A4A; margin: 0; display: flex; align-items: center; gap: 5px; }
.dash-card-meta { display: flex; gap: 16px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #EFEFEF; }
.dash-card-meta-item { display: flex; flex-direction: column; gap: 2px; }
.dash-card-meta-num { font-size: 18px; font-weight: 700; color: #1A1A1A; }
.dash-card-meta-label { font-size: 11px; color: #4A4A4A; text-transform: uppercase; letter-spacing: 0.5px; }

.dash-card-actions { display: flex; gap: 8px; padding: 0 18px 18px; }
.dash-card-btn {
  flex: 1; height: 38px; padding: 0 12px;
  border: 1px solid #DADADA; border-radius: 10px;
  background: #FFFFFF; color: #1A1A1A; font-size: 13px; font-weight: 500;
  font-family: inherit; cursor: pointer; transition: all 200ms ease;
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  text-decoration: none;
}
.dash-card-btn:hover { background: #EFEFEF; border-color: #4A4A4A; }
.dash-card-btn--danger { color: #4A4A4A; }
.dash-card-btn--danger:hover { background: #1A1A1A; color: #FFFFFF; border-color: #1A1A1A; }

/* ---- Skeleton ---- */
.dash-skeleton {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 16px; overflow: hidden;
}
.dash-skel-cover { height: 140px; background: linear-gradient(90deg, #EFEFEF 25%, #F8F8F8 50%, #EFEFEF 75%); background-size: 200% 100%; animation: dash-shimmer 1.5s infinite; }
.dash-skel-body { padding: 18px; display: flex; flex-direction: column; gap: 10px; }
.dash-skel-line { height: 14px; border-radius: 6px; background: #EFEFEF; animation: dash-shimmer 1.5s infinite; }
.dash-skel-line--w60 { width: 60%; }
.dash-skel-line--w40 { width: 40%; }
.dash-skel-line--w80 { width: 80%; }
@keyframes dash-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ---- Empty state ---- */
.dash-empty {
  text-align: center; padding: 64px 20px; background: #FFFFFF;
  border: 1px solid #EFEFEF; border-radius: 16px;
}
.dash-empty-icon { width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 14px; background: #EFEFEF; display: flex; align-items: center; justify-content: center; color: #4A4A4A; }
.dash-empty h3 { margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #1A1A1A; }
.dash-empty p { margin: 0 0 20px; font-size: 14px; color: #4A4A4A; }

/* ---- Modal form ---- */
.dash-modal-title { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #1A1A1A; }
.dash-modal-sub { margin: 0 0 24px; font-size: 14px; color: #4A4A4A; }
.dash-field { margin-bottom: 16px; }
.dash-field-label { display: block; font-size: 13px; font-weight: 600; color: #4A4A4A; margin-bottom: 6px; }
.dash-field input, .dash-field textarea {
  width: 100%; height: 44px; padding: 10px 14px;
  border: 1px solid #DADADA; border-radius: 12px;
  background: #FFFFFF; font-size: 14px; color: #1A1A1A;
  outline: none; transition: border-color 200ms ease, box-shadow 200ms ease;
  box-sizing: border-box; font-family: inherit;
}
.dash-field input:focus, .dash-field textarea:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.dash-field textarea { height: auto; min-height: 80px; resize: vertical; line-height: 1.5; }
.dash-field-hint { font-size: 12px; color: #B0B0B0; margin-top: 4px; }
.dash-modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
.dash-modal-btn {
  height: 44px; padding: 0 20px; border-radius: 12px; font-size: 14px; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: all 200ms ease; border: none;
}
.dash-modal-btn--cancel { background: #FFFFFF; color: #1A1A1A; border: 1px solid #DADADA; }
.dash-modal-btn--cancel:hover { background: #EFEFEF; }
.dash-modal-btn--primary { background: #1A1A1A; color: #FFFFFF; display: inline-flex; align-items: center; gap: 8px; }
.dash-modal-btn--primary:hover { background: #333333; }
.dash-modal-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
.dash-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #FFFFFF; border-radius: 50%; animation: dash-spin 0.6s linear infinite; }
@keyframes dash-spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .dash-stats { grid-template-columns: repeat(2, 1fr); }
  .dash-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .dash-container { padding: 24px 16px 48px; }
  .dash-header { flex-direction: column; gap: 16px; }
  .dash-stats { grid-template-columns: repeat(2, 1fr); }
  .dash-grid { grid-template-columns: 1fr; }
  .dash-toolbar { flex-direction: column; align-items: stretch; }
  .dash-sort { width: 100%; }
  .dash-sort select { width: 100%; }
}
`;

export function DashboardPage() {
  const { data: events = [], isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [filter, setFilter] = useState<FilterKey>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formDate, setFormDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

  const filteredEvents = useMemo(() => {
    let list = [...events];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.venue ?? '').toLowerCase().includes(q),
      );
    }
    if (filter === 'active') list = list.filter(isEventActive);
    if (filter === 'past') list = list.filter((e) => !isEventActive(e));
    list.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'oldest')
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    return list;
  }, [events, search, sortKey, filter]);

  const activeCount = useMemo(
    () => events.filter(isEventActive).length,
    [events],
  );

  async function handleCreate() {
    const name = formName.trim();
    if (!name) {
      toast('Please enter an event name', 'error');
      return;
    }
    const slug = slugify(name);
    try {
      await createEvent.mutateAsync({
        name,
        slug,
        venue: formVenue.trim() || null,
        date: formDate || null,
      });
      toast('Event created', 'success');
      setCreateOpen(false);
      setFormName('');
      setFormVenue('');
      setFormDate('');
    } catch {
      toast('Failed to create event', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEvent.mutateAsync(deleteTarget.id);
      toast('Event deleted', 'success');
      setDeleteTarget(null);
    } catch {
      toast('Failed to delete event', 'error');
    }
  }

  return (
    <div className="dash-root">
      <style>{DASH_CSS}</style>
      <div className="dash-container">
        {/* Header */}
        <div className="dash-header">
          <div className="dash-header-left">
            <h1>Your Events</h1>
            <p>Manage your seating events and invitations.</p>
          </div>
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
          <div className="dash-search">
            <span className="dash-search-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="dash-sort">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name (A–Z)</option>
            </select>
            <span className="dash-sort-arrow">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </div>
        </div>

        {/* Filter chips */}
        <div className="dash-chips">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'past', label: 'Past' },
            ] as { id: FilterKey; label: string }[]
          ).map((chip) => (
            <button
              key={chip.id}
              className={`dash-chip ${filter === chip.id ? 'dash-chip--active' : ''}`}
              onClick={() => setFilter(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Stat cards */}
        <div className="dash-stats">
          <div className="dash-stat">
            <span className="dash-stat-label">Total Events</span>
            <span className="dash-stat-value">{events.length}</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-label">Active Events</span>
            <span className="dash-stat-value">{activeCount}</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-label">Total Guests</span>
            <span className="dash-stat-value">
              <AggregatedTotal events={events} useHook="guests" />
            </span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-label">Total Tables</span>
            <span className="dash-stat-value">
              <AggregatedTotal events={events} useHook="tables" />
            </span>
          </div>
        </div>

        {/* Event grid */}
        {isLoading ? (
          <div className="dash-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="dash-skeleton">
                <div className="dash-skel-cover" />
                <div className="dash-skel-body">
                  <div className="dash-skel-line dash-skel-line--w60" />
                  <div className="dash-skel-line dash-skel-line--w40" />
                  <div className="dash-skel-line dash-skel-line--w80" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3>No events yet</h3>
            <p>Create your first event to start managing seating.</p>
            <button className="dash-create-btn" onClick={() => setCreateOpen(true)}>
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

      {/* Create event modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} maxWidth={460}>
        <h2 className="dash-modal-title">Create New Event</h2>
        <p className="dash-modal-sub">Set up a new event to manage its seating.</p>
        <div className="dash-field">
          <label className="dash-field-label">Event Name</label>
          <input
            type="text"
            placeholder="e.g. Annual Gala 2025"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="dash-field">
          <label className="dash-field-label">Venue</label>
          <input
            type="text"
            placeholder="e.g. Grand Ballroom, NYC"
            value={formVenue}
            onChange={(e) => setFormVenue(e.target.value)}
          />
        </div>
        <div className="dash-field">
          <label className="dash-field-label">Date</label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
          />
        </div>
        <div className="dash-modal-actions">
          <button
            className="dash-modal-btn dash-modal-btn--cancel"
            onClick={() => setCreateOpen(false)}
          >
            Cancel
          </button>
          <button
            className="dash-modal-btn dash-modal-btn--primary"
            onClick={handleCreate}
            disabled={createEvent.isPending}
          >
            {createEvent.isPending && <span className="dash-spinner" />}
            {createEvent.isPending ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently remove all guests, tables, and seating assignments. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* ============================================================
 * Sub-components — each one calls hooks at the top level
 * (React hooks rules require hooks to be called unconditionally
 * at the top level of a component, never in loops or conditionals)
 * ============================================================ */

/**
 * Aggregates a count across all events by rendering one hook-calling child per event.
 * Each child reports its count via a callback; the parent sums them into state.
 * `useHook` selects whether to count guests or tables.
 */
function AggregatedTotal({
  events,
  useHook,
}: {
  events: Event[];
  useHook: 'guests' | 'tables';
}) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  const report = useCallback((eventId: string, count: number) => {
    setCounts((prev) => {
      if (prev[eventId] === count) return prev;
      return { ...prev, [eventId]: count };
    });
  }, []);

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <>
      {events.map((e) =>
        useHook === 'guests' ? (
          <GuestCounter key={e.id} eventId={e.id} onCount={report} />
        ) : (
          <TableCounter key={e.id} eventId={e.id} onCount={report} />
        ),
      )}
      {total}
    </>
  );
}

/** Calls useGuests for a single event and reports the count upward. */
function GuestCounter({
  eventId,
  onCount,
}: {
  eventId: string;
  onCount: (eventId: string, count: number) => void;
}) {
  const { data } = useGuests(eventId);
  const count = data?.length ?? 0;
  useEffect(() => {
    onCount(eventId, count);
  }, [eventId, count, onCount]);
  return null;
}

/** Calls useTables for a single event and reports the count upward. */
function TableCounter({
  eventId,
  onCount,
}: {
  eventId: string;
  onCount: (eventId: string, count: number) => void;
}) {
  const { data } = useTables(eventId);
  const count = data?.length ?? 0;
  useEffect(() => {
    onCount(eventId, count);
  }, [eventId, count, onCount]);
  return null;
}

/** Individual event card — calls useGuests and useTables at the top level. */
function EventCard({
  event,
  onDelete,
}: {
  event: Event;
  onDelete: () => void;
}) {
  const { data: guests = [] } = useGuests(event.id);
  const { data: tables = [] } = useTables(event.id);
  const active = isEventActive(event);

  return (
    <div className="dash-card">
      <div className="dash-card-cover">
        {event.cover_url ? (
          <img src={event.cover_url} alt={event.name} />
        ) : (
          <div className="dash-card-cover-placeholder" />
        )}
        <div className="dash-card-badges">
          {active ? (
            <span className="dash-badge dash-badge--active">Active</span>
          ) : (
            <span className="dash-badge dash-badge--past">Past</span>
          )}
          {event.invitation_enabled && (
            <span className="dash-badge">Invitations On</span>
          )}
        </div>
      </div>
      <div className="dash-card-body">
        <h3 className="dash-card-name">{event.name}</h3>
        <p className="dash-card-date">{formatDate(event.date)}</p>
        {event.venue && (
          <p className="dash-card-venue">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <path d="M7 12s-4-3.5-4-7a4 4 0 1 1 8 0c0 3.5-4 7-4 7z" stroke="currentColor" strokeWidth="1.3" fill="none" />
              <circle cx="7" cy="5" r="1.5" fill="currentColor" />
            </svg>
            {event.venue}
          </p>
        )}
        <div className="dash-card-meta">
          <div className="dash-card-meta-item">
            <span className="dash-card-meta-num">{guests.length}</span>
            <span className="dash-card-meta-label">Guests</span>
          </div>
          <div className="dash-card-meta-item">
            <span className="dash-card-meta-num">{tables.length}</span>
            <span className="dash-card-meta-label">Tables</span>
          </div>
        </div>
      </div>
      <div className="dash-card-actions">
        <Link to={`/e/${event.id}`} className="dash-card-btn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Manage
        </Link>
        <button className="dash-card-btn dash-card-btn--danger" onClick={onDelete}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 4h9M5 4V2.5h4V4M3.5 4l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
