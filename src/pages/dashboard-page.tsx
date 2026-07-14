import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import type { Event } from '@/types/event';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type SortKey = 'newest' | 'oldest' | 'name-asc' | 'name-desc';
type FilterKey = 'all' | 'active' | 'past';

function isPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return d.getTime() < today.getTime();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBD';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTimestamp(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function gradientFor(event: Event): string {
  const accent = event.accent_color || '#6366f1';
  return `linear-gradient(135deg, ${accent} 0%, ${accent}cc 40%, #1e1b4b 100%)`;
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  accent: string;
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="dash-stat-card">
      <div className="dash-stat-card__icon" style={{ background: accent }}>
        {icon}
      </div>
      <div className="dash-stat-card__body">
        <span className="dash-stat-card__value">{value}</span>
        <span className="dash-stat-card__label">{label}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Event card                                                         */
/* ------------------------------------------------------------------ */

interface EventCardProps {
  event: Event;
  onDelete: (event: Event) => void;
}

function EventCard({ event, onDelete }: EventCardProps) {
  const { data: guests } = useGuests(event.id);
  const { data: tables } = useTables(event.id);

  const guestCount = guests?.length ?? 0;
  const tableCount = tables?.length ?? 0;
  const past = isPast(event.date);

  return (
    <article className="dash-event-card">
      <div
        className="dash-event-card__cover"
        style={
          event.cover_url
            ? { backgroundImage: `url(${event.cover_url})` }
            : { background: gradientFor(event) }
        }
      >
        <span
          className={`dash-event-card__status ${
            event.invitation_enabled && !past
              ? 'dash-event-card__status--active'
              : 'dash-event-card__status--draft'
          }`}
        >
          {event.invitation_enabled && !past ? 'Invitations On' : 'Draft'}
        </span>
      </div>

      <div className="dash-event-card__content">
        <h3 className="dash-event-card__title">{event.name}</h3>

        <div className="dash-event-card__meta">
          <span className="dash-event-card__date">
            📅 {formatDate(event.date)}
            {event.time ? ` · ${event.time}` : ''}
          </span>
          <span className="dash-event-card__venue">
            📍 {event.venue || 'Venue TBD'}
          </span>
        </div>

        <div className="dash-event-card__badges">
          <span className="dash-badge dash-badge--guests">
            👥 {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
          </span>
          <span className="dash-badge dash-badge--tables">
            🪑 {tableCount} {tableCount === 1 ? 'Table' : 'Tables'}
          </span>
        </div>

        <p className="dash-event-card__updated">
          Updated {formatTimestamp(event.updated_at)}
        </p>

        <div className="dash-event-card__actions">
          <Link
            to={`/events/${event.id}/settings`}
            className="dash-action-btn dash-action-btn--edit"
            title="Edit event settings"
          >
            ✏️ Edit
          </Link>
          <Link
            to={`/events/${event.id}/guests`}
            className="dash-action-btn"
            title="Manage guests"
          >
            👤 Guests
          </Link>
          <Link
            to={`/events/${event.id}/seating`}
            className="dash-action-btn"
            title="Arrange seating"
          >
            🪑 Seating
          </Link>
          <Link
            to={`/events/${event.id}`}
            className="dash-action-btn"
            title="Event overview"
          >
            📋 Overview
          </Link>
          <Link
            to={`/events/${event.id}/check-in`}
            className="dash-action-btn"
            title="Guest check-in"
          >
            ✅ Check-in
          </Link>
          <Link
            to={`/events/${event.id}/analytics`}
            className="dash-action-btn"
            title="Event analytics"
          >
            📊 Analytics
          </Link>
          <Link
            to={`/events/${event.id}/print/seating`}
            className="dash-action-btn"
            title="Print seating chart"
          >
            🖨️ Print
          </Link>
          <Link
            to={`/e/${event.slug}`}
            className="dash-action-btn"
            title="Public find-your-seat page"
          >
            🎯 Find Your Seat
          </Link>
          <Link
            to={`/events/${event.id}/guest-page`}
            className="dash-action-btn"
            title="Guest page editor"
          >
            🌐 Guest Page
          </Link>
        </div>

        <div className="dash-event-card__footer">
          <button
            className="dash-delete-btn"
            onClick={() => onDelete(event)}
            title="Delete event"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Create event modal                                                 */
/* ------------------------------------------------------------------ */

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateEventModal({ open, onClose }: CreateEventModalProps) {
  const { toast } = useToast();
  const createEvent = useCreateEvent();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName('');
    setDate('');
    setVenue('');
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date.trim()) {
      toast('Please provide an event name and date.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createEvent.mutateAsync({
        name: name.trim(),
        slug: slugify(name) || `event-${Date.now()}`,
        date: date.trim(),
        time: '',
        venue: venue.trim(),
        invitation_enabled: false,
      });
      toast('Event created successfully!', 'success');
      handleClose();
    } catch {
      toast('Failed to create event. Please try again.', 'error');
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create New Event">
      <form className="dash-create-form" onSubmit={handleSubmit}>
        <label className="dash-create-form__field">
          <span className="dash-create-form__label">Event Name</span>
          <input
            type="text"
            className="dash-create-form__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Annual Gala Dinner"
            autoFocus
            required
          />
        </label>

        <label className="dash-create-form__field">
          <span className="dash-create-form__label">Date</span>
          <input
            type="date"
            className="dash-create-form__input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label className="dash-create-form__field">
          <span className="dash-create-form__label">Venue</span>
          <input
            type="text"
            className="dash-create-form__input"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. The Grand Ballroom"
          />
        </label>

        <div className="dash-create-form__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard page                                                     */
/* ------------------------------------------------------------------ */

export function DashboardPage() {
  const { data: events, isLoading } = useEvents();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    if (!events) return [];
    const q = search.trim().toLowerCase();
    let list = events.filter((ev) =>
      q ? ev.name.toLowerCase().includes(q) : true,
    );

    if (filter === 'active') {
      list = list.filter((ev) => ev.invitation_enabled && !isPast(ev.date));
    } else if (filter === 'past') {
      list = list.filter((ev) => isPast(ev.date));
    }

    const sorted = [...list];
    switch (sort) {
      case 'newest':
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case 'oldest':
        sorted.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
    return sorted;
  }, [events, search, sort, filter]);

  const stats = useMemo(() => {
    const all = events ?? [];
    return {
      total: all.length,
      guests: 0, // computed per-card; left as 0 placeholder at list level
      tables: 0,
      active: all.filter((ev) => ev.invitation_enabled && !isPast(ev.date))
        .length,
    };
  }, [events]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEvent.mutateAsync(deleteTarget.id);
      toast('Event deleted.', 'success');
      setDeleteTarget(null);
    } catch {
      toast('Failed to delete event.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="dash">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header__top">
          <div className="dash-header__heading">
            <h1 className="dash-header__title">Your Events</h1>
            <p className="dash-header__subtitle">
              Manage your seating arrangements, guests, and check-ins.
            </p>
          </div>
          <button
            className="btn btn--primary dash-header__create"
            onClick={() => setCreateOpen(true)}
          >
            ＋ Create Event
          </button>
        </div>

        <div className="dash-header__controls">
          <div className="dash-header__search">
            <span className="dash-header__search-icon">🔍</span>
            <input
              type="text"
              className="dash-header__search-input"
              placeholder="Search events by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="dash-header__sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
        </div>

        <div className="dash-header__filters">
          {(['all', 'active', 'past'] as FilterKey[]).map((key) => (
            <button
              key={key}
              className={`dash-chip ${filter === key ? 'dash-chip--active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {key === 'all' ? 'All' : key === 'active' ? 'Active' : 'Past'}
            </button>
          ))}
        </div>
      </header>

      {/* Stats */}
      <section className="dash-stats">
        <StatCard
          label="Total Events"
          value={stats.total}
          icon="🎉"
          accent="#6366f1"
        />
        <StatCard
          label="Total Guests"
          value="—"
          icon="👥"
          accent="#10b981"
        />
        <StatCard
          label="Total Tables"
          value="—"
          icon="🪑"
          accent="#f59e0b"
        />
        <StatCard
          label="Active Events"
          value={stats.active}
          icon="✨"
          accent="#ec4899"
        />
      </section>

      {/* Body */}
      <section className="dash-body">
        {isLoading ? (
          <div className="dash-loading">
            <div className="dash-loading__spinner" />
            <p>Loading your events…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty__icon">🎈</div>
            <h2 className="dash-empty__title">No events yet</h2>
            <p className="dash-empty__text">
              {search || filter !== 'all'
                ? 'No events match your filters. Try adjusting your search.'
                : 'Create your first event to start arranging seating and inviting guests.'}
            </p>
            {!search && filter === 'all' && (
              <button
                className="btn btn--primary"
                onClick={() => setCreateOpen(true)}
              >
                ＋ Create Event
              </button>
            )}
          </div>
        ) : (
          <div className="dash-events-grid">
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDelete={(ev) => setDeleteTarget(ev)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Create modal */}
      <CreateEventModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Event"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleConfirmDelete}
        onCancel={() => (deleting ? undefined : setDeleteTarget(null))}
      />
    </div>
  );
}
