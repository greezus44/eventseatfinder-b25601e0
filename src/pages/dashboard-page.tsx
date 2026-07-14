import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import type { Event } from '@/types/event';

const DASH_CSS = `
.dash-root { min-height: 100vh; background: #F8F8F8; font-family: 'Inter', system-ui, sans-serif; color: #1A1A1A; }

/* Header */
.dash-header {
  background: #FFFFFF; border-bottom: 1px solid #EFEFEF; padding: 20px 32px;
  position: sticky; top: 0; z-index: 100;
}
.dash-header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.dash-brand { display: flex; align-items: center; gap: 12px; }
.dash-brand-mark { width: 36px; height: 36px; border-radius: 10px; background: #1A1A1A; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; }
.dash-brand-name { font-size: 18px; font-weight: 600; color: #1A1A1A; letter-spacing: -0.01em; }
.dash-create-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 20px;
  background: #1A1A1A; color: #FFFFFF; border: 1px solid #1A1A1A; border-radius: 12px;
  font-size: 14px; font-weight: 500; cursor: pointer; transition: background 200ms ease;
  white-space: nowrap;
}
.dash-create-btn:hover { background: #333333; }
.dash-create-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Controls row */
.dash-controls { max-width: 1200px; margin: 0 auto; padding: 24px 32px 0; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.dash-page-title { font-size: 28px; font-weight: 700; color: #1A1A1A; margin: 0; flex: 1; min-width: 200px; letter-spacing: -0.02em; }
.dash-search { position: relative; flex: 0 1 320px; }
.dash-search-input {
  width: 100%; height: 44px; padding: 10px 14px 10px 40px;
  border: 1px solid #DADADA; border-radius: 12px; background: #FFFFFF;
  font-size: 14px; color: #1A1A1A; outline: none;
  transition: border-color 200ms ease, box-shadow 200ms ease;
  box-sizing: border-box;
}
.dash-search-input:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.dash-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #B0B0B0; pointer-events: none; }
.dash-sort {
  height: 44px; padding: 10px 36px 10px 14px;
  border: 1px solid #DADADA; border-radius: 12px; background: #FFFFFF;
  font-size: 14px; color: #1A1A1A; cursor: pointer; outline: none; appearance: none;
  transition: border-color 200ms ease, box-shadow 200ms ease;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%234A4A4A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 14px center;
}
.dash-sort:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }

/* Filter chips */
.dash-chips { max-width: 1200px; margin: 0 auto; padding: 16px 32px 0; display: flex; gap: 8px; }
.dash-chip {
  padding: 8px 16px; border: 1px solid #DADADA; border-radius: 12px; background: #FFFFFF;
  font-size: 13px; font-weight: 500; color: #4A4A4A; cursor: pointer;
  transition: all 200ms ease;
}
.dash-chip:hover { border-color: #4A4A4A; }
.dash-chip--active { background: #1A1A1A; color: #FFFFFF; border-color: #1A1A1A; }

/* Stat cards */
.dash-stats { max-width: 1200px; margin: 0 auto; padding: 24px 32px 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.dash-stat {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px; padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.dash-stat-label { font-size: 12px; font-weight: 600; color: #B0B0B0; text-transform: uppercase; letter-spacing: 0.05em; }
.dash-stat-value { font-size: 32px; font-weight: 700; color: #1A1A1A; margin-top: 4px; letter-spacing: -0.02em; }

/* Event grid */
.dash-grid { max-width: 1200px; margin: 0 auto; padding: 24px 32px 48px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.dash-card {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: box-shadow 200ms ease, transform 200ms ease;
  display: flex; flex-direction: column;
}
.dash-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }
.dash-card-cover { height: 140px; position: relative; overflow: hidden; }
.dash-card-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dash-card-cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #1A1A1A 0%, #4A4A4A 100%); }
.dash-card-badges { position: absolute; top: 10px; right: 10px; display: flex; gap: 6px; }
.dash-badge {
  padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.03em; text-transform: uppercase;
}
.dash-badge--active { background: #1A1A1A; color: #FFFFFF; }
.dash-badge--past { background: rgba(255,255,255,0.85); color: #4A4A4A; border: 1px solid #DADADA; }
.dash-badge--inv { background: rgba(255,255,255,0.85); color: #1A1A1A; border: 1px solid #DADADA; }
.dash-card-body { padding: 16px; flex: 1; display: flex; flex-direction: column; }
.dash-card-name { font-size: 16px; font-weight: 600; color: #1A1A1A; margin: 0 0 4px; letter-spacing: -0.01em; }
.dash-card-meta { font-size: 13px; color: #4A4A4A; margin: 0 0 4px; display: flex; align-items: center; gap: 6px; }
.dash-card-meta svg { flex-shrink: 0; }
.dash-card-stats { font-size: 12px; color: #B0B0B0; margin: 8px 0 0; }
.dash-card-actions { display: flex; gap: 8px; margin-top: 16px; }
.dash-card-btn {
  flex: 1; height: 38px; padding: 0 14px; border-radius: 10px; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 200ms ease; border: 1px solid #DADADA;
  display: inline-flex; align-items: center; justify-content: center; gap: 4px;
}
.dash-card-btn--primary { background: #1A1A1A; color: #FFFFFF; border-color: #1A1A1A; }
.dash-card-btn--primary:hover { background: #333333; }
.dash-card-btn--secondary { background: #FFFFFF; color: #1A1A1A; }
.dash-card-btn--secondary:hover { background: #EFEFEF; }
.dash-card-btn--danger { background: #FFFFFF; color: #4A4A4A; border-color: #DADADA; flex: 0 0 38px; padding: 0; }
.dash-card-btn--danger:hover { background: #EFEFEF; color: #1A1A1A; }

/* Skeleton */
.dash-skeleton {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.dash-skel-cover { height: 140px; background: #EFEFEF; animation: dash-pulse 1.5s ease-in-out infinite; }
.dash-skel-body { padding: 16px; }
.dash-skel-line { height: 14px; border-radius: 6px; background: #EFEFEF; animation: dash-pulse 1.5s ease-in-out infinite; margin-bottom: 8px; }
.dash-skel-line--title { width: 70%; height: 18px; }
.dash-skel-line--meta { width: 50%; }
.dash-skel-line--stats { width: 40%; }
.dash-skel-actions { display: flex; gap: 8px; margin-top: 16px; }
.dash-skel-btn { height: 38px; flex: 1; border-radius: 10px; background: #EFEFEF; animation: dash-pulse 1.5s ease-in-out infinite; }
@keyframes dash-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* Empty state */
.dash-empty { max-width: 1200px; margin: 0 auto; padding: 64px 32px; text-align: center; }
.dash-empty-icon { width: 64px; height: 64px; margin: 0 auto 16px; color: #DADADA; }
.dash-empty-title { font-size: 18px; font-weight: 600; color: #1A1A1A; margin: 0 0 4px; }
.dash-empty-text { font-size: 14px; color: #B0B0B0; margin: 0 0 24px; }

/* Modal form */
.dash-modal-title { font-size: 18px; font-weight: 600; color: #1A1A1A; margin: 0 0 20px; }
.dash-field { margin-bottom: 16px; }
.dash-label { display: block; font-size: 13px; font-weight: 600; color: #4A4A4A; margin-bottom: 6px; }
.dash-input, .dash-select, .dash-textarea {
  width: 100%; height: 44px; padding: 10px 14px; border: 1px solid #DADADA; border-radius: 12px;
  background: #FFFFFF; font-size: 14px; color: #1A1A1A; outline: none; box-sizing: border-box;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.dash-input:focus, .dash-select:focus, .dash-textarea:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.dash-textarea { height: auto; min-height: 80px; resize: vertical; line-height: 1.5; }
.dash-select { appearance: none; cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%234A4A4A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px;
}
.dash-row { display: flex; gap: 16px; }
.dash-row > * { flex: 1; }
.dash-modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.dash-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 44px; padding: 0 20px; border-radius: 12px; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 200ms ease; border: 1px solid transparent;
}
.dash-btn--primary { background: #1A1A1A; color: #FFFFFF; border-color: #1A1A1A; }
.dash-btn--primary:hover { background: #333333; }
.dash-btn--primary:disabled { opacity: 0.6; cursor: not-allowed; }
.dash-btn--secondary { background: #FFFFFF; color: #1A1A1A; border-color: #DADADA; }
.dash-btn--secondary:hover { background: #EFEFEF; }

/* Responsive */
@media (max-width: 1024px) {
  .dash-stats { grid-template-columns: repeat(2, 1fr); }
  .dash-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .dash-stats { grid-template-columns: 1fr; }
  .dash-grid { grid-template-columns: 1fr; }
  .dash-header, .dash-controls, .dash-chips, .dash-stats, .dash-grid { padding-left: 16px; padding-right: 16px; }
  .dash-row { flex-direction: column; }
}
`;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date not set';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function isPastEvent(event: Event): boolean {
  if (!event.date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.date + 'T00:00:00');
  return eventDate < today;
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'event';
}

