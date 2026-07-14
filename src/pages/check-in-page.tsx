import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useGuests } from '@/hooks/use-guests';
import {
  useCheckIns,
  useToggleCheckIn,
  useUpdateCheckInPlusOnes,
} from '@/hooks/use-check-ins';
import { useToast } from '@/providers/toast-provider';
import type { GuestWithTable } from '@/types/guest';
import type { RSVPStatus } from '@/types/rsvp';
import type { CheckIn } from '@/types/check-in';

type FilterTab = 'all' | 'checked-in' | 'not-checked-in';

export function CheckInPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';
  const { data: event, isLoading, error } = useEvent(eid);
  const { data: guests } = useGuests(eid);
  const { data: rsvps } = useRSVPs(eid);
  const { data: checkIns } = useCheckIns(eid);
  const toggleCheckIn = useToggleCheckIn(eid);
  const updatePlusOnes = useUpdateCheckInPlusOnes(eid);
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const rsvpMap = useMemo(
    () => new Map((rsvps ?? []).map((r) => [r.guest_id, r.status])),
    [rsvps],
  );

  const checkInMap = useMemo(
    () => new Map((checkIns ?? []).map((c) => [c.guest_id, c])),
    [checkIns],
  );

  if (isLoading) return <div className="page">Loading...</div>;
  if (error || !event) return <div className="page">Event not found.</div>;

  const totalGuests = guests?.length ?? 0;
  const checkedInCount = (checkIns ?? []).filter((c) => c.checked_in).length;
  const checkInPct = totalGuests > 0 ? (checkedInCount / totalGuests) * 100 : 0;

  const rsvpBadgeClass = (status: RSVPStatus | undefined) => {
    if (status === 'attending')
      return 'checkin__rsvp-badge checkin__rsvp-badge--attending';
    if (status === 'not_attending')
      return 'checkin__rsvp-badge checkin__rsvp-badge--declined';
    return 'checkin__rsvp-badge checkin__rsvp-badge--pending';
  };

  const rsvpLabel = (status: RSVPStatus | undefined) => {
    if (status === 'attending') return 'Attending';
    if (status === 'not_attending') return 'Declined';
    if (status === 'maybe') return 'Maybe';
    return 'No RSVP';
  };

  const tableBadgeClass = (table: GuestWithTable['table']) => {
    if (!table) return 'checkin__table-badge checkin__table-badge--none';
    return 'checkin__table-badge';
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const handleToggle = async (guest: GuestWithTable) => {
    const existing = checkInMap.get(guest.id);
    const newState = !(existing?.checked_in ?? false);
    try {
      await toggleCheckIn.mutateAsync({
        guest_id: guest.id,
        check_in: newState,
      });
      toast(
        newState ? `${guest.name} checked in` : `${guest.name} checked out`,
        'success',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to toggle', 'error');
    }
  };

  const handlePlusOnesChange = async (guest: GuestWithTable, value: number) => {
    try {
      await updatePlusOnes.mutateAsync({
        guest_id: guest.id,
        plus_ones_actual: Math.max(0, value),
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update', 'error');
    }
  };

  const filteredGuests = (guests ?? []).filter((g) => {
    const fullName = g.name.toLowerCase();
    const matchesSearch = !search || fullName.includes(search.toLowerCase());
    const checkIn = checkInMap.get(g.id);
    const isCheckedIn = checkIn?.checked_in ?? false;
    const matchesFilter =
      filter === 'all' ||
      (filter === 'checked-in' && isCheckedIn) ||
      (filter === 'not-checked-in' && !isCheckedIn);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="page">
      <div className="page__header">
        <h1>Check-in — {event.name}</h1>
      </div>

      <div className="card">
        <div className="checkin__stats">
          <div className="checkin__stat checkin__stat--total">
            <span className="checkin__stat__number">{totalGuests}</span>
            <span className="checkin__stat__label">Total</span>
          </div>
          <div className="checkin__stat checkin__stat--checked-in">
            <span className="checkin__stat__number">{checkedInCount}</span>
            <span className="checkin__stat__label">Checked In</span>
          </div>
          <div className="checkin__stat checkin__stat--remaining">
            <span className="checkin__stat__number">
              {totalGuests - checkedInCount}
            </span>
            <span className="checkin__stat__label">Remaining</span>
          </div>
        </div>

        <div className="checkin__progress-bar">
          <div
            className="checkin__progress-fill"
            style={{ width: `${checkInPct}%` }}
          />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="checkin__controls">
          <input
            className="checkin__search input"
            type="text"
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="checkin__filters">
            <button
              className={`btn btn--ghost btn--sm${filter === 'all' ? ' btn--primary' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`btn btn--ghost btn--sm${filter === 'checked-in' ? ' btn--primary' : ''}`}
              onClick={() => setFilter('checked-in')}
            >
              Checked In
            </button>
            <button
              className={`btn btn--ghost btn--sm${filter === 'not-checked-in' ? ' btn--primary' : ''}`}
              onClick={() => setFilter('not-checked-in')}
            >
              Not Checked In
            </button>
          </div>
        </div>

        <div className="checkin__list-card">
          {filteredGuests.length === 0 ? (
            <div className="checkin__empty">
              <p>No guests found.</p>
            </div>
          ) : (
            <div className="checkin__list">
              {filteredGuests.map((guest) => {
                const checkIn = checkInMap.get(guest.id) as CheckIn | undefined;
                const isCheckedIn = checkIn?.checked_in ?? false;
                const rsvpStatus = rsvpMap.get(guest.id);
                return (
                  <div
                    key={guest.id}
                    className={`checkin__row${isCheckedIn ? ' checkin__row--checked' : ''}`}
                  >
                    <button
                      className={`checkin__toggle${isCheckedIn ? ' checkin__toggle--on' : ' checkin__toggle--off'}`}
                      onClick={() => handleToggle(guest)}
                    >
                      {isCheckedIn ? '✓' : ''}
                    </button>
                    <div className="checkin__guest-info">
                      <span className="checkin__guest-name">{guest.name}</span>
                      <div className="checkin__guest-meta">
                        <span className={tableBadgeClass(guest.table)}>
                          {guest.table ? guest.table.name : 'No table'}
                        </span>
                        <span className={rsvpBadgeClass(rsvpStatus)}>
                          {rsvpLabel(rsvpStatus)}
                        </span>
                        {isCheckedIn && checkIn?.checked_in_at && (
                          <span className="checkin__time">
                            {formatTime(checkIn.checked_in_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    {isCheckedIn &&
                      (checkIn?.plus_ones_checked_in ?? 0) > 0 && (
                        <div className="checkin__plus-ones">
                          <span className="checkin__plus-ones__label">
                            Plus Ones
                          </span>
                          <div className="checkin__plus-ones__controls">
                            <button
                              className="btn btn--ghost btn--sm"
                              onClick={() =>
                                handlePlusOnesChange(
                                  guest,
                                  (checkIn?.plus_ones_checked_in ?? 0) - 1,
                                )
                              }
                            >
                              −
                            </button>
                            <span className="checkin__plus-ones__count">
                              {checkIn?.plus_ones_checked_in ?? 0}
                            </span>
                            <button
                              className="btn btn--ghost btn--sm"
                              onClick={() =>
                                handlePlusOnesChange(
                                  guest,
                                  (checkIn?.plus_ones_checked_in ?? 0) + 1,
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
