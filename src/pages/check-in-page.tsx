import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useCheckIns } from '@/hooks/use-check-ins';
import {
  useToggleCheckIn,
  useUpdateCheckInPlusOnes,
} from '@/hooks/use-check-ins';
import { useToast } from '@/providers/toast-provider';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { CheckIn } from '@/types/check-in';
import type { RSVP } from '@/types/rsvp';

type FilterTab = 'all' | 'checked-in' | 'pending';

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function rsvpBadgeClass(status: RSVP['status']): string {
  return `checkin__rsvp-badge checkin__rsvp-badge--${status}`;
}

function rsvpLabel(status: RSVP['status']): string {
  switch (status) {
    case 'attending':
      return 'Attending';
    case 'not_attending':
      return 'Not Attending';
    case 'maybe':
      return 'Maybe';
    default:
      return status;
  }
}

export function CheckInPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = eventId ?? '';

  const { data: event, isLoading } = useEvent(id);
  const { data: guests } = useGuests(id);
  const { data: rsvps } = useRSVPs(id);
  const { data: checkIns } = useCheckIns(id);
  const toggleCheckIn = useToggleCheckIn(id);
  const updatePlusOnes = useUpdateCheckInPlusOnes(id);
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const checkInByGuest = useMemo(() => {
    const map = new Map<string, CheckIn>();
    for (const c of checkIns ?? []) {
      map.set(c.guest_id, c);
    }
    return map;
  }, [checkIns]);

  const rsvpByGuest = useMemo(() => {
    const map = new Map<string, RSVP>();
    for (const r of rsvps ?? []) {
      map.set(r.guest_id, r);
    }
    return map;
  }, [rsvps]);

  if (isLoading) return <LoadingScreen label="Loading check-in…" />;

  if (!event) {
    return (
      <div className="page">
        <ErrorScreen message="Event not found" />
        <Link to="/" className="btn btn--secondary btn--sm">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const guestList = guests ?? [];
  const checkedInCount = (checkIns ?? []).length;
  const pendingCount = guestList.length - checkedInCount;
  const completionPct =
    guestList.length > 0
      ? Math.round((checkedInCount / guestList.length) * 100)
      : 0;

  const plusOnesActualTotal = (checkIns ?? []).reduce(
    (sum, c) => sum + (c.plus_ones_actual ?? 0),
    0,
  );
  const attendingCount = (rsvps ?? []).filter(
    (r) => r.status === 'attending',
  ).length;
  const plusOnesExpected = (rsvps ?? []).reduce(
    (sum, r) => sum + r.plus_ones,
    0,
  );
  const expectedAttendees = attendingCount + plusOnesExpected;

  const filteredGuests = guestList.filter((g) => {
    const isMatch = g.name.toLowerCase().includes(search.toLowerCase());
    if (!isMatch) return false;
    const isCheckedIn = checkInByGuest.has(g.id);
    if (filter === 'checked-in') return isCheckedIn;
    if (filter === 'pending') return !isCheckedIn;
    return true;
  });

  function handleToggle(guestId: string, isCheckedIn: boolean) {
    toggleCheckIn.mutate(
      { guest_id: guestId, check_in: !isCheckedIn },
      {
        onError: () => toast('Could not update check-in', 'error'),
      },
    );
  }

  function handlePlusOnesChange(guestId: string, value: number) {
    updatePlusOnes.mutate(
      { guest_id: guestId, plus_ones_actual: value },
      {
        onError: () => toast('Could not update plus ones', 'error'),
      },
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Check-in</h1>
          <p className="text-secondary">{event.name}</p>
        </div>
        <Link to={`/events/${id}/overview`} className="btn btn--ghost btn--sm">
          ← Back to overview
        </Link>
      </div>

      <div className="checkin__stats">
        <div className="checkin__stat checkin__stat--success">
          <div className="checkin__stat__value">{checkedInCount}</div>
          <div className="checkin__stat__label">Checked In</div>
        </div>
        <div className="checkin__stat checkin__stat--warning">
          <div className="checkin__stat__value">{pendingCount}</div>
          <div className="checkin__stat__label">Pending</div>
        </div>
        <div className="checkin__stat">
          <div className="checkin__stat__value">{completionPct}%</div>
          <div className="checkin__stat__label">Complete</div>
        </div>
        <div className="checkin__stat">
          <div className="checkin__stat__value">{plusOnesActualTotal}</div>
          <div className="checkin__stat__label">Plus Ones (actual)</div>
        </div>
        <div className="checkin__stat">
          <div className="checkin__stat__value">{expectedAttendees}</div>
          <div className="checkin__stat__label">Expected Attendees</div>
        </div>
      </div>

      <div className="checkin__progress-bar">
        <div
          className="checkin__progress-fill"
          style={{ width: `${completionPct}%` }}
        />
      </div>

      <div className="checkin__controls">
        <input
          className="input checkin__search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests…"
        />
        <div className="checkin__filters">
          <button
            className={`btn btn--sm ${filter === 'all' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`btn btn--sm ${filter === 'checked-in' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setFilter('checked-in')}
          >
            Checked In
          </button>
          <button
            className={`btn btn--sm ${filter === 'pending' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
        </div>
      </div>

      <div className="checkin__list-card card">
        {filteredGuests.length === 0 ? (
          <p className="checkin__empty text-secondary">
            {guestList.length === 0
              ? 'No guests yet.'
              : 'No guests match your search.'}
          </p>
        ) : (
          <div className="checkin__list">
            {filteredGuests.map((g) => {
              const checkIn = checkInByGuest.get(g.id);
              const isCheckedIn = !!checkIn;
              const rsvp = rsvpByGuest.get(g.id);
              const rowClass = isCheckedIn ? 'checkin__row--checked' : '';
              const toggleClass = isCheckedIn
                ? 'checkin__toggle--checked'
                : 'checkin__toggle--unchecked';
              return (
                <div key={g.id} className={`checkin__row ${rowClass}`.trim()}>
                  <button
                    className={`checkin__toggle ${toggleClass}`.trim()}
                    onClick={() => handleToggle(g.id, isCheckedIn)}
                    disabled={toggleCheckIn.isPending}
                    aria-label={
                      isCheckedIn ? 'Undo check-in' : 'Check in guest'
                    }
                  >
                    {isCheckedIn ? '✓' : ''}
                  </button>
                  <div className="checkin__guest-info">
                    <div className="checkin__guest-name">{g.name}</div>
                    <div className="checkin__guest-meta">
                      {g.table ? (
                        <span className="badge checkin__table-badge">
                          {g.table.name} (#{g.table.number})
                        </span>
                      ) : (
                        <span className="badge checkin__table-badge--unassigned">
                          Unassigned
                        </span>
                      )}
                      {rsvp ? (
                        <span className={rsvpBadgeClass(rsvp.status)}>
                          {rsvpLabel(rsvp.status)}
                        </span>
                      ) : (
                        <span className="checkin__rsvp-badge checkin__rsvp-badge--pending">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  {isCheckedIn && checkIn && (
                    <>
                      <div className="checkin__plus-ones">
                        <label className="checkin__plus-ones-label">+1s</label>
                        <input
                          className="input checkin__plus-ones-input"
                          type="number"
                          min={0}
                          value={checkIn.plus_ones_actual ?? 0}
                          onChange={(e) =>
                            handlePlusOnesChange(
                              g.id,
                              Math.max(0, Number(e.target.value)),
                            )
                          }
                          disabled={updatePlusOnes.isPending}
                        />
                      </div>
                      <div className="checkin__time">
                        {formatTime(checkIn.checked_in_at)}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
