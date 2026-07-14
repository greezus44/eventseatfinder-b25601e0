import { useState, useMemo, type FormEvent } from 'react';
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
import { LoadingScreen, ErrorScreen, Spinner } from '@/components/ui/feedback';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { GuestWithTable } from '@/types/guest';
import type { Table } from '@/types/table';

function TablesSidebar({
  eventId,
  tables,
  isLoading,
}: {
  eventId: string;
  tables: Table[] | undefined;
  isLoading: boolean;
}) {
  const createTable = useCreateTable(eventId);
  const deleteTable = useDeleteTable(eventId);
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);

  const handleAddTable = async (e: FormEvent) => {
    e.preventDefault();
    const num = parseInt(number, 10);
    if (!name.trim() || isNaN(num)) return;
    try {
      await createTable.mutateAsync({
        name: name.trim(),
        number: num,
        capacity: capacity ? parseInt(capacity, 10) : 8,
      });
      toast('Table added', 'success');
      setName('');
      setNumber('');
      setCapacity('');
      setShowAdd(false);
    } catch {
      toast('Failed to add table', 'error');
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTable.mutateAsync(deleteTarget.id);
      toast('Table deleted', 'success');
      setDeleteTarget(null);
    } catch {
      toast('Failed to delete table', 'error');
    }
  };

  return (
    <div className="guest-mgmt__sidebar">
      <div
        className="flex gap-2"
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-3)',
        }}
      >
        <h3 style={{ margin: 0 }}>Tables</h3>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddTable}
          className="card"
          style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}
        >
          <div className="form-field">
            <input
              className="input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Table name"
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <input
                className="input w-full"
                type="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Number"
                min={1}
              />
            </div>
            <div className="form-field">
              <input
                className="input w-full"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Capacity"
                min={1}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn--primary btn--sm w-full"
            disabled={createTable.isPending}
            style={{ gap: 'var(--space-2)' }}
          >
            {createTable.isPending && <Spinner size={14} />} Add Table
          </button>
        </form>
      )}

      {isLoading ? (
        <Spinner size={20} />
      ) : tables && tables.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          {tables.map((table) => (
            <div
              key={table.id}
              className="card"
              style={{
                padding: 'var(--space-3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>Table {table.number}</span>
                {table.name && (
                  <span
                    className="text-muted"
                    style={{ marginLeft: 'var(--space-2)' }}
                  >
                    {table.name}
                  </span>
                )}
                <span
                  className="text-muted"
                  style={{ display: 'block', fontSize: '0.8125rem' }}
                >
                  Capacity: {table.capacity}
                </span>
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setDeleteTarget(table)}
                style={{ color: 'var(--error)' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
          No tables yet. Add one to start seating guests.
        </p>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Table"
          message={`Delete Table ${deleteTarget.number}${deleteTarget.name ? ` (${deleteTarget.name})` : ''}? Guests at this table will become unassigned.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteTable}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function GuestRow({
  guest,
  tables,
  eventId,
}: {
  guest: GuestWithTable;
  tables: Table[];
  eventId: string;
}) {
  const updateGuest = useUpdateGuest(eventId);
  const deleteGuest = useDeleteGuest(eventId);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(guest.name);
  const [editTableId, setEditTableId] = useState(guest.table_id ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    updateGuest.mutate(
      {
        id: guest.id,
        name: editName.trim() || guest.name,
        table_id: editTableId || null,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast('Guest updated', 'success');
        },
        onError: () => toast('Failed to update guest', 'error'),
      },
    );
  };

  const handleDelete = () => {
    deleteGuest.mutate(guest.id, {
      onSuccess: () => toast('Guest deleted', 'success'),
      onError: () => toast('Failed to delete guest', 'error'),
    });
    setConfirmDelete(false);
  };

  const deleteDialog = confirmDelete && (
    <ConfirmDialog
      title="Delete Guest"
      message={`Delete ${guest.name}? This cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={handleDelete}
      onCancel={() => setConfirmDelete(false)}
    />
  );

  if (isEditing) {
    return (
      <>
        <div className="guest-row">
          <input
            className="input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{ flex: 1 }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
          />
          <select
            className="input"
            value={editTableId}
            onChange={(e) => setEditTableId(e.target.value)}
            style={{ flex: 1, maxWidth: '180px' }}
          >
            <option value="">Unassigned</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                Table {t.number}
                {t.name ? ` - ${t.name}` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleSave}
            disabled={updateGuest.isPending}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setIsEditing(false);
              setEditName(guest.name);
              setEditTableId(guest.table_id ?? '');
            }}
          >
            Cancel
          </button>
        </div>
        {deleteDialog}
      </>
    );
  }

  return (
    <>
      <div className="guest-row">
        <span style={{ flex: 1 }}>{guest.name}</span>
        {guest.table ? (
          <span className="badge badge--info">Table {guest.table.number}</span>
        ) : (
          <span className="badge badge--warning">Unassigned</span>
        )}
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setConfirmDelete(true)}
          style={{ color: 'var(--error)' }}
        >
          Delete
        </button>
      </div>
      {deleteDialog}
    </>
  );
}

function BulkImportModal({
  eventId,
  onClose,
}: {
  eventId: string;
  onClose: () => void;
}) {
  const bulkCreate = useBulkCreateGuests(eventId);
  const { toast } = useToast();
  const [text, setText] = useState('');

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    const names = text
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    try {
      await bulkCreate.mutateAsync(names);
      toast(`Imported ${names.length} guests`, 'success');
      onClose();
    } catch {
      toast('Failed to import guests', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>Bulk Import Guests</h2>
        <p
          className="text-secondary"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          Enter one guest name per line.
        </p>
        <form onSubmit={handleImport}>
          <div className="form-field">
            <textarea
              className="input w-full"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'Jane Doe\nJohn Smith\nAlice Johnson'}
              rows={10}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              autoFocus
            />
          </div>
          <div
            className="flex gap-3"
            style={{ justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}
          >
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={bulkCreate.isPending}
              style={{ gap: 'var(--space-2)' }}
            >
              {bulkCreate.isPending && <Spinner size={16} />} Import Guests
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GuestManagementPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: guests, isLoading, error } = useGuests(eventId ?? '');
  const { data: tables, isLoading: tablesLoading } = useTables(eventId ?? '');
  const createGuest = useCreateGuest(eventId ?? '');
  const { toast } = useToast();

  const [newGuestName, setNewGuestName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);

  const tablesList = useMemo(() => tables ?? [], [tables]);

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    if (!searchQuery.trim()) return guests;
    const q = searchQuery.toLowerCase();
    return guests.filter((g) => g.name.toLowerCase().includes(q));
  }, [guests, searchQuery]);

  if (isLoading) return <LoadingScreen message="Loading guests..." />;
  if (error) return <ErrorScreen message={error.message} />;

  const handleAddGuest = async (e: FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;
    try {
      await createGuest.mutateAsync(newGuestName.trim());
      toast('Guest added', 'success');
      setNewGuestName('');
    } catch {
      toast('Failed to add guest', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <Link
            to={`/events/${eventId}`}
            className="btn btn--ghost btn--sm"
            style={{ marginBottom: 'var(--space-1)' }}
          >
            ← Back to Event
          </Link>
          <h1>Manage Guests</h1>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/events/${eventId}/seating`}
            className="btn btn--secondary btn--sm"
          >
            Seating →
          </Link>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setShowBulkImport(true)}
          >
            Bulk Import
          </button>
        </div>
      </div>

      <div className="page__body">
        <div className="guest-mgmt__layout">
          <div className="guest-mgmt__main">
            <form className="guest-add-row" onSubmit={handleAddGuest}>
              <input
                className="input"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                placeholder="Add a guest..."
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn--primary"
                disabled={createGuest.isPending}
                style={{ gap: 'var(--space-2)' }}
              >
                {createGuest.isPending ? <Spinner size={16} /> : null} Add
              </button>
            </form>

            <div className="form-field">
              <input
                className="input w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guests..."
              />
            </div>

            <div className="guest-list">
              {filteredGuests.length > 0 ? (
                filteredGuests.map((guest) => (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    tables={tablesList}
                    eventId={eventId!}
                  />
                ))
              ) : (
                <p
                  className="text-muted"
                  style={{ textAlign: 'center', padding: 'var(--space-6)' }}
                >
                  {searchQuery.trim()
                    ? 'No guests match your search.'
                    : 'No guests yet. Add one above or use bulk import.'}
                </p>
              )}
            </div>

            {guests && guests.length > 0 && (
              <p
                className="text-muted"
                style={{ fontSize: '0.8125rem', marginTop: 'var(--space-3)' }}
              >
                {filteredGuests.length} of {guests.length} guests
              </p>
            )}
          </div>

          <TablesSidebar
            eventId={eventId ?? ''}
            tables={tables}
            isLoading={tablesLoading}
          />
        </div>
      </div>

      {showBulkImport && (
        <BulkImportModal
          eventId={eventId ?? ''}
          onClose={() => setShowBulkImport(false)}
        />
      )}
    </div>
  );
}
