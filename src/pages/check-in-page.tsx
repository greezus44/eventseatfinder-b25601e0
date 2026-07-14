import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGuests } from '@/hooks/use-guests';
import { useCheckIns, useToggleCheckIn, useUpdateCheckInPlusOnes } from '@/hooks/use-check-ins';
import { useToast } from '@/providers/toast-provider';

export function CheckInPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();

  const { data: guests, isLoading } = useGuests(eventId ?? '');
  const { data: checkIns } = useCheckIns(eventId ?? '');
  const toggleCheckIn = useToggleCheckIn(eventId ?? '');
  const updatePlusOnes = useUpdateCheckInPlusOnes(eventId ?? '');

  const [search, setSearch] = useState('');

  const checkInByGuestId = useMemo(() => {
    const map = new Map<string, typeof checkIns extends (infer T)[] | undefined ? T : never>();
    if (!checkIns) return map;
    for (const ci of checkIns) {
      map.set(ci.guest_id, ci);
    }
    return map;
  }, [checkIns]);

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((g) => g.name.toLowerCase().includes(q));
  }, [guests, search]);

  const checkedInCount = checkIns ? checkIns.length : 0;
  const totalGuests = guests ? guests.length : 0;

  async function handleToggle(guestId: string, currentlyCheckedIn: boolean) {
    try {
      await toggleCheckIn.mutateAsync({
        guest_id: guestId,
        check_in: !currentlyCheckedIn,
      });
      toast(currentlyCheckedIn ? 'Checked out' : 'Checked in', 'success');
    } catch {
      toast('Could not update check-in status', 'error');
    }
  }

  async function handlePlusOnesChange(guestId: string, current: number, delta: number) {
    const next = Math.max(0, current + delta);
    if (next === current) return;
    try {
      await updatePlusOnes.mutateAsync({ guest_id: guestId, plus_ones_actual: next });
    } catch {
      toast('Could not update plus-ones count', 'error');
    }
  }

  return (
    <div className="ci-page">
      <header className="ci-header">
        <Link to={`/events/${eventId}`} className="ci-back-link">← Back to event</Link>
        <h1 className="ci-title">Check-in</h1>
      </header>

      <section className="ci-stats">
        <div className="ci-stat">
          <span className="ci-stat-value">{checkedInCount}</span>
          <span className="ci-stat-label">Checked in</span>
        </div>
        <div className="ci-stat-divider" />
        <div className="ci-stat">
          <span className="ci-stat-value">{totalGuests}</span>
          <span className="ci-stat-label">Total guests</span>
        </div>
      </section>

      <div className="ci-search-wrap">
        <input
          type="text"
          className="ci-search-input"
          placeholder="Search guests by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="ci-guest-list">
        {isLoading ? (
          <div className="ci-loading">Loading guests…</div>
        ) : filteredGuests.length === 0 ? (
          <div className="ci-empty">
            {search.trim() ? 'No guests match your search.' : 'No guests have been added to this event yet.'}
          </div>
        ) : (
          filteredGuests.map((guest) => {
            const checkIn = checkInByGuestId.get(guest.id);
            const isCheckedIn = Boolean(checkIn);
            const plusOnesActual = checkIn?.plus_ones_actual ?? 0;

            return (
              <div key={guest.id} className={`ci-guest-row ${isCheckedIn ? 'ci-guest-row--checked' : ''}`}>
                <div className="ci-guest-info">
                  <span className="ci-guest-name">{guest.name}</span>
                  {guest.table && (
                    <span className="ci-guest-table">
                      Table {guest.table.number}{guest.table.name ? ` · ${guest.table.name}` : ''}
                    </span>
                  )}
                </div>

                <div className="ci-guest-actions">
                  {isCheckedIn && (
                    <div className="ci-plus-ones">
                      <button
                        type="button"
                        className="ci-plus-ones-btn"
                        onClick={() => handlePlusOnesChange(guest.id, plusOnesActual, -1)}
                        disabled={updatePlusOnes.isPending}
                      >−</button>
                      <span className="ci-plus-ones-count">+{plusOnesActual}</span>
                      <button
                        type="button"
                        className="ci-plus-ones-btn"
                        onClick={() => handlePlusOnesChange(guest.id, plusOnesActual, 1)}
                        disabled={updatePlusOnes.isPending}
                      >+</button>
                    </div>
                  )}
                  <button
                    type="button"
                    className={`ci-checkin-btn ${isCheckedIn ? 'ci-checkin-btn--checked' : ''}`}
                    onClick={() => handleToggle(guest.id, isCheckedIn)}
                    disabled={toggleCheckIn.isPending}
                  >
                    {isCheckedIn ? 'Checked in' : 'Check in'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
