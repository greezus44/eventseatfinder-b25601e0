import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useGuests,
  useCreateGuest,
  useBulkCreateGuests,
  useUpdateGuest,
  useDeleteGuest,
} from '@/hooks/use-guests';
import { useTables, useCreateTable, useDeleteTable } from '@/hooks/use-tables';
import { useToast } from '@/providers/toast-provider';
import type { GuestWithTable } from '@/types/guest';

export function GuestManagementPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';
  const { data: guests, isLoading } = useGuests(eid);
  const { data: tables } = useTables(eid);
  const createGuest = useCreateGuest(eid);
  const bulkCreateGuests = useBulkCreateGuests(eid);
  const updateGuest = useUpdateGuest(eid);
  const deleteGuest = useDeleteGuest(eid);
  const createTable = useCreateTable(eid);
  const deleteTable = useDeleteTable(eid);
  const { toast } = useToast();

  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTableId, setNewTableId] = useState('');
  const [newPlusOnes, setNewPlusOnes] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTableId, setEditTableId] = useState('');
  const [editPlusOnes, setEditPlusOnes] = useState(0);
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(8);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim()) {
      toast('Name is required', 'error');
      return;
    }
    try {
      await createGuest.mutateAsync({
        name: `${newFirstName}${newLastName ? ` ${newLastName}` : ''}`,
        table_id: newTableId || null,
      });
      toast('Guest added', 'success');
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewTableId('');
      setNewPlusOnes(0);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to add guest',
        'error',
      );
    }
  };

  const handleBulkImport = async () => {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      toast('Enter at least one guest', 'error');
      return;
    }
    const inputs = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      const first = parts[0] ?? '';
      const last = parts[1] ?? '';
      return {
        name: `${first}${last ? ` ${last}` : ''}`,
      };
    });
    try {
      await bulkCreateGuests.mutateAsync(inputs);
      toast(`${inputs.length} guests imported`, 'success');
      setBulkText('');
      setShowBulk(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Bulk import failed', 'error');
    }
  };

  const startEdit = (guest: GuestWithTable) => {
    setEditingId(guest.id);
    const parts = (guest.name ?? '').split(' ');
    setEditFirstName(parts[0] ?? '');
    setEditLastName(parts.slice(1).join(' '));
    setEditTableId(guest.table_id ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateGuest.mutateAsync({
        id: editingId,
        name: `${editFirstName}${editLastName ? ` ${editLastName}` : ''}`,
        table_id: editTableId || null,
      });
      toast('Guest updated', 'success');
      setEditingId(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update', 'error');
    }
  };

  const handleDeleteGuest = async (id: string) => {
    try {
      await deleteGuest.mutateAsync(id);
      toast('Guest removed', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove', 'error');
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) {
      toast('Table name is required', 'error');
      return;
    }
    try {
      await createTable.mutateAsync({
        event_id: eid,
        name: newTableName,
        number: (tables?.length ?? 0) + 1,
        capacity: newTableCapacity,
        position_x: 100,
        position_y: 100,
      });
      toast('Table added', 'success');
      setNewTableName('');
      setNewTableCapacity(8);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to add table',
        'error',
      );
    }
  };

  const handleDeleteTable = async (id: string) => {
    try {
      await deleteTable.mutateAsync(id);
      toast('Table removed', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove', 'error');
    }
  };

  if (isLoading) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <div className="page__header">
        <h1>Guest Management</h1>
        <button
          className="btn btn--secondary"
          onClick={() => setShowBulk((v) => !v)}
        >
          {showBulk ? 'Close Bulk' : 'Bulk Import'}
        </button>
      </div>

      {showBulk && (
        <div className="card" style={{ marginBottom: 24 }}>
          <p style={{ marginBottom: 8, fontSize: 13, color: '#64748b' }}>
            One per line: First, Last, Email, PlusOnes
          </p>
          <textarea
            className="input"
            rows={6}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'Jane,Smith,jane@example.com,0\nJohn,Doe,,1'}
          />
          <button
            className="btn btn--primary"
            style={{ marginTop: 12 }}
            onClick={handleBulkImport}
          >
            Import Guests
          </button>
        </div>
      )}

      <div className="guest-mgmt__layout">
        <div className="guest-mgmt__main">
          <form className="guest-add-row" onSubmit={handleAddGuest}>
            <input
              className="input"
              placeholder="First name"
              value={newFirstName}
              onChange={(e) => setNewFirstName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Last name"
              value={newLastName}
              onChange={(e) => setNewLastName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <select
              className="input"
              value={newTableId}
              onChange={(e) => setNewTableId(e.target.value)}
            >
              <option value="">No table</option>
              {tables?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              min={0}
              value={newPlusOnes}
              onChange={(e) =>
                setNewPlusOnes(Math.max(0, Number(e.target.value)))
              }
              style={{ width: 70 }}
            />
            <button type="submit" className="btn btn--primary">
              Add
            </button>
          </form>

          <div className="guest-list">
            {guests?.map((guest) => (
              <div key={guest.id} className="guest-row">
                {editingId === guest.id ? (
                  <div className="guest-row__edit">
                    <input
                      className="input"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                    />
                    <input
                      className="input"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                    />
                    <input
                      className="input"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                    <select
                      className="input"
                      value={editTableId}
                      onChange={(e) => setEditTableId(e.target.value)}
                    >
                      <option value="">No table</option>
                      {tables?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={editPlusOnes}
                      onChange={(e) =>
                        setEditPlusOnes(Math.max(0, Number(e.target.value)))
                      }
                      style={{ width: 70 }}
                    />
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={handleSaveEdit}
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
                  <div className="guest-row__display">
                    <span className="guest-row__name">{guest.name}</span>
                    {guest.table && (
                      <span className="badge">{guest.table.name}</span>
                    )}
                    <div className="guest-row__actions">
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => startEdit(guest)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => handleDeleteGuest(guest.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="guest-mgmt__sidebar">
          <div className="card">
            <h2 style={{ marginBottom: 12 }}>Tables</h2>
            <form
              onSubmit={handleAddTable}
              style={{ display: 'flex', gap: 8, marginBottom: 16 }}
            >
              <input
                className="input"
                placeholder="Table name"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
              />
              <input
                className="input"
                type="number"
                min={1}
                value={newTableCapacity}
                onChange={(e) =>
                  setNewTableCapacity(Math.max(1, Number(e.target.value)))
                }
                style={{ width: 80 }}
              />
              <button type="submit" className="btn btn--primary">
                Add
              </button>
            </form>

            <div className="table-list">
              {tables?.map((table) => {
                const count = guests?.filter(
                  (g) => g.table_id === table.id,
                ).length;
                return (
                  <div key={table.id} className="table-row">
                    <span className="table-row__name">{table.name}</span>
                    <span className="table-row__count">
                      {count}/{table.capacity}
                    </span>
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => handleDeleteTable(table.id)}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
              {(!tables || tables.length === 0) && (
                <p style={{ fontSize: 13, color: '#64748b' }}>No tables yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
