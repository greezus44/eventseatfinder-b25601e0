import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import type { Event } from '@/types/event';

type SortKey = 'newest' | 'oldest' | 'name-asc' | 'name-desc';
type FilterKey = 'all' | 'active' | 'past';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
];

const FILTER_CHIPS: { value: FilterKey; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'past', label: 'Past' },
];

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
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTimestamp(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function gradientFor(name: string): string {
  const palettes = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palettes[hash % palettes.length];
}

function StatCard({ label, value, icon, accent }: { label: string; value: number | string; icon: string; accent: string }) {
  return (
    <div className="dash-stat-card">
      <div className="dash-stat-card__icon" style={{ background: accent }}>{icon}</div>
      <div className="dash-stat-card__body">
        <span className="dash-stat-card__value">{value}</span>
        <span className="dash-stat-card__label">{label}</span>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const { data: guests } = useGuests(event.id);
  const { data: tables } = useTables(event.id);
  const { toast } = useToast();
  const deleteEvent = useDeleteEvent();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const guestCount = guests?.length ?? 0;
  const tableCount = tables?.length ?? 0;
  const past = isPast(event.date);
  const cover = event.cover_url;
  const accent = event.accent_color || '#6366f1';

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEvent.mutateAsync(event.id);
      toast('Event deleted', 'success');
      setConfirmOpen(false);
    } catch {
      toast('Failed to delete event', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="dash-event-card">
      <div className="dash-event-card__cover" style={cover ? undefined : { background: gradientFor(event.name) }}>
        {cover ? (
          <img src={cover} alt={event.name} className="dash-event-card__cover-img" />
        ) : (
          <div className="dash-event-card__cover-placeholder">{event.name.charAt(0).toUpperCase()}</div>
        )}
        <span className={`dash-event-card__status ${event.invitation_enabled && !past ? 'dash-event-card__status--active' : 'dash-event-card__status--draft'}`}>
          {event.invitation_enabled && !past ? 'Invitations On' : 'Draft'}
        </span>
      </div>

      <div className="dash-event-card__body">
        <h3 className="dash-event-card__name">{event.name}</h3>
        <div className="dash-event-card__date">{formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}</div>
        {event.venue && <div className="dash-event-card__venue">📍 {event.venue}</div>}

        <div className="dash-event-card__badges">
          <span className="dash-event-card__badge">👥 {guestCount} guests</span>
          <span className="dash-event-card__badge">🪑 {tableCount} tables</span>
        </div>

        <div className="dash-event-card__updated">Updated {formatTimestamp(event.updated_at)}</div>

        <div className="dash-event-card__actions">
          <Link to={`/events/${event.id}`} className="dash-event-card__action">Overview</Link>
          <Link to={`/events/${event.id}`} className="dash-event-card__action">Guests</Link>
          <Link to={`/events/${event.id}`} className="dash-event-card__action">Seating</Link>
          <Link to={`/events/${event.id}/print/seating`} className="dash-event-card__action">Print</Link>
          <Link to={`/e/${event.slug}`} className="dash-event-card__action dash-event-card__action--accent" style={{ color: accent }}>Find Your Seat</Link>
          <Link to={`/events/${event.id}`} className="dash-event-card__action">Guest Page</Link>
        </div>

        <div className="dash-event-card__footer">
          <button
            className="dash-event-card__delete"
            onClick={() => setConfirmOpen(true)}
            aria-label={`Delete ${event.name}`}
          >
            🗑 Delete
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete event?"
        message={`This will permanently delete "${event.name}" and all its guests and tables. This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function CreateEventModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const createEvent = useCreateEvent();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setName('');
    setDate('');
    setVenue('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast('Please enter an event name', 'error');
      return;
    }
    setSaving(true);
    try {
      await createEvent.mutateAsync({
        name: name.trim(),
        slug: slugify(name.trim()) + '-' + Math.random().toString(36).slice(2, 6),
        date,
        time: '',
        venue: venue.trim(),
        invitation_enabled: false,
      });
      toast('Event created', 'success');
      reset();
      onClose();
    } catch {
      toast('Failed to create event', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create New Event">
      <form className="dash-create-form" onSubmit={handleSubmit}>
        <label className="dash-create-form__field">
          <span className="dash-create-form__label">Event name</span>
          <input
            type="text"
            className="dash-create-form__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Annual Gala 2025"
            autoFocus
          />
        </label>
        <label className="dash-create-form__field">
          <span className="dash-create-form__label">Date</span>
          <input
            type="date"
            className="dash-create-form__input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="dash-create-form__field">
          <span className="dash-create-form__label">Venue</span>
          <input
            type="text"
            className="dash-create-form__input"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Grand Ballroom, NYC"
          />
        </label>
        <div className="dash-create-form__actions">
          <button type="button" className="dash-create-form__cancel" onClick={handleClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="dash-create-form__submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="dash-empty">
      <div className="dash-empty__icon">🎉</div>
      <h2 className="dash-empty__title">No events yet</h2>
      <p className="dash-empty__subtitle">Create your first event to start planning seating and managing guests.</p>
      <button className="dash-empty__cta" onClick={onCreate}>+ Create Event</button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="dash-events-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="dash-event-card dash-event-card--skeleton" key={i}>
          <div className="dash-skeleton dash-skeleton--cover" />
          <div className="dash-event-card__body">
            <div className="dash-skeleton dash-skeleton--line dash-skeleton--line-lg" />
            <div className="dash-skeleton dash-skeleton--line dash-skeleton--line-sm" />
            <div className="dash-skeleton dash-skeleton--line dash-skeleton--line-sm" />
            <div className="dash-skeleton dash-skeleton--actions" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { data: events, isLoading } = useEvents();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = events ?? [];
    let result = list;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((ev) => ev.name.toLowerCase().includes(q));
    }

    if (filter === 'active') {
      result = result.filter((ev) => ev.invitation_enabled && !isPast(ev.date));
    } else if (filter === 'past') {
      result = result.filter((ev) => isPast(ev.date));
    }

    const sorted = [...result];
    switch (sort) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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
    const list = events ?? [];
    const totalGuests = 0; // computed per-card via hooks; stat shows event-level summary
    const active = list.filter((ev) => ev.invitation_enabled && !isPast(ev.date)).length;
    return {
      totalEvents: list.length,
      totalGuests,
      totalTables: 0,
      activeEvents: active,
    };
  }, [events]);

  const hasEvents = (events?.length ?? 0) > 0;
  const hasResults = filtered.length > 0;

  function handleCreateClick() {
    setCreateOpen(true);
  }

  return (
    <div className="dash">
      <header className="dash-header">
        <div className="dash-header__top">
          <div>
            <h1 className="dash-header__title">Your Events</h1>
            <p className="dash-header__subtitle">Manage seating, guests, and invitations all in one place.</p>
          </div>
          <button className="dash-header__create" onClick={handleCreateClick}>+ Create Event</button>
        </div>

        <div className="dash-header__controls">
          <input
            type="text"
            className="dash-header__search"
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="dash-header__sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="dash-header__chips">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.value}
                className={`dash-chip ${filter === chip.value ? 'dash-chip--active' : ''}`}
                onClick={() => setFilter(chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="dash-stats">
        <StatCard label="Total Events" value={stats.totalEvents} icon="📅" accent="#6366f1" />
        <StatCard label="Total Guests" value="—" icon="👥" accent="#ec4899" />
        <StatCard label="Total Tables" value="—" icon="🪑" accent="#14b8a6" />
        <StatCard label="Active Events" value={stats.activeEvents} icon="✨" accent="#f59e0b" />
      </section>

      <main className="dash-main">
        {isLoading ? (
          <LoadingState />
        ) : !hasEvents ? (
          <EmptyState onCreate={handleCreateClick} />
        ) : !hasResults ? (
          <div className="dash-empty dash-empty--filtered">
            <div className="dash-empty__icon">🔍</div>
            <h2 className="dash-empty__title">No matching events</h2>
            <p className="dash-empty__subtitle">Try adjusting your search or filters.</p>
            <button
              className="dash-empty__cta"
              onClick={() => { setSearch(''); setFilter('all'); setSort('newest'); }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="dash-events-grid">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>

      <CreateEventModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
