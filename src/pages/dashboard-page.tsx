import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import type { Event } from '@/types/event';

const DASH_CSS = `
.dash-root { min-height: 100vh; background: #F8F8F8; font-family: 'Inter', sans-serif; padding: 32px; }
.dash-container { max-width: 1200px; margin: 0 auto; }
.dash-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.dash-title { font-size: 28px; font-weight: 700; color: #1A1A1A; margin: 0; }
.dash-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.dash-create-btn { display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 20px; border-radius: 12px; background: #1A1A1A; color: #FFFFFF; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 200ms ease; white-space: nowrap; }
.dash-create-btn:hover { background: #333333; }
.dash-create-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.dash-controls { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.dash-search { flex: 1; min-width: 200px; position: relative; }
.dash-search input { width: 100%; height: 44px; padding: 10px 14px 10px 40px; border: 1px solid #DADADA; border-radius: 12px; background: #FFFFFF; font-size: 14px; color: #1A1A1A; outline: none; transition: border-color 200ms ease, box-shadow 200ms ease; box-sizing: border-box; }
.dash-search input:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.dash-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #B0B0B0; pointer-events: none; display: flex; }
.dash-sort { height: 44px; padding: 10px 36px 10px 14px; border: 1px solid #DADADA; border-radius: 12px; background: #FFFFFF; font-size: 14px; color: #1A1A1A; outline: none; cursor: pointer; appearance: none; transition: border-color 200ms ease, box-shadow 200ms ease; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%234A4A4A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; }
.dash-sort:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }

.dash-chips { display: flex; gap: 8px; margin-bottom: 28px; flex-wrap: wrap; }
.dash-chip { padding: 8px 16px; border-radius: 12px; border: 1px solid #DADADA; background: #FFFFFF; font-size: 13px; font-weight: 500; color: #4A4A4A; cursor: pointer; transition: all 200ms ease; }
.dash-chip:hover { background: #EFEFEF; }
.dash-chip--active { background: #1A1A1A; color: #FFFFFF; border-color: #1A1A1A; }

.dash-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
.dash-stat { background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.dash-stat-label { font-size: 12px; font-weight: 600; color: #B0B0B0; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.dash-stat-value { font-size: 28px; font-weight: 700; color: #1A1A1A; }

.dash-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.dash-card { background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: box-shadow 200ms ease, transform 200ms ease; display: flex; flex-direction: column; }
.dash-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }
.dash-card-cover { height: 160px; position: relative; overflow: hidden; }
.dash-card-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dash-card-cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #1A1A1A 0%, #4A4A4A 100%); display: flex; align-items: center; justify-content: center; }
.dash-card-cover-placeholder span { font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.05em; }
.dash-card-body { padding: 20px; flex: 1; display: flex; flex-direction: column; }
.dash-card-name { font-size: 18px; font-weight: 600; color: #1A1A1A; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dash-card-date { font-size: 13px; color: #4A4A4A; margin-bottom: 4px; }
.dash-card-venue { font-size: 13px; color: #B0B0B0; margin-bottom: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dash-card-badges { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
.dash-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.03em; }
.dash-badge--guests { background: #EFEFEF; color: #1A1A1A; }
.dash-badge--tables { background: #F8F8F8; color: #4A4A4A; border: 1px solid #EFEFEF; }
.dash-badge--active { background: #1A1A1A; color: #FFFFFF; }
.dash-badge--past { background: #FFFFFF; color: #B0B0B0; border: 1px solid #DADADA; }
.dash-card-actions { display: flex; gap: 8px; margin-top: auto; }
.dash-card-btn { flex: 1; height: 40px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 200ms ease; display: inline-flex; align-items: center; justify-content: center; gap: 4px; border: 1px solid transparent; }
.dash-card-btn--primary { background: #1A1A1A; color: #FFFFFF; }
.dash-card-btn--primary:hover { background: #333333; }
.dash-card-btn--secondary { background: #FFFFFF; color: #1A1A1A; border-color: #DADADA; }
.dash-card-btn--secondary:hover { background: #EFEFEF; }
.dash-card-btn--danger { background: #FFFFFF; color: #C0392B; border-color: #E5A29B; flex: 0 0 40px; padding: 0; }
.dash-card-btn--danger:hover { background: #FDF2F1; }

.dash-skeleton-card { background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.dash-skeleton-cover { height: 160px; background: #EFEFEF; animation: dash-shimmer 1.5s infinite ease-in-out; }
.dash-skeleton-body { padding: 20px; }
.dash-skeleton-line { height: 14px; border-radius: 6px; background: #EFEFEF; margin-bottom: 10px; animation: dash-shimmer 1.5s infinite ease-in-out; }
.dash-skeleton-line:last-child { width: 60%; }
@keyframes dash-shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.dash-empty { text-align: center; padding: 64px 32px; background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px; }
.dash-empty-icon { margin-bottom: 16px; }
.dash-empty-title { font-size: 18px; font-weight: 600; color: #1A1A1A; margin-bottom: 8px; }
.dash-empty-text { font-size: 14px; color: #B0B0B0; margin-bottom: 24px; }

.dash-modal-field { margin-bottom: 16px; }
.dash-modal-label { display: block; font-size: 13px; font-weight: 600; color: #4A4A4A; margin-bottom: 6px; }
.dash-modal-input { width: 100%; height: 44px; padding: 10px 14px; border: 1px solid #DADADA; border-radius: 12px; background: #FFFFFF; font-size: 14px; color: #1A1A1A; outline: none; transition: border-color 200ms ease, box-shadow 200ms ease; box-sizing: border-box; }
.dash-modal-input:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.dash-modal-row { display: flex; gap: 16px; }
.dash-modal-row > * { flex: 1; }
.dash-modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
.dash-modal-btn { height: 44px; padding: 0 20px; border-radius: 12px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 200ms ease; border: none; }
.dash-modal-btn--primary { background: #1A1A1A; color: #FFFFFF; }
.dash-modal-btn--primary:hover { background: #333333; }
.dash-modal-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
.dash-modal-btn--secondary { background: #FFFFFF; color: #1A1A1A; border: 1px solid #DADADA; }
.dash-modal-btn--secondary:hover { background: #EFEFEF; }
.dash-modal-title { font-size: 20px; font-weight: 600; color: #1A1A1A; margin: 0 0 20px; }

.dash-spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #FFFFFF; border-radius: 50%; animation: dash-spin 0.6s linear infinite; display: inline-block; }
@keyframes dash-spin { to { transform: rotate(360deg); } }

@media (max-width: 1024px) { .dash-grid { grid-template-columns: repeat(2, 1fr); } .dash-stats { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .dash-grid { grid-template-columns: 1fr; } .dash-stats { grid-template-columns: repeat(2, 1fr); } .dash-root { padding: 16px; } .dash-modal-row { flex-direction: column; } }
`;

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
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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