export function DashboardPage() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name' | 'date'>('newest');
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', date: '', time: '', venue: '' });

  const filtered = useMemo(() => {
    if (!events) return [];
    let list = events.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.venue ?? '').toLowerCase().includes(search.toLowerCase())
    );
    if (filter === 'active') list = list.filter((e) => !isPastEvent(e));
    if (filter === 'past') list = list.filter((e) => isPastEvent(e));
    const sorted = [...list];
    if (sort === 'newest') sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (sort === 'oldest') sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'date') sorted.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
    return sorted;
  }, [events, search, sort, filter]);

  const totalGuests = useMemo(() => {
    if (!events) return 0;
    return events.reduce((sum, _e) => sum, 0); // computed per-card via hooks below
  }, [events]);
  // Note: total guests/tables are aggregated from child components; we use a simpler stat here
  const activeCount = useMemo(() => (events ?? []).filter((e) => !isPastEvent(e)).length, [events]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast('Event name is required', 'error');
      return;
    }
    try {
      await createEvent.mutateAsync({
        name: form.name.trim(),
        slug: slugify(form.name),
        date: form.date || null,
        time: form.time || null,
        venue: form.venue || null,
      });
      toast('Event created', 'success');
      setForm({ name: '', date: '', time: '', venue: '' });
      setCreateOpen(false);
    } catch (err) {
      toast('Failed to create event: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEvent.mutateAsync(deleteId);
      toast('Event deleted', 'success');
      setDeleteId(null);
    } catch (err) {
      toast('Failed to delete event: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error');
    }
  };

  const deleteTarget = events?.find((e) => e.id === deleteId);

  return (
    <div className="dash-root">
      <style>{DASH_CSS}</style>

      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-brand">
            <div className="dash-brand-mark">S</div>
            <span className="dash-brand-name">Seatly</span>
          </div>
          <button className="dash-create-btn" onClick={() => setCreateOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3v10M3 8h10" strokeLinecap="round" />
            </svg>
            Create Event
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="dash-controls">
        <h1 className="dash-page-title">Your Events</h1>
        <div className="dash-search">
          <svg className="dash-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" strokeLinecap="round" />
          </svg>
          <input
            className="dash-search-input"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="dash-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name (A–Z)</option>
          <option value="date">Date</option>
        </select>
      </div>

      {/* Filter chips */}
      <div className="dash-chips">
        {(['all', 'active', 'past'] as const).map((f) => (
          <button
            key={f}
            className={`dash-chip${filter === f ? ' dash-chip--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Past'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="dash-stats">
        <div className="dash-stat">
          <div className="dash-stat-label">Total Events</div>
          <div className="dash-stat-value">{events?.length ?? 0}</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Active Events</div>
          <div className="dash-stat-value">{activeCount}</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Past Events</div>
          <div className="dash-stat-value">{(events?.length ?? 0) - activeCount}</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Invitations On</div>
          <div className="dash-stat-value">{(events ?? []).filter((e) => e.invitation_enabled).length}</div>
        </div>
      </div>

      {/* Grid */}
      <div className="dash-grid">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="dash-skeleton">
              <div className="dash-skel-cover" />
              <div className="dash-skel-body">
                <div className="dash-skel-line dash-skel-line--title" />
                <div className="dash-skel-line dash-skel-line--meta" />
                <div className="dash-skel-line dash-skel-line--stats" />
                <div className="dash-skel-actions">
                  <div className="dash-skel-btn" />
                  <div className="dash-skel-btn" />
                  <div className="dash-skel-btn" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="dash-empty" style={{ gridColumn: '1 / -1' }}>
            <svg className="dash-empty-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="8" y="12" width="48" height="40" rx="4" />
              <path d="M8 24h48M20 36h24" strokeLinecap="round" />
            </svg>
            <div className="dash-empty-title">No events found</div>
            <p className="dash-empty-text">
              {search || filter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Create your first event to get started.'}
            </p>
            <button className="dash-create-btn" onClick={() => setCreateOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
              </svg>
              Create Event
            </button>
          </div>
        ) : (
          filtered.map((event) => <EventCard key={event.id} event={event} onDelete={(id) => setDeleteId(id)} />)
        )}
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)}>
        <h2 className="dash-modal-title">Create New Event</h2>
        <div className="dash-field">
          <label className="dash-label">Event Name</label>
          <input
            className="dash-input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Annual Gala 2024"
            autoFocus
          />
        </div>
        <div className="dash-row">
          <div className="dash-field">
            <label className="dash-label">Date</label>
            <input
              className="dash-input"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="dash-field">
            <label className="dash-label">Time</label>
            <input
              className="dash-input"
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            />
          </div>
        </div>
        <div className="dash-field">
          <label className="dash-label">Venue</label>
          <input
            className="dash-input"
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            placeholder="e.g. Grand Ballroom Hotel"
          />
        </div>
        <div className="dash-modal-actions">
          <button className="dash-btn dash-btn--secondary" onClick={() => setCreateOpen(false)}>
            Cancel
          </button>
          <button className="dash-btn dash-btn--primary" onClick={handleCreate} disabled={createEvent.isPending}>
            {createEvent.isPending ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.name ?? 'this event'}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmLabel="Delete"
      />
    </div>
  );
}

/* ── Event Card with per-card hooks ── */
function EventCard({ event, onDelete }: { event: Event; onDelete: (id: string) => void }) {
  const { data: guests } = useGuests(event.id);
  const { data: tables } = useTables(event.id);

  const past = isPastEvent(event);
  const guestCount = guests?.length ?? 0;
  const tableCount = tables?.length ?? 0;

  return (
    <div className="dash-card">
      <div className="dash-card-cover">
        {event.cover_url ? (
          <img src={event.cover_url} alt={event.name} />
        ) : (
          <div className="dash-card-cover-placeholder" />
        )}
        <div className="dash-card-badges">
          {event.invitation_enabled && <span className="dash-badge dash-badge--inv">Invitation</span>}
          {past ? (
            <span className="dash-badge dash-badge--past">Past</span>
          ) : (
            <span className="dash-badge dash-badge--active">Active</span>
          )}
        </div>
      </div>
      <div className="dash-card-body">
        <h3 className="dash-card-name">{event.name}</h3>
        <p className="dash-card-meta">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="10" height="10" rx="1.5" />
            <path d="M3 7h10M6 2v4M10 2v4" strokeLinecap="round" />
          </svg>
          {formatDate(event.date)}
          {event.time ? ` · ${event.time}` : ''}
        </p>
        {event.venue && (
          <p className="dash-card-meta">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 14s5-4.5 5-8a5 5 0 10-10 0c0 3.5 5 8 5 8z" />
              <circle cx="8" cy="6" r="2" />
            </svg>
            {event.venue}
          </p>
        )}
        <p className="dash-card-stats">{guestCount} guests · {tableCount} tables</p>
        <div className="dash-card-actions">
          <Link to={`/event/${event.id}`} style={{ flex: 1 }}>
            <button className="dash-card-btn dash-card-btn--primary">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M11 2.5l2.5 2.5L6 12.5H3.5V10L11 2.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Manage
            </button>
          </Link>
          {event.invitation_enabled && (
            <Link to={`/invitation/${event.slug}`} style={{ flex: 1 }}>
              <button className="dash-card-btn dash-card-btn--secondary">View Invite</button>
            </Link>
          )}
          <button className="dash-card-btn dash-card-btn--danger" onClick={() => onDelete(event.id)} title="Delete event">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 5h10M6 5V3h4v2M5 5l1 8h4l1-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
