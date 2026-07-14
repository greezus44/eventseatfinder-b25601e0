import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useRSVPs } from '@/hooks/use-rsvps';
import {
  useCheckIns,
  useToggleCheckIn,
  useUpdateCheckInPlusOnes,
} from '@/hooks/use-check-ins';
import { useToast } from '@/providers/toast-provider';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';

export function CheckInPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId ?? '');
  const { data: rsvps, isLoading: rsvpsLoading } = useRSVPs(eventId ?? '');
  const { data: checkIns, isLoading: checkInsLoading } = useCheckIns(
    eventId ?? '',
  );
  const toggleCheckIn = useToggleCheckIn(eventId ?? '');
  const updatePlusOnes = useUpdateCheckInPlusOnes(eventId ?? '');
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'checked-in' | 'pending'>('all');

  const checkInMap = useMemo(() => {
    const map = new Map<
      string,
      { checked_in_at: string; plus_ones_actual: number }
    >();
    for (const c of checkIns ?? []) {
      map.set(c.guest_id, {
        checked_in_at: c.checked_in_at,
        plus_ones_actual: c.plus_ones_actual,
      });
    }
    return map;
  }, [checkIns]);

  const rsvpMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rsvps ?? []) {
      map.set(r.guest_id, r.status);
    }
    return map;
  }, [rsvps]);

  const stats = useMemo(() => {
    const total = guests?.length ?? 0;
    const checkedIn = checkIns?.length ?? 0;
    const pending = total - checkedIn;
    const totalPlusOnesActual =
      checkIns?.reduce((sum, c) => sum + c.plus_ones_actual, 0) ?? 0;
    const totalExpected =
      (rsvps ?? [])
        .filter((r) => r.status === 'attending')
        .reduce((sum, r) => sum + 1 + r.plus_ones, 0) ?? 0;
    return {
      total,
      checkedIn,
      pending,
      totalPlusOnesActual,
      totalExpected,
      percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
    };
  }, [guests, checkIns, rsvps]);

  const filteredGuests = useMemo(() => {
    let result = guests ?? [];
    if (filter === 'checked-in') {
      result = result.filter((g) => checkInMap.has(g.id));
    } else if (filter === 'pending') {
      result = result.filter((g) => !checkInMap.has(g.id));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(q));
    }
    return result;
  }, [guests, filter, search, checkInMap]);

  if (eventLoading || guestsLoading || rsvpsLoading || checkInsLoading)
    return <LoadingScreen message="Loading check-in…" />;
  if (!event) return <ErrorScreen message="Event not found." />;

  const handleToggle = (guest: GuestWithTable) => {
    const isCheckedIn = checkInMap.has(guest.id);
    const expectedPlusOnes =
      rsvps?.find((r) => r.guest_id === guest.id)?.plus_ones ?? 0;

    toggleCheckIn.mutate(
      {
        guest_id: guest.id,
        check_in: !isCheckedIn,
        plus_ones_actual: isCheckedIn ? 0 : expectedPlusOnes,
      },
      {
        onSuccess: () => {
          toast(
            !isCheckedIn
              ? `${guest.name} checked in`
              : `${guest.name} checked out`,
            'success',
          );
        },
        onError: () => toast('Failed to toggle check-in', 'error'),
      },
    );
  };

  const handlePlusOnesChange = (guestId: string, value: number) => {
    updatePlusOnes.mutate(
      { guest_id: guestId, plus_ones_actual: value },
      {
        onError: () => toast('Failed to update plus ones', 'error'),
      },
    );
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <Link
            to={`/events/${eventId}`}
            className="text-secondary"
            style={{ fontSize: '0.875rem' }}
          >
            ← Event settings
          </Link>
          <h1 style={{ marginTop: 'var(--space-2)' }}>Guest Check-in</h1>
          <p className="text-secondary">{event.name}</p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/events/${eventId}/overview`}
            className="btn btn--secondary"
          >
            Overview
          </Link>
          <Link to={`/events/${eventId}/guests`} className="btn btn--secondary">
            Guests
          </Link>
        </div>
      </div>

      <div className="checkin__stats">
        <div className="checkin__stat">
          <div className="checkin__stat__value">{stats.checkedIn}</div>
          <div className="checkin__stat__label">Checked In</div>
        </div>
        <div className="checkin__stat checkin__stat--warning">
          <div className="checkin__stat__value">{stats.pending}</div>
          <div className="checkin__stat__label">Pending</div>
        </div>
        <div className="checkin__stat">
          <div className="checkin__stat__value">{stats.percentage}%</div>
          <div className="checkin__stat__label">Completion</div>
        </div>
        <div className="checkin__stat checkin__stat--success">
          <div className="checkin__stat__value">
            {stats.totalPlusOnesActual}
          </div>
          <div className="checkin__stat__label">Plus Ones (Actual)</div>
        </div>
        <div className="checkin__stat">
          <div className="checkin__stat__value">{stats.totalExpected}</div>
          <div className="checkin__stat__label">Expected Attendees</div>
        </div>
      </div>

      <div className="checkin__progress-bar">
        <div
          className="checkin__progress-fill"
          style={{ width: `${stats.percentage}%` }}
        />
      </div>

      <div className="checkin__controls">
        <input
          type="text"
          className="input checkin__search"
          placeholder="Search guests…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="checkin__filters">
          <button
            className={`btn btn--sm ${
              filter === 'all' ? 'btn--primary' : 'btn--secondary'
            }`}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </button>
          <button
            className={`btn btn--sm ${
              filter === 'checked-in' ? 'btn--primary' : 'btn--secondary'
            }`}
            onClick={() => setFilter('checked-in')}
          >
            Checked In ({stats.checkedIn})
          </button>
          <button
            className={`btn btn--sm ${
              filter === 'pending' ? 'btn--primary' : 'btn--secondary'
            }`}
            onClick={() => setFilter('pending')}
          >
            Pending ({stats.pending})
          </button>
        </div>
      </div>

      <div className="card checkin__list-card">
        {filteredGuests.length === 0 ? (
          <div className="checkin__empty">
            {search.trim()
              ? 'No guests match your search.'
              : filter === 'checked-in'
                ? 'No guests have checked in yet.'
                : filter === 'pending'
                  ? 'All guests have checked in!'
                  : 'No guests have been added to this event yet.'}
          </div>
        ) : (
          <div className="checkin__list">
            {filteredGuests.map((guest) => {
              const checkIn = checkInMap.get(guest.id);
              const isCheckedIn = !!checkIn;
              const rsvp = rsvpMap.get(guest.id);

              return (
                <div
                  key={guest.id}
                  className={`checkin__row ${
                    isCheckedIn ? 'checkin__row--checked' : ''
                  }`}
                >
                  <button
                    className={`checkin__toggle ${
                      isCheckedIn
                        ? 'checkin__toggle--checked'
                        : 'checkin__toggle--unchecked'
                    }`}
                    onClick={() => handleToggle(guest)}
                    disabled={toggleCheckIn.isPending}
                    aria-label={isCheckedIn ? 'Check out' : 'Check in'}
                  >
                    {isCheckedIn ? '✓' : ''}
                  </button>
                  <div className="checkin__guest-info">
                    <span className="checkin__guest-name">{guest.name}</span>
                    <div className="checkin__guest-meta">
                      {guest.table && (
                        <span className="checkin__table-badge">
                          Table {guest.table.number}
                        </span>
                      )}
                      {!guest.table && (
                        <span className="checkin__table-badge checkin__table-badge--unassigned">
                          Unassigned
                        </span>
                      )}
                      {rsvp && (
                        <span
                          className={`checkin__rsvp-badge checkin__rsvp-badge--${rsvp}`}
                        >
                          {rsvp === 'attending'
                            ? 'Attending'
                            : rsvp === 'not_attending'
                              ? 'Declined'
                              : 'Maybe'}
                        </span>
                      )}
                      {!rsvp && (
                        <span className="checkin__rsvp-badge checkin__rsvp-badge--pending">
                          No RSVP
                        </span>
                      )}
                    </div>
                  </div>
                  {isCheckedIn && (
                    <div className="checkin__plus-ones">
                      <label className="checkin__plus-ones-label">+1s</label>
                      <input
                        type="number"
                        className="input checkin__plus-ones-input"
                        value={checkIn?.plus_ones_actual ?? 0}
                        min={0}
                        max={10}
                        onChange={(e) =>
                          handlePlusOnesChange(
                            guest.id,
                            parseInt(e.target.value, 10) || 0,
                          )
                        }
                      />
                    </div>
                  )}
                  {isCheckedIn && checkIn && (
                    <span className="checkin__time">
                      {new Date(checkIn.checked_in_at).toLocaleTimeString(
                        'en-US',
                        { hour: 'numeric', minute: '2-digit' },
                      )}
                    </span>
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