function EventCard({ event, onDelete }: { event: Event; onDelete: (id: string) => void }) {
  const { data: guests } = useGuests(event.id);
  const { data: tables } = useTables(event.id);
  const past = isPastEvent(event);

  return (
    <div className="dash-card">
      <div className="dash-card-cover">
        {event.cover_url ? (
          <img src={event.cover_url} alt={event.name} />
        ) : (
          <div className="dash-card-cover-placeholder">
            <span>{event.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="dash-card-body">
        <div className="dash-card-name">{event.name}</div>
        <div className="dash-card-date">{formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}</div>
        <div className="dash-card-venue">{event.venue || 'Venue TBD'}</div>
        <div className="dash-card-badges">
          <span className="dash-badge dash-badge--guests">{guests?.length ?? 0} guests</span>
          <span className="dash-badge dash-badge--tables">{tables?.length ?? 0} tables</span>
          <span className={`dash-badge ${past ? 'dash-badge--past' : 'dash-badge--active'}`}>{past ? 'Past' : 'Active'}</span>
        </div>
        <div className="dash-card-actions">
          <Link to={`/events/${event.id}`} style={{ flex: 1, textDecoration: 'none' }}>
            <button className="dash-card-btn dash-card-btn--primary">Manage</button>
          </Link>
          <Link to={`/events/${event.id}/print/seating`} style={{ textDecoration: 'none' }}>
            <button className="dash-card-btn dash-card-btn--secondary" title="Print seating chart">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="8" height="9" rx="1" /><path d="M2 8h2M12 8h2M2 8v5a1 1 0 001 1h10a1 1 0 001-1V8" strokeLinecap="round" /></svg>
            </button>
          </Link>
          <button className="dash-card-btn dash-card-btn--danger" title="Delete event" onClick={() => onDelete(event.id)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5h10M6 5V3a1 1 0 011-1h2a1 1 0 011 1v2M5 5l1 9a1 1 0 001 1h2a1 1 0 001-1l1-9" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="dash-skeleton-card">
      <div className="dash-skeleton-cover" />
      <div className="dash-skeleton-body">
        <div className="dash-skeleton-line" />
        <div className="dash-skeleton-line" />
        <div className="dash-skeleton-line" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', slug: '', date: '', venue: '' });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let result = events;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) => e.name.toLowerCase().includes(q) || (e.venue ?? '').toLowerCase().includes(q),
      );
    }

    if (filter === 'active') {
      result = result.filter((e) => !isPastEvent(e));
    } else if (filter === 'past') {
      result = result.filter((e) => isPastEvent(e));
    }

    const sorted = [...result];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [events, search, sortBy, filter]);

  const activeCount = useMemo(() => {
    if (!events) return 0;
    return events.filter((e) => !isPastEvent(e)).length;
  }, [events]);

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast('Event name is required', 'error');
      return;
    }
    const slug = createForm.slug.trim() || slugify(createForm.name);
    if (!slug) {
      toast('Could not generate a valid slug', 'error');
      return;
    }
    try {
      await createEvent.mutateAsync({
        name: createForm.name.trim(),
        slug,
        date: createForm.date || null,
        venue: createForm.venue.trim() || null,
      });
      toast('Event created', 'success');
      setCreateOpen(false);
      setCreateForm({ name: '', slug: '', date: '', venue: '' });
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

  const eventToDelete = events?.find((e) => e.id === deleteId);

  return (
    <div className="dash-root">
      <style>{DASH_CSS}</style>
      <div className="dash-container">
        <div className="dash-header">
          <h1 className="dash-title">Your Events</h1>
          <div className="dash-header-right">
            <button className="dash-create-btn" onClick={() => setCreateOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10" strokeLinecap="round" /></svg>
              Create Event
            </button>
          </div>
        </div>

        <div className="dash-controls">
          <div className="dash-search">
            <span className="dash-search-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5" /><path d="M11 11l3 3" strokeLinecap="round" /></svg>
            </span>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="dash-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

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

        <div className="dash-stats">
          <div className="dash-stat">
            <div className="dash-stat-label">Total Events</div>
            <div className="dash-stat-value">{events?.length ?? 0}</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-label">Total Guests</div>
            <div className="dash-stat-value">—</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-label">Total Tables</div>
            <div className="dash-stat-value">—</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-label">Active Events</div>
            <div className="dash-stat-value">{activeCount}</div>
          </div>
        </div>

        {isLoading ? (
          <div className="dash-grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#DADADA" strokeWidth="1.5"><rect x="6" y="10" width="36" height="32" rx="3" /><path d="M6 18h36M14 6v8M34 6v8" strokeLinecap="round" /></svg>
            </div>
            <div className="dash-empty-title">
              {search || filter !== 'all' ? 'No events match your filters' : 'No events yet'}
            </div>
            <div className="dash-empty-text">
              {search || filter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Create your first event to get started.'}
            </div>
            {!search && filter === 'all' && (
              <button className="dash-create-btn" onClick={() => setCreateOpen(true)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10" strokeLinecap="round" /></svg>
                Create Event
              </button>
            )}
          </div>
        ) : (
          <div className="dash-grid">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onDelete={(id) => setDeleteId(id)} />
            ))}
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)}>
        <h2 className="dash-modal-title">Create New Event</h2>
        <div className="dash-modal-field">
          <label className="dash-modal-label">Event Name</label>
          <input
            className="dash-modal-input"
            value={createForm.name}
            onChange={(e) =>
              setCreateForm((f) => ({
                ...f,
                name: e.target.value,
                slug: f.slug || slugify(e.target.value),
              }))
            }
            placeholder="e.g. Sarah & Tom's Wedding"
          />
        </div>
        <div className="dash-modal-field">
          <label className="dash-modal-label">Slug (URL)</label>
          <input
            className="dash-modal-input"
            value={createForm.slug}
            onChange={(e) => setCreateForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
            placeholder="auto-generated from name"
          />
        </div>
        <div className="dash-modal-row">
          <div className="dash-modal-field">
            <label className="dash-modal-label">Date</label>
            <input
              className="dash-modal-input"
              type="date"
              value={createForm.date}
              onChange={(e) => setCreateForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="dash-modal-field">
            <label className="dash-modal-label">Venue</label>
            <input
              className="dash-modal-input"
              value={createForm.venue}
              onChange={(e) => setCreateForm((f) => ({ ...f, venue: e.target.value }))}
              placeholder="e.g. The Grand Hall"
            />
          </div>
        </div>
        <div className="dash-modal-actions">
          <button className="dash-modal-btn dash-modal-btn--secondary" onClick={() => setCreateOpen(false)}>
            Cancel
          </button>
          <button
            className="dash-modal-btn dash-modal-btn--primary"
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

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Event"
        message={
          eventToDelete
            ? `Are you sure you want to delete "${eventToDelete.name}"? This will permanently remove all guests, tables, and settings. This cannot be undone.`
            : 'Are you sure you want to delete this event? This cannot be undone.'
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
