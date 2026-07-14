import { useState, type FormEvent } from 'react';
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
import { Spinner, ErrorScreen, LoadingScreen } from '@/components/ui/feedback';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { GuestWithTable } from '@/types/guest';

export function GuestManagementPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';

  const { data: guests, isLoading, error } = useGuests(eid);
  const { data: tables } = useTables(eid);
  const createGuest = useCreateGuest(eid);
  const bulkCreateGuests = useBulkCreateGuests(eid);
  const updateGuest = useUpdateGuest(eid);
  const deleteGuest = useDeleteGuest(eid);
  const createTable = useCreateTable(eid);
  const deleteTable = useDeleteTable(eid);
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [newGuestName, setNewGuestName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTableId, setEditTableId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GuestWithTable | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableName, setTableName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [tableCapacity, setTableCapacity] = useState('8');
  const [deleteTableTarget, setDeleteTableTarget] = useState<string | null>(
    null,
  );

  if (isLoading) return <LoadingScreen message="Loading guests..." />;
  if (error) return <ErrorScreen message="Failed to load guests" />;

  const filtered = (guests ?? []).filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;
    try {
      await createGuest.mutateAsync(newGuestName.trim());
      setNewGuestName('');
      toast('Guest added', 'success');
    } catch {
      toast('Failed to add guest', 'error');
    }
  };

  const startEdit = (guest: GuestWithTable) => {
    setEditingId(guest.id);
    setEditName(guest.name);
    setEditTableId(guest.table_id);
  };

  const handleSaveEdit = async (guestId: string) => {
    try {
      await updateGuest.mutateAsync({
        id: guestId,
        name: editName.trim(),
        table_id: editTableId,
      });
      setEditingId(null);
      toast('Guest updated', 'success');
    } catch {
      toast('Failed to update guest', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGuest.mutateAsync(deleteTarget.id);
      toast('Guest removed', 'success');
    } catch {
      toast('Failed to remove guest', 'error');
    }
    setDeleteTarget(null);
  };

  const handleBulkImport = async (e: FormEvent) => {
    e.preventDefault();
    const names = bulkText
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    try {
      await bulkCreateGuests.mutateAsync(names);
      toast(`${names.length} guests imported`, 'success');
      setShowBulkModal(false);
      setBulkText('');
    } catch {
      toast('Failed to import guests', 'error');
    }
  };

  const handleCreateTable = async (e: FormEvent) => {
    e.preventDefault();
    const num = parseInt(tableNumber, 10);
    if (!tableName.trim() || isNaN(num)) {
      toast('Table name and number are required', 'error');
      return;
    }
    try {
      await createTable.mutateAsync({
        name: tableName.trim(),
        number: num,
        capacity: parseInt(tableCapacity, 10) || 8,
      });
      toast('Table created', 'success');
      setShowTableModal(false);
      setTableName('');
      setTableNumber('');
      setTableCapacity('8');
    } catch {
      toast('Failed to create table', 'error');
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteTableTarget) return;
    try {
      await deleteTable.mutateAsync(deleteTableTarget);
      toast('Table removed', 'success');
    } catch {
      toast('Failed to remove table', 'error');
    }
    setDeleteTableTarget(null);
  };

  const tableNameFor = (tableId: string | null): string => {
    if (!tableId) return 'Unassigned';
    const t = (tables ?? []).find((tbl) => tbl.id === tableId);
    return t ? `Table ${t.number}` : 'Unassigned';
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
          <h1>Manage Guests</h1>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn--secondary"
            onClick={() => setShowBulkModal(true)}
          >
            Bulk Import
          </button>
          <Link to={`/events/${eid}/seating`} className="btn btn--secondary">
            Seating
          </Link>
        </div>
      </div>

      <div className="page__body guest-mgmt__layout">
        <div className="guest-mgmt__main">
          <div className="guest-add-row">
            <form onSubmit={handleAdd} className="flex gap-2 w-full">
              <input
                type="text"
                className="input"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                placeholder="Add a guest by name..."
                autoFocus
              />
              <button
                type="submit"
                className="btn btn--primary"
                disabled={createGuest.isPending}
              >
                {createGuest.isPending ? <Spinner size={20} /> : 'Add'}
              </button>
            </form>
          </div>

          <input
            type="text"
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests..."
            style={{ marginBottom: 'var(--space-4)' }}
          />

          <div className="guest-list">
            {filtered.length === 0 ? (
              <p
                className="text-secondary"
                style={{ textAlign: 'center', padding: 'var(--space-5)' }}
              >
                {search
                  ? 'No matching guests'
                  : 'No guests yet. Add one above.'}
              </p>
            ) : (
              filtered.map((guest) => (
                <div key={guest.id} className="guest-row">
                  {editingId === guest.id ? (
                    <div
                      className="flex gap-2 w-full"
                      style={{ alignItems: 'center' }}
                    >
                      <input
                        type="text"
                        className="input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <select
                        className="input"
                        value={editTableId ?? ''}
                        onChange={(e) => setEditTableId(e.target.value || null)}
                        style={{ width: 'auto' }}
                      >
                        <option value="">Unassigned</option>
                        {(tables ?? []).map((t) => (
                          <option key={t.id} value={t.id}>
                            Table {t.number}
                          </option>
                        ))}
                      </select>
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
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <div>{guest.name}</div>
                        <div
                          className="text-muted"
                          style={{ fontSize: '0.875rem' }}
                        >
                          {tableNameFor(guest.table_id)}
                        </div>
                      </div>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => startEdit(guest)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setDeleteTarget(guest)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="guest-mgmt__sidebar">
          <div className="card">
            <div
              className="flex gap-2"
              style={{
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-4)',
              }}
            >
              <h3>Tables</h3>
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => setShowTableModal(true)}
              >
                + Add
              </button>
            </div>

            {(tables ?? []).length === 0 ? (
              <p className="text-secondary">No tables yet.</p>
            ) : (
              (tables ?? []).map((t) => {
                const count = (guests ?? []).filter(
                  (g) => g.table_id === t.id,
                ).length;
                return (
                  <div
                    key={t.id}
                    className="flex gap-2"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-2) 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div>Table {t.number}</div>
                      <div
                        className="text-muted"
                        style={{ fontSize: '0.875rem' }}
                      >
                        {t.name} · {count}/{t.capacity}
                      </div>
                    </div>
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => setDeleteTableTarget(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Remove Guest"
          message={`Remove ${deleteTarget.name} from this event?`}
          confirmLabel="Remove"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteTableTarget && (
        <ConfirmDialog
          title="Delete Table"
          message="Deleting a table will unassign all guests at it. Continue?"
          confirmLabel="Delete"
          onConfirm={handleDeleteTable}
          onCancel={() => setDeleteTableTarget(null)}
        />
      )}

      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 'var(--space-3)' }}>
              Bulk Import Guests
            </h2>
            <p
              className="text-secondary"
              style={{ marginBottom: 'var(--space-3)' }}
            >
              Enter one guest name per line.
            </p>
            <form onSubmit={handleBulkImport}>
              <textarea
                className="input"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'Alice Smith\nBob Jones\nCarol White'}
                rows={10}
                style={{
                  width: '100%',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                autoFocus
              />
              <div
                className="flex gap-3"
                style={{
                  justifyContent: 'flex-end',
                  marginTop: 'var(--space-4)',
                }}
              >
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowBulkModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={bulkCreateGuests.isPending}
                >
                  {bulkCreateGuests.isPending ? (
                    <Spinner size={20} />
                  ) : (
                    'Import Guests'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTableModal && (
        <div className="modal-overlay" onClick={() => setShowTableModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Add Table</h2>
            <form onSubmit={handleCreateTable}>
              <div className="form-field">
                <label className="form-field__label" htmlFor="tbl-name">
                  Table Name
                </label>
                <input
                  id="tbl-name"
                  type="text"
                  className="input"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Head Table"
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-field__label" htmlFor="tbl-num">
                    Table Number
                  </label>
                  <input
                    id="tbl-num"
                    type="number"
                    className="input"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    min={0}
                  />
                </div>
                <div className="form-field">
                  <label className="form-field__label" htmlFor="tbl-cap">
                    Capacity
                  </label>
                  <input
                    id="tbl-cap"
                    type="number"
                    className="input"
                    value={tableCapacity}
                    onChange={(e) => setTableCapacity(e.target.value)}
                    min={1}
                  />
                </div>
              </div>
              <div
                className="flex gap-3"
                style={{
                  justifyContent: 'flex-end',
                  marginTop: 'var(--space-4)',
                }}
              >
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowTableModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={createTable.isPending}
                >
                  {createTable.isPending ? (
                    <Spinner size={20} />
                  ) : (
                    'Create Table'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
