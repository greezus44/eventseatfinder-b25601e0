import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import type { Event } from '@/types/event';

/* ------------------------------------------------------------------ */
/*  Scoped styles — monochrome design system, `dash-` namespace        */
/* ------------------------------------------------------------------ */
const DASH_STYLES = `
:root {
  --dash-white: #FFFFFF;
  --dash-off-white: #F8F8F8;
  --dash-light-grey: #EFEFEF;
  --dash-mid-grey: #DADADA;
  --dash-dark-grey: #4A4A4A;
  --dash-near-black: #1A1A1A;
  --dash-danger: #C44A4A;
  --dash-danger-bg: #F4E8E8;
  --dash-danger-border: #E0CBCB;
  --dash-radius: 12px;
  --dash-shadow-sm: 0 1px 2px rgba(26,26,26,0.04), 0 1px 1px rgba(26,26,26,0.03);
  --dash-shadow-md: 0 4px 12px rgba(26,26,26,0.06), 0 2px 4px rgba(26,26,26,0.04);
  --dash-shadow-lg: 0 12px 28px rgba(26,26,26,0.08), 0 4px 10px rgba(26,26,26,0.05);
  --dash-transition: 200ms ease;
}

.dash-page {
  --dash-accent: var(--dash-event-accent, #1A1A1A);
  min-height: 100%;
  background: var(--dash-white);
  color: var(--dash-near-black);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding: 40px 48px 64px;
  max-width: 1320px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .dash-page { padding: 24px 20px 48px; }
}

/* ---------- Header ---------- */
.dash-header { margin-bottom: 40px; }

.dash-header__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}
@media (max-width: 640px) {
  .dash-header__top { flex-direction: column; gap: 16px; }
}

.dash-title {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--dash-near-black);
  margin: 0;
  line-height: 1.2;
}
.dash-subtitle {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--dash-dark-grey);
  font-weight: 400;
}

.dash-create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--dash-near-black);
  color: var(--dash-white);
  border: 1px solid var(--dash-near-black);
  border-radius: 10px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--dash-transition), border-color var(--dash-transition), transform var(--dash-transition);
  white-space: nowrap;
  flex-shrink: 0;
}
.dash-create-btn:hover { background: #2A2A2A; transform: translateY(-1px); }
.dash-create-btn:active { transform: translateY(0); }
.dash-create-btn:focus-visible {
  outline: 2px solid var(--dash-accent);
  outline-offset: 2px;
}
.dash-create-btn__plus { font-size: 18px; line-height: 1; font-weight: 400; }

/* ---------- Toolbar ---------- */
.dash-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.dash-search {
  position: relative;
  flex: 1 1 280px;
  max-width: 360px;
  min-width: 200px;
}
.dash-search__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--dash-dark-grey);
  pointer-events: none;
  font-size: 15px;
}
.dash-search__input {
  width: 100%;
  background: var(--dash-off-white);
  border: 1px solid var(--dash-light-grey);
  border-radius: 10px;
  padding: 10px 14px 10px 40px;
  font-size: 14px;
  color: var(--dash-near-black);
  transition: border-color var(--dash-transition), background var(--dash-transition), box-shadow var(--dash-transition);
  box-sizing: border-box;
  font-family: inherit;
}
.dash-search__input::placeholder { color: #9A9A9A; }
.dash-search__input:focus {
  outline: none;
  border-color: var(--dash-accent);
  background: var(--dash-white);
  box-shadow: 0 0 0 3px rgba(26,26,26,0.06);
}

.dash-sort {
  position: relative;
}
.dash-sort__select {
  appearance: none;
  -webkit-appearance: none;
  background: var(--dash-off-white);
  border: 1px solid var(--dash-light-grey);
  border-radius: 10px;
  padding: 10px 36px 10px 14px;
  font-size: 14px;
  color: var(--dash-near-black);
  cursor: pointer;
  transition: border-color var(--dash-transition), background var(--dash-transition);
  font-family: inherit;
  font-weight: 500;
}
.dash-sort__select:hover { background: var(--dash-light-grey); }
.dash-sort__select:focus {
  outline: none;
  border-color: var(--dash-accent);
  box-shadow: 0 0 0 3px rgba(26,26,26,0.06);
}
.dash-sort__arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--dash-dark-grey);
  font-size: 10px;
}

.dash-chips {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
@media (max-width: 768px) {
  .dash-chips { margin-left: 0; width: 100%; }
}
.dash-chip {
  background: var(--dash-white);
  border: 1px solid var(--dash-light-grey);
  border-radius: 999px;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--dash-dark-grey);
  cursor: pointer;
  transition: all var(--dash-transition);
  font-family: inherit;
}
.dash-chip:hover {
  border-color: var(--dash-mid-grey);
  color: var(--dash-near-black);
}
.dash-chip--active {
  background: var(--dash-accent);
  border-color: var(--dash-accent);
  color: var(--dash-white);
}
.dash-chip--active:hover { color: var(--dash-white); }
.dash-chip:focus-visible {
  outline: 2px solid var(--dash-accent);
  outline-offset: 2px;
}

/* ---------- Stat cards ---------- */
.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}
@media (max-width: 900px) {
  .dash-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .dash-stats { grid-template-columns: 1fr; }
}

.dash-stat {
  background: var(--dash-white);
  border: 1px solid var(--dash-light-grey);
  border-radius: var(--dash-radius);
  padding: 22px 24px;
  box-shadow: var(--dash-shadow-sm);
  transition: box-shadow var(--dash-transition), border-color var(--dash-transition);
}
.dash-stat:hover {
  box-shadow: var(--dash-shadow-md);
  border-color: var(--dash-mid-grey);
}
.dash-stat__value {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--dash-near-black);
  line-height: 1;
  margin: 0 0 8px;
  font-variant-numeric: tabular-nums;
}
.dash-stat__label {
  font-size: 13px;
  color: var(--dash-dark-grey);
  font-weight: 500;
  margin: 0;
  letter-spacing: 0.01em;
}

/* ---------- Event grid ---------- */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
@media (max-width: 1100px) {
  .dash-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 700px) {
  .dash-grid { grid-template-columns: 1fr; }
}

/* ---------- Event card ---------- */
.dash-card {
  background: var(--dash-white);
  border: 1px solid var(--dash-light-grey);
  border-radius: var(--dash-radius);
  overflow: hidden;
  box-shadow: var(--dash-shadow-sm);
  transition: box-shadow var(--dash-transition), border-color var(--dash-transition), transform var(--dash-transition);
  display: flex;
  flex-direction: column;
}
.dash-card:hover {
  box-shadow: var(--dash-shadow-lg);
  border-color: var(--dash-mid-grey);
  transform: translateY(-2px);
}

.dash-card__cover {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: var(--dash-light-grey);
}
.dash-card__cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.dash-card__cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #F0F0F0 0%, #E2E2E2 50%, #D4D4D4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.dash-card__cover-placeholder span {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--dash-white);
  opacity: 0.7;
  text-transform: uppercase;
}
.dash-card__status-row {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
}

.dash-card__body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 14px;
}

.dash-card__name {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--dash-near-black);
  margin: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dash-card__meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.dash-card__meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--dash-dark-grey);
  line-height: 1.4;
}
.dash-card__meta-icon {
  width: 14px;
  text-align: center;
  flex-shrink: 0;
  opacity: 0.6;
  font-size: 13px;
}
.dash-card__meta-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dash-card__badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dash-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--dash-off-white);
  border: 1px solid var(--dash-light-grey);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--dash-dark-grey);
  line-height: 1;
}
.dash-badge__num {
  font-weight: 600;
  color: var(--dash-near-black);
  font-variant-numeric: tabular-nums;
}

.dash-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 999px;
  line-height: 1;
  backdrop-filter: blur(8px);
}
.dash-status--on {
  background: rgba(255,255,255,0.92);
  color: var(--dash-near-black);
  border: 1px solid var(--dash-mid-grey);
}
.dash-status--draft {
  background: rgba(248,248,248,0.92);
  color: var(--dash-dark-grey);
  border: 1px solid var(--dash-light-grey);
}
.dash-status__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dash-dark-grey);
  flex-shrink: 0;
}
.dash-status--on .dash-status__dot { background: var(--dash-accent); }

.dash-card__updated {
  font-size: 12px;
  color: #9A9A9A;
  margin: 0;
  padding-top: 2px;
}

.dash-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px solid var(--dash-light-grey);
  margin-top: auto;
  padding-top: 14px;
}
.dash-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--dash-off-white);
  border: 1px solid var(--dash-light-grey);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--dash-dark-grey);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--dash-transition);
  font-family: inherit;
  line-height: 1;
}
.dash-action:hover {
  background: var(--dash-light-grey);
  color: var(--dash-near-black);
  border-color: var(--dash-mid-grey);
}
.dash-action:focus-visible {
  outline: 2px solid var(--dash-accent);
  outline-offset: 1px;
}
.dash-action--find {
  background: transparent;
  color: var(--dash-accent);
  border-color: var(--dash-mid-grey);
}
.dash-action--find:hover {
  background: var(--dash-accent);
  color: var(--dash-white);
  border-color: var(--dash-accent);
}
.dash-action--delete {
  background: transparent;
  color: var(--dash-danger);
  border-color: var(--dash-danger-border);
}
.dash-action--delete:hover {
  background: var(--dash-danger-bg);
  border-color: var(--dash-danger);
}

/* ---------- Skeleton ---------- */
.dash-skeleton {
  background: var(--dash-white);
  border: 1px solid var(--dash-light-grey);
  border-radius: var(--dash-radius);
  overflow: hidden;
  box-shadow: var(--dash-shadow-sm);
}
.dash-skeleton__cover {
  height: 160px;
  background: linear-gradient(90deg, #F2F2F2 25%, #ECECEC 50%, #F2F2F2 75%);
  background-size: 200% 100%;
  animation: dash-shimmer 1.4s infinite linear;
}
.dash-skeleton__body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.dash-skeleton__line {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #F2F2F2 25%, #ECECEC 50%, #F2F2F2 75%);
  background-size: 200% 100%;
  animation: dash-shimmer 1.4s infinite linear;
}
.dash-skeleton__line--title { height: 20px; width: 70%; }
.dash-skeleton__line--meta { width: 90%; }
.dash-skeleton__line--meta-short { width: 60%; }
.dash-skeleton__line--actions { height: 32px; width: 100%; margin-top: 4px; }

@keyframes dash-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---------- Empty state ---------- */
.dash-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 24px;
  border: 1px dashed var(--dash-mid-grey);
  border-radius: var(--dash-radius);
  background: var(--dash-off-white);
}
.dash-empty__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--dash-white);
  border: 1px solid var(--dash-light-grey);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--dash-dark-grey);
  margin-bottom: 20px;
}
.dash-empty__title {
  font-size: 20px;
  font-weight: 600;
  color: var(--dash-near-black);
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}
.dash-empty__text {
  font-size: 14px;
  color: var(--dash-dark-grey);
  margin: 0 0 24px;
  max-width: 360px;
  line-height: 1.5;
}
.dash-empty__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--dash-near-black);
  color: var(--dash-white);
  border: 1px solid var(--dash-near-black);
  border-radius: 10px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--dash-transition), transform var(--dash-transition);
  font-family: inherit;
}
.dash-empty__btn:hover { background: #2A2A2A; transform: translateY(-1px); }
.dash-empty__btn:focus-visible { outline: 2px solid var(--dash-accent); outline-offset: 2px; }

/* ---------- Modal form ---------- */
.dash-form { display: flex; flex-direction: column; gap: 18px; padding: 4px 0; }
.dash-field { display: flex; flex-direction: column; gap: 7px; }
.dash-field__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--dash-near-black);
  letter-spacing: 0.01em;
}
.dash-field__input {
  background: var(--dash-off-white);
  border: 1px solid var(--dash-light-grey);
  border-radius: 10px;
  padding: 11px 14px;
  font-size: 14px;
  color: var(--dash-near-black);
  transition: border-color var(--dash-transition), background var(--dash-transition), box-shadow var(--dash-transition);
  box-sizing: border-box;
  font-family: inherit;
}
.dash-field__input::placeholder { color: #9A9A9A; }
.dash-field__input:focus {
  outline: none;
  border-color: var(--dash-accent);
  background: var(--dash-white);
  box-shadow: 0 0 0 3px rgba(26,26,26,0.06);
}
.dash-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
.dash-btn {
  display: inline-flex;
  align-items: center;
  border-radius: 10px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--dash-transition);
  font-family: inherit;
  border: 1px solid transparent;
  line-height: 1;
}
.dash-btn--secondary {
  background: var(--dash-light-grey);
  color: var(--dash-dark-grey);
  border-color: var(--dash-light-grey);
}
.dash-btn--secondary:hover { background: var(--dash-mid-grey); color: var(--dash-near-black); }
.dash-btn--primary {
  background: var(--dash-near-black);
  color: var(--dash-white);
  border-color: var(--dash-near-black);
}
.dash-btn--primary:hover { background: #2A2A2A; }
.dash-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
.dash-btn:focus-visible { outline: 2px solid var(--dash-accent); outline-offset: 2px; }
`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type SortKey = 'newest' | 'oldest' | 'name-asc' | 'name-desc';
type FilterKey = 'all' | 'active' | 'past';

