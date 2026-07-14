import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import type { Event } from '@/types/event';

type FilterChip = 'all' | 'active' | 'past';
type SortOption = 'newest' | 'oldest' | 'name-az' | 'name-za';

interface CreateEventForm {
  name: string;
  date: string;
  venue: string;
}

const EMPTY_FORM: CreateEventForm = { name: '', date: '', venue: '' };

/** Format an ISO date string into a friendly readable date. */
function formatEventDate(dateStr: string, time?: string): string {
  if (!dateStr) return 'Date TBD';
  try {
    const dt = time ? new Date(`${dateStr}T${time}`) : new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return dateStr;
    const datePart = dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (time) {
      const timePart = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return `${datePart} · ${timePart}`;
    }
    return datePart;
  } catch {
    return dateStr;
  }
}

/** Format an ISO timestamp into a relative "time ago" style string. */
function formatUpdated(iso: string): string {
  if (!iso) return '';
  try {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diffMs = Date.now() - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    const diffMo = Math.floor(diffDay / 30);
    if (diffMo < 12) return `${diffMo}mo ago`;
    return `${Math.floor(diffMo / 12)}y ago`;
  } catch {
    return '';
  }
}

/** Build a deterministic gradient placeholder from an event name. */
function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 70%, 58%), hsl(${h2}, 72%, 46%))`;
}

/** Convert a name into a URL-friendly slug. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isPastEvent(event: Event): boolean {
  try {
    const dt = event.time ? new Date(`${event.date}T${event.time}`) : new Date(`${event.date}T23:59:59`);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() < Date.now();
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* EventCard — owns its own guest/table count queries per event.      */
/* ------------------------------------------------------------------ */

function EventCard({
  event,
  onDelete,
  isDeleting,
}: {
  event: Event;
  onDelete: (event: Event) => void;
  isDeleting: boolean;
}) {
  const { data: guests } = useGuests(event.id);
  const { data: tables } = useTables(event.id);

  const guestCount = guests?.length ?? 0;
  const tableCount = tables?.length ?? 0;
  const past = isPastEvent(event);

  return (
    <article className="dash-event-card">
      <div className="dash-event-card__cover">
        {event.cover_url ? (
          <img src={event.cover_url} alt="" className="dash-event-card__img" loading="lazy" />
        ) : (
          <div className="dash-event-card__placeholder" style={{ background: gradientFor(event.name) }}>
            <span className="dash-event-card__placeholder-text">{event.name.charAt(0) || 'S'}</span>
          </div>
        )}
        <span className={`dash-event-card__status ${event.invitation_enabled ? 'dash-event-card__status--on' : 'dash-event-card__status--draft'}`}>
          {event.invitation_enabled ? 'Invitations On' : 'Draft'}
        </span>
      </div>

      <div className="dash-event-card__body">
        <h3 className="dash-event-card__name">{event.name}</h3>
        <p className="dash-event-card__date">{formatEventDate(event.date, event.time)}</p>
        {event.venue && <p className="dash-event-card__venue">📍 {event.venue}</p>}

        <div className="dash-event-card__badges">
          <span className="dash-badge dash-badge--guests">👥 {guestCount} guests</span>
          <span className="dash-badge dash-badge--tables">🪑 {tableCount} tables</span>
          {past && <span className="dash-badge dash-badge--past">Past</span>}
        </div>

        <p className="dash-event-card__updated">Updated {formatUpdated(event.updated_at)}</p>

        <div className="dash-event-card__actions">
          <Link to={`/events/${event.id}`} className="dash-action-btn">Overview</Link>
          <Link to={`/events/${event.id}`} className="dash-action-btn">Guests</Link>
          <Link to={`/events/${event.id}`} className="dash-action-btn">Seating</Link>
          <Link to={`/events/${event.id}/print/seating`} className="dash-action-btn">Print</Link>
          <Link to={`/e/${event.slug}`} className="dash-action-btn dash-action-btn--accent">Find Your Seat</Link>
          <Link to={`/events/${event.id}`} className="dash-action-btn">Guest Page</Link>
        </div>

        <button
          type="button"
          className="dash-event-card__delete"
          onClick={() => onDelete(event)}
          disabled={isDeleting}
          aria-label={`Delete ${event.name}`}
        >
          {isDeleting ? 'Deleting…' : '🗑 Delete'}
        </button>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* StatCard                                                            */
/* ------------------------------------------------------------------ */

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="dash-stat-card">
      <span className="dash-stat-card__icon">{icon}</span>
      <div className="dash-stat-card__info">
        <span className="dash-stat-card__value">{value}</span>
        <span className="dash-stat-card__label">{label}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DashboardPage                                                       */
/* ------------------------------------------------------------------ */

export function DashboardPage() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [filter, setFilter] = useState<FilterChip>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateEventForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

  const filteredEvents = useMemo(() => {
    const list = events ?? [];

    const searched = search.trim()
      ? list.filter((e) => e.name.toLowerCase().includes(search.trim().toLowerCase()))
      : list;

    const filtered = searched.filter((e) => {
      if (filter === 'active') return e.invitation_enabled && !isPastEvent(e);
      if (filter === 'past') return isPastEvent(e);
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name-az':
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        case 'name-za':
          return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
        default:
          return 0;
      }
    });

    return sorted;
  }, [events, search, sort, filter]);

  const stats = useMemo(() => {
    const list = events ?? [];
    const totalGuests = 0; // aggregate handled per-card; stat reflects events-level count placeholder
    const totalTables = 0;
    return {
      totalEvents: list.length,
      totalGuests,
      totalTables,
      activeEvents: list.filter((e) => e.invitation_enabled && !isPastEvent(e)).length,
    };
  }, [events]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Event name is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createEvent.mutateAsync({
        name: form.name.trim(),
        slug: slugify(form.name),
        date: form.date || new Date().toISOString().slice(0, 10),
        time: '',
        venue: form.venue.trim(),
        invitation_enabled: false,
      });
      toast('Event created', 'success');
      setForm(EMPTY_FORM);
      setCreateOpen(false);
    } catch {
      toast('Failed to create event', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEvent.mutateAsync(deleteTarget.id);
      toast('Event deleted', 'success');
    } catch {
      toast('Failed to delete event', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  const filterChips: { key: FilterChip; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'past', label: 'Past' },
  ];

  return (
    <div className="dash-page">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header__top">
          <h1 className="dash-header__title">Your Events</h1>
          <button type="button" className="dash-create-btn" onClick={() => setCreateOpen(true)}>
            + Create Event
          </button>
        </div>

        <div className="dash-header__controls">
          <input
            type="search"
            className="dash-search"
            placeholder="Search events by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search events"
          />

          <select
            className="dash-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Sort events"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name-az">Name A-Z</option>
            <option value="name-za">Name Z-A</option>
          </select>

          <div className="dash-filter-chips" role="tablist" aria-label="Filter events">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                role="tab"
                aria-selected={filter === chip.key}
                className={`dash-chip ${filter === chip.key ? 'dash-chip--active' : ''}`}
                onClick={() => setFilter(chip.key)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Stat cards */}
      <section className="dash-stats" aria-label="Event statistics">
        <StatCard icon="🎉" label="Total Events" value={stats.totalEvents} />
        <StatCard icon="👥" label="Total Guests" value={stats.totalGuests} />
        <StatCard icon="🪑" label="Total Tables" value={stats.totalTables} />
        <StatCard icon="✅" label="Active Events" value={stats.activeEvents} />
      </section>

      {/* Main content */}
      <section className="dash-content">
        {isLoading ? (
          <div className="dash-loading">
            <div className="dash-spinner" aria-hidden="true" />
            <p>Loading your events…</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="dash-empty">
            <span className="dash-empty__icon">🎉</span>
            <h2 className="dash-empty__title">No events yet</h2>
            <p className="dash-empty__text">
              {search || filter !== 'all'
                ? 'No events match your filters. Try adjusting your search or filters.'
                : 'Create your first event to get started with seating.'}
            </p>
            <button type="button" className="dash-create-btn" onClick={() => setCreateOpen(true)}>
              + Create Event
            </button>
          </div>
        ) : (
          <div className="dash-grid">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDelete={setDeleteTarget}
                isDeleting={deleteEvent.isPending && deleteTarget?.id === event.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Create Event Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Event">
        <form className="dash-create-form" onSubmit={handleCreate}>
          <label className="dash-field">
            <span className="dash-field__label">Event Name</span>
            <input
              type="text"
              className="dash-field__input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Annual Gala 2025"
              autoFocus
              required
            />
          </label>

          <label className="dash-field">
            <span className="dash-field__label">Date</span>
            <input
              type="date"
              className="dash-field__input"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </label>

          <label className="dash-field">
            <span className="dash-field__label">Venue</span>
            <input
              type="text"
              className="dash-field__input"
              value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              placeholder="e.g. Grand Ballroom, NYC"
            />
          </label>

          <div className="dash-create-form__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="dash-create-btn" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
