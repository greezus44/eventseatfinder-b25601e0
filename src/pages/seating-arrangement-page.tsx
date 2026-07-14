import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests, useUpdateGuest } from '@/hooks/use-guests';
import { useTables, useUpdateTablePosition } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';
import type { Table } from '@/types/table';

type DragType = 'guest' | 'table';

interface DragState {
  type: DragType;
  guestId?: string;
  tableId?: string;
  offsetX: number;
  offsetY: number;
}

export function SeatingArrangementPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = eventId ?? '';

  const { data: event, isLoading } = useEvent(id);
  const { data: guests } = useGuests(id);
  const { data: tables } = useTables(id);
  const updateTablePosition = useUpdateTablePosition(id);
  const updateGuest = useUpdateGuest(id);
  const { toast } = useToast();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverTableId, setHoverTableId] = useState<string | null>(null);
  const [hoverUnassigned, setHoverUnassigned] = useState(false);

  const unassignedGuests: GuestWithTable[] = [];
  const guestsByTable = new Map<string, GuestWithTable[]>();
  if (guests) {
    for (const g of guests) {
      if (g.table_id) {
        const arr = guestsByTable.get(g.table_id) ?? [];
        arr.push(g);
        guestsByTable.set(g.table_id, arr);
      } else {
        unassignedGuests.push(g);
      }
    }
  }

  function handleGuestDragStart(e: React.DragEvent, guest: GuestWithTable) {
    setDragState({
      type: 'guest',
      guestId: guest.id,
      tableId: guest.table_id ?? undefined,
      offsetX: 0,
      offsetY: 0,
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', guest.id);
  }

  function handleTableDragStart(e: React.DragEvent, table: Table) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragState({
      type: 'table',
      tableId: table.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', table.id);
  }

  function handleCanvasDragOver(e: React.DragEvent) {
    if (dragState?.type === 'table') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleCanvasDrop(e: React.DragEvent) {
    if (dragState?.type !== 'table' || !dragState.tableId) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragState.offsetX;
    const y = e.clientY - rect.top - dragState.offsetY;
    const clampedX = Math.max(0, Math.min(x, rect.width - 200));
    const clampedY = Math.max(0, Math.min(y, rect.height - 120));
    updateTablePosition.mutate(
      { id: dragState.tableId, position_x: clampedX, position_y: clampedY },
      {
        onError: () => toast('Could not save table position', 'error'),
      },
    );
    setDragState(null);
  }

  function handleTableDragOver(e: React.DragEvent) {
    if (dragState?.type === 'guest') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const tableId = (e.currentTarget as HTMLElement).dataset.tableId;
      if (tableId) setHoverTableId(tableId);
    }
  }

  function handleTableDragLeave(e: React.DragEvent) {
    const tableId = (e.currentTarget as HTMLElement).dataset.tableId;
    if (tableId === hoverTableId) setHoverTableId(null);
  }

  function handleTableDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setHoverTableId(null);
    if (dragState?.type !== 'guest' || !dragState.guestId) return;
    const targetTableId = (e.currentTarget as HTMLElement).dataset.tableId;
    if (!targetTableId) return;
    if (dragState.tableId === targetTableId) {
      setDragState(null);
      return;
    }
    const guest = guests?.find((g) => g.id === dragState.guestId);
    if (!guest) {
      setDragState(null);
      return;
    }
    updateGuest.mutate(
      { id: dragState.guestId, name: guest.name, table_id: targetTableId },
      {
        onSuccess: () => toast('Guest seated', 'success'),
        onError: () => toast('Could not assign guest', 'error'),
      },
    );
    setDragState(null);
  }

  function handleUnassignedDragOver(e: React.DragEvent) {
    if (dragState?.type === 'guest') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setHoverUnassigned(true);
    }
  }

  function handleUnassignedDragLeave() {
    setHoverUnassigned(false);
  }

  function handleUnassignedDrop(e: React.DragEvent) {
    e.preventDefault();
    setHoverUnassigned(false);
    if (dragState?.type !== 'guest' || !dragState.guestId) return;
    if (!dragState.tableId) {
      setDragState(null);
      return;
    }
    const guest = guests?.find((g) => g.id === dragState.guestId);
    if (!guest) {
      setDragState(null);
      return;
    }
    updateGuest.mutate(
      { id: dragState.guestId, name: guest.name, table_id: null },
      {
        onSuccess: () => toast('Guest unassigned', 'success'),
        onError: () => toast('Could not unassign guest', 'error'),
      },
    );
    setDragState(null);
  }

  function handleDragEnd() {
    setDragState(null);
    setHoverTableId(null);
    setHoverUnassigned(false);
  }

  if (isLoading) return <LoadingScreen label="Loading seating…" />;

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

  const hasTables = tables && tables.length > 0;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Seating Arrangement</h1>
          <p className="text-secondary">{event.name}</p>
        </div>
        <Link to={`/events/${id}`} className="btn btn--ghost btn--sm">
          ← Back to event
        </Link>
      </div>

      {(updateTablePosition.isPending || updateGuest.isPending) && (
        <div className="seating-saving">Saving…</div>
      )}

      <div className="seating-layout">
        <div
          ref={canvasRef}
          className="seating-canvas"
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
        >
          {!hasTables && (
            <div className="seating-canvas__empty">
              No tables yet. Add tables from the Guests page to start arranging.
            </div>
          )}

          {tables?.map((table) => {
            const tableGuests = guestsByTable.get(table.id) ?? [];
            const isDragging =
              dragState?.type === 'table' && dragState.tableId === table.id;
            const isHover = hoverTableId === table.id;
            return (
              <div
                key={table.id}
                data-table-id={table.id}
                className={`seating-table${isDragging ? ' seating-table--dragging' : ''}${isHover ? ' seating-table--hover' : ''}`}
                style={{
                  left: table.position_x ?? 20,
                  top: table.position_y ?? 20,
                }}
                draggable
                onDragStart={(e) => handleTableDragStart(e, table)}
                onDragOver={handleTableDragOver}
                onDragLeave={handleTableDragLeave}
                onDrop={handleTableDrop}
                onDragEnd={handleDragEnd}
              >
                <div className="seating-table__header">
                  <span className="seating-table__name">{table.name}</span>
                  <span className="seating-table__number">#{table.number}</span>
                </div>
                <div className="seating-table__count">
                  {tableGuests.length} / {table.capacity} guests
                </div>
                <div className="seating-table__guests">
                  {tableGuests.length === 0 ? (
                    <span className="seating-table__empty">
                      Drop guests here
                    </span>
                  ) : (
                    tableGuests.map((g) => (
                      <div
                        key={g.id}
                        className={`guest-chip${dragState?.type === 'guest' && dragState.guestId === g.id ? ' guest-chip--dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleGuestDragStart(e, g)}
                        onDragEnd={handleDragEnd}
                      >
                        {g.name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="seating-sidebar">
          <div
            className={`unassigned-drop-zone${hoverUnassigned ? ' unassigned-drop-zone--hover' : ''}`}
            onDragOver={handleUnassignedDragOver}
            onDragLeave={handleUnassignedDragLeave}
            onDrop={handleUnassignedDrop}
          >
            <h3>Unassigned Guests</h3>
            {unassignedGuests.length === 0 ? (
              <p className="text-secondary">All guests are seated.</p>
            ) : (
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
                    className={`guest-chip guest-chip--unassigned${dragState?.type === 'guest' && dragState.guestId === g.id ? ' guest-chip--dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleGuestDragStart(e, g)}
                    onDragEnd={handleDragEnd}
                  >
                    {g.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="seating-tips">
            <h3>Tips</h3>
            <ul>
              <li>Drag table cards to reposition them on the canvas.</li>
              <li>Drag guest chips between tables to seat them.</li>
              <li>
                Drop a guest in the unassigned zone to remove their table.
              </li>
              <li>Positions save automatically.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
