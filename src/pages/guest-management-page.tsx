import { useMemo, useState } from 'react';
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
import { Spinner, LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { GuestWithTable } from '@/types/guest';
import type { Table } from '@/types/table';

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
  const [deleteTableTarget, setDeleteTableTarget] = useState<Table | null>(
    null,
  );

  const filteredGuests = useMemo(() => {
    if (!search.trim()) return guests ?? [];
    const q = search.toLowerCase();
    return (guests ?? []).filter((g) => g.name.toLowerCase().includes(q));
  }, [guests, search]);

  const handleAddGuest = async (e: React.FormEvent) => {
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

  const handleDeleteGuest = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGuest.mutateAsync(deleteTarget.id);
      toast('Guest removed', 'success');
      setDeleteTarget(null);
    } catch {
      toast('Failed to remove guest', 'error');
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = bulkText
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) {
      toast('Please enter at least one name', 'error');
      return;
    }
    try {
      await bulkCreateGuests.mutateAsync(names);
      toast(
        `${names.length} guest${names.length > 1 ? 's' : ''} added`,
        'success',
      );
      setBulkText('');
      setShowBulkModal(false);
    } catch {
      toast('Failed to import guests', 'error');
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim() || !tableNumber.trim()) {
      toast('Table name and number are required', 'error');
      return;
    }
    try {
      await createTable.mutateAsync({
        name: tableName.trim(),
        number: parseInt(tableNumber, 10),
        capacity: tableCapacity ? parseInt(tableCapacity, 10) : 8,
      });
      toast('Table added', 'success');
      setTableName('');
      setTableNumber('');
      setTableCapacity('8');
      setShowTableModal(false);
    } catch {
      toast('Failed to add table', 'error');
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteTableTarget) return;
    try {
      await deleteTable.mutateAsync(deleteTableTarget.id);
      toast('Table removed', 'success');
      setDeleteTableTarget(null);
    } catch {
      toast('Failed to remove table', 'error');
    }
  };

  if (isLoading) return <LoadingScreen message="Loading guests..." />;
  if (error) return <ErrorScreen message="Failed to load guests." />;

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
          <h1>Manage Guests</h1>
          <div className="flex gap-2">
            <Link
              to={`/events/${eid}/seating`}
              className="btn btn--secondary btn--sm"
            >
              Seating
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
        <div className="guest-mgmt__layout">
          <div className="guest-mgmt__main">
            <div
              className="flex gap-2"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <input
                className="input"
                placeholder="Search guests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn--secondary"
                onClick={() => setShowBulkModal(true)}
              >
                Bulk Import
              </button>
            </div>

            <form
              className="guest-add-row"
              onSubmit={handleAddGuest}
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <input
                className="input"
                placeholder="Add a guest by name..."
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn--primary"
                disabled={createGuest.isPending}
              >
                {createGuest.isPending ? <Spinner size={18} /> : 'Add'}
              </button>
            </form>

            <div className="guest-list">
              {filteredGuests.length === 0 ? (
                <p
                  className="text-muted"
                  style={{ textAlign: 'center', padding: 'var(--space-4)' }}
                >
                  {search
                    ? 'No guests match your search.'
                    : 'No guests yet. Add one above.'}
                </p>
              ) : (
                filteredGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="guest-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {editingId === guest.id ? (
                      <>
                        <input
                          className="input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <select
                          className="input"
                          value={editTableId ?? ''}
                          onChange={(e) =>
                            setEditTableId(e.target.value || null)
                          }
                          style={{ width: 140 }}
                        >
                          <option value="">No table</option>
                          {tables?.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} (#{t.number})
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
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1 }}>{guest.name}</span>
                        {guest.table ? (
                          <span
                            className="badge"
                            style={{
                              background: 'var(--primary)',
                              color: '#fff',
                            }}
                          >
                            {guest.table.name} #{guest.table.number}
                          </span>
                        ) : (
                          <span
                            className="text-muted"
                            style={{ fontSize: '0.875rem' }}
                          >
                            Unassigned
                          </span>
                        )}
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => startEdit(guest)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => setDeleteTarget(guest)}
                          style={{ color: 'var(--error)' }}
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
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div
                className="flex"
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
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
              {tables && tables.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                  No tables yet.
                </p>
              ) : (
                <div>
                  {tables?.map((t) => {
                    const count =
                      guests?.filter((g) => g.table_id === t.id).length ?? 0;
                    return (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-2) 0',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 500 }}>{t.name}</span>
                          <span
                            className="text-muted"
                            style={{
                              fontSize: '0.875rem',
                              marginLeft: 'var(--space-1)',
                            }}
                          >
                            #{t.number} · {count}/{t.capacity}
                          </span>
                        </div>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => setDeleteTableTarget(t)}
                          style={{ color: 'var(--error)' }}
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                className="input w-full"
                rows={10}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'Alice Smith\nBob Jones\nCarol White'}
                style={{
                  marginBottom: 'var(--space-4)',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
              <div
                className="flex gap-3"
                style={{ justifyContent: 'flex-end' }}
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
                    <Spinner size={18} />
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateTable(e);
              }}
            >
              <div
                className="form-field"
                style={{ marginBottom: 'var(--space-3)' }}
              >
                <label className="form-field__label">Table Name</label>
                <input
                  className="input w-full"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Head Table"
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div
                  className="form-field"
                  style={{ marginBottom: 'var(--space-3)' }}
                >
                  <label className="form-field__label">Number</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    min={1}
                  />
                </div>
                <div
                  className="form-field"
                  style={{ marginBottom: 'var(--space-4)' }}
                >
                  <label className="form-field__label">Capacity</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={tableCapacity}
                    onChange={(e) => setTableCapacity(e.target.value)}
                    min={1}
                  />
                </div>
              </div>
              <div
                className="flex gap-3"
                style={{ justifyContent: 'flex-end' }}
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
                  {createTable.isPending ? <Spinner size={18} /> : 'Add Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove Guest"
          message={`Are you sure you want to remove ${deleteTarget.name}?`}
          confirmLabel="Remove"
          onConfirm={handleDeleteGuest}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteTableTarget && (
        <ConfirmDialog
          title="Delete Table"
          message={`Delete ${deleteTableTarget.name} (#${deleteTableTarget.number})? Guests at this table will become unassigned.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteTable}
          onCancel={() => setDeleteTableTarget(null)}
        />
      )}
    </div>
  );
}