function isPastEvent(dateStr: string): boolean {
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
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':');
    const hours = parseInt(h, 10);
    const minutes = parseInt(m || '0', 10);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const mm = minutes > 0 ? `:${String(minutes).padStart(2, '0')}` : '';
    return `${displayHours}${mm} ${period}`;
  } catch {
    return timeStr;
  }
}

function formatUpdated(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || `event-${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/*  EventCard sub-component                                            */
/* ------------------------------------------------------------------ */

function EventCard({
  event,
  onDelete,
}: {
  event: Event;
  onDelete: (event: Event) => void;
}) {
  const { data: guests = [] } = useGuests(event.id);
  const { data: tables = [] } = useTables(event.id);

  const guestCount = guests.length;
  const tableCount = tables.length;
  const accent = event.accent_color || '#1A1A1A';
  const initials = event.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();

  return (
    <div
      className="dash-card"
      style={{ ['--dash-event-accent' as string]: accent }}
    >
      <div className="dash-card__cover">
        {event.cover_url ? (
          <img
            className="dash-card__cover-img"
            src={event.cover_url}
            alt={event.name}
            loading="lazy"
          />
        ) : (
          <div className="dash-card__cover-placeholder">
            <span>{initials || 'SE'}</span>
          </div>
        )}
        <div className="dash-card__status-row">
          {event.invitation_enabled ? (
            <span className="dash-status dash-status--on">
              <span className="dash-status__dot" />
              Invitations On
            </span>
          ) : (
            <span className="dash-status dash-status--draft">
              <span className="dash-status__dot" />
              Draft
            </span>
          )}
        </div>
      </div>

      <div className="dash-card__body">
        <h3 className="dash-card__name" title={event.name}>{event.name}</h3>

        <div className="dash-card__meta">
          <div className="dash-card__meta-row">
            <span className="dash-card__meta-icon">📅</span>
            <span className="dash-card__meta-text">
              {formatDate(event.date)}
              {event.time ? ` · ${formatTime(event.time)}` : ''}
            </span>
          </div>
          {event.venue && (
            <div className="dash-card__meta-row">
              <span className="dash-card__meta-icon">📍</span>
              <span className="dash-card__meta-text">{event.venue}</span>
            </div>
          )}
        </div>

        <div className="dash-card__badges">
          <span className="dash-badge">
            <span className="dash-badge__num">{guestCount}</span>
            {guestCount === 1 ? 'Guest' : 'Guests'}
          </span>
          <span className="dash-badge">
            <span className="dash-badge__num">{tableCount}</span>
            {tableCount === 1 ? 'Table' : 'Tables'}
          </span>
        </div>

        <p className="dash-card__updated">Updated {formatUpdated(event.updated_at)}</p>

        <div className="dash-card__actions">
          <Link className="dash-action" to={`/events/${event.id}`}>Overview</Link>
          <Link className="dash-action" to={`/events/${event.id}`}>Guests</Link>
          <Link className="dash-action" to={`/events/${event.id}`}>Seating</Link>
          <Link className="dash-action" to={`/events/${event.id}/print/seating`}>Print</Link>
          <Link className="dash-action dash-action--find" to={`/e/${event.slug}`}>Find Your Seat</Link>
          <Link className="dash-action" to={`/events/${event.id}`}>Guest Page</Link>
          <button
            className="dash-action dash-action--delete"
            onClick={() => onDelete(event)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton card                                                      */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="dash-skeleton">
      <div className="dash-skeleton__cover" />
      <div className="dash-skeleton__body">
        <div className="dash-skeleton__line dash-skeleton__line--title" />
        <div className="dash-skeleton__line dash-skeleton__line--meta" />
        <div className="dash-skeleton__line dash-skeleton__line--meta-short" />
        <div className="dash-skeleton__line dash-skeleton__line--actions" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create event form (inside modal)                                    */
/* ------------------------------------------------------------------ */

function CreateEventForm({
  onCreate,
  onCancel,
  isCreating,
}: {
  onCreate: (input: { name: string; date: string; venue: string }) => void;
  onCancel: () => void;
  isCreating: boolean;
}) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), date, venue: venue.trim() });
  };

  return (
    <form className="dash-form" onSubmit={handleSubmit}>
      <div className="dash-field">
        <label className="dash-field__label" htmlFor="evt-name">Event name</label>
        <input
          id="evt-name"
          className="dash-field__input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Annual Gala 2025"
          autoFocus
          required
        />
      </div>
      <div className="dash-field">
        <label className="dash-field__label" htmlFor="evt-date">Date</label>
        <input
          id="evt-date"
          className="dash-field__input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="dash-field">
        <label className="dash-field__label" htmlFor="evt-venue">Venue</label>
        <input
          id="evt-venue"
          className="dash-field__input"
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. The Grand Ballroom, NYC"
        />
      </div>
      <div className="dash-form__actions">
        <button type="button" className="dash-btn dash-btn--secondary" onClick={onCancel} disabled={isCreating}>
          Cancel
        </button>
        <button type="submit" className="dash-btn dash-btn--primary" disabled={isCreating || !name.trim()}>
          {isCreating ? 'Creating…' : 'Create Event'}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function DashboardPage() {
  const { toast } = useToast();
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [filter, setFilter] = useState<FilterKey>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

  /* ---- derived list: search → filter → sort ---- */
  const visibleEvents = useMemo(() => {
    if (!events) return [];

    let list = events;

    // search by name (case-insensitive)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }

    // filter chips
    if (filter === 'active') {
      list = list.filter((e) => e.invitation_enabled);
    } else if (filter === 'past') {
      list = list.filter((e) => isPastEvent(e.date));
    }

    // sort
    const sorted = [...list];
    switch (sort) {
      case 'newest':
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
      case 'oldest':
        sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base' }));
        break;
    }
    return sorted;
  }, [events, search, filter, sort]);

  /* ---- aggregate stats ---- */
  const stats = useMemo(() => {
    const all = events ?? [];
    return {
      total: all.length,
      guests: 0, // populated below; counts require per-event queries
      tables: 0,
      active: all.filter((e) => e.invitation_enabled).length,
    };
  }, [events]);

  /* ---- handlers ---- */
  const handleCreate = async (input: { name: string; date: string; venue: string }) => {
    try {
      await createEvent.mutateAsync({
        name: input.name,
        slug: slugify(input.name),
        date: input.date,
        time: '',
        venue: input.venue,
        invitation_enabled: false,
      });
      toast('Event created successfully', 'success');
      setCreateOpen(false);
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

  const chips: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'past', label: 'Past' },
  ];

  return (
    <div className="dash-page">
      <style>{DASH_STYLES}</style>

      {/* ---------- Header ---------- */}
      <header className="dash-header">
        <div className="dash-header__top">
          <div>
            <h1 className="dash-title">Your Events</h1>
            <p className="dash-subtitle">
              Manage seating, guests, and invitations for your events.
            </p>
          </div>
          <button className="dash-create-btn" onClick={() => setCreateOpen(true)}>
            <span className="dash-create-btn__plus">+</span>
            Create Event
          </button>
        </div>

        <div className="dash-toolbar">
          <div className="dash-search">
            <span className="dash-search__icon">⌕</span>
            <input
              className="dash-search__input"
              type="text"
              placeholder="Search events by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="dash-sort">
            <select
              className="dash-sort__select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort events"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
            <span className="dash-sort__arrow">▾</span>
          </div>

          <div className="dash-chips">
            {chips.map((c) => (
              <button
                key={c.key}
                className={`dash-chip${filter === c.key ? ' dash-chip--active' : ''}`}
                onClick={() => setFilter(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ---------- Stat cards ---------- */}
      <section className="dash-stats">
        <div className="dash-stat">
          <p className="dash-stat__value">{stats.total}</p>
          <p className="dash-stat__label">Total Events</p>
        </div>
        <div className="dash-stat">
          <p className="dash-stat__value">—</p>
          <p className="dash-stat__label">Total Guests</p>
        </div>
        <div className="dash-stat">
          <p className="dash-stat__value">—</p>
          <p className="dash-stat__label">Total Tables</p>
        </div>
        <div className="dash-stat">
          <p className="dash-stat__value">{stats.active}</p>
          <p className="dash-stat__label">Active Events</p>
        </div>
      </section>

      {/* ---------- Event grid ---------- */}
      {isLoading ? (
        <div className="dash-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="dash-empty">
          <div className="dash-empty__icon">✦</div>
          <h2 className="dash-empty__title">
            {search || filter !== 'all'
              ? 'No events match your filters'
              : 'No events yet'}
          </h2>
          <p className="dash-empty__text">
            {search || filter !== 'all'
              ? 'Try adjusting your search or filters to find what you’re looking for.'
              : 'Create your first event to start managing guests, tables, and seating arrangements.'}
          </p>
          {(!search && filter === 'all') && (
            <button className="dash-empty__btn" onClick={() => setCreateOpen(true)}>
              <span className="dash-create-btn__plus">+</span>
              Create Your First Event
            </button>
          )}
        </div>
      ) : (
        <div className="dash-grid">
          {visibleEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDelete={(e) => setDeleteTarget(e)}
            />
          ))}
        </div>
      )}

      {/* ---------- Create event modal ---------- */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Event">
        <CreateEventForm
          onCreate={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isCreating={createEvent.isPending}
        />
      </Modal>

      {/* ---------- Delete confirm dialog ---------- */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Event"
        message={`Are you sure you want to delete “${deleteTarget?.name ?? ''}”? This action cannot be undone, and all guests and seating for this event will be removed.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
