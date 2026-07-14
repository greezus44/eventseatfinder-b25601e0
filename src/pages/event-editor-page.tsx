import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent, useCheckSlugAvailability } from '@/hooks/use-events';
import { useGuests, useCreateGuest, useDeleteGuest, useBulkCreateGuests } from '@/hooks/use-guests';
import { useTables, useCreateTable, useUpdateTable, useDeleteTable, useBulkCreateTables } from '@/hooks/use-tables';
import { useGuestPageSettings, useUpsertGuestPageSettings } from '@/hooks/use-guest-page-settings';
import { useToast } from '@/providers/toast-provider';
import { useConfirmDialog } from '@/components/confirm-dialog';
import QRCode from 'qrcode';
import type { GuestInput, TableInput, GuestPageSettingsInput } from '@/types';
import {
  parseFile,
  matchGuestsToTables,
  buildGuestPayload,
  classifyError,
  type ImportStage,
  type ImportSummary,
} from '@/lib/guest-import';

const TABS = [
  { id: 'settings', label: 'Event Settings' },
  { id: 'guests', label: 'Guests' },
  { id: 'tables', label: 'Tables' },
  { id: 'layout', label: 'Venue Layout' },
  { id: 'theme', label: 'Theme Editor' },
  { id: 'share', label: 'Share' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function EventEditorPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<TabId>('guests');

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId);
  const { data: tables, isLoading: tablesLoading } = useTables(eventId);
  const { data: settings } = useGuestPageSettings(eventId);

  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  if (eventLoading) {
    return <div style={{ padding: '48px', textAlign: 'center' }}><p style={{ color: '#4A4A4A' }}>Loading...</p></div>;
  }

  if (!event) {
    return <div style={{ padding: '48px', textAlign: 'center' }}><p style={{ color: '#4A4A4A' }}>Event not found</p></div>;
  }

  const handleDelete = () => {
    confirm({
      title: 'Delete Event',
      message: `Delete "${event.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteEvent.mutateAsync(event.id);
          toast('Event deleted');
          navigate('/');
        } catch (err) {
          toast(classifyError(err), 'error');
        }
      },
    });
  };

  return (
    <>
      <style>{eeStyles}</style>
      <div className="ee-container">
        <div className="ee-header">
          <div>
            <h1 className="ee-title">{event.name}</h1>
            <p className="ee-subtitle">
              {event.date ? new Date(event.date).toLocaleDateString() : 'No date set'}
              {event.venue ? ` • ${event.venue}` : ''}
            </p>
          </div>
          <button className="ee-btn ee-btn-danger" onClick={handleDelete}>Delete Event</button>
        </div>

        <div className="ee-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`ee-tab ${activeTab === tab.id ? 'ee-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ee-content">
          {activeTab === 'settings' && (
            <SettingsTab event={event} updateEvent={updateEvent} toast={toast} />
          )}
          {activeTab === 'guests' && (
            <GuestsTab
              eventId={event.id}
              guests={guests}
              tables={tables}
              guestsLoading={guestsLoading}
              toast={toast}
              confirm={confirm}
              dialog={dialog}
            />
          )}
          {activeTab === 'tables' && (
            <TablesTab eventId={event.id} tables={tables} tablesLoading={tablesLoading} toast={toast} confirm={confirm} dialog={dialog} />
          )}
          {activeTab === 'layout' && (
            <LayoutTab eventId={event.id} tables={tables} toast={toast} />
          )}
          {activeTab === 'theme' && (
            <ThemeTab eventId={event.id} settings={settings} toast={toast} />
          )}
          {activeTab === 'share' && (
            <ShareTab event={event} updateEvent={updateEvent} toast={toast} />
          )}
        </div>
      </div>
      {dialog()}
    </>
  );
}

function SettingsTab({ event, updateEvent, toast }: {
  event: any;
  updateEvent: ReturnType<typeof useUpdateEvent>;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(event.date || '');
  const [time, setTime] = useState(event.time || '');
  const [venue, setVenue] = useState(event.venue || '');

  const handleSave = async () => {
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        name,
        date: date || null,
        time: time || null,
        venue: venue || null,
      });
      toast('Event settings saved');
    } catch (err) {
      toast(classifyError(err), 'error');
    }
  };

  return (
    <div className="ee-card">
      <h2 className="ee-section-title">Event Details</h2>
      <div className="ee-form-grid">
        <div className="ee-form-field">
          <label className="ee-label">Event Name</label>
          <input className="ee-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="ee-form-field">
          <label className="ee-label">Date</label>
          <input className="ee-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="ee-form-field">
          <label className="ee-label">Time</label>
          <input className="ee-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="ee-form-field">
          <label className="ee-label">Venue</label>
          <input className="ee-input" value={venue} onChange={(e) => setVenue(e.target.value)} />
        </div>
      </div>
      <button className="ee-btn ee-btn-primary" onClick={handleSave} disabled={updateEvent.isPending}>
        {updateEvent.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

function GuestsTab({ eventId, guests, tables, guestsLoading, toast, confirm, dialog }: {
  eventId: string;
  guests: any[] | undefined;
  tables: any[] | undefined;
  guestsLoading: boolean;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm: ReturnType<typeof useConfirmDialog>['confirm'];
  dialog: ReturnType<typeof useConfirmDialog>['dialog'];
}) {
  const createGuest = useCreateGuest();
  const deleteGuest = useDeleteGuest();
  const bulkCreateGuests = useBulkCreateGuests();
  const [showAdd, setShowAdd] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestTable, setNewGuestTable] = useState('');
  const [search, setSearch] = useState('');
  const [importStage, setImportStage] = useState<ImportStage>('idle');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredGuests = guests?.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleAddGuest = async () => {
    if (!newGuestName.trim()) {
      toast('Please enter a guest name', 'error');
      return;
    }
    try {
      await createGuest.mutateAsync({
        eventId,
        name: newGuestName.trim(),
        table_id: newGuestTable || null,
      });
      toast('Guest added');
      setNewGuestName('');
      setNewGuestTable('');
      setShowAdd(false);
    } catch (err) {
      toast(classifyError(err), 'error');
    }
  };

  const handleDeleteGuest = (id: string, name: string, eventId: string) => {
    confirm({
      title: 'Delete Guest',
      message: `Remove "${name}" from the guest list?`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteGuest.mutateAsync({ id, eventId });
          toast('Guest deleted');
        } catch (err) {
          toast(classifyError(err), 'error');
        }
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStage('uploading');
    setImportError(null);
    setImportSummary(null);

    try {
      console.log('[Import] File received', { name: file.name, size: file.size, type: file.type });

      setImportStage('parsing');
      const result = await parseFile(file, setImportStage);
      console.log('[Import] Parse result', result);

      if (result.errors.length > 0) {
        setImportError(result.errors.join('\n'));
        setImportStage('error');
        return;
      }

      if (result.guests.length === 0) {
        setImportError('No valid guest rows found in the file.');
        setImportStage('error');
        return;
      }

      setImportStage('matching');
      const summary = matchGuestsToTables(result.guests, tables || []);
      setImportSummary(summary);
      console.log('[Import] Match summary', summary);

      if (summary.mappedGuests.length === 0) {
        setImportError('No valid guests to import after matching.');
        setImportStage('error');
        return;
      }

      setImportStage('importing');
      const payload = buildGuestPayload(summary.mappedGuests, eventId);
      console.log('[Import] Sending to database', { count: payload.length, eventId });

      const insertResult = await bulkCreateGuests.mutateAsync({
        eventId,
        guests: summary.mappedGuests.map((g) => ({
          name: g.name,
          table_id: g.table_id,
        })),
      });

      console.log('[Import] Database response', insertResult);

      setImportStage('complete');
      toast(`Import complete: ${insertResult.inserted} guests imported.`);

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('[Import] Full error', err);
      const msg = classifyError(err);
      setImportError(msg);
      setImportStage('error');
      toast(msg, 'error');
    }
  };

  const stageLabels: Record<ImportStage, string> = {
    idle: '',
    uploading: 'Uploading...',
    parsing: 'Parsing file...',
    matching: 'Matching tables...',
    importing: 'Importing guests...',
    complete: 'Import complete.',
    error: 'Import failed.',
  };

  return (
    <div>
      <div className="ee-card">
        <div className="ee-row-space">
          <h2 className="ee-section-title">Guests ({guests?.length || 0})</h2>
          <div className="ee-row-gap">
            <button className="ee-btn ee-btn-secondary" onClick={() => fileInputRef.current?.click()}>
              Bulk Import
            </button>
            <button className="ee-btn ee-btn-primary" onClick={() => setShowAdd(!showAdd)}>
              Add Guest
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {importStage !== 'idle' && (
          <div className={`ee-import-status ${importStage === 'error' ? 'ee-import-error' : importStage === 'complete' ? 'ee-import-success' : ''}`}>
            <p style={{ fontWeight: 600, marginBottom: '4px' }}>{stageLabels[importStage]}</p>
            {importError && (
              <p style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>{importError}</p>
            )}
            {importSummary && importStage === 'complete' && (
              <div style={{ fontSize: '13px', marginTop: '8px' }}>
                <p>Imported: {importSummary.mappedGuests.length} guests</p>
                {importSummary.unmatchedTables.length > 0 && (
                  <p style={{ marginTop: '4px', color: '#996600' }}>
                    Unmatched tables: {importSummary.unmatchedTables.join(', ')}
                  </p>
                )}
              </div>
            )}
            {importSummary && importStage !== 'complete' && importStage !== 'error' && (
              <div style={{ fontSize: '13px', marginTop: '8px' }}>
                <p>Parsed: {importSummary.totalRows} rows</p>
                <p>Mapped: {importSummary.mappedGuests.length} guests</p>
                {importSummary.unmatchedTables.length > 0 && (
                  <p style={{ color: '#996600' }}>
                    Unmatched tables: {importSummary.unmatchedTables.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {showAdd && (
          <div className="ee-add-guest-form">
            <input
              className="ee-input"
              placeholder="Guest name"
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
            />
            <select
              className="ee-input"
              value={newGuestTable}
              onChange={(e) => setNewGuestTable(e.target.value)}
            >
              <option value="">No table</option>
              {tables?.map((t) => (
                <option key={t.id} value={t.id}>Table {t.number} — {t.name}</option>
              ))}
            </select>
            <button className="ee-btn ee-btn-primary" onClick={handleAddGuest} disabled={createGuest.isPending}>
              {createGuest.isPending ? 'Adding...' : 'Add'}
            </button>
          </div>
        )}

        <input
          className="ee-input ee-search"
          placeholder="Search guests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginTop: '16px', width: '100%' }}
        />

        {guestsLoading ? (
          <p className="ee-muted">Loading guests...</p>
        ) : filteredGuests.length === 0 ? (
          <p className="ee-muted">No guests found. Add one or import a file.</p>
        ) : (
          <div className="ee-guest-list">
            {filteredGuests.map((g) => {
              const table = tables?.find((t) => t.id === g.table_id);
              return (
                <div key={g.id} className="ee-guest-row">
                  <span className="ee-guest-name">{g.name}</span>
                  {table && (
                    <span className="ee-guest-table">Table {table.number} — {table.name}</span>
                  )}
                  <button
                    className="ee-btn-sm ee-btn-danger"
                    onClick={() => handleDeleteGuest(g.id, g.name, eventId)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {dialog()}
    </div>
  );
}

function TablesTab({ eventId, tables, tablesLoading, toast, confirm, dialog }: {
  eventId: string;
  tables: any[] | undefined;
  tablesLoading: boolean;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm: ReturnType<typeof useConfirmDialog>['confirm'];
  dialog: ReturnType<typeof useConfirmDialog>['dialog'];
}) {
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();
  const bulkCreateTables = useBulkCreateTables();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('');

  const handleAdd = async () => {
    if (!newName.trim() || !newNumber) {
      toast('Please fill in name and number', 'error');
      return;
    }
    try {
      await createTable.mutateAsync({
        eventId,
        name: newName.trim(),
        number: parseInt(newNumber),
        capacity: parseInt(newCapacity) || 0,
      });
      toast('Table added');
      setNewName('');
      setNewNumber('');
      setNewCapacity('');
      setShowAdd(false);
    } catch (err) {
      toast(classifyError(err), 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    confirm({
      title: 'Delete Table',
      message: `Delete "Table ${name}"?`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteTable.mutateAsync({ id, eventId });
          toast('Table deleted');
        } catch (err) {
          toast(classifyError(err), 'error');
        }
      },
    });
  };

  const handleBulkCreate = async () => {
    const maxNum = tables?.length ? Math.max(...tables.map((t) => t.number)) : 0;
    const newTables: TableInput[] = [];
    for (let i = 1; i <= 10; i++) {
      newTables.push({
        name: `Table ${maxNum + i}`,
        number: maxNum + i,
        capacity: 8,
      });
    }
    try {
      await bulkCreateTables.mutateAsync({ event_id: eventId, tables: newTables });
      toast(`Added ${newTables.length} tables`);
    } catch (err) {
      toast(classifyError(err), 'error');
    }
  };

  return (
    <div className="ee-card">
      <div className="ee-row-space">
        <h2 className="ee-section-title">Tables ({tables?.length || 0})</h2>
        <div className="ee-row-gap">
          <button className="ee-btn ee-btn-secondary" onClick={handleBulkCreate} disabled={bulkCreateTables.isPending}>
            Add 10 Tables
          </button>
          <button className="ee-btn ee-btn-primary" onClick={() => setShowAdd(!showAdd)}>
            Add Table
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="ee-add-guest-form" style={{ marginTop: '16px' }}>
          <input className="ee-input" placeholder="Table name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="ee-input" placeholder="Number" type="number" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} />
          <input className="ee-input" placeholder="Capacity" type="number" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} />
          <button className="ee-btn ee-btn-primary" onClick={handleAdd} disabled={createTable.isPending}>
            {createTable.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
      )}

      {tablesLoading ? (
        <p className="ee-muted">Loading tables...</p>
      ) : !tables || tables.length === 0 ? (
        <p className="ee-muted">No tables yet.</p>
      ) : (
        <div className="ee-guest-list" style={{ marginTop: '16px' }}>
          {tables.map((t) => {
            const guestCount = guests_count(t.id, tables);
            return (
              <div key={t.id} className="ee-guest-row">
                <span className="ee-guest-name">Table {t.number} — {t.name}</span>
                <span className="ee-guest-table">Cap: {t.capacity}</span>
                <button className="ee-btn-sm ee-btn-danger" onClick={() => handleDelete(t.id, t.name)}>
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
      {dialog()}
    </div>
  );
}

function guests_count(_tableId: string, _tables: any[]): number {
  return 0;
}

function LayoutTab({ eventId, tables, toast }: {
  eventId: string;
  tables: any[] | undefined;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const updateTable = useUpdateTable();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, tableId: string) => {
    setDraggingId(tableId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    try {
      await updateTable.mutateAsync({
        id: draggingId,
        position_x: x,
        position_y: y,
      });
    } catch (err) {
      toast(classifyError(err), 'error');
    }
    setDraggingId(null);
  };

  return (
    <div className="ee-card">
      <h2 className="ee-section-title">Venue Layout</h2>
      <p className="ee-muted" style={{ marginBottom: '16px' }}>Drag tables to position them on the floor plan.</p>
      <div
        ref={containerRef}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          position: 'relative',
          width: '100%',
          height: '500px',
          backgroundColor: '#F8F8F8',
          borderRadius: '12px',
          border: '2px dashed #EFEFEF',
          overflow: 'hidden',
        }}
      >
        {tables?.map((t) => (
          <div
            key={t.id}
            draggable
            onDragStart={(e) => handleDragStart(e, t.id)}
            style={{
              position: 'absolute',
              left: `${t.position_x ?? 10}%`,
              top: `${t.position_y ?? 10}%`,
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #DADADA',
              borderRadius: '8px',
              cursor: 'move',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              userSelect: 'none',
            }}
          >
            Table {t.number}
            <br />
            <span style={{ fontSize: '11px', fontWeight: 400, color: '#4A4A4A' }}>{t.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemeTab({ eventId, settings, toast }: {
  eventId: string;
  settings: any;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const upsert = useUpsertGuestPageSettings();
  const [colorPrimary, setColorPrimary] = useState(settings?.color_primary || '#1A1A1A');
  const [colorBg, setColorBg] = useState(settings?.color_background || '#F8F8F8');
  const [colorCard, setColorCard] = useState(settings?.color_card || '#FFFFFF');
  const [colorText, setColorText] = useState(settings?.color_text || '#1A1A1A');
  const [borderRadius, setBorderRadius] = useState(settings?.border_radius ?? 12);
  const [welcomeMessage, setWelcomeMessage] = useState(settings?.welcome_message || '');

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        eventId,
        color_primary: colorPrimary,
        color_background: colorBg,
        color_card: colorCard,
        color_text: colorText,
        border_radius: borderRadius,
        welcome_message: welcomeMessage || null,
      });
      toast('Theme saved');
    } catch (err) {
      toast(classifyError(err), 'error');
    }
  };

  return (
    <div className="ee-card">
      <h2 className="ee-section-title">Theme Editor</h2>
      <div className="ee-form-grid">
        <div className="ee-form-field">
          <label className="ee-label">Primary Color</label>
          <input className="ee-input" type="color" value={colorPrimary} onChange={(e) => setColorPrimary(e.target.value)} />
        </div>
        <div className="ee-form-field">
          <label className="ee-label">Background Color</label>
          <input className="ee-input" type="color" value={colorBg} onChange={(e) => setColorBg(e.target.value)} />
        </div>
        <div className="ee-form-field">
          <label className="ee-label">Card Color</label>
          <input className="ee-input" type="color" value={colorCard} onChange={(e) => setColorCard(e.target.value)} />
        </div>
        <div className="ee-form-field">
          <label className="ee-label">Text Color</label>
          <input className="ee-input" type="color" value={colorText} onChange={(e) => setColorText(e.target.value)} />
        </div>
        <div className="ee-form-field">
          <label className="ee-label">Border Radius</label>
          <input className="ee-input" type="number" value={borderRadius} onChange={(e) => setBorderRadius(parseInt(e.target.value) || 0)} />
        </div>
        <div className="ee-form-field ee-form-field-full">
          <label className="ee-label">Welcome Message</label>
          <input className="ee-input" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Welcome message for guests" />
        </div>
      </div>
      <button className="ee-btn ee-btn-primary" onClick={handleSave} disabled={upsert.isPending}>
        {upsert.isPending ? 'Saving...' : 'Save Theme'}
      </button>
    </div>
  );
}

function ShareTab({ event, updateEvent, toast }: {
  event: any;
  updateEvent: ReturnType<typeof useUpdateEvent>;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [slug, setSlug] = useState(event.slug);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/find-your-seat` : '';
  const fullUrl = `${baseUrl}/${slug}`;
  const slugCheck = useCheckSlugAvailability(slug, event.id);

  useEffect(() => {
    if (fullUrl) {
      QRCode.toDataURL(fullUrl, { width: 300, margin: 2, color: { dark: '#1A1A1A', light: '#FFFFFF' } })
        .then(setQrDataUrl)
        .catch((err) => console.error('QR PNG error:', err));
      QRCode.toString(fullUrl, { type: 'svg', margin: 2, color: { dark: '#1A1A1A', light: '#FFFFFF' } })
        .then(setQrSvg)
        .catch((err) => console.error('QR SVG error:', err));
    }
  }, [fullUrl]);

  const sanitizeSlug = (val: string) => {
    return val.toLowerCase().trim().replace(/[^a-z0-9-\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  const handleSaveSlug = async () => {
    const clean = sanitizeSlug(slug);
    if (!clean || clean.length < 2) {
      toast('Slug must be at least 2 characters (letters, numbers, hyphens only)', 'error');
      return;
    }
    if (slugCheck.data && !slugCheck.data.available) {
      toast('This slug is already taken. Please choose another.', 'error');
      return;
    }
    try {
      await updateEvent.mutateAsync({ id: event.id, slug: clean });
      setSlug(clean);
      toast('URL updated');
    } catch (err) {
      toast(classifyError(err), 'error');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast('Link copied to clipboard');
    } catch (err) {
      toast('Could not copy link. Please copy manually: ' + fullUrl, 'error');
    }
  };

  const handleOpenWebsite = () => {
    window.open(fullUrl, '_blank');
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${slug}-qr.png`;
    a.click();
  };

  const handleDownloadSvg = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `Find your seat at ${event.name}`,
          url: fullUrl,
        });
      } catch (err) {
        // User cancelled — no action needed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="ee-card">
      <h2 className="ee-section-title">Share Event</h2>

      <div className="ee-share-grid">
        <div>
          <label className="ee-label">Guest Website URL</label>
          <div className="ee-share-url-display">{fullUrl}</div>

          <label className="ee-label" style={{ marginTop: '20px' }}>Custom URL Slug</label>
          <div className="ee-share-slug-field">
            <span className="ee-share-slug-prefix">{baseUrl}/</span>
            <input
              className="ee-input ee-share-slug-input"
              value={slug}
              onChange={(e) => setSlug(sanitizeSlug(e.target.value))}
              placeholder="my-event"
            />
          </div>
          {slug !== event.slug && slug.length >= 2 && (
            slugCheck.isLoading ? (
              <p className="ee-muted" style={{ marginTop: '4px' }}>Checking availability...</p>
            ) : slugCheck.data?.available ? (
              <p className="ee-share-valid" style={{ marginTop: '4px' }}>Slug is available</p>
            ) : (
              <p className="ee-share-error" style={{ marginTop: '4px' }}>Slug is already taken</p>
            )
          )}
          <button className="ee-btn ee-btn-primary" onClick={handleSaveSlug} disabled={updateEvent.isPending || slug === event.slug} style={{ marginTop: '8px' }}>
            Save URL
          </button>

          <div className="ee-share-actions" style={{ marginTop: '24px' }}>
            <button className="ee-btn ee-btn-secondary" onClick={handleCopyLink} title="Copy link to clipboard">Copy Link</button>
            <button className="ee-btn ee-btn-secondary" onClick={handleOpenWebsite} title="Open guest website in new tab">Open Website</button>
            <button className="ee-btn ee-btn-secondary" onClick={handleDownloadPng} title="Download QR code as PNG">Download QR (PNG)</button>
            <button className="ee-btn ee-btn-secondary" onClick={handleDownloadSvg} title="Download QR code as SVG">Download QR (SVG)</button>
            <button className="ee-btn ee-btn-secondary" onClick={handleNativeShare} title="Share via your device's share menu">Share</button>
          </div>
        </div>

        <div className="ee-share-qr-wrap">
          <label className="ee-label" style={{ textAlign: 'center', marginBottom: '12px' }}>QR Code</label>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR code" style={{ width: '100%', maxWidth: '240px', borderRadius: '8px' }} />
          ) : (
            <p className="ee-muted">Generating QR code...</p>
          )}
        </div>
      </div>
    </div>
  );
}

const eeStyles = `
.ee-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}
.ee-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.ee-title {
  font-size: 24px;
  font-weight: 700;
  color: #1A1A1A;
  letter-spacing: -0.02em;
  margin: 0;
}
.ee-subtitle {
  font-size: 14px;
  color: #4A4A4A;
  margin-top: 4px;
}
.ee-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #EFEFEF;
  margin-bottom: 24px;
  overflow-x: auto;
  flex-wrap: wrap;
}
.ee-tab {
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #4A4A4A;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}
.ee-tab:hover {
  color: #1A1A1A;
}
.ee-tab-active {
  color: #1A1A1A;
  border-bottom-color: #1A1A1A;
}
.ee-content {
  animation: fadeIn 0.2s ease;
}
.ee-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #EFEFEF;
}
.ee-section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
  margin: 0 0 16px;
}
.ee-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
.ee-form-field-full {
  grid-column: 1 / -1;
}
.ee-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #4A4A4A;
  margin-bottom: 6px;
}
.ee-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid #DADADA;
  background: #FFFFFF;
  font-size: 15px;
  color: #1A1A1A;
  outline: none;
  transition: border-color 0.2s;
}
.ee-input:focus {
  border-color: #1A1A1A;
}
.ee-btn {
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}
.ee-btn:hover {
  opacity: 0.9;
}
.ee-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ee-btn-primary {
  background: #1A1A1A;
  color: #FFFFFF;
}
.ee-btn-secondary {
  background: #F8F8F8;
  color: #1A1A1A;
  border: 1px solid #DADADA;
}
.ee-btn-danger {
  background: transparent;
  color: #DC2626;
  border: 1px solid #DC2626;
}
.ee-btn-sm {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.ee-row-space {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ee-row-gap {
  display: flex;
  gap: 8px;
}
.ee-muted {
  color: #4A4A4A;
  font-size: 14px;
}
.ee-add-guest-form {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.ee-add-guest-form .ee-input {
  flex: 1;
  min-width: 150px;
}
.ee-search {
  margin-bottom: 16px;
}
.ee-guest-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ee-guest-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  background: #F8F8F8;
  border: 1px solid #EFEFEF;
}
.ee-guest-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A1A;
}
.ee-guest-table {
  font-size: 13px;
  color: #4A4A4A;
}
.ee-import-status {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #F8F8F8;
  border: 1px solid #EFEFEF;
  font-size: 14px;
}
.ee-import-error {
  background: #FEF2F2;
  border-color: #FECACA;
  color: #991B1B;
}
.ee-import-success {
  background: #F0FDF4;
  border-color: #BBF7D0;
  color: #166534;
}
.ee-share-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
}
.ee-share-url-display {
  padding: 12px 16px;
  border-radius: 12px;
  background: #F8F8F8;
  border: 1px solid #EFEFEF;
  font-size: 14px;
  color: #1A1A1A;
  word-break: break-all;
  font-family: monospace;
}
.ee-share-slug-field {
  display: flex;
  align-items: center;
  border: 1px solid #DADADA;
  border-radius: 12px;
  overflow: hidden;
}
.ee-share-slug-prefix {
  padding: 0 12px;
  font-size: 14px;
  color: #4A4A4A;
  white-space: nowrap;
  background: #F8F8F8;
  height: 44px;
  display: flex;
  align-items: center;
}
.ee-share-slug-input {
  border: none;
  border-radius: 0;
  flex: 1;
}
.ee-share-slug-input:focus {
  border: none;
}
.ee-share-valid {
  color: #166534;
  font-size: 13px;
}
.ee-share-error {
  color: #DC2626;
  font-size: 13px;
}
.ee-share-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ee-share-qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}
@media (max-width: 768px) {
  .ee-form-grid {
    grid-template-columns: 1fr;
  }
  .ee-share-grid {
    grid-template-columns: 1fr;
  }
}
`;
