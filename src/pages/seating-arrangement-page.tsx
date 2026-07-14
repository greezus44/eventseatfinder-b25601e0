import {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  type MouseEvent,
  type DragEvent,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTables, useUpdateTablePosition } from '@/hooks/use-tables';
import { useGuests, useUpdateGuest } from '@/hooks/use-guests';
import { useToast } from '@/providers/toast-provider';
import { LoadingScreen, ErrorScreen, Spinner } from '@/components/ui/feedback';
import type { Table } from '@/types/table';
import type { GuestWithTable } from '@/types/guest';

const CANVAS_PADDING = 24;
const TABLE_WIDTH = 180;
const TABLE_HEIGHT = 140;

export function SeatingArrangementPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const {
    data: tables,
    isLoading: tablesLoading,
    error: tablesError,
  } = useTables(eventId ?? '');
  const {
    data: guests,
    isLoading: guestsLoading,
    error: guestsError,
  } = useGuests(eventId ?? '');
  const updateTablePosition = useUpdateTablePosition(eventId ?? '');
  const updateGuest = useUpdateGuest(eventId ?? '');
  const { toast } = useToast();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingTable, setDraggingTable] = useState<Table | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [saving, setSaving] = useState(false);
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);
  const [dragOverUnassigned, setDragOverUnassigned] = useState(false);

  const guestsByTable = useMemo(() => {
    const map = new Map<string, GuestWithTable[]>();
    for (const guest of guests ?? []) {
      if (guest.table_id) {
        const list = map.get(guest.table_id) ?? [];
        list.push(guest);
        map.set(guest.table_id, list);
      }
    }
    return map;
  }, [guests]);

  const unassignedGuests = useMemo(
    () => (guests ?? []).filter((g) => !g.table_id),
    [guests],
  );

  useEffect(() => {
    if (tables) {
      const posMap: Record<string, { x: number; y: number }> = {};
      for (const t of tables) {
        posMap[t.id] = {
          x: t.position_x ?? 0,
          y: t.position_y ?? 0,
        };
      }
      setPositions(posMap);
    }
  }, [tables]);

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>, table: Table) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const pos = positions[table.id] ?? { x: 0, y: 0 };
      const offsetX = e.clientX - rect.left - pos.x + CANVAS_PADDING;
      const offsetY = e.clientY - rect.top - pos.y + CANVAS_PADDING;

      setDraggingTable(table);
      setDragOffset({ x: offsetX, y: offsetY });
    },
    [positions],
  );

  useEffect(() => {
    if (!draggingTable) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left - dragOffset.x;
      let y = e.clientY - rect.top - dragOffset.y;

      x = Math.max(
        0,
        Math.min(x, rect.width - TABLE_WIDTH - 2 * CANVAS_PADDING),
      );
      y = Math.max(
        0,
        Math.min(y, rect.height - TABLE_HEIGHT - 2 * CANVAS_PADDING),
      );

      setPositions((prev) => ({
        ...prev,
        [draggingTable.id]: { x, y },
      }));
    };

    const handleMouseUp = async () => {
      if (!draggingTable) return;
      const pos = positions[draggingTable.id];
      if (pos) {
        setSaving(true);
        try {
          await updateTablePosition.mutateAsync({
            id: draggingTable.id,
            position_x: Math.round(pos.x),
            position_y: Math.round(pos.y),
          });
        } catch {
          toast('Failed to save position', 'error');
        } finally {
          setSaving(false);
        }
      }
      setDraggingTable(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTable, dragOffset, positions, updateTablePosition, toast]);

  const handleGuestDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, guestId: string) => {
      e.dataTransfer.setData('text/plain', guestId);
      e.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  const handleTableDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleTableDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, tableId: string) => {
      e.preventDefault();
      const guestId = e.dataTransfer.getData('text/plain');
      setDragOverTableId(null);
      if (!guestId) return;

      updateGuest.mutate(
        { id: guestId, table_id: tableId },
        {
          onError: () => toast('Failed to assign guest', 'error'),
        },
      );
    },
    [updateGuest, toast],
  );

  const handleUnassignedDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const guestId = e.dataTransfer.getData('text/plain');
      setDragOverUnassigned(false);
      if (!guestId) return;

      updateGuest.mutate(
        { id: guestId, table_id: null },
        {
          onError: () => toast('Failed to unassign guest', 'error'),
        },
      );
    },
    [updateGuest, toast],
  );

  if (tablesLoading || guestsLoading)
    return <LoadingScreen message="Loading seating..." />;
  if (tablesError) return <ErrorScreen message={tablesError.message} />;
  if (guestsError) return <ErrorScreen message={guestsError.message} />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <Link
            to={`/events/${eventId}`}
            className="btn btn--ghost btn--sm"
            style={{ marginBottom: 'var(--space-1)' }}
          >
            ← Back to Event
          </Link>
          <h1>Seating Arrangement</h1>
        </div>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          {saving && (
            <span
              className="flex gap-2 text-secondary"
              style={{ fontSize: '0.875rem', alignItems: 'center' }}
            >
              <Spinner size={14} />
              Saving...
            </span>
          )}
          <Link
            to={`/events/${eventId}/print`}
            className="btn btn--secondary btn--sm"
          >
            Print View →
          </Link>
        </div>
      </div>

      <div className="page__body">
        <div className="seating-layout">
          <div
            className="seating-canvas"
            ref={canvasRef}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {tables && tables.length > 0 ? (
              tables.map((table) => {
                const pos = positions[table.id] ?? { x: 0, y: 0 };
                const tableGuests = guestsByTable.get(table.id) ?? [];
                const isOver = dragOverTableId === table.id;

                return (
                  <div
                    key={table.id}
                    className="seating-table"
                    style={{
                      position: 'absolute',
                      left: `${pos.x + CANVAS_PADDING}px`,
                      top: `${pos.y + CANVAS_PADDING}px`,
                      width: `${TABLE_WIDTH}px`,
                      minHeight: `${TABLE_HEIGHT}px`,
                      cursor:
                        draggingTable?.id === table.id ? 'grabbing' : 'grab',
                      borderColor: isOver ? 'var(--primary)' : undefined,
                      boxShadow: isOver
                        ? '0 0 0 2px var(--primary)'
                        : undefined,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, table)}
                    onDragOver={handleTableDragOver}
                    onDrop={(e) => handleTableDrop(e, table.id)}
                    onDragEnter={() => setDragOverTableId(table.id)}
                    onDragLeave={() => setDragOverTableId(null)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          Table {table.number}
                        </div>
                        {table.name && (
                          <div
                            className="text-muted"
                            style={{ fontSize: '0.8125rem' }}
                          >
                            {table.name}
                          </div>
                        )}
                      </div>
                      <span className="badge badge--info">
                        {tableGuests.length}/{table.capacity}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 'var(--space-1)',
                      }}
                    >
                      {tableGuests.map((g) => (
                        <div
                          key={g.id}
                          className="guest-chip"
                          draggable
                          onDragStart={(e) => handleGuestDragStart(e, g.id)}
                        >
                          {g.name}
                        </div>
                      ))}
                      {tableGuests.length === 0 && (
                        <span
                          className="text-muted"
                          style={{ fontSize: '0.8125rem' }}
                        >
                          Drag guests here
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <p
                  className="text-secondary"
                  style={{ marginBottom: 'var(--space-2)' }}
                >
                  No tables yet
                </p>
                <p className="text-muted">
                  Add tables from the Guest Management page to start arranging
                  seating.
                </p>
                <Link
                  to={`/events/${eventId}/guests`}
                  className="btn btn--secondary btn--sm"
                  style={{ marginTop: 'var(--space-3)' }}
                >
                  Manage Tables →
                </Link>
              </div>
            )}
          </div>

          <div className="seating-sidebar">
            <h3 style={{ marginBottom: 'var(--space-3)' }}>
              Unassigned Guests
            </h3>
            <div
              className={`unassigned-drop-zone ${dragOverUnassigned ? 'unassigned-drop-zone--active' : ''}`}
              onDragOver={handleTableDragOver}
              onDrop={handleUnassignedDrop}
              onDragEnter={() => setDragOverUnassigned(true)}
              onDragLeave={() => setDragOverUnassigned(false)}
            >
              {unassignedGuests.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                  }}
                >
                  {unassignedGuests.map((g) => (
                    <div
                      key={g.id}
                      className="guest-chip"
                      draggable
                      onDragStart={(e) => handleGuestDragStart(e, g.id)}
                    >
                      {g.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className="text-muted"
                  style={{ fontSize: '0.875rem', textAlign: 'center' }}
                >
                  All guests are seated. Drag a guest chip here to unassign.
                </p>
              )}
            </div>
            <p
              className="text-muted"
              style={{ fontSize: '0.8125rem', marginTop: 'var(--space-3)' }}
            >
              Drag guest chips between tables or to the unassigned zone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
