import { useState, useRef, type MouseEvent, type DragEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTables, useUpdateTablePosition } from '@/hooks/use-tables';
import { useGuests, useUpdateGuest } from '@/hooks/use-guests';
import { useToast } from '@/providers/toast-provider';
import { Spinner, ErrorScreen, LoadingScreen } from '@/components/ui/feedback';
import type { Table } from '@/types/table';

export function SeatingArrangementPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';

  const { data: tables, isLoading, error } = useTables(eid);
  const { data: guests } = useGuests(eid);
  const updateTablePosition = useUpdateTablePosition(eid);
  const updateGuest = useUpdateGuest(eid);
  const { toast } = useToast();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedGuestId, setDraggedGuestId] = useState<string | null>(null);
  const [dropTargetTableId, setDropTargetTableId] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localPositions, setLocalPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const localPositionsRef = useRef(localPositions);
  localPositionsRef.current = localPositions;

  if (isLoading)
    return <LoadingScreen message="Loading seating arrangement..." />;
  if (error)
    return <ErrorScreen message="Failed to load seating arrangement" />;

  const handleTableMouseDown = (e: MouseEvent, table: Table) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const tableEl = e.currentTarget as HTMLElement;
    const tableRect = tableEl.getBoundingClientRect();
    const offsetX = e.clientX - tableRect.left;
    const offsetY = e.clientY - tableRect.top;

    const handleMouseMove = (moveE: MouseEvent) => {
      const x = moveE.clientX - rect.left - offsetX;
      const y = moveE.clientY - rect.top - offsetY;
      const clampedX = Math.max(0, Math.min(x, rect.width - tableRect.width));
      const clampedY = Math.max(0, Math.min(y, rect.height - tableRect.height));
      updateTablePositionLocally(table.id, clampedX, clampedY);
    };

    const handleMouseUp = () => {
      document.removeEventListener(
        'mousemove',
        handleMouseMove as unknown as EventListener,
      );
      document.removeEventListener('mouseup', handleMouseUp);
      scheduleSave(table.id);
    };

    document.addEventListener(
      'mousemove',
      handleMouseMove as unknown as EventListener,
    );
    document.addEventListener('mouseup', handleMouseUp);
  };

  const updateTablePositionLocally = (
    tableId: string,
    x: number,
    y: number,
  ) => {
    setLocalPositions((prev) => {
      const next = { ...prev, [tableId]: { x, y } };
      localPositionsRef.current = next;
      return next;
    });
  };

  const scheduleSave = (tableId: string) => {
    setIsSaving(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const pos = localPositionsRef.current[tableId];
      if (pos) {
        try {
          await updateTablePosition.mutateAsync({
            id: tableId,
            position_x: pos.x,
            position_y: pos.y,
          });
        } catch {
          toast('Failed to save table position', 'error');
        }
      }
      setIsSaving(false);
    }, 800);
  };

  const getTablePosition = (table: Table): { x: number; y: number } => {
    const local = localPositions[table.id];
    if (local) return local;
    return {
      x: table.position_x ?? 50 + (tables ?? []).indexOf(table) * 30,
      y: table.position_y ?? 50,
    };
  };

  const guestsAtTable = (tableId: string) =>
    (guests ?? []).filter((g) => g.table_id === tableId);

  const unassignedGuests = (guests ?? []).filter((g) => !g.table_id);

  const handleGuestDragStart = (e: DragEvent, guestId: string) => {
    setDraggedGuestId(guestId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTableDragOver = (e: DragEvent, tableId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetTableId(tableId);
  };

  const handleTableDrop = async (e: DragEvent, tableId: string) => {
    e.preventDefault();
    setDropTargetTableId(null);
    if (!draggedGuestId) return;
    try {
      await updateGuest.mutateAsync({ id: draggedGuestId, table_id: tableId });
      toast('Guest seated', 'success');
    } catch {
      toast('Failed to seat guest', 'error');
    }
    setDraggedGuestId(null);
  };

  const handleUnassignedDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDropTargetTableId(null);
    if (!draggedGuestId) return;
    try {
      await updateGuest.mutateAsync({ id: draggedGuestId, table_id: null });
      toast('Guest unassigned', 'success');
    } catch {
      toast('Failed to unassign guest', 'error');
    }
    setDraggedGuestId(null);
  };

  const handleUnassignedDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetTableId('unassigned');
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <Link
            to={`/events/${eid}`}
            className="btn btn--ghost btn--sm"
            style={{ marginBottom: 'var(--space-2)' }}
          >
            ← Back to Event
          </Link>
          <h1>Seating Arrangement</h1>
        </div>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          {isSaving && (
            <span
              className="text-secondary flex gap-2"
              style={{ alignItems: 'center' }}
            >
              <Spinner size={16} /> Saving...
            </span>
          )}
          <Link to={`/events/${eid}/guests`} className="btn btn--secondary">
            Manage Guests
          </Link>
        </div>
      </div>

      <div className="page__body seating-layout">
        <div
          className="seating-canvas"
          ref={canvasRef}
          onDragOver={handleUnassignedDragOver}
          onDrop={handleUnassignedDrop}
        >
          {(tables ?? []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <p className="text-secondary">
                No tables yet. Add tables from the Guest Management page.
              </p>
            </div>
          ) : (
            (tables ?? []).map((table) => {
              const pos = getTablePosition(table);
              const tableGuests = guestsAtTable(table.id);
              const isDropTarget = dropTargetTableId === table.id;
              return (
                <div
                  key={table.id}
                  className={`seating-table ${isDropTarget ? 'seating-table--drop-target' : ''}`}
                  style={{ left: pos.x, top: pos.y }}
                  onMouseDown={(e) => handleTableMouseDown(e, table)}
                  onDragOver={(e) => handleTableDragOver(e, table.id)}
                  onDrop={(e) => handleTableDrop(e, table.id)}
                >
                  <div className="seating-table__header">
                    <span className="seating-table__name">{table.name}</span>
                    <span className="seating-table__number">
                      #{table.number}
                    </span>
                  </div>
                  <div className="seating-table__count">
                    {tableGuests.length}/{table.capacity} guests
                  </div>
                  <div className="seating-table__guests">
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
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="seating-sidebar">
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-3)' }}>
              Unassigned Guests
            </h3>
            <div
              className={`unassigned-drop-zone ${dropTargetTableId === 'unassigned' ? 'unassigned-drop-zone--active' : ''}`}
              onDragOver={handleUnassignedDragOver}
              onDrop={handleUnassignedDrop}
            >
              {unassignedGuests.length === 0 ? (
                <p className="text-secondary" style={{ textAlign: 'center' }}>
                  All guests are seated. Drag a guest here to unassign.
                </p>
              ) : (
                unassignedGuests.map((g) => (
                  <div
                    key={g.id}
                    className="guest-chip"
                    draggable
                    onDragStart={(e) => handleGuestDragStart(e, g.id)}
                  >
                    {g.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
