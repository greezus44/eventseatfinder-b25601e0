import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import type { Event } from '@/types/event';

const DASH_CSS = `
.dash-root {
  padding: 32px 40px 64px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 1280px;
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
  font-size: 30px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0;
  letter-spacing: -0.02em;
}
.dash-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.dash-search {
  position: relative;
}
.dash-search input {
  width: 240px;
  padding: 10px 14px 10px 38px;
  border: 1px solid #D5D5D5;
  border-radius: 10px;
  font-size: 14px;
  color: #1A1A1A;
  background: #FFFFFF;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}
.dash-search input:focus {
  border-color: #1A1A1A;
}
.dash-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8A8A8A;
  pointer-events: none;
}
.dash-select {
  padding: 10px 14px;
  border: 1px solid #D5D5D5;
  border-radius: 10px;
  font-size: 14px;
  color: #1A1A1A;
  background: #FFFFFF;
  cursor: pointer;
  outline: none;
}
.dash-create-btn {
  padding: 10px 20px;
  background: #1A1A1A;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}
.dash-create-btn:hover { background: #2A2A2A; }
.dash-chips {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
}
.dash-chip {
  padding: 7px 16px;
  border: 1px solid #D5D5D5;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  color: #4A4A4A;
  background: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s ease;
}
.dash-chip--active {
  background: #1A1A1A;
  color: #FFFFFF;
  border-color: #1A1A1A;
}
.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 36px;
}
.dash-stat {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 14px;
  padding: 20px 24px;
}
.dash-stat-label {
  font-size: 13px;
  color: #8A8A8A;
  margin: 0 0 8px 0;
  font-weight: 500;
}
.dash-stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0;
  letter-spacing: -0.02em;
}
.dash-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.dash-card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.dash-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transform: translateY(-2px);
}
.dash-card-cover {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
}
.dash-card-cover-placeholder {
  width: 100%;
  height: 140px;
  background: linear-gradient(135deg, #F8F8F8 0%, #E5E5E5 100%);
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
  color: #1A1A1A;
  margin: 0 0 8px 0;
  letter-spacing: -0.01em;
}
.dash-card-meta {
  font-size: 13px;
  color: #8A8A8A;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dash-card-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.dash-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 100px;
  background: #F8F8F8;
  color: #4A4A4A;
  border: 1px solid #E5E5E5;
}
.dash-badge--active {
  background: #1A1A1A;
  color: #FFFFFF;
  border-color: #1A1A1A;
}
.dash-card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}
.dash-card-btn {
  flex: 1;
  padding: 9px 12px;
  border: 1px solid #D5D5D5;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #1A1A1A;
  background: #FFFFFF;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition: all 0.2s ease;
}
.dash-card-btn:hover {
  background: #F8F8F8;
}
.dash-card-btn--danger {
  color: #6A6A6A;
  border-color: #D5D5D5;
}
.dash-card-btn--danger:hover {
  background: #F0F0F0;
  color: #1A1A1A;
}
.dash-skeleton {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 16px;
  overflow: hidden;
}
.dash-skeleton-cover {
  width: 100%;
  height: 140px;
  background: #F0F0F0;
  animation: dash-shimmer 1.5s infinite ease-in-out;
}
.dash-skeleton-body {
  padding: 20px;
}
.dash-skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: #F0F0F0;
  margin-bottom: 10px;
  animation: dash-shimmer 1.5s infinite ease-in-out;
}
.dash-skeleton-line:last-child { margin-bottom: 0; width: 60%; }
@keyframes dash-shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.dash-empty {
  text-align: center;
  padding: 64px 24px;
  color: #8A8A8A;
}
.dash-empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #4A4A4A;
  margin: 0 0 8px 0;
}
.dash-empty-text {
  font-size: 14px;
  margin: 0 0 20px 0;
}
.dash-modal-field {
  margin-bottom: 18px;
}
.dash-modal-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 6px;
}
.dash-modal-input {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid #D5D5D5;
  border-radius: 10px;
  font-size: 14px;
  color: #1A1A1A;
  background: #FFFFFF;
  outline: none;
  box-sizing: border-box;
}
.dash-modal-input:focus { border-color: #1A1A1A; }
.dash-modal-row {
  display: flex;
  gap: 12px;
}
.dash-modal-row > div { flex: 1; }
.dash-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.dash-modal-btn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s ease;
}
.dash-modal-btn--primary {
  background: #1A1A1A;
  color: #FFFFFF;
}
.dash-modal-btn--primary:hover { background: #2A2A2A; }
.dash-modal-btn--primary:disabled { opacity: 0.6; cursor: not-allowed; }
.dash-modal-btn--secondary {
  background: #F8F8F8;
  color: #1A1A1A;
  border: 1px solid #D5D5D5;
}
.dash-modal-btn--secondary:hover { background: #F0F0F0; }

@media (max-width: 1024px) {
  .dash-grid { grid-template-columns: repeat(2, 1fr); }
  .dash-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .dash-root { padding: 20px; }
  .dash-grid { grid-template-columns: 1fr; }
  .dash-stats { grid-template-columns: repeat(2, 1fr); }
  .dash-search input { width: 180px; }
}
`;

type SortKey = 'recent' | 'name' | 'date';
type FilterKey = 'all' | 'active' | 'past';

