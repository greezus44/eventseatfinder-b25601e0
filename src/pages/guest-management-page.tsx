import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGuests, useCreateGuest, useBulkCreateGuests, useUpdateGuest, useDeleteGuest } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import type { GuestWithTable } from '@/types/guest';

export function GuestManagementPage() {
  const eventId = useParams<{ eventId: string }>().eventId ?? '';

  const { data: guests, isLoading } = useGuests(eventId);
  const { data: tables } = useTables(eventId);
  const { toast } = useToast();

  const createGuest = useCreateGuest(eventId);
  const bulkCreateGuests = useBulkCreateGuests(eventId);
  const updateGuest = useUpdateGuest(eventId);
  const deleteGuest = useDeleteGuest(eventId);

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestWithTable | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<GuestWithTable | null>(null);

  // Add form state
  const [addName, setAddName] = useState('');
  const [addTableId, setAddTableId] = useState<string>('');

  // Bulk form state
  const [bulkText, setBulkText] = useState('');
  const [bulkTableId, setBulkTableId] = useState<string>('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editTableId, setEditTableId] = useState<string>('');

  const filteredGuests = (guests ?? []).filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetAddForm = () => {
    setAddName('');
    setAddTableId('');
  };

  const resetBulkForm = () => {
    setBulkText('');
    setBulkTableId('');
  };

  const handleOpenAdd = () => {
    resetAddForm();
    setIsAddOpen(true);
  };

  const handleOpenBulk = () => {
    resetBulkForm();
    setIsBulkOpen(true);
  };

  const handleOpenEdit = (guest: GuestWithTable) => {
    setEditingGuest(guest);
    setEditName(guest.name);
    setEditTableId(guest.table_id ?? '');
  };

  const handleAddSubmit = async () => {
    const name = addName.trim();
    if (!name) {
      toast('Please enter a guest name', 'error');
      return;
    }
    try {
      await createGuest.mutateAsync({
        name,
        table_id: addTableId || null,
      });
      toast('Guest added successfully', 'success');
      resetAddForm();
      setIsAddOpen(false);
    } catch {
      toast('Failed to add guest', 'error');
    }
  };

  const handleBulkSubmit = async () => {
    const names = bulkText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) {
      toast('Please enter at least one guest name', 'error');
      return;
    }

    try {
      await bulkCreateGuests.mutateAsync(
        names.map((name) => ({
          name,
          table_id: bulkTableId || null,
        }))
      );
      toast(`${names.length} guest${names.length === 1 ? '' : 's'} added successfully`, 'success');
      resetBulkForm();
      setIsBulkOpen(false);
    } catch {
      toast('Failed to add guests', 'error');
    }
  };

  const handleEditSubmit = async () => {
    if (!editingGuest) return;
    const name = editName.trim();
    if (!name) {
      toast('Please enter a guest name', 'error');
      return;
    }
    try {
      await updateGuest.mutateAsync({
        id: editingGuest.id,
        name,
        table_id: editTableId || null,
      });
      toast('Guest updated successfully', 'success');
      setEditingGuest(null);
    } catch {
      toast('Failed to update guest', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGuest) return;
    try {
      await deleteGuest.mutateAsync(deletingGuest.id);
      toast('Guest deleted successfully', 'success');
      setDeletingGuest(null);
    } catch {
      toast('Failed to delete guest', 'error');
    }
  };

  return (
    <div className="gm-page">
      <div className="gm-container">
        {/* Header */}
        <div className="gm-header">
          <Link to={`/events/${eventId}`} className="gm-back-link">
            ← Back to event
          </Link>
          <div className="gm-header-titles">
            <h1 className="gm-title">Guests</h1>
            <p className="gm-subtitle">Manage guests for this event</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="gm-toolbar">
          <input
            type="text"
            className="gm-search"
            placeholder="Search guests by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="gm-toolbar-actions">
            <button className="gm-btn gm-btn-secondary" onClick={handleOpenBulk}>
              Bulk add
            </button>
            <button className="gm-btn gm-btn-primary" onClick={handleOpenAdd}>
              Add guest
            </button>
          </div>
        </div>

        {/* Guest list */}
        {isLoading ? (
          <div className="gm-loading">Loading guests...</div>
        ) : filteredGuests.length === 0 ? (
          <div className="gm-empty">
            {search
              ? 'No guests match your search.'
              : 'No guests yet. Click "Add guest" to get started.'}
          </div>
        ) : (
          <div className="gm-table-wrapper">
            <table className="gm-table">
              <thead>
                <tr>
                  <th className="gm-th">Name</th>
                  <th className="gm-th">Table</th>
                  <th className="gm-th gm-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="gm-tr">
                    <td className="gm-td gm-td-name">{guest.name}</td>
                    <td className="gm-td gm-td-table">
                      {guest.table ? `${guest.table.name}` : '—'}
                    </td>
                    <td className="gm-td gm-td-actions">
                      <button
                        className="gm-btn gm-btn-icon"
                        onClick={() => handleOpenEdit(guest)}
                        aria-label={`Edit ${guest.name}`}
                      >
                        Edit
                      </button>
                      <button
                        className="gm-btn gm-btn-icon gm-btn-danger"
                        onClick={() => setDeletingGuest(guest)}
                        aria-label={`Delete ${guest.name}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal open={isAddOpen} title="Add guest" onClose={() => setIsAddOpen(false)}>
        <form className="gm-form" onSubmit={(e) => { e.preventDefault(); handleAddSubmit(); }}>
          <label className="gm-label">Name</label>
          <input
            type="text"
            className="gm-input"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Guest name"
            autoFocus
          />
          <label className="gm-label">Table</label>
          <select
            className="gm-select"
            value={addTableId}
            onChange={(e) => setAddTableId(e.target.value)}
          >
            <option value="">No table</option>
            {(tables ?? []).map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
          <div className="gm-form__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary">Add</button>
          </div>
        </form>
      </Modal>

      {/* Bulk add modal */}
      <Modal open={isBulkOpen} title="Bulk add guests" onClose={() => setIsBulkOpen(false)}>
        <form className="gm-form" onSubmit={(e) => { e.preventDefault(); handleBulkSubmit(); }}>
          <label className="gm-label">Guest names (one per line)</label>
          <textarea
            className="gm-textarea"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'Alice\nBob\nCharlie'}
            rows={8}
            autoFocus
          />
          <label className="gm-label">Table (optional)</label>
          <select
            className="gm-select"
            value={bulkTableId}
            onChange={(e) => setBulkTableId(e.target.value)}
          >
            <option value="">No table</option>
            {(tables ?? []).map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
          <div className="gm-form__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setIsBulkOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary">Add all</button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editingGuest} title="Edit guest" onClose={() => setEditingGuest(null)}>
        <form className="gm-form" onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }}>
          <label className="gm-label">Name</label>
          <input
            type="text"
            className="gm-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Guest name"
            autoFocus
          />
          <label className="gm-label">Table</label>
          <select
            className="gm-select"
            value={editTableId}
            onChange={(e) => setEditTableId(e.target.value)}
          >
            <option value="">No table</option>
            {(tables ?? []).map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
          <div className="gm-form__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setEditingGuest(null)}>Cancel</button>
            <button type="submit" className="btn btn--primary">Save</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!deletingGuest}
        title="Delete guest"
        message={`Are you sure you want to delete "${deletingGuest?.name ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeletingGuest(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
