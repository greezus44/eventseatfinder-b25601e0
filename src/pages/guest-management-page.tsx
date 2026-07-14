import { useMemo, useState, type FormEvent } from 'react';
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
import { ErrorScreen, LoadingScreen, Spinner } from '@/components/ui/feedback';
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
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTableId, setEditTableId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GuestWithTable | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState({
    name: '',
    number: '',
    capacity: '',
  });
  const [deleteTableId, setDeleteTableId] = useState<string | null>(null);

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.table?.name.toLowerCase().includes(q) ?? false),
    );
  }, [guests, search]);

  const guestsByTable = useMemo(() => {
    const map = new Map<string, number>();
    guests?.forEach((g) => {
      if (g.table_id) {
        map.set(g.table_id, (map.get(g.table_id) ?? 0) + 1);
      }
    });
    return map;
  }, [guests]);

  if (isLoading) return <LoadingScreen message="Loading guests…" />;
  if (error)
    return <ErrorScreen message={error.message || 'Failed to load guests'} />;

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createGuest.mutateAsync(newName.trim());
      setNewName('');
      toast('Guest added', 'success');
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to add guest',
        'error',
      );
    }
  };

  const startEdit = (guest: GuestWithTable) => {
    setEditingId(guest.id);
    setEditName(guest.name);
    setEditTableId(guest.table_id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditTableId(null);
  };

  const saveEdit = async (guest: GuestWithTable) => {
    try {
      await updateGuest.mutateAsync({
        id: guest.id,
        name: editName.trim() || guest.name,
        table_id: editTableId,
      });
      toast('Guest updated', 'success');
      cancelEdit();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to update guest',
        'error',
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGuest.mutateAsync(deleteTarget.id);
      toast('Guest removed', 'success');
      setDeleteTarget(null);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to delete guest',
        'error',
      );
    }
  };

  const handleBulkImport = async (e: FormEvent) => {
    e.preventDefault();
    const names = bulkText
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) {
      toast('Enter at least one name', 'error');
      return;
    }
    try {
      await bulkCreateGuests.mutateAsync(names);
      toast(`Imported ${names.length} guests`, 'success');
      setBulkText('');
      setBulkOpen(false);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to import guests',
        'error',
      );
    }
  };

  const handleCreateTable = async (e: FormEvent) => {
    e.preventDefault();
    const number = parseInt(tableForm.number, 10);
    if (!tableForm.name.trim() || isNaN(number)) {
      toast('Table name and number are required', 'error');
      return;
    }
    const capacity =
      tableForm.capacity.trim() !== ''
        ? parseInt(tableForm.capacity, 10)
        : undefined;
    try {
      await createTable.mutateAsync({
        name: tableForm.name.trim(),
        number,
        ...(capacity !== undefined ? { capacity } : {}),
      });
      toast('Table added', 'success');
      setTableForm({ name: '', number: '', capacity: '' });
      setTableModalOpen(false);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to create table',
        'error',
      );
    }
  };

  const confirmDeleteTable = async () => {
    if (!deleteTableId) return;
    try {
      await deleteTable.mutateAsync(deleteTableId);
      toast('Table removed', 'success');
      setDeleteTableId(null);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to delete table',
        'error',
      );
    }
  };

  const nextTableNumber =
    tables && tables.length > 0
      ? Math.max(...tables.map((t) => t.number)) + 1
      : 1;

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Link to={`/events/${eid}`} className="back-link">
            ← Event settings
          </Link>
          <h1>Manage Guests</h1>
        </div>
        <div className="flex flex--gap-2">
          <button
            className="btn btn--secondary"
            onClick={() => setBulkOpen(true)}
          >
            Bulk import
          </button>
          <Link to={`/events/${eid}/seating`} className="btn btn--primary">
            Seating arrangement →
          </Link>
        </div>
      </header>

      <div className="guest-mgmt">
        <div className="guest-mgmt__main">
          <form className="inline-add card" onSubmit={handleAdd}>
            <input
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add a guest by name…"
            />
            <button
              className="btn btn--primary"
              type="submit"
              disabled={createGuest.isPending || !newName.trim()}
            >
              {createGuest.isPending ? <Spinner size={18} /> : 'Add'}
            </button>
          </form>

          <div className="search-bar">
            <input
              className="input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guests…"
            />
          </div>

          <div className="guest-list">
            {filteredGuests.length === 0 ? (
              <div className="card empty-state empty-state--sm">
                <p className="text-secondary">
                  {guests && guests.length === 0
                    ? 'No guests yet. Add one above or use bulk import.'
                    : 'No guests match your search.'}
                </p>
              </div>
            ) : (
              filteredGuests.map((guest) => (
                <div key={guest.id} className="card guest-row">
                  {editingId === guest.id ? (
                    <div className="guest-row__edit">
                      <input
                        className="input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                      <select
                        className="input"
                        value={editTableId ?? ''}
                        onChange={(e) => setEditTableId(e.target.value || null)}
                      >
                        <option value="">Unassigned</option>
                        {tables?.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} (#{t.number})
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => saveEdit(guest)}
                        disabled={updateGuest.isPending}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="guest-row__view">
                      <span className="guest-row__name">{guest.name}</span>
                      {guest.table ? (
                        <span className="badge">
                          {guest.table.name} · #{guest.table.number}
                        </span>
                      ) : (
                        <span className="badge badge--muted">Unassigned</span>
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
                          onClick={() => setDeleteTarget(guest)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="guest-mgmt__sidebar card">
          <div className="sidebar-panel__head">
            <h3>Tables</h3>
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => {
                setTableForm({
                  name: '',
                  number: String(nextTableNumber),
                  capacity: '',
                });
                setTableModalOpen(true);
              }}
            >
              + Add
            </button>
          </div>
          {tables && tables.length === 0 ? (
            <p className="text-muted sidebar-panel__empty">
              No tables yet. Add one to start seating guests.
            </p>
          ) : (
            <ul className="table-list">
              {tables?.map((t) => (
                <li key={t.id} className="table-list__item">
                  <div className="table-list__info">
                    <span className="table-list__name">{t.name}</span>
                    <span className="table-list__meta text-muted">
                      #{t.number} · {guestsByTable.get(t.id) ?? 0}
                      {t.capacity ? ` / ${t.capacity}` : ''} guests
                    </span>
                  </div>
                  <button
                    className="btn btn--ghost btn--sm table-list__delete"
                    onClick={() => setDeleteTableId(t.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {bulkOpen && (
        <div className="modal-overlay" onClick={() => setBulkOpen(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Bulk import guests</h2>
            <form className="modal__form" onSubmit={handleBulkImport}>
              <label className="form-field">
                <span className="form-field__label">
                  Enter one name per line
                </span>
                <textarea
                  className="input textarea"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={10}
                  placeholder={'Alice Smith\nBob Jones\nCarol White'}
                  autoFocus
                />
              </label>
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setBulkOpen(false)}
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
                    'Import guests'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tableModalOpen && (
        <div className="modal-overlay" onClick={() => setTableModalOpen(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Add table</h2>
            <form className="modal__form" onSubmit={handleCreateTable}>
              <label className="form-field">
                <span className="form-field__label">Table name</span>
                <input
                  className="input"
                  value={tableForm.name}
                  onChange={(e) =>
                    setTableForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Head Table"
                  autoFocus
                  required
                />
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span className="form-field__label">Number</span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={tableForm.number}
                    onChange={(e) =>
                      setTableForm((f) => ({ ...f, number: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="form-field">
                  <span className="form-field__label">Capacity</span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={tableForm.capacity}
                    onChange={(e) =>
                      setTableForm((f) => ({ ...f, capacity: e.target.value }))
                    }
                    placeholder="8"
                  />
                </label>
              </div>
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setTableModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={createTable.isPending}
                >
                  {createTable.isPending ? <Spinner size={18} /> : 'Add table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove guest?"
          message={`Are you sure you want to remove ${deleteTarget.name}?`}
          confirmLabel="Remove"
          loading={deleteGuest.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {deleteTableId && (
        <ConfirmDialog
          title="Delete table?"
          message="Guests at this table will become unassigned."
          confirmLabel="Delete"
          loading={deleteTable.isPending}
          onCancel={() => setDeleteTableId(null)}
          onConfirm={confirmDeleteTable}
        />
      )}
    </div>
  );
}