function isPast(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr + 'T23:59:59');
    return d.getTime() < Date.now();
  } catch {
    return false;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function EventCard({ event, onDelete }: { event: Event; onDelete: (e: Event) => void }) {
  const { data: guests } = useGuests(event.id);
  const { data: tables } = useTables(event.id);
  const past = isPast(event.date);
  const guestCount = guests?.length ?? 0;
  const tableCount = tables?.length ?? 0;

  return (
    <div className="dash-card">
      {event.cover_url ? (
        <img className="dash-card-cover" src={event.cover_url} alt={event.name} />
      ) : (
        <div className="dash-card-cover-placeholder" />
      )}
      <div className="dash-card-body">
        <h3 className="dash-card-name">{event.name}</h3>
        {event.date && (
          <p className="dash-card-meta">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="12" height="11" rx="1.5" />
              <path d="M2 6h12M5 1.5v3M11 1.5v3" strokeLinecap="round" />
            </svg>
            {formatDate(event.date)}
          </p>
        )}
        {event.venue && (
          <p className="dash-card-meta">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 14s5-4.5 5-8a5 5 0 0 0-10 0c0 3.5 5 8 5 8z" />
              <circle cx="8" cy="6" r="2" />
            </svg>
            {event.venue}
          </p>
        )}
        <div className="dash-card-badges">
          <span className={`dash-badge${past ? '' : ' dash-badge--active'}`}>
            {past ? 'Past' : 'Active'}
          </span>
          <span className="dash-badge">{guestCount} Guests</span>
          <span className="dash-badge">{tableCount} Tables</span>
          {event.invitation_enabled && <span className="dash-badge">Invitation</span>}
        </div>
        <div className="dash-card-actions">
          <Link className="dash-card-btn" to={`/events/${event.id}`}>Manage</Link>
          <button className="dash-card-btn dash-card-btn--danger" onClick={() => onDelete(event)}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="dash-skeleton">
      <div className="dash-skeleton-cover" />
      <div className="dash-skeleton-body">
        <div className="dash-skeleton-line" style={{ width: '70%' }} />
        <div className="dash-skeleton-line" style={{ width: '50%' }} />
        <div className="dash-skeleton-line" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formSlug, setFormSlug] = useState('');

  const filtered = useMemo(() => {
    if (!events) return [];
    let list = [...events];

    // Filter
    if (filter === 'active') list = list.filter((e) => !isPast(e.date));
    if (filter === 'past') list = list.filter((e) => isPast(e.date));

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.venue && e.venue.toLowerCase().includes(q)),
      );
    }

    // Sort
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'date') list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    else list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

    return list;
  }, [events, filter, search, sort]);

  const totalGuests = events?.reduce((acc) => acc + 0, 0) ?? 0; // placeholder; per-event counts need sub-queries
  const totalTables = 0;
  const activeCount = events?.filter((e) => !isPast(e.date)).length ?? 0;

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast('Event name is required', 'error');
      return;
    }
    const slug = formSlug.trim() || formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    try {
      await createEvent.mutateAsync({
        name: formName.trim(),
        slug,
        date: formDate,
        time: formTime,
        venue: formVenue.trim(),
      });
      toast('Event created!', 'success');
      setShowCreate(false);
      setFormName(''); setFormDate(''); setFormTime(''); setFormVenue(''); setFormSlug('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create event', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent.mutateAsync(deleteTarget.id);
      toast('Event deleted', 'success');
      setDeleteTarget(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete event', 'error');
    }
  };

  return (
    <>
      <style>{DASH_CSS}</style>
      <div className="dash-root">
        <div className="dash-header">
          <h1 className="dash-title">Your Events</h1>
          <div className="dash-controls">
            <div className="dash-search">
              <svg className="dash-search-icon" viewBox="0 0 18 18" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="5.5" />
                <path d="M13 13l-3-3" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search events…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="dash-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="recent">Most Recent</option>
              <option value="name">Name (A–Z)</option>
              <option value="date">Date</option>
            </select>
            <button className="dash-create-btn" onClick={() => setShowCreate(true)}>+ Create Event</button>
          </div>
        </div>

        <div className="dash-chips">
          {(['all', 'active', 'past'] as FilterKey[]).map((f) => (
            <button
              key={f}
              className={`dash-chip${filter === f ? ' dash-chip--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Past'}
            </button>
          ))}
        </div>

        <div className="dash-stats">
          <div className="dash-stat">
            <p className="dash-stat-label">Total Events</p>
            <p className="dash-stat-value">{events?.length ?? 0}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-label">Total Guests</p>
            <p className="dash-stat-value">{totalGuests}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-label">Total Tables</p>
            <p className="dash-stat-value">{totalTables}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-label">Active Events</p>
            <p className="dash-stat-value">{activeCount}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="dash-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <p className="dash-empty-title">No events yet</p>
            <p className="dash-empty-text">Create your first event to start managing seating.</p>
            <button className="dash-create-btn" onClick={() => setShowCreate(true)}>+ Create Event</button>
          </div>
        ) : (
          <div className="dash-grid">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Event">
        <div className="dash-modal-field">
          <label className="dash-modal-label">Event Name</label>
          <input className="dash-modal-input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="My Wedding" />
        </div>
        <div className="dash-modal-field">
          <label className="dash-modal-label">Slug (optional)</label>
          <input className="dash-modal-input" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="my-wedding" />
        </div>
        <div className="dash-modal-row">
          <div className="dash-modal-field">
            <label className="dash-modal-label">Date</label>
            <input className="dash-modal-input" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          </div>
          <div className="dash-modal-field">
            <label className="dash-modal-label">Time</label>
            <input className="dash-modal-input" type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
          </div>
        </div>
        <div className="dash-modal-field">
          <label className="dash-modal-label">Venue</label>
          <input className="dash-modal-input" value={formVenue} onChange={(e) => setFormVenue(e.target.value)} placeholder="Grand Ballroom" />
        </div>
        <div className="dash-modal-actions">
          <button className="dash-modal-btn dash-modal-btn--secondary" onClick={() => setShowCreate(false)}>Cancel</button>
          <button className="dash-modal-btn dash-modal-btn--primary" onClick={handleCreate} disabled={createEvent.isPending}>
            {createEvent.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
