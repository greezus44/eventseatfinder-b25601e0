import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import {
  useGuests,
  useCreateGuest,
  useUpdateGuest,
  useDeleteGuest,
  useBulkCreateGuests,
} from '@/hooks/use-guests';
import { useTables, useCreateTable, useDeleteTable } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { LoadingScreen, ErrorScreen, Spinner } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';
import type { Table } from '@/types/table';

export function GuestManagementPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId ?? '');
  const { data: tables } = useTables(eventId ?? '');

  const { toast } = useToast();
  const deleteGuest = useDeleteGuest(eventId ?? '');
  const deleteTable = useDeleteTable(eventId ?? '');

  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<
    | { type: 'guest'; id: string; name: string }
    | { type: 'table'; id: string; name: string }
    | null
  >(null);

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    const q = search.toLowerCase().trim();
    if (!q) return guests;
    return guests.filter((g) => g.name.toLowerCase().includes(q));
  }, [guests, search]);

  if (eventLoading || guestsLoading)
    return <LoadingScreen message="Loading guests…" />;
  if (!event) return <ErrorScreen message="Event not found." />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to={`/events/${eventId}`}
              className="text-secondary"
              style={{ fontSize: '0.875rem' }}
            >
              ← Event settings
            </Link>
          </div>
          <h1 style={{ marginTop: 'var(--space-2)' }}>Guests</h1>
          <p className="text-secondary">{event.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            className="btn btn--secondary"
            onClick={() => setShowImport(true)}
          >
            Bulk Import
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => setShowAddTable(true)}
          >
            + Table
          </button>
        </div>
      </div>

      <div className="guest-mgmt__layout">
        <div className="guest-mgmt__main">
          <div className="page__search">
            <input
              type="text"
              className="input"
              placeholder="Search guests…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <GuestTable
            guests={filteredGuests}
            tables={tables ?? []}
            eventId={eventId!}
            search={search}
          />
        </div>

        <aside className="guest-mgmt__sidebar">
          <TablesPanel
            tables={tables ?? []}
            guests={guests ?? []}
            onAdd={() => setShowAddTable(true)}
            onDelete={(id, name) =>
              setConfirmDelete({ type: 'table', id, name })
            }
          />
        </aside>
      </div>

      {showImport && (
        <BulkImportModal
          eventId={eventId!}
          onClose={() => setShowImport(false)}
        />
      )}

      {showAddTable && (
        <AddTableModal
          eventId={eventId!}
          existingCount={tables?.length ?? 0}
          onClose={() => setShowAddTable(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteDialog
          title={
            confirmDelete.type === 'guest' ? 'Remove guest?' : 'Delete table?'
          }
          message={
            confirmDelete.type === 'guest'
              ? `Remove ${confirmDelete.name} from the guest list?`
              : `Delete ${confirmDelete.name}? Guests at this table will become unassigned.`
          }
          confirmLabel={confirmDelete.type === 'guest' ? 'Remove' : 'Delete'}
          onConfirm={async () => {
            try {
              if (confirmDelete.type === 'guest') {
                await deleteGuest.mutateAsync(confirmDelete.id);
                toast(`Removed ${confirmDelete.name}`, 'success');
              } else {
                await deleteTable.mutateAsync(confirmDelete.id);
                toast(`Deleted ${confirmDelete.name}`, 'success');
              }
            } catch {
              toast('Failed to delete', 'error');
            }
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function GuestTable({
  guests,
  tables,
  eventId,
  search,
}: {
  guests: GuestWithTable[];
  tables: Table[];
  eventId: string;
  search: string;
}) {
  const { toast } = useToast();
  const createGuest = useCreateGuest(eventId);
  const updateGuest = useUpdateGuest(eventId);
  const deleteGuest = useDeleteGuest(eventId);

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTableId, setEditTableId] = useState<string | null>(null);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || createGuest.isPending) return;
    try {
      await createGuest.mutateAsync(newName.trim());
      setNewName('');
      toast('Guest added', 'success');
    } catch {
      toast('Failed to add guest', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await updateGuest.mutateAsync({
        id: editingId,
        name: editName.trim(),
        table_id: editTableId,
      });
      toast('Guest updated', 'success');
      setEditingId(null);
    } catch {
      toast('Failed to update guest', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteGuest.mutateAsync(id);
      toast(`Removed ${name}`, 'success');
    } catch {
      toast('Failed to remove guest', 'error');
    }
  };

  const startEdit = (guest: GuestWithTable) => {
    setEditingId(guest.id);
    setEditName(guest.name);
    setEditTableId(guest.table_id);
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <form onSubmit={handleAdd} className="guest-add-row">
        <input
          type="text"
          className="input"
          placeholder="Add a guest by name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={createGuest.isPending}
        />
        <button
          type="submit"
          className="btn btn--primary"
          disabled={createGuest.isPending || !newName.trim()}
        >
          {createGuest.isPending ? <Spinner size={18} /> : null}
          Add
        </button>
      </form>

      {guests.length === 0 ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <p className="text-secondary">
            {search
              ? 'No guests found.'
              : 'No guests yet. Add your first guest above.'}
          </p>
        </div>
      ) : (
        <div className="guest-list">
          {guests.map((guest) => (
            <div key={guest.id} className="guest-row">
              {editingId === guest.id ? (
                <>
                  <input
                    type="text"
                    className="input guest-row__edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <select
                    className="input guest-row__edit-table"
                    value={editTableId ?? ''}
                    onChange={(e) => setEditTableId(e.target.value || null)}
                  >
                    <option value="">Unassigned</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (#{t.number})
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={handleSaveEdit}
                    disabled={updateGuest.isPending}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn--ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="guest-row__name">{guest.name}</span>
                  {guest.table ? (
                    <span className="badge">
                      {guest.table.name} (#{guest.table.number})
                    </span>
                  ) : (
                    <span className="guest-row__unassigned">Unassigned</span>
                  )}
                  <div className="guest-row__actions">
                    <button
                      className="btn btn--ghost"
                      onClick={() => startEdit(guest)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn--ghost guest-row__delete"
                      onClick={() => handleDelete(guest.id, guest.name)}
                    >
                      ✕
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TablesPanel({
  tables,
  guests,
  onAdd,
  onDelete,
}: {
  tables: Table[];
  guests: GuestWithTable[];
  onAdd: () => void;
  onDelete: (id: string, name: string) => void;
}) {
  const guestCountByTable = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of guests) {
      if (g.table_id) {
        counts.set(g.table_id, (counts.get(g.table_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [guests]);

  return (
    <div className="card" style={{ padding: 'var(--space-5)' }}>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 'var(--space-4)' }}
      >
        <h3>Tables</h3>
        <button className="btn btn--ghost btn--sm" onClick={onAdd}>
          + Add
        </button>
      </div>
      {tables.length === 0 ? (
        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
          No tables yet. Add tables to assign guests.
        </p>
      ) : (
        <div className="table-list">
          {tables.map((t) => (
            <div key={t.id} className="table-row">
              <div className="table-row__info">
                <span className="table-row__name">{t.name}</span>
                <span className="table-row__meta">
                  #{t.number} · {guestCountByTable.get(t.id) ?? 0}/{t.capacity}
                </span>
              </div>
              <button
                className="btn btn--ghost table-row__delete"
                onClick={() => onDelete(t.id, t.name)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BulkImportModal({
  eventId,
  onClose,
}: {
  eventId: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const bulkCreate = useBulkCreateGuests(eventId);
  const [text, setText] = useState('');

  const names = useMemo(
    () =>
      text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [text],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (names.length === 0 || bulkCreate.isPending) return;
    try {
      const created = await bulkCreate.mutateAsync(names);
      toast(`${created.length} guests imported`, 'success');
      onClose();
    } catch {
      toast('Failed to import guests', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Bulk Import Guests</h2>
        <p
          className="text-secondary"
          style={{ marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}
        >
          Paste one name per line.
        </p>
        <form onSubmit={handleSubmit}>
          <textarea
            className="input"
            style={{
              minHeight: '200px',
              resize: 'vertical',
              fontFamily: 'monospace',
            }}
            placeholder={'John Smith\nJane Doe\nBob Johnson'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            disabled={bulkCreate.isPending}
          />
          {names.length > 0 && (
            <p
              className="text-secondary"
              style={{ marginTop: 'var(--space-2)', fontSize: '0.8125rem' }}
            >
              {names.length} guest{names.length !== 1 ? 's' : ''} ready to
              import
            </p>
          )}
          <div
            className="flex gap-3"
            style={{ marginTop: 'var(--space-5)', justifyContent: 'flex-end' }}
          >
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={bulkCreate.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={bulkCreate.isPending || names.length === 0}
            >
              {bulkCreate.isPending ? <Spinner size={18} /> : null}
              Import {names.length > 0 ? `(${names.length})` : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddTableModal({
  eventId,
  existingCount,
  onClose,
}: {
  eventId: string;
  existingCount: number;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createTable = useCreateTable(eventId);
  const [name, setName] = useState('');
  const [number, setNumber] = useState(String(existingCount + 1));
  const [capacity, setCapacity] = useState('8');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (createTable.isPending) return;
    try {
      await createTable.mutateAsync({
        name: name.trim() || `Table ${number}`,
        number: parseInt(number, 10),
        capacity: parseInt(capacity, 10) || 8,
      });
      toast('Table added', 'success');
      onClose();
    } catch {
      toast('Failed to add table', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Add Table</h2>
        <form onSubmit={handleSubmit}>
          <div className="auth-form__field">
            <label htmlFor="table-name" className="auth-form__label">
              Table Name
            </label>
            <input
              id="table-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Table ${number}`}
              disabled={createTable.isPending}
            />
          </div>
          <div className="form-grid" style={{ marginTop: 'var(--space-4)' }}>
            <div className="auth-form__field">
              <label htmlFor="table-number" className="auth-form__label">
                Number
              </label>
              <input
                id="table-number"
                type="number"
                className="input"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                min={1}
                required
                disabled={createTable.isPending}
              />
            </div>
            <div className="auth-form__field">
              <label htmlFor="table-capacity" className="auth-form__label">
                Capacity
              </label>
              <input
                id="table-capacity"
                type="number"
                className="input"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min={1}
                disabled={createTable.isPending}
              />
            </div>
          </div>
          <div
            className="flex gap-3"
            style={{ marginTop: 'var(--space-5)', justifyContent: 'flex-end' }}
          >
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={createTable.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={createTable.isPending}
            >
              {createTable.isPending ? <Spinner size={18} /> : null}
              Add Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>{title}</h2>
        <p
          className="text-secondary"
          style={{ marginBottom: 'var(--space-5)' }}
        >
          {message}
        </p>
        <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onConfirm}
            style={{ background: '#dc2626' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
