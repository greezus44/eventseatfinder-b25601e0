import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTables, useCreateTable, useDeleteTable, useUpdateTablePosition } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import type { Table } from '@/types/table';

const CANVAS_WIDTH = 1000;
const CARD_WIDTH = 180;
const CARD_HEIGHT = 140;

interface DragState {
  id: string;
  offsetX: number;
  offsetY: number;
}

interface NewTableForm {
  name: string;
  number: string;
  capacity: string;
}

export function SeatingArrangementPage() {
  const eventId = useParams<{ eventId: string }>().eventId ?? '';

  const { data: fetchedTables = [], isLoading } = useTables(eventId);
  const { mutateAsync: createTable } = useCreateTable(eventId);
  const { mutateAsync: deleteTable } = useDeleteTable(eventId);
  const { mutateAsync: updateTablePosition } = useUpdateTablePosition(eventId);

  const { data: guests = [] } = useGuests(eventId);
  const { toast } = useToast();

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  // Local copy of tables for smooth dragging without waiting on server round-trips.
  const [tables, setTables] = useState<Table[]>([]);
  const [dragging, setDragging] = useState<DragState | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<NewTableForm>({ name: '', number: '', capacity: '' });

  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);


  // Sync fetched tables into local state when not actively dragging.
  useEffect(() => {
    if (!dragRef.current) {
      setTables(fetchedTables);
    }
  }, [fetchedTables]);

  const guestCountByTable = useCallback(() => {
    const counts = new Map<string, number>();
    for (const guest of guests) {
      if (guest.table_id) {
        counts.set(guest.table_id, (counts.get(guest.table_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [guests]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, table: Table) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - (table.position_x ?? 0);
      const offsetY = e.clientY - rect.top - (table.position_y ?? 0);

      const next: DragState = { id: table.id, offsetX, offsetY };
      dragRef.current = next;
      setDragging(next);
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const current = dragRef.current;
      if (!current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left - current.offsetX;
      let y = e.clientY - rect.top - current.offsetY;

      x = Math.max(0, Math.min(x, CANVAS_WIDTH - CARD_WIDTH));
      y = Math.max(0, Math.min(y, rect.height - CARD_HEIGHT));

      setTables((prev) =>
        prev.map((t) => (t.id === current.id ? { ...t, position_x: x, position_y: y } : t)),
      );
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    const current = dragRef.current;
    dragRef.current = null;
    setDragging(null);

    if (!current || !eventId) return;

    const table = tables.find((t) => t.id === current.id);
    if (!table) return;

    updateTablePosition({
      id: current.id,
      position_x: table.position_x ?? 0,
      position_y: table.position_y ?? 0,
    }).catch((err) => {
      console.error('Failed to persist table position', err);
      toast('Failed to save position', 'error');
    });
  }, [tables, updateTablePosition, eventId, toast]);

  const handleAddSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!eventId) return;

      const name = form.name.trim();
      const number = Number(form.number);
      const capacity = Number(form.capacity);

      if (!name) {
        toast('Name is required', 'error');
        return;
      }
      if (!Number.isFinite(number) || number < 1) {
        toast('Table number must be a positive integer', 'error');
        return;
      }
      if (!Number.isFinite(capacity) || capacity < 1) {
        toast('Capacity must be a positive integer', 'error');
        return;
      }

      setIsSubmitting(true);
      try {
        await createTable({ name, number, capacity });
        toast(`Table created: ${name} has been added.`, 'success');
        setForm({ name: '', number: '', capacity: '' });
        setIsAddModalOpen(false);
      } catch (err) {
        console.error('Failed to create table', err);
        toast('Failed to create table', 'error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, createTable, toast, eventId],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget || !eventId) return;
    try {
      await deleteTable(deleteTarget.id);
      toast(`Table deleted: ${deleteTarget.name} has been removed.`, 'success');
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete table', err);
      toast('Failed to delete table', 'error');
    }
  }, [deleteTarget, deleteTable, toast, eventId]);

  if (!eventId) {
    return (
      <div className="sa-page">
        <div className="sa-empty">
          <p>No event selected.</p>
          <Link to="/dashboard" className="sa-back-link">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const counts = guestCountByTable();

  return (
    <div className="sa-page">
      <header className="sa-header">
        <div className="sa-header-left">
          <Link to={`/events/${eventId}`} className="sa-back-link">← Back to event</Link>
          <h1 className="sa-title">Seating Arrangement</h1>
        </div>
        <button type="button" className="sa-add-btn" onClick={() => setIsAddModalOpen(true)}>
          + Add Table
        </button>
      </header>

      {isLoading ? (
        <div className="sa-loading">Loading tables…</div>
      ) : tables.length === 0 ? (
        <div className="sa-empty">
          <p>No tables yet. Add your first table to start arranging the seating.</p>
          <button type="button" className="sa-add-btn" onClick={() => setIsAddModalOpen(true)}>
            + Add Table
          </button>
        </div>
      ) : (
        <div
          ref={canvasRef}
          className="sa-canvas"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {tables.map((table) => {
            const count = counts.get(table.id) ?? 0;
            const isDragging = dragging?.id === table.id;
            return (
              <div
                key={table.id}
                className={`sa-table-card${isDragging ? ' sa-table-card--dragging' : ''}`}
                style={{
                  left: `${table.position_x ?? 0}px`,
                  top: `${table.position_y ?? 0}px`,
                  width: `${CARD_WIDTH}px`,
                  height: `${CARD_HEIGHT}px`,
                }}
                onMouseDown={(e) => handleMouseDown(e, table)}
              >
                <div className="sa-table-card-header">
                  <span className="sa-table-number">#{table.number}</span>
                  <button
                    type="button"
                    className="sa-delete-btn"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(table);
                    }}
                    aria-label={`Delete ${table.name}`}
                  >
                    ✕
                  </button>
                </div>
                <h3 className="sa-table-name">{table.name}</h3>
                <div className="sa-table-meta">
                  <span className="sa-meta-item">Capacity: {table.capacity}</span>
                  <span className="sa-meta-item">Guests: {count}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={isAddModalOpen} onClose={() => !isSubmitting && setIsAddModalOpen(false)}>
        <form className="sa-form" onSubmit={handleAddSubmit}>
          <h2 className="sa-form-title">Add Table</h2>
          <label className="sa-field">
            <span className="sa-field-label">Name</span>
            <input
              className="sa-input"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Head Table"
              autoFocus
            />
          </label>
          <label className="sa-field">
            <span className="sa-field-label">Table number</span>
            <input
              className="sa-input"
              type="number"
              min={1}
              value={form.number}
              onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
              placeholder="1"
            />
          </label>
          <label className="sa-field">
            <span className="sa-field-label">Capacity</span>
            <input
              className="sa-input"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              placeholder="8"
            />
          </label>
          <div className="sa-form-actions">
            <button
              type="button"
              className="sa-btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="sa-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create table'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete table"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
