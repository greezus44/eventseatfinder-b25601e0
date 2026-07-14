import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests, useUpdateGuest } from '@/hooks/use-guests';
import { useTables, useUpdateTablePosition } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import type { Table } from '@/types/table';
import type { GuestWithTable } from '@/types/guest';

export function SeatingArrangementPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';
  const { data: event, isLoading } = useEvent(eid);
  const { data: guests } = useGuests(eid);
  const { data: tables } = useTables(eid);
  const updateTablePosition = useUpdateTablePosition(eid);
  const updateGuest = useUpdateGuest(eid);
  const { toast } = useToast();

  const [draggingTable, setDraggingTable] = useState<Table | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingGuest, setDraggingGuest] = useState<GuestWithTable | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const handleTableMouseDown = useCallback(
    (e: React.MouseEvent, table: Table) => {
      e.preventDefault();
      setDraggingTable(table);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingTable) return;
      const canvas = e.currentTarget as HTMLElement;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      const clampedX = Math.max(0, Math.min(x, rect.width - 180));
      const clampedY = Math.max(0, Math.min(y, rect.height - 140));
      setDragOffset((prev) => ({ ...prev, x: clampedX, y: clampedY }));
    },
    [draggingTable, dragOffset],
  );

  const handleTableDrop = useCallback(
    async (e: React.MouseEvent) => {
      if (!draggingTable) return;
      const canvas = e.currentTarget as HTMLElement;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 180),
      );
      const y = Math.max(
        0,
        Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 140),
      );
      setSaving(true);
      try {
        await updateTablePosition.mutateAsync({
          id: draggingTable.id,
          position_x: x,
          position_y: y,
        });
      } catch (err) {
        toast(
          err instanceof Error ? err.message : 'Failed to save position',
          'error',
        );
      } finally {
        setSaving(false);
        setDraggingTable(null);
      }
    },
    [draggingTable, dragOffset, eid, updateTablePosition, toast],
  );

  const handleGuestDragStart = useCallback(
    (e: React.DragEvent, guest: GuestWithTable) => {
      setDraggingGuest(guest);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', guest.id);
    },
    [],
  );

  const handleTableDropGuest = useCallback(
    async (e: React.DragEvent, tableId: string) => {
      e.preventDefault();
      if (!draggingGuest) return;
      if (draggingGuest.table_id === tableId) {
        setDraggingGuest(null);
        return;
      }
      try {
        await updateGuest.mutateAsync({
          id: draggingGuest.id,
          name: draggingGuest.name,
          table_id: tableId,
        });
        toast(`${draggingGuest.name} seated`, 'success');
      } catch (err) {
        toast(
          err instanceof Error ? err.message : 'Failed to seat guest',
          'error',
        );
      } finally {
        setDraggingGuest(null);
      }
    },
    [draggingGuest, updateGuest, toast],
  );

  const handleUnassignedDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggingGuest) return;
      if (!draggingGuest.table_id) {
        setDraggingGuest(null);
        return;
      }
      try {
        await updateGuest.mutateAsync({
          id: draggingGuest.id,
          name: draggingGuest.name,
          table_id: null,
        });
        toast('Guest unassigned', 'success');
      } catch (err) {
        toast(
          err instanceof Error ? err.message : 'Failed to unassign',
          'error',
        );
      } finally {
        setDraggingGuest(null);
      }
    },
    [draggingGuest, updateGuest, toast],
  );

  if (isLoading) return <div className="page">Loading...</div>;
  if (!event) return <div className="page">Event not found.</div>;

  const unassigned = (guests ?? []).filter((g) => !g.table_id);

  return (
    <div className="page">
      <div className="page__header">
        <h1>Seating Arrangement</h1>
        {saving && <span className="seating-saving">Saving...</span>}
      </div>

      <div className="seating-layout">
        <div
          className="seating-canvas"
          onMouseMove={handleMouseMove}
          onMouseUp={handleTableDrop}
          onMouseLeave={handleTableDrop}
        >
          {(!tables || tables.length === 0) && (
            <div className="seating-canvas__empty">
              <p>No tables yet. Add tables from the Guest Management page.</p>
            </div>
          )}

          {tables?.map((table) => {
            const tableGuests = (guests ?? []).filter(
              (g) => g.table_id === table.id,
            );
            return (
              <div
                key={table.id}
                className="seating-table"
                style={{
                  left: table.position_x,
                  top: table.position_y,
                  opacity: draggingTable?.id === table.id ? 0.5 : 1,
                }}
                onMouseDown={(e) => handleTableMouseDown(e, table)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleTableDropGuest(e, table.id)}
              >
                <div className="seating-table__header">
                  <span className="seating-table__name">{table.name}</span>
                  <span className="seating-table__count">
                    {tableGuests.length}/{table.capacity}
                  </span>
                </div>
                <div className="seating-table__guests">
                  {tableGuests.map((g) => (
                    <div
                      key={g.id}
                      className="guest-chip guest-chip--assigned"
                      draggable
                      onDragStart={(e) => handleGuestDragStart(e, g)}
                    >
                      {g.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="seating-sidebar">
          <div className="seating-tips">
            <h3>Tips</h3>
            <ul>
              <li>Drag table cards to reposition them on the canvas.</li>
              <li>Drag guest chips to assign or reassign tables.</li>
              <li>
                Drop a guest in the unassigned zone to remove them from a table.
              </li>
            </ul>
          </div>

          <div
            className={`unassigned-drop-zone${draggingGuest ? ' unassigned-drop-zone--active' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleUnassignedDrop}
          >
            <h3>Unassigned Guests</h3>
            {unassigned.length === 0 ? (
              <p className="unassigned-drop-zone__empty">All guests seated!</p>
            ) : (
              unassigned.map((g) => (
                <div
                  key={g.id}
                  className="guest-chip guest-chip--unassigned"
                  draggable
                  onDragStart={(e) => handleGuestDragStart(e, g)}
                >
                  {g.name}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
