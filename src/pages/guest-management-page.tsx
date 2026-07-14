import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useGuests,
  useCreateGuest,
  useBulkCreateGuests,
  useUpdateGuest,
  useDeleteGuest,
} from '@/hooks/use-guests';
import { useTables, useCreateTable, useDeleteTable } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { LoadingScreen } from '@/components/ui/feedback';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { GuestWithTable } from '@/types/guest';

export function GuestManagementPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = eventId ?? '';

  const { data: guests, isLoading } = useGuests(id);
  const { data: tables } = useTables(id);
  const createGuest = useCreateGuest(id);
  const bulkCreateGuests = useBulkCreateGuests(id);
  const updateGuest = useUpdateGuest(id);
  const deleteGuest = useDeleteGuest(id);
  const createTable = useCreateTable(id);
  const deleteTable = useDeleteTable(id);
  const { toast } = useToast();

  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestTable, setNewGuestTable] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTable, setEditTable] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('');
  const [deleteTableId, setDeleteTableId] = useState<string | null>(null);

  function guestCountForTable(tableId: string): number {
    return (guests ?? []).filter((g) => g.table_id === tableId).length;
  }

  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault();
    const name = newGuestName.trim();
    if (!name) return;
    try {
      await createGuest.mutateAsync({
        name,
        table_id: newGuestTable || null,
      });
      toast('Guest added', 'success');
      setNewGuestName('');
      setNewGuestTable('');
    } catch {
      toast('Could not add guest', 'error');
    }
  }

  async function handleBulkImport(e: React.FormEvent) {
    e.preventDefault();
    const names = bulkText
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    try {
      await bulkCreateGuests.mutateAsync(names);
      toast(
        `${names.length} guest${names.length === 1 ? '' : 's'} imported`,
        'success',
      );
      setBulkText('');
      setShowBulkImport(false);
    } catch {
      toast('Could not import guests', 'error');
    }
  }

  function startEdit(guest: GuestWithTable) {
    setEditingId(guest.id);
    setEditName(guest.name);
    setEditTable(guest.table_id ?? '');
  }

  async function handleSaveEdit(guestId: string) {
    try {
      await updateGuest.mutateAsync({
        id: guestId,
        name: editName.trim(),
        table_id: editTable || null,
      });
      toast('Guest updated', 'success');
      setEditingId(null);
    } catch {
      toast('Could not update guest', 'error');
    }
  }

  async function handleDeleteGuest(guestId: string) {
    try {
      await deleteGuest.mutateAsync(guestId);
      toast('Guest deleted', 'success');
    } catch {
      toast('Could not delete guest', 'error');
    }
  }

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    const name = newTableName.trim();
    const number = Number(newTableNumber);
    if (!name || !number) return;
    try {
      await createTable.mutateAsync({
        name,
        number,
        capacity: newTableCapacity ? Number(newTableCapacity) : undefined,
      });
      toast('Table added', 'success');
      setNewTableName('');
      setNewTableNumber('');
      setNewTableCapacity('');
    } catch {
      toast('Could not add table', 'error');
    }
  }

  async function confirmDeleteTable() {
    if (!deleteTableId) return;
    try {
      await deleteTable.mutateAsync(deleteTableId);
      toast('Table deleted', 'success');
    } catch {
      toast('Could not delete table', 'error');
    } finally {
      setDeleteTableId(null);
    }
  }

  if (isLoading) return <LoadingScreen label="Loading guests…" />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Guests</h1>
          <Link to={`/events/${id}`} className="btn btn--ghost btn--sm">
            ← Back to event
          </Link>
        </div>
        <button
          className="btn btn--secondary"
          onClick={() => setShowBulkImport((prev) => !prev)}
        >
          {showBulkImport ? 'Cancel import' : 'Bulk import'}
        </button>
      </div>

      {showBulkImport && (
        <form
          className="card"
          onSubmit={handleBulkImport}
          style={{ marginBottom: 'var(--space-5)' }}
        >
          <div className="form-field">
            <label className="form-field__label" htmlFor="bulk-text">
              Paste guest names (one per line)
            </label>
            <textarea
              id="bulk-text"
              className="input"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={6}
              placeholder={'Alice Smith\nBob Jones\nCarol White'}
            />
          </div>
          <button
            className="btn btn--primary"
            type="submit"
            disabled={bulkCreateGuests.isPending}
          >
            {bulkCreateGuests.isPending ? 'Importing…' : 'Import guests'}
          </button>
        </form>
      )}

      <div className="guest-mgmt__layout">
        <div className="guest-mgmt__main">
          <form className="guest-add-row" onSubmit={handleAddGuest}>
            <input
              className="input"
              type="text"
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
              placeholder="Guest name"
            />
            <select
              className="input"
              value={newGuestTable}
              onChange={(e) => setNewGuestTable(e.target.value)}
            >
              <option value="">Unassigned</option>
              {tables?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (#{t.number})
                </option>
              ))}
            </select>
            <button
              className="btn btn--primary"
              type="submit"
              disabled={createGuest.isPending}
            >
              Add
            </button>
          </form>

          <div className="guest-list">
            {guests?.map((guest) => (
              <div key={guest.id} className="guest-row">
                {editingId === guest.id ? (
                  <>
                    <input
                      className="input guest-row__edit-name"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <select
                      className="input guest-row__edit-table"
                      value={editTable}
                      onChange={(e) => setEditTable(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {tables?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (#{t.number})
                        </option>
                      ))}
                    </select>
                    <div className="guest-row__actions">
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => handleSaveEdit(guest.id)}
                        disabled={updateGuest.isPending}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
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
                        className="btn btn--ghost btn--sm"
                        onClick={() => startEdit(guest)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn--ghost btn--sm guest-row__delete"
                        onClick={() => handleDeleteGuest(guest.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {guests && guests.length === 0 && (
              <p className="text-secondary">No guests yet. Add one above.</p>
            )}
          </div>
        </div>

        <div className="guest-mgmt__sidebar">
          <div className="card">
            <h2 style={{ marginBottom: 'var(--space-3)' }}>Tables</h2>
            <form
              onSubmit={handleAddTable}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <input
                className="input"
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Table name"
              />
              <input
                className="input"
                type="number"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="Table number"
                min={1}
              />
              <input
                className="input"
                type="number"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
                placeholder="Capacity (optional)"
                min={1}
              />
              <button
                className="btn btn--primary"
                type="submit"
                disabled={createTable.isPending}
              >
                Add table
              </button>
            </form>

            <div className="table-list">
              {tables?.map((table) => (
                <div key={table.id} className="table-row">
                  <div className="table-row__info">
                    <span className="table-row__name">{table.name}</span>
                    <span className="table-row__meta">
                      #{table.number} · {guestCountForTable(table.id)} guest
                      {guestCountForTable(table.id) === 1 ? '' : 's'}
                    </span>
                  </div>
                  <button
                    className="btn btn--ghost btn--sm table-row__delete"
                    onClick={() => setDeleteTableId(table.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
              {tables && tables.length === 0 && (
                <p className="text-secondary">No tables yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteTableId && (
        <ConfirmDialog
          title="Delete table"
          message="Guests assigned to this table will become unassigned. Continue?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDeleteTable}
          onCancel={() => setDeleteTableId(null)}
        />
      )}
    </div>
  );
}
