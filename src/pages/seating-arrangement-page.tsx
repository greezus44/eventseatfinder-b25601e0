import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTables, useUpdateTablePosition } from '@/hooks/use-tables';
import { useGuests, useUpdateGuest } from '@/hooks/use-guests';
import { useToast } from '@/providers/toast-provider';
import { ErrorScreen, LoadingScreen } from '@/components/ui/feedback';
import type { Table } from '@/types/table';
import type { GuestWithTable } from '@/types/guest';

const CANVAS_PADDING = 16;
const TABLE_WIDTH = 180;
const TABLE_HEIGHT = 120;

interface DragState {
  tableId: string;
  offsetX: number;
  offsetY: number;
}

export function SeatingArrangementPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';

  const { data: tables, isLoading, error } = useTables(eid);
  const { data: guests } = useGuests(eid);
  const updateTablePosition = useUpdateTablePosition(eid);
  const updateGuest = useUpdateGuest(eid);
  const { toast } = useToast();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);
  const [dragOverSidebar, setDragOverSidebar] = useState(false);

  const guestsByTable = useMemo(() => {
    const map = new Map<string, GuestWithTable[]>();
    guests?.forEach((g) => {
      if (g.table_id) {
        const arr = map.get(g.table_id) ?? [];
        arr.push(g);
        map.set(g.table_id, arr);
      }
    });
    return map;
  }, [guests]);

  const unassignedGuests = useMemo(
    () => guests?.filter((g) => !g.table_id) ?? [],
    [guests],
  );

  useEffect(() => {
    if (!dragState) return;
    const handleMove = (e: globalThis.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - dragState.offsetX;
      const y = e.clientY - rect.top - dragState.offsetY;
      const clampedX = Math.max(
        CANVAS_PADDING,
        Math.min(x, rect.width - TABLE_WIDTH - CANVAS_PADDING),
      );
      const clampedY = Math.max(
        CANVAS_PADDING,
        Math.min(y, rect.height - TABLE_HEIGHT - CANVAS_PADDING),
      );
      updateNodePosition(dragState.tableId, clampedX, clampedY);
    };
    const handleUp = () => {
      finalizePosition(dragState.tableId);
      setDragState(null);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [dragState]);

  const positions = useRef<Map<string, { x: number; y: number }>>(new Map());

  const updateNodePosition = useCallback(
    (tableId: string, x: number, y: number) => {
      positions.current.set(tableId, { x, y });
      const el = document.getElementById(`table-node-${tableId}`);
      if (el) {
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
      }
    },
    [],
  );

  const finalizePosition = useCallback(
    async (tableId: string) => {
      const pos = positions.current.get(tableId);
      if (!pos) return;
      setSavingId(tableId);
      try {
        await updateTablePosition.mutateAsync({
          id: tableId,
          position_x: pos.x,
          position_y: pos.y,
        });
      } catch (err) {
        toast(
          err instanceof Error ? err.message : 'Failed to save position',
          'error',
        );
      } finally {
        setSavingId(null);
        positions.current.delete(tableId);
      }
    },
    [updateTablePosition, toast],
  );

  const handleTableMouseDown = (
    e: MouseEvent<HTMLDivElement>,
    table: Table,
  ) => {
    if ((e.target as HTMLElement).closest('.guest-chip')) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nodeEl = e.currentTarget;
    const nodeRect = nodeEl.getBoundingClientRect();
    setDragState({
      tableId: table.id,
      offsetX: e.clientX - nodeRect.left,
      offsetY: e.clientY - nodeRect.top,
    });
    void rect;
  };

  const handleGuestDragStart = (
    e: DragEvent<HTMLDivElement>,
    guest: GuestWithTable,
  ) => {
    e.dataTransfer.setData('text/plain', guest.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTableDragOver = (
    e: DragEvent<HTMLDivElement>,
    tableId: string,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTableId(tableId);
  };

  const handleTableDrop = async (
    e: DragEvent<HTMLDivElement>,
    tableId: string,
  ) => {
    e.preventDefault();
    setDragOverTableId(null);
    const guestId = e.dataTransfer.getData('text/plain');
    if (!guestId) return;
    const guest = guests?.find((g) => g.id === guestId);
    if (!guest || guest.table_id === tableId) return;
    try {
      await updateGuest.mutateAsync({ id: guestId, table_id: tableId });
      toast('Guest seated', 'success');
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to move guest',
        'error',
      );
    }
  };

  const handleSidebarDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSidebar(true);
  };

  const handleSidebarDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverSidebar(false);
    const guestId = e.dataTransfer.getData('text/plain');
    if (!guestId) return;
    const guest = guests?.find((g) => g.id === guestId);
    if (!guest || !guest.table_id) return;
    try {
      await updateGuest.mutateAsync({ id: guestId, table_id: null });
      toast('Guest unassigned', 'success');
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to unassign guest',
        'error',
      );
    }
  };

  if (isLoading) return <LoadingScreen message="Loading seating…" />;
  if (error)
    return <ErrorScreen message={error.message || 'Failed to load seating'} />;

  return (
    <div className="page page--full">
      <header className="page__header">
        <div>
          <Link to={`/events/${eid}`} className="back-link">
            ← Event settings
          </Link>
          <h1>Seating Arrangement</h1>
        </div>
        {savingId && (
          <span className="saving-indicator">
            <span className="saving-indicator__dot" />
            Saving…
          </span>
        )}
      </header>

      <div className="seating-layout">
        <div className="seating-canvas" ref={canvasRef}>
          {tables && tables.length === 0 && (
            <div className="canvas-empty">
              <p className="text-secondary">
                No tables yet. Add tables from the Guests page to start
                arranging.
              </p>
              <Link to={`/events/${eid}/guests`} className="btn btn--primary">
                Go to Guest Management
              </Link>
            </div>
          )}
          {tables?.map((table) => {
            const tableGuests = guestsByTable.get(table.id) ?? [];
            const x = table.position_x ?? CANVAS_PADDING;
            const y = table.position_y ?? CANVAS_PADDING;
            return (
              <div
                key={table.id}
                id={`table-node-${table.id}`}
                className={`table-node ${
                  dragOverTableId === table.id ? 'table-node--dragover' : ''
                }`}
                style={{ left: x, top: y, width: TABLE_WIDTH }}
                onMouseDown={(e) => handleTableMouseDown(e, table)}
                onDragOver={(e) => handleTableDragOver(e, table.id)}
                onDragLeave={() => setDragOverTableId(null)}
                onDrop={(e) => handleTableDrop(e, table.id)}
              >
                <div className="table-node__head">
                  <span className="table-node__title">
                    {table.name} · #{table.number}
                  </span>
                  <span className="table-node__count">
                    {tableGuests.length}
                    {table.capacity ? ` / ${table.capacity}` : ''}
                  </span>
                </div>
                <div className="table-node__guests">
                  {tableGuests.length === 0 ? (
                    <span className="table-node__empty text-muted">
                      Drop guests here
                    </span>
                  ) : (
                    tableGuests.map((g) => (
                      <div
                        key={g.id}
                        className="guest-chip"
                        draggable
                        onDragStart={(e) => handleGuestDragStart(e, g)}
                      >
                        {g.name}
                      </div>
                    ))
                  )}
                </div>
                <div className="table-node__handle" title="Drag to move">
                  ⠿
                </div>
              </div>
            );
          })}
        </div>

        <aside
          className={`unassigned-sidebar card ${
            dragOverSidebar ? 'unassigned-sidebar--dragover' : ''
          }`}
          onDragOver={handleSidebarDragOver}
          onDragLeave={() => setDragOverSidebar(false)}
          onDrop={handleSidebarDrop}
        >
          <h3 className="unassigned-sidebar__title">
            Unassigned Guests
            <span className="unassigned-sidebar__count">
              {unassignedGuests.length}
            </span>
          </h3>
          <p className="text-muted unassigned-sidebar__hint">
            Drag guests here to unseat them
          </p>
          <div className="unassigned-sidebar__list">
            {unassignedGuests.length === 0 ? (
              <p className="text-muted unassigned-sidebar__empty">
                All guests are seated
              </p>
            ) : (
              unassignedGuests.map((g) => (
                <div
                  key={g.id}
                  className="guest-chip guest-chip--sidebar"
                  draggable
                  onDragStart={(e) => handleGuestDragStart(e, g)}
                >
                  {g.name}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
