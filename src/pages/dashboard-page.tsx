import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import type { Event } from '@/types/event';

type SortKey = 'newest' | 'oldest' | 'name';
type FilterKey = 'all' | 'active' | 'past';

export function DashboardPage() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', date: '', venue: '' });

  const isPast = (e: Event) => {
    if (!e.date) return false;
    return new Date(e.date + 'T23:59:59') < new Date();
  };

  const filtered = useMemo(() => {
    if (!events) return [];
    let list = [...events];

    // Filter
    if (filter === 'active') list = list.filter((e) => !isPast(e));
    else if (filter === 'past') list = list.filter((e) => isPast(e));

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.venue ?? '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortKey === 'newest') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortKey === 'oldest') {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortKey === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [events, filter, search, sortKey]);

  const totalGuests = useMemo(() => {
    if (!events) return 0;
    return events.reduce((acc, _e) => acc, 0);
  }, [events]);

  const totalTables = useMemo(() => {
    if (!events) return 0;
    return events.reduce((acc, _e) => acc, 0);
  }, [events]);

  const activeEvents = useMemo(() => {
    if (!events) return 0;
    return events.filter((e) => !isPast(e)).length;
  }, [events]);

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    const slug = createForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4);
    try {
      await createEvent.mutateAsync({
        name: createForm.name.trim(),
        slug,
        date: createForm.date || null,
        venue: createForm.venue.trim() || null,
      });
      setCreateForm({ name: '', date: '', venue: '' });
      setCreateOpen(false);
      toast('Event created', 'success');
    } catch {
      toast('Failed to create event', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent.mutateAsync(deleteTarget.id);
      toast('Event deleted', 'success');
      setDeleteTarget(null);
    } catch {
      toast('Failed to delete event', 'error');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date TBD';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <style>{DASH_CSS}</style>
      <div className="dash-root">
        {/* Header */}
        <header className="dash-header">
          <div className="dash-header-top">
            <h1 className="dash-page-title">Your Events</h1>
            <button className="dash-create-btn" onClick={() => setCreateOpen(true)}>
              + Create Event
            </button>
          </div>
          <div className="dash-toolbar">
            <div className="dash-search-wrap">
              <svg className="dash-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="M15 15l-3-3" strokeLinecap="round" />
              </svg>
              <input
                className="dash-search"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="dash-sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
          <div className="dash-filters">
            {(['all', 'active', 'past'] as FilterKey[]).map((key) => (
              <button
                key={key}
                className={`dash-chip${filter === key ? ' dash-chip--active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {key === 'all' ? 'All' : key === 'active' ? 'Active' : 'Past'}
              </button>
            ))}
          </div>
        </header>

        {/* Stat Cards */}
        <div className="dash-stats">
          <StatCard label="Total Events" value={events?.length ?? 0} />
          <StatCard label="Total Guests" value={totalGuests} />
          <StatCard label="Total Tables" value={totalTables} />
          <StatCard label="Active Events" value={activeEvents} />
        </div>

        {/* Event Cards */}
        {isLoading ? (
          <div className="dash-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="dash-skeleton-card">
                <div className="dash-skeleton-cover" />
                <div className="dash-skeleton-body">
                  <div className="dash-skeleton-line dash-skeleton-line--lg" />
                  <div className="dash-skeleton-line" />
                  <div className="dash-skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <p className="dash-empty-title">No events found</p>
            <p className="dash-empty-hint">
              {search || filter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Create your first event to get started.'}
            </p>
            {!search && filter === 'all' && (
              <button className="dash-create-btn" onClick={() => setCreateOpen(true)}>
                + Create Event
              </button>
            )}
          </div>
        ) : (
          <div className="dash-grid">
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDelete={() => setDeleteTarget(event)}
                formatDate={formatDate}
                isPast={isPast(event)}
              />
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} width={480}>
          <h2 className="dash-modal-title">Create New Event</h2>
          <div className="dash-modal-form">
            <div className="dash-modal-field">
              <label className="dash-modal-label">Event Name</label>
              <input
                className="dash-modal-input"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Sarah & John's Wedding"
                autoFocus
              />
            </div>
            <div className="dash-modal-field">
              <label className="dash-modal-label">Date</label>
              <input
                type="date"
                className="dash-modal-input"
                value={createForm.date}
                onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="dash-modal-field">
              <label className="dash-modal-label">Venue</label>
              <input
                className="dash-modal-input"
                value={createForm.venue}
                onChange={(e) => setCreateForm((p) => ({ ...p, venue: e.target.value }))}
                placeholder="e.g. Grand Ballroom Hotel"
              />
            </div>
          </div>
          <div className="dash-modal-actions">
            <button className="dash-ghost-btn" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button
              className="dash-primary-btn"
              onClick={handleCreate}
              disabled={createEvent.isPending || !createForm.name.trim()}
            >
              {createEvent.isPending ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Event"
          message={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This will permanently remove all guests, tables, and settings.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="dash-stat-card">
      <span className="dash-stat-value">{value}</span>
      <span className="dash-stat-label">{label}</span>
    </div>
  );
}

function EventCard({
  event,
  onDelete,
  formatDate,
  isPast,
}: {
  event: Event;
  onDelete: () => void;
  formatDate: (d: string | null) => string;
  isPast: boolean;
}) {
  const { data: guests } = useGuests(event.id);
  const { data: tables } = useTables(event.id);

  const guestCount = guests?.length ?? 0;
  const tableCount = tables?.length ?? 0;
  const assignedCount = guests?.filter((g) => g.table_id).length ?? 0;

  return (
    <div className="dash-card">
      <Link to={`/events/${event.id}`} className="dash-card-cover-link">
        {event.cover_url ? (
          <img src={event.cover_url} alt={event.name} className="dash-card-cover" />
        ) : (
          <div className="dash-card-cover dash-card-cover--placeholder">
            <span className="dash-card-monogram">{event.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        {isPast && <span className="dash-card-badge dash-card-badge--past">Past</span>}
        {!isPast && <span className="dash-card-badge dash-card-badge--active">Active</span>}
      </Link>
      <div className="dash-card-body">
        <Link to={`/events/${event.id}`} className="dash-card-title-link">
          <h3 className="dash-card-title">{event.name}</h3>
        </Link>
        <p className="dash-card-date">{formatDate(event.date)}</p>
        {event.venue && <p className="dash-card-venue">{event.venue}</p>}
        <div className="dash-card-stats">
          <span className="dash-card-stat">{guestCount} guests</span>
          <span className="dash-card-stat">{tableCount} tables</span>
          <span className="dash-card-stat">{assignedCount} seated</span>
        </div>
        <div className="dash-card-actions">
          <Link to={`/events/${event.id}`} className="dash-card-btn dash-card-btn--primary">
            Manage
          </Link>
          <Link to={`/e/${event.slug}`} target="_blank" className="dash-card-btn">
            Guest Page
          </Link>
          <button className="dash-card-btn dash-card-btn--danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const DASH_CSS = `
.dash-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1A1A1A;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

/* Header */
.dash-header {
  margin-bottom: 32px;
}

.dash-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.dash-page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #1A1A1A;
}

.dash-create-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: #1A1A1A;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
  white-space: nowrap;
}

.dash-create-btn:hover {
  background: #4A4A4A;
}

.dash-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.dash-search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.dash-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #4A4A4A;
  pointer-events: none;
}

.dash-search {
  width: 100%;
  padding: 10px 14px 10px 40px;
  border: 1px solid #DADADA;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #1A1A1A;
  background: #FFFFFF;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.dash-search:focus {
  border-color: #1A1A1A;
  box-shadow: 0 0 0 3px rgba(26,26,26,0.06);
}

.dash-sort {
  padding: 10px 14px;
  border: 1px solid #DADADA;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #1A1A1A;
  background: #FFFFFF;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.dash-sort:focus {
  border-color: #1A1A1A;
}

.dash-filters {
  display: flex;
  gap: 8px;
}

.dash-chip {
  padding: 6px 16px;
  border: 1px solid #DADADA;
  border-radius: 20px;
  background: #FFFFFF;
  color: #4A4A4A;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.dash-chip:hover {
  border-color: #4A4A4A;
  color: #1A1A1A;
}

.dash-chip--active {
  background: #1A1A1A;
  color: #FFFFFF;
  border-color: #1A1A1A;
}

/* Stats */
.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}

.dash-stat-card {
  background: #FFFFFF;
  border: 1px solid #EFEFEF;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dash-stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1A1A1A;
  line-height: 1;
}

.dash-stat-label {
  font-size: 13px;
  color: #4A4A4A;
  font-weight: 500;
}

/* Grid */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* Event Card */
.dash-card {
  border: 1px solid #EFEFEF;
  border-radius: 12px;
  overflow: hidden;
  background: #FFFFFF;
  transition: border-color 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
}

.dash-card:hover {
  border-color: #DADADA;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

.dash-card-cover-link {
  display: block;
  position: relative;
  height: 160px;
  overflow: hidden;
  text-decoration: none;
}

.dash-card-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.dash-card-cover--placeholder {
  background: linear-gradient(135deg, #F8F8F8 0%, #EFEFEF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dash-card-monogram {
  font-size: 48px;
  font-weight: 700;
  color: #DADADA;
}

.dash-card-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dash-card-badge--active {
  background: #1A1A1A;
  color: #FFFFFF;
}

.dash-card-badge--past {
  background: #EFEFEF;
  color: #4A4A4A;
  border: 1px solid #DADADA;
}

.dash-card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.dash-card-title-link {
  text-decoration: none;
}

.dash-card-title {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #1A1A1A;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dash-card-title-link:hover .dash-card-title {
  text-decoration: underline;
}

.dash-card-date {
  font-size: 13px;
  color: #4A4A4A;
  margin: 0;
}

.dash-card-venue {
  font-size: 13px;
  color: #4A4A4A;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dash-card-stats {
  display: flex;
  gap: 12px;
  margin: 8px 0;
  flex-wrap: wrap;
}

.dash-card-stat {
  font-size: 12px;
  color: #4A4A4A;
  background: #F8F8F8;
  padding: 3px 8px;
  border-radius: 4px;
}

.dash-card-actions {
  display: flex;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
}

.dash-card-btn {
  padding: 6px 14px;
  border: 1px solid #DADADA;
  border-radius: 6px;
  background: #FFFFFF;
  color: #4A4A4A;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
  transition: all 0.15s;
  white-space: nowrap;
}

.dash-card-btn:hover {
  border-color: #1A1A1A;
  color: #1A1A1A;
}

.dash-card-btn--primary {
  background: #1A1A1A;
  color: #FFFFFF;
  border-color: #1A1A1A;
}

.dash-card-btn--primary:hover {
  background: #4A4A4A;
  color: #FFFFFF;
}

.dash-card-btn--danger:hover {
  background: #1A1A1A;
  color: #FFFFFF;
  border-color: #1A1A1A;
}

/* Skeleton */
.dash-skeleton-card {
  border: 1px solid #EFEFEF;
  border-radius: 12px;
  overflow: hidden;
  background: #FFFFFF;
}

.dash-skeleton-cover {
  height: 160px;
  background: linear-gradient(90deg, #F8F8F8 25%, #EFEFEF 50%, #F8F8F8 75%);
  background-size: 200% 100%;
  animation: dash-shimmer 1.5s infinite;
}

.dash-skeleton-body {
  padding: 16px;
}

.dash-skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: #EFEFEF;
  margin-bottom: 8px;
  animation: dash-shimmer 1.5s infinite;
}

.dash-skeleton-line--lg {
  height: 18px;
  width: 70%;
}

@keyframes dash-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty */
.dash-empty {
  text-align: center;
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.dash-empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
  margin: 0;
}

.dash-empty-hint {
  font-size: 14px;
  color: #4A4A4A;
  margin: 0;
}

/* Modal */
.dash-modal-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #1A1A1A;
}

.dash-modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dash-modal-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dash-modal-label {
  font-size: 13px;
  font-weight: 500;
  color: #4A4A4A;
}

.dash-modal-input {
  padding: 10px 14px;
  border: 1px solid #DADADA;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #1A1A1A;
  background: #FFFFFF;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.dash-modal-input:focus {
  border-color: #1A1A1A;
  box-shadow: 0 0 0 3px rgba(26,26,26,0.06);
}

.dash-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.dash-ghost-btn {
  padding: 10px 20px;
  border: 1px solid #DADADA;
  border-radius: 8px;
  background: #FFFFFF;
  color: #4A4A4A;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.dash-ghost-btn:hover {
  border-color: #1A1A1A;
  color: #1A1A1A;
}

.dash-primary-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: #1A1A1A;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.dash-primary-btn:hover:not(:disabled) {
  background: #4A4A4A;
}

.dash-primary-btn:disabled {
  background: #DADADA;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .dash-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .dash-grid {
    grid-template-columns: 1fr;
  }
  .dash-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
`;
