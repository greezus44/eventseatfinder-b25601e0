import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTables, useUpdateTablePosition } from '@/hooks/use-tables';
import { useGuests, useUpdateGuest } from '@/hooks/use-guests';
import { useToast } from '@/providers/toast-provider';
import { Spinner, LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { Table } from '@/types/table';
import type { GuestWithTable } from '@/types/guest';

const CANVAS_PADDING = 16;
const TABLE_WIDTH = 200;
const TABLE_HEIGHT = 140;

export function SeatingArrangementPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';

  const { data: tables, isLoading, error } = useTables(eid);
  const { data: guests } = useGuests(eid);
  const updateTablePosition = useUpdateTablePosition(eid);
  const updateGuest = useUpdateGuest(eid);
  const { toast } = useToast();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [saving, setSaving] = useState(false);
  const [dragGuestId, setDragGuestId] = useState<string | null>(null);
  const [dropTargetTableId, setDropTargetTableId] = useState<string | null>(
    null,
  );

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tables) {
      const pos: Record<string, { x: number; y: number }> = {};
      tables.forEach((t) => {
        pos[t.id] = {
          x: t.position_x ?? 50,
          y: t.position_y ?? 50,
        };
      });
      setPositions(pos);
    }
  }, [tables]);

  const guestsByTable = useMemo(() => {
    const map: Record<string, GuestWithTable[]> = {};
    guests?.forEach((g) => {
      if (g.table_id) {
        if (!map[g.table_id]) map[g.table_id] = [];
        map[g.table_id].push(g);
      }
    });
    return map;
  }, [guests]);

  const unassignedGuests = useMemo(
    () => guests?.filter((g) => !g.table_id) ?? [],
    [guests],
  );

  const clampPosition = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x, y };
    const maxX = canvas.clientWidth - TABLE_WIDTH - CANVAS_PADDING;
    const maxY = canvas.clientHeight - TABLE_HEIGHT - CANVAS_PADDING;
    return {
      x: Math.max(CANVAS_PADDING, Math.min(x, maxX)),
      y: Math.max(CANVAS_PADDING, Math.min(y, maxY)),
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent, table: Table) => {
    e.preventDefault();
    const pos = positions[table.id] ?? { x: 50, y: 50 };
    setDraggingId(table.id);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingId) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      const clamped = clampPosition(x, y);
      setPositions((prev) => ({ ...prev, [draggingId]: clamped }));
    },
    [draggingId, dragOffset, clampPosition],
  );

  const handleMouseUp = useCallback(() => {
    if (!draggingId) return;
    const pos = positions[draggingId];
    if (pos) {
      setSaving(true);
      updateTablePosition.mutate(
        { id: draggingId, position_x: pos.x, position_y: pos.y },
        {
          onSuccess: () => {
            setSaving(false);
          },
          onError: () => {
            setSaving(false);
            toast('Failed to save position', 'error');
          },
        },
      );
    }
    setDraggingId(null);
  }, [draggingId, positions, updateTablePosition, toast]);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  const handleGuestDragStart = (e: React.DragEvent, guestId: string) => {
    setDragGuestId(guestId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', guestId);
  };

  const handleDropOnTable = (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData('text/plain') || dragGuestId;
    if (!guestId) return;
    updateGuest.mutate(
      { id: guestId, table_id: tableId },
      {
        onSuccess: () => toast('Guest assigned to table', 'success'),
        onError: () => toast('Failed to assign guest', 'error'),
      },
    );
    setDragGuestId(null);
    setDropTargetTableId(null);
  };

  const handleDropOnUnassigned = (e: React.DragEvent) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData('text/plain') || dragGuestId;
    if (!guestId) return;
    updateGuest.mutate(
      { id: guestId, table_id: null },
      {
        onSuccess: () => toast('Guest moved to unassigned', 'success'),
        onError: () => toast('Failed to move guest', 'error'),
      },
    );
    setDragGuestId(null);
  };

  if (isLoading) return <LoadingScreen message="Loading seating..." />;
  if (error) return <ErrorScreen message="Failed to load seating." />;

  return (
    <div className="page">
      <div className="page__header">
        <Link
          to={`/events/${eid}`}
          className="text-secondary"
          style={{
            fontSize: '0.875rem',
            marginBottom: 'var(--space-2)',
            display: 'inline-block',
          }}
        >
          ← Back to Event Settings
        </Link>
        <div
          className="flex"
          style={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <h1>Seating Arrangement</h1>
          <div className="flex gap-2">
            {saving && (
              <span
                className="text-muted flex gap-2"
                style={{ alignItems: 'center', fontSize: '0.875rem' }}
              >
                <Spinner size={14} /> Saving...
              </span>
            )}
            <Link
              to={`/events/${eid}/print`}
              className="btn btn--secondary btn--sm"
            >
              Print
            </Link>
            <Link
              to={`/events/${eid}/check-in`}
              className="btn btn--secondary btn--sm"
            >
              Check-in
            </Link>
          </div>
        </div>
      </div>
      <div className="page__body">
        <div className="seating-layout">
          <div
            className="seating-canvas"
            ref={canvasRef}
            onDragOver={(e) => e.preventDefault()}
          >
            {tables && tables.length === 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <p className="text-muted">
                  No tables yet. Add tables from the Guests page.
                </p>
              </div>
            )}
            {tables?.map((table) => {
              const pos = positions[table.id] ?? { x: 50, y: 50 };
              const tableGuests = guestsByTable[table.id] ?? [];
              return (
                <div
                  key={table.id}
                  className="seating-table"
                  style={{
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                    width: TABLE_WIDTH,
                    minHeight: TABLE_HEIGHT,
                    cursor: draggingId === table.id ? 'grabbing' : 'grab',
                    border:
                      dropTargetTableId === table.id
                        ? '2px solid var(--primary)'
                        : undefined,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, table)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropTargetTableId(table.id);
                  }}
                  onDragLeave={() => {
                    setDropTargetTableId((id) => (id === table.id ? null : id));
                  }}
                  onDrop={(e) => handleDropOnTable(e, table.id)}
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
                      <div style={{ fontWeight: 600 }}>{table.name}</div>
                      <div
                        className="text-muted"
                        style={{ fontSize: '0.75rem' }}
                      >
                        #{table.number} · {tableGuests.length}/{table.capacity}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--space-1)',
                    }}
                  >
                    {tableGuests.map((g) => (
                      <span
                        key={g.id}
                        className="guest-chip"
                        draggable
                        onDragStart={(e) => handleGuestDragStart(e, g.id)}
                      >
                        {g.name}
                      </span>
                    ))}
                    {tableGuests.length === 0 && (
                      <span
                        className="text-muted"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Drop guests here
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="seating-sidebar">
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>
                Unassigned Guests
              </h3>
              <div
                className="unassigned-drop-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropOnUnassigned}
                style={{
                  minHeight: 100,
                  border: '2px dashed var(--border)',
                  borderRadius: 8,
                  padding: 'var(--space-2)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-1)',
                  alignContent: 'flex-start',
                }}
              >
                {unassignedGuests.length === 0 ? (
                  <span
                    className="text-muted"
                    style={{ fontSize: '0.875rem', padding: 'var(--space-2)' }}
                  >
                    All guests are assigned. Drag a guest here to unassign.
                  </span>
                ) : (
                  unassignedGuests.map((g) => (
                    <span
                      key={g.id}
                      className="guest-chip"
                      draggable
                      onDragStart={(e) => handleGuestDragStart(e, g.id)}
                    >
                      {g.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
