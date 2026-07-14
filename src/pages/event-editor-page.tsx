import { useState, useRef, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent, useCheckSlugAvailability } from '@/hooks/use-events';
import { useGuests, useCreateGuest, useDeleteGuest, useBulkCreateGuests } from '@/hooks/use-guests';
import { useTables, useCreateTable, useUpdateTable, useDeleteTable, useBulkCreateTables } from '@/hooks/use-tables';
import { useGuestPageSettings, useUpsertGuestPageSettings } from '@/hooks/use-guest-page-settings';
import { useToast } from '@/providers/toast-provider';
import { useConfirmDialog } from '@/components/confirm-dialog';
import QRCode from 'qrcode';
import type { TableInput, GuestPageSettingsInput } from '@/types';
import { GOOGLE_FONTS, FONT_WEIGHTS, FONT_SIZE_OPTIONS } from '@/lib/fonts';
import { parseFile, matchGuestsToTables, buildGuestPayload, classifyError } from '@/lib/guest-import';

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
  const [activeTab, setActiveTab] = useState<TabId>('settings');

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId);
  const { data: tables, isLoading: tablesLoading } = useTables(eventId);
  const { data: settings } = useGuestPageSettings(eventId);

  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  if (eventLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return <div className="empty-state">Event not found.</div>;
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
          toast(classifyError(err).message, 'error');
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
          <div className="ee-header-actions">
            <Link to={`/events/${eventId}/print/seating-chart`} className="btn btn-secondary">Seating Chart</Link>
            <Link to={`/events/${eventId}/print/guest-list`} className="btn btn-secondary">Guest List</Link>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
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
            <GuestsTab eventId={event.id} guests={guests} tables={tables} guestsLoading={guestsLoading} toast={toast} confirm={confirm} dialog={dialog} />
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

type EventData = NonNullable<ReturnType<typeof useEvent>['data']>;
type UpdateEventMut = ReturnType<typeof useUpdateEvent>;
type ToastFn = (msg: string, type?: 'success' | 'error' | 'info') => void;

function SettingsTab({ event, updateEvent, toast }: { event: EventData; updateEvent: UpdateEventMut; toast: ToastFn }) {
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(event.date ?? '');
  const [time, setTime] = useState(event.time ?? '');
  const [venue, setVenue] = useState(event.venue ?? '');

  const dirty = name !== event.name || date !== (event.date ?? '') || time !== (event.time ?? '') || venue !== (event.venue ?? '');

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Event name is required', 'error');
      return;
    }
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        name: name.trim(),
        date: date || null,
        time: time || null,
        venue: venue || null,
      });
      toast('Event settings saved');
    } catch (err) {
      toast(classifyError(err).message, 'error');
    }
  };

  return (
    <form onSubmit={handleSave} className="card">
      <h2 className="ee-section-title">Event Details</h2>
      <div className="ee-form-grid">
        <div className="form-group">
          <label className="form-label">Event Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Time</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Venue</label>
          <input value={venue} onChange={(e) => setVenue(e.target.value)} />
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={updateEvent.isPending || !dirty}>
        {updateEvent.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

function GuestsTab({ eventId, guests, tables, guestsLoading, toast, confirm, dialog }: {
  eventId: string;
  guests: ReturnType<typeof useGuests>['data'];
  tables: ReturnType<typeof useTables>['data'];
  guestsLoading: boolean;
  toast: ToastFn;
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
  const [importStage, setImportStage] = useState<string>('idle');
  const [importMsg, setImportMsg] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredGuests = (guests ?? []).filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddGuest = async () => {
    if (!newGuestName.trim()) {
      toast('Please enter a guest name', 'error');
      return;
    }
    try {
      await createGuest.mutateAsync({ eventId, name: newGuestName.trim(), table_id: newGuestTable || null });
      toast('Guest added');
      setNewGuestName('');
      setNewGuestTable('');
      setShowAdd(false);
    } catch (err) {
      toast(classifyError(err).message, 'error');
    }
  };

  const handleDeleteGuest = (id: string, name: string) => {
    confirm({
      title: 'Delete Guest',
      message: `Remove "${name}" from the guest list?`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteGuest.mutateAsync({ id, eventId });
          toast('Guest deleted');
        } catch (err) {
          toast(classifyError(err).message, 'error');
        }
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStage('uploading');
    setImportError('');
    setImportMsg('');

    try {
      setImportStage('parsing');
      const parsed = await parseFile(file);
      console.log('[Import] Parsed rows:', parsed.length);

      if (parsed.length === 0) {
        setImportError('File is empty or has no data rows.');
        setImportStage('error');
        return;
      }

      setImportStage('matching');
      const mapped = matchGuestsToTables(parsed, tables ?? []);
      console.log('[Import] Mapped guests:', mapped.length);

      const payload = buildGuestPayload(mapped, eventId);
      if (payload.length === 0) {
        setImportError('No valid guests found. Ensure the file has a "Name" column.');
        setImportStage('error');
        return;
      }

      console.log('[Import] Sending to database:', { count: payload.length, eventId });
      setImportStage('importing');
      const result = await bulkCreateGuests.mutateAsync({ eventId, guests: payload });
      console.log('[Import] Database response:', result.length);

      setImportStage('complete');
      setImportMsg(`Import complete: ${result.length} guests imported.`);
      toast(`Imported ${result.length} guests`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('[Import] Error:', err);
      const classified = classifyError(err);
      setImportError(classified.message);
      setImportStage('error');
      toast(classified.message, 'error');
    }
  };

  const stageLabels: Record<string, string> = {
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
      <div className="card">
        <div className="ee-row-space">
          <h2 className="ee-section-title">Guests ({guests?.length ?? 0})</h2>
          <div className="ee-row-gap">
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>Bulk Import</button>
            <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>Add Guest</button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleFileUpload} />

        {importStage !== 'idle' && (
          <div className={`ee-import-status ${importStage === 'error' ? 'ee-import-error' : importStage === 'complete' ? 'ee-import-success' : ''}`}>
            <p style={{ fontWeight: 600, marginBottom: '4px' }}>{stageLabels[importStage]}</p>
            {importError && <p style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>{importError}</p>}
            {importMsg && <p style={{ fontSize: '13px' }}>{importMsg}</p>}
          </div>
        )}

        {showAdd && (
          <div className="ee-add-form">
            <input className="ee-flex-input" placeholder="Guest name" value={newGuestName} onChange={(e) => setNewGuestName(e.target.value)} />
            <select className="ee-flex-input" value={newGuestTable} onChange={(e) => setNewGuestTable(e.target.value)}>
              <option value="">No table</option>
              {tables?.map((t) => <option key={t.id} value={t.id}>Table {t.number} — {t.name}</option>)}
            </select>
            <button className="btn btn-primary" onClick={handleAddGuest} disabled={createGuest.isPending}>
              {createGuest.isPending ? 'Adding...' : 'Add'}
            </button>
          </div>
        )}

        <input className="ee-search" placeholder="Search guests..." value={search} onChange={(e) => setSearch(e.target.value)} />

        {guestsLoading ? (
          <p className="ee-muted">Loading guests...</p>
        ) : filteredGuests.length === 0 ? (
          <p className="ee-muted">No guests found. Add one or import a file.</p>
        ) : (
          <div className="ee-list">
            {filteredGuests.map((g) => {
              const table = tables?.find((t) => t.id === g.table_id);
              return (
                <div key={g.id} className="ee-list-row">
                  <span className="ee-list-name">{g.name}</span>
                  {table && <span className="ee-list-meta">Table {table.number} — {table.name}</span>}
                  <button className="btn btn-danger ee-btn-sm" onClick={() => handleDeleteGuest(g.id, g.name)}>Remove</button>
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
  tables: ReturnType<typeof useTables>['data'];
  tablesLoading: boolean;
  toast: ToastFn;
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
      await createTable.mutateAsync({ eventId, name: newName.trim(), number: parseInt(newNumber), capacity: parseInt(newCapacity) || 0 });
      toast('Table added');
      setNewName(''); setNewNumber(''); setNewCapacity('');
      setShowAdd(false);
    } catch (err) {
      toast(classifyError(err).message, 'error');
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
          toast(classifyError(err).message, 'error');
        }
      },
    });
  };

  const handleBulkCreate = async () => {
    const maxNum = tables?.length ? Math.max(...tables.map((t) => t.number)) : 0;
    const newTables: TableInput[] = [];
    for (let i = 1; i <= 10; i++) {
      newTables.push({ name: `Table ${maxNum + i}`, number: maxNum + i, capacity: 8 });
    }
    try {
      await bulkCreateTables.mutateAsync({ event_id: eventId, tables: newTables });
      toast(`Added ${newTables.length} tables`);
    } catch (err) {
      toast(classifyError(err).message, 'error');
    }
  };

  return (
    <div className="card">
      <div className="ee-row-space">
        <h2 className="ee-section-title">Tables ({tables?.length ?? 0})</h2>
        <div className="ee-row-gap">
          <button className="btn btn-secondary" onClick={handleBulkCreate} disabled={bulkCreateTables.isPending}>Add 10 Tables</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>Add Table</button>
        </div>
      </div>

      {showAdd && (
        <div className="ee-add-form" style={{ marginTop: '16px' }}>
          <input className="ee-flex-input" placeholder="Table name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="ee-flex-input" placeholder="Number" type="number" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} />
          <input className="ee-flex-input" placeholder="Capacity" type="number" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} />
          <button className="btn btn-primary" onClick={handleAdd} disabled={createTable.isPending}>
            {createTable.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
      )}

      {tablesLoading ? (
        <p className="ee-muted">Loading tables...</p>
      ) : !tables || tables.length === 0 ? (
        <p className="ee-muted">No tables yet.</p>
      ) : (
        <div className="ee-list" style={{ marginTop: '16px' }}>
          {tables.map((t) => (
            <div key={t.id} className="ee-list-row">
              <span className="ee-list-name">Table {t.number} — {t.name}</span>
              <span className="ee-list-meta">Cap: {t.capacity}</span>
              <button className="btn btn-danger ee-btn-sm" onClick={() => handleDelete(t.id, t.name)}>Delete</button>
            </div>
          ))}
        </div>
      )}
      {dialog()}
    </div>
  );
}

function LayoutTab({ eventId, tables, toast }: { eventId: string; tables: ReturnType<typeof useTables>['data']; toast: ToastFn }) {
  const updateTable = useUpdateTable();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    try {
      await updateTable.mutateAsync({ id: draggingId, position_x: x, position_y: y });
    } catch (err) {
      toast(classifyError(err).message, 'error');
    }
    setDraggingId(null);
  };

  return (
    <div className="card">
      <h2 className="ee-section-title">Venue Layout</h2>
      <p className="ee-muted" style={{ marginBottom: '16px' }}>Drag tables to position them on the floor plan.</p>
      <div ref={containerRef} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="ee-layout-canvas">
        {tables?.map((t) => (
          <div
            key={t.id}
            draggable
            onDragStart={(e) => setDraggingId(t.id)}
            className="ee-layout-table"
            style={{ left: `${t.position_x ?? 10}%`, top: `${t.position_y ?? 10}%` }}
          >
            Table {t.number}
            <span className="ee-layout-table-name">{t.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemeTab({ eventId, settings, toast }: { eventId: string; settings: ReturnType<typeof useGuestPageSettings>['data']; toast: ToastFn }) {
  const upsert = useUpsertGuestPageSettings();

  const [colorPrimary, setColorPrimary] = useState(settings?.color_primary || '#1A1A1A');
  const [colorBg, setColorBg] = useState(settings?.color_background || '#F8F8F8');
  const [colorCard, setColorCard] = useState(settings?.color_card || '#FFFFFF');
  const [colorText, setColorText] = useState(settings?.color_text || '#1A1A1A');
  const [colorHeader, setColorHeader] = useState(settings?.color_header || '#1A1A1A');
  const [borderRadius, setBorderRadius] = useState(settings?.border_radius ?? 12);
  const [welcomeMessage, setWelcomeMessage] = useState(settings?.welcome_message || '');
  const [eventSubtitle, setEventSubtitle] = useState(settings?.event_subtitle || '');
  const [logoSize, setLogoSize] = useState(settings?.logo_size ?? 80);
  const [logoRounded, setLogoRounded] = useState(settings?.logo_rounded ?? false);

  const [fontTitleFamily, setFontTitleFamily] = useState(settings?.font_title_family || 'Inter');
  const [fontTitleSize, setFontTitleSize] = useState(settings?.font_title_size ?? 32);
  const [fontTitleWeight, setFontTitleWeight] = useState(settings?.font_title_weight ?? 700);
  const [fontSubtitleFamily, setFontSubtitleFamily] = useState(settings?.font_subtitle_family || 'Inter');
  const [fontSubtitleSize, setFontSubtitleSize] = useState(settings?.font_subtitle_size ?? 16);
  const [fontSubtitleWeight, setFontSubtitleWeight] = useState(settings?.font_subtitle_weight ?? 400);
  const [fontDatetimeFamily, setFontDatetimeFamily] = useState(settings?.font_datetime_family || 'Inter');
  const [fontDatetimeSize, setFontDatetimeSize] = useState(settings?.font_datetime_size ?? 14);
  const [fontDatetimeWeight, setFontDatetimeWeight] = useState(settings?.font_datetime_weight ?? 400);
  const [fontVenueFamily, setFontVenueFamily] = useState(settings?.font_venue_family || 'Inter');
  const [fontVenueSize, setFontVenueSize] = useState(settings?.font_venue_size ?? 14);
  const [fontVenueWeight, setFontVenueWeight] = useState(settings?.font_venue_weight ?? 400);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const input: GuestPageSettingsInput = {
        color_primary: colorPrimary,
        color_background: colorBg,
        color_card: colorCard,
        color_text: colorText,
        color_header: colorHeader,
        border_radius: borderRadius,
        welcome_message: welcomeMessage || undefined,
        event_subtitle: eventSubtitle || undefined,
        logo_size: logoSize,
        logo_rounded: logoRounded,
        font_title_family: fontTitleFamily,
        font_title_size: fontTitleSize,
        font_title_weight: fontTitleWeight,
        font_subtitle_family: fontSubtitleFamily,
        font_subtitle_size: fontSubtitleSize,
        font_subtitle_weight: fontSubtitleWeight,
        font_datetime_family: fontDatetimeFamily,
        font_datetime_size: fontDatetimeSize,
        font_datetime_weight: fontDatetimeWeight,
        font_venue_family: fontVenueFamily,
        font_venue_size: fontVenueSize,
        font_venue_weight: fontVenueWeight,
      };
      await upsert.mutateAsync({ eventId, ...input });
      toast('Theme saved');
    } catch (err) {
      toast(classifyError(err).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const logoSizeLabel = logoSize <= 80 ? 'Small' : logoSize <= 160 ? 'Medium' : logoSize <= 280 ? 'Large' : 'Extra Large';

  return (
    <div>
      <style>{getDynamicFontStyles()}</style>
      <div className="card">
        <h2 className="ee-section-title">Theme Editor</h2>

        <h3 className="ee-subsection-title">Colors</h3>
        <div className="ee-form-grid">
          <ColorField label="Primary" value={colorPrimary} onChange={setColorPrimary} />
          <ColorField label="Background" value={colorBg} onChange={setColorBg} />
          <ColorField label="Card" value={colorCard} onChange={setColorCard} />
          <ColorField label="Text" value={colorText} onChange={setColorText} />
          <ColorField label="Header" value={colorHeader} onChange={setColorHeader} />
          <div className="form-group">
            <label className="form-label">Border Radius: {borderRadius}px</label>
            <input type="range" min="0" max="24" value={borderRadius} onChange={(e) => setBorderRadius(parseInt(e.target.value))} />
          </div>
        </div>

        <h3 className="ee-subsection-title">Event Content</h3>
        <div className="ee-form-grid">
          <div className="form-group">
            <label className="form-label">Event Subtitle</label>
            <input value={eventSubtitle} onChange={(e) => setEventSubtitle(e.target.value)} placeholder="e.g. Together with their families" />
          </div>
          <div className="form-group">
            <label className="form-label">Welcome Message</label>
            <input value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Welcome message for guests" />
          </div>
        </div>

        <h3 className="ee-subsection-title">Logo Size ({logoSizeLabel} — {logoSize}px)</h3>
        <div className="form-group">
          <input type="range" min="40" max="500" step="10" value={logoSize} onChange={(e) => setLogoSize(parseInt(e.target.value))} />
          <div className="ee-size-labels">
            <span>Small</span><span>Medium</span><span>Large</span><span>Extra Large</span>
          </div>
        </div>
        <div className="form-group">
          <label className="ee-checkbox-label">
            <input type="checkbox" checked={logoRounded} onChange={(e) => setLogoRounded(e.target.checked)} />
            Rounded logo corners
          </label>
        </div>

        <h3 className="ee-subsection-title">Typography</h3>
        <p className="ee-muted" style={{ marginBottom: '16px' }}>Customise how text appears on the Guest Website. Each font is shown in its own style.</p>

        <div className="ee-typography-section">
          <h4 className="ee-typo-group-title">Event Title</h4>
          <TypographyControls
            family={fontTitleFamily} setFamily={setFontTitleFamily}
            size={fontTitleSize} setSize={setFontTitleSize}
            weight={fontTitleWeight} setWeight={setFontTitleWeight}
          />
          <div className="ee-typo-preview" style={{ fontFamily: fontTitleFamily, fontSize: `${fontTitleSize}px`, fontWeight: fontTitleWeight }}>
            Your Event Title
          </div>
        </div>

        <div className="ee-typography-section">
          <h4 className="ee-typo-group-title">Event Subtitle</h4>
          <TypographyControls
            family={fontSubtitleFamily} setFamily={setFontSubtitleFamily}
            size={fontSubtitleSize} setSize={setFontSubtitleSize}
            weight={fontSubtitleWeight} setWeight={setFontSubtitleWeight}
          />
          <div className="ee-typo-preview" style={{ fontFamily: fontSubtitleFamily, fontSize: `${fontSubtitleSize}px`, fontWeight: fontSubtitleWeight }}>
            Together with their families
          </div>
        </div>

        <div className="ee-typography-section">
          <h4 className="ee-typo-group-title">Date &amp; Time</h4>
          <TypographyControls
            family={fontDatetimeFamily} setFamily={setFontDatetimeFamily}
            size={fontDatetimeSize} setSize={setFontDatetimeSize}
            weight={fontDatetimeWeight} setWeight={setFontDatetimeWeight}
          />
          <div className="ee-typo-preview" style={{ fontFamily: fontDatetimeFamily, fontSize: `${fontDatetimeSize}px`, fontWeight: fontDatetimeWeight }}>
            Saturday, 15 June 2024 at 6:00 PM
          </div>
        </div>

        <div className="ee-typography-section">
          <h4 className="ee-typo-group-title">Venue</h4>
          <TypographyControls
            family={fontVenueFamily} setFamily={setFontVenueFamily}
            size={fontVenueSize} setSize={setFontVenueSize}
            weight={fontVenueWeight} setWeight={setFontVenueWeight}
          />
          <div className="ee-typo-preview" style={{ fontFamily: fontVenueFamily, fontSize: `${fontVenueSize}px`, fontWeight: fontVenueWeight }}>
            The Grand Ballroom, Hilton Hotel
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: '24px' }}>
          {saving ? 'Saving...' : 'Save Theme'}
        </button>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="ee-color-field">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="ee-color-picker" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="ee-color-text" />
      </div>
    </div>
  );
}

function TypographyControls({ family, setFamily, size, setSize, weight, setWeight }: {
  family: string; setFamily: (v: string) => void;
  size: number; setSize: (v: number) => void;
  weight: number; setWeight: (v: number) => void;
}) {
  return (
    <div className="ee-typo-controls">
      <div className="form-group">
        <label className="form-label">Font Family</label>
        <select value={family} onChange={(e) => setFamily(e.target.value)} style={{ fontFamily: family }}>
          {GOOGLE_FONTS.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Font Size</label>
        <select value={size} onChange={(e) => setSize(parseInt(e.target.value))}>
          {FONT_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Font Weight</label>
        <select value={weight} onChange={(e) => setWeight(parseInt(e.target.value))}>
          {FONT_WEIGHTS.map((w) => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ShareTab({ event, updateEvent, toast }: { event: EventData; updateEvent: UpdateEventMut; toast: ToastFn }) {
  const [slug, setSlug] = useState(event.slug);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/find-your-seat` : '';
  const fullUrl = `${baseUrl}/${slug}`;
  const slugCheck = useCheckSlugAvailability(slug, event.id);

  useEffect(() => {
    if (fullUrl) {
      QRCode.toDataURL(fullUrl, { width: 300, margin: 2, color: { dark: '#1A1A1A', light: '#FFFFFF' } })
        .then(setQrDataUrl).catch((err) => console.error('QR PNG error:', err));
      QRCode.toString(fullUrl, { type: 'svg', margin: 2, color: { dark: '#1A1A1A', light: '#FFFFFF' } })
        .then(setQrSvg).catch((err) => console.error('QR SVG error:', err));
    }
  }, [fullUrl]);

  const sanitizeSlug = (val: string) => val.toLowerCase().trim().replace(/[^a-z0-9-\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const handleSaveSlug = async () => {
    const clean = sanitizeSlug(slug);
    if (!clean || clean.length < 2) { toast('Slug must be at least 2 characters', 'error'); return; }
    if (slugCheck.data && !slugCheck.data.available) { toast('This slug is already taken', 'error'); return; }
    try {
      await updateEvent.mutateAsync({ id: event.id, slug: clean });
      setSlug(clean);
      toast('URL updated');
    } catch (err) {
      toast(classifyError(err).message, 'error');
    }
  };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(fullUrl); toast('Link copied to clipboard'); }
    catch { toast('Could not copy link: ' + fullUrl, 'error'); }
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a'); a.href = qrDataUrl; a.download = `${slug}-qr.png`; a.click();
  };

  const handleDownloadSvg = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${slug}-qr.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: event.name, text: `Find your seat at ${event.name}`, url: fullUrl }); }
      catch { /* cancelled */ }
    } else { handleCopyLink(); }
  };

  return (
    <div className="card">
      <h2 className="ee-section-title">Share Event</h2>
      <div className="ee-share-grid">
        <div>
          <label className="form-label">Guest Website URL</label>
          <div className="ee-share-url">{fullUrl}</div>
          <label className="form-label" style={{ marginTop: '20px' }}>Custom URL Slug</label>
          <div className="ee-share-slug-field">
            <span className="ee-share-slug-prefix">{baseUrl}/</span>
            <input className="ee-share-slug-input" value={slug} onChange={(e) => setSlug(sanitizeSlug(e.target.value))} placeholder="my-event" />
          </div>
          {slug !== event.slug && slug.length >= 2 && (
            slugCheck.isLoading ? <p className="ee-muted">Checking availability...</p>
            : slugCheck.data?.available ? <p className="ee-share-valid">Slug is available</p>
            : <p className="ee-share-error">Slug is already taken</p>
          )}
          <button className="btn btn-primary" onClick={handleSaveSlug} disabled={updateEvent.isPending || slug === event.slug} style={{ marginTop: '8px' }}>
            Save URL
          </button>
          <div className="ee-share-actions">
            <button className="btn btn-secondary" onClick={handleCopyLink} title="Copy link to clipboard">Copy Link</button>
            <button className="btn btn-secondary" onClick={() => window.open(fullUrl, '_blank')} title="Open guest website">Open Website</button>
            <button className="btn btn-secondary" onClick={handleDownloadPng} title="Download QR code as PNG">Download QR (PNG)</button>
            <button className="btn btn-secondary" onClick={handleDownloadSvg} title="Download QR code as SVG">Download QR (SVG)</button>
            <button className="btn btn-secondary" onClick={handleNativeShare} title="Share via your device">Share</button>
          </div>
        </div>
        <div className="ee-share-qr">
          <label className="form-label" style={{ textAlign: 'center', marginBottom: '12px' }}>QR Code</label>
          {qrDataUrl ? <img src={qrDataUrl} alt="QR code" style={{ width: '100%', maxWidth: '240px', borderRadius: '8px' }} />
            : <p className="ee-muted">Generating QR code...</p>}
        </div>
      </div>
    </div>
  );
}

function getDynamicFontStyles(): string {
  const imports = GOOGLE_FONTS.map((f) =>
    `@import url('https://fonts.googleapis.com/css2?family=${f.css}&display=swap');`
  ).join('\n');
  return imports;
}

const eeStyles = `
.ee-container { max-width: 900px; margin: 0 auto; padding: 24px; }
.ee-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.ee-title { font-size: 24px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.02em; margin: 0; }
.ee-subtitle { font-size: 14px; color: #4A4A4A; margin-top: 4px; }
.ee-header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.ee-tabs { display: flex; gap: 4px; border-bottom: 1px solid #EFEFEF; margin-bottom: 24px; overflow-x: auto; flex-wrap: wrap; }
.ee-tab { padding: 10px 16px; border: none; background: transparent; color: #4A4A4A; font-size: 14px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; }
.ee-tab:hover { color: #1A1A1A; }
.ee-tab-active { color: #1A1A1A; border-bottom-color: #1A1A1A; }
.ee-content { animation: fadeIn 0.2s ease; }
.ee-section-title { font-size: 18px; font-weight: 600; color: #1A1A1A; margin: 0 0 16px; }
.ee-subsection-title { font-size: 15px; font-weight: 600; color: #1A1A1A; margin: 24px 0 12px; }
.ee-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
.ee-row-space { display: flex; justify-content: space-between; align-items: center; }
.ee-row-gap { display: flex; gap: 8px; }
.ee-muted { color: #4A4A4A; font-size: 14px; }
.ee-add-form { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
.ee-flex-input { flex: 1; min-width: 150px; }
.ee-search { margin-top: 16px; margin-bottom: 16px; width: 100%; }
.ee-list { display: flex; flex-direction: column; gap: 8px; }
.ee-list-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 8px; background: #F8F8F8; border: 1px solid #EFEFEF; }
.ee-list-name { font-size: 14px; font-weight: 500; color: #1A1A1A; }
.ee-list-meta { font-size: 13px; color: #4A4A4A; }
.ee-btn-sm { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; height: auto; }
.ee-import-status { margin-top: 16px; padding: 16px; border-radius: 8px; background: #F8F8F8; border: 1px solid #EFEFEF; font-size: 14px; }
.ee-import-error { background: #FEF2F2; border-color: #FECACA; color: #991B1B; }
.ee-import-success { background: #F0FDF4; border-color: #BBF7D0; color: #166534; }
.ee-layout-canvas { position: relative; width: 100%; height: 500px; background: #F8F8F8; border-radius: 12px; border: 2px dashed #EFEFEF; overflow: hidden; }
.ee-layout-table { position: absolute; padding: 12px 16px; background: #FFFFFF; border: 1px solid #DADADA; border-radius: 8px; cursor: move; font-size: 13px; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.08); user-select: none; }
.ee-layout-table-name { display: block; font-size: 11px; font-weight: 400; color: #4A4A4A; }
.ee-color-field { display: flex; gap: 8px; align-items: center; }
.ee-color-picker { width: 44px; height: 44px; padding: 0; border: 1px solid #DADADA; border-radius: 8px; cursor: pointer; }
.ee-color-text { flex: 1; }
.ee-checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #4A4A4A; cursor: pointer; }
.ee-checkbox-label input { width: auto; height: auto; }
.ee-size-labels { display: flex; justify-content: space-between; font-size: 11px; color: #4A4A4A; margin-top: 4px; }
.ee-typography-section { padding: 16px; border: 1px solid #EFEFEF; border-radius: 12px; margin-bottom: 16px; }
.ee-typo-group-title { font-size: 14px; font-weight: 600; color: #1A1A1A; margin: 0 0 12px; }
.ee-typo-controls { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.ee-typo-preview { padding: 12px; background: #F8F8F8; border-radius: 8px; margin-top: 12px; color: #1A1A1A; }
.ee-share-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
.ee-share-url { padding: 12px 16px; border-radius: 12px; background: #F8F8F8; border: 1px solid #EFEFEF; font-size: 14px; color: #1A1A1A; word-break: break-all; font-family: monospace; }
.ee-share-slug-field { display: flex; align-items: center; border: 1px solid #DADADA; border-radius: 12px; overflow: hidden; }
.ee-share-slug-prefix { padding: 0 12px; font-size: 14px; color: #4A4A4A; white-space: nowrap; background: #F8F8F8; height: 44px; display: flex; align-items: center; }
.ee-share-slug-input { border: none; border-radius: 0; flex: 1; }
.ee-share-slug-input:focus { border: none; }
.ee-share-valid { color: #166534; font-size: 13px; }
.ee-share-error { color: #DC2626; font-size: 13px; }
.ee-share-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
.ee-share-qr { display: flex; flex-direction: column; align-items: center; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@media (max-width: 768px) {
  .ee-form-grid { grid-template-columns: 1fr; }
  .ee-typo-controls { grid-template-columns: 1fr; }
  .ee-share-grid { grid-template-columns: 1fr; }
}
`;
