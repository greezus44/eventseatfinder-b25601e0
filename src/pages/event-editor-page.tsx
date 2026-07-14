import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent, useCheckSlugAvailability } from '@/hooks/use-events';
import { useGuests, useCreateGuest, useDeleteGuest, useUpdateGuest, useBulkCreateGuests } from '@/hooks/use-guests';
import { useTables, useCreateTable, useUpdateTable, useDeleteTable, useBulkCreateTables } from '@/hooks/use-tables';
import { useGuestPageSettings, useUpsertGuestPageSettings } from '@/hooks/use-guest-page-settings';
import { useToast } from '@/providers/toast-provider';
import { useConfirmDialog } from '@/components/confirm-dialog';
import QRCode from 'qrcode';
import type { Event, TableInput, GuestPageSettingsInput } from '@/types';
import { GOOGLE_FONTS, FONT_WEIGHTS, FONT_SIZE_OPTIONS, getFontCss, getFontSize, getFontWeight } from '@/lib/fonts';
import { parseFile, matchGuestsToTables, buildGuestPayload, classifyError, type GuestWithTable } from '@/lib/guest-import';

type Tab = 'settings' | 'guests' | 'tables' | 'layout' | 'theme' | 'share';

const TABS: { id: Tab; label: string }[] = [
  { id: 'settings', label: 'Event Settings' },
  { id: 'guests', label: 'Guests' },
  { id: 'tables', label: 'Tables' },
  { id: 'layout', label: 'Venue Layout' },
  { id: 'theme', label: 'Theme Editor' },
  { id: 'share', label: 'Share' },
];

export function EventEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<Tab>('settings');

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId);
  const { data: tables, isLoading: tablesLoading } = useTables(eventId);
  const { data: settings } = useGuestPageSettings(eventId);

  const deleteEvent = useDeleteEvent();

  if (eventLoading) {
    return <div className="full-center"><div className="spinner" /></div>;
  }
  if (!event) {
    return <div className="ee-container"><p className="ee-muted">Event not found.</p></div>;
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Event',
      message: `Delete "${event.name}"? This cannot be undone.`,
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      await deleteEvent.mutateAsync(event.id);
      toast('Event deleted');
      navigate('/dashboard');
    } catch (err) {
      toast(classifyError(err).message, 'error');
    }
  };

  return (
    <>
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
            <SettingsTab event={event} toast={toast} />
          )}
          {activeTab === 'guests' && (
            <GuestsTab eventId={event.id} guests={guests} tables={tables} guestsLoading={guestsLoading} toast={toast} confirm={confirm} dialog={dialog} />
          )}
          {activeTab === 'tables' && (
            <TablesTab eventId={event.id} tables={tables} tablesLoading={tablesLoading} toast={toast} confirm={confirm} dialog={dialog} />
          )}
          {activeTab === 'layout' && (
            <LayoutTab eventId={event.id} settings={settings} toast={toast} />
          )}
          {activeTab === 'theme' && (
            <ThemeTab eventId={event.id} settings={settings} toast={toast} />
          )}
          {activeTab === 'share' && (
            <ShareTab event={event} toast={toast} />
          )}
        </div>
      </div>
      {dialog}
    </>
  );
}

type ToastFn = (msg: string, type?: 'success' | 'error' | 'info') => void;
type ConfirmFn = ReturnType<typeof useConfirmDialog>['confirm'];
type DialogEl = ReturnType<typeof useConfirmDialog>['dialog'];

// ── Settings Tab (Event Details + Typography) ──────────────────────────
function SettingsTab({ event, toast }: { event: Event; toast: ToastFn }) {
  const updateEvent = useUpdateEvent();
  const { data: settings } = useGuestPageSettings(event.id);
  const upsertSettings = useUpsertGuestPageSettings();

  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(event.date ?? '');
  const [time, setTime] = useState(event.time ?? '');
  const [venue, setVenue] = useState(event.venue ?? '');

  // Typography state
  const [titleFamily, setTitleFamily] = useState(settings?.font_title_family || 'Inter');
  const [titleSize, setTitleSize] = useState(settings?.font_title_size ?? 32);
  const [titleWeight, setTitleWeight] = useState(settings?.font_title_weight ?? 700);
  const [titleColor, setTitleColor] = useState(settings?.font_title_color || '#1A1A1A');
  const [subtitleFamily, setSubtitleFamily] = useState(settings?.font_subtitle_family || 'Inter');
  const [subtitleSize, setSubtitleSize] = useState(settings?.font_subtitle_size ?? 16);
  const [subtitleWeight, setSubtitleWeight] = useState(settings?.font_subtitle_weight ?? 400);
  const [subtitleColor, setSubtitleColor] = useState(settings?.font_subtitle_color || '#4A4A4A');
  const [datetimeFamily, setDatetimeFamily] = useState(settings?.font_datetime_family || 'Inter');
  const [datetimeSize, setDatetimeSize] = useState(settings?.font_datetime_size ?? 14);
  const [datetimeWeight, setDatetimeWeight] = useState(settings?.font_datetime_weight ?? 400);
  const [datetimeColor, setDatetimeColor] = useState(settings?.font_datetime_color || '#4A4A4A');
  const [venueFontFamily, setVenueFontFamily] = useState(settings?.font_venue_family || 'Inter');
  const [venueFontSize, setVenueFontSize] = useState(settings?.font_venue_size ?? 14);
  const [venueFontWeight, setVenueFontWeight] = useState(settings?.font_venue_weight ?? 400);
  const [venueFontColor, setVenueFontColor] = useState(settings?.font_venue_color || '#4A4A4A');
  const [welcomeFamily, setWelcomeFamily] = useState(settings?.font_welcome_family || 'Inter');
  const [welcomeSize, setWelcomeSize] = useState(settings?.font_welcome_size ?? 16);
  const [welcomeWeight, setWelcomeWeight] = useState(settings?.font_welcome_weight ?? 400);
  const [welcomeColor, setWelcomeColor] = useState(settings?.font_welcome_color || '#4A4A4A');
  const [welcomeMessage, setWelcomeMessage] = useState(settings?.welcome_message || '');
  const [eventSubtitle, setEventSubtitle] = useState(settings?.event_subtitle || '');

  const [savingDetails, setSavingDetails] = useState(false);
  const [savingTypography, setSavingTypography] = useState(false);

  const detailsDirty = name !== event.name || date !== (event.date ?? '') || time !== (event.time ?? '') || venue !== (event.venue ?? '');

  const handleSaveDetails = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast('Event name is required', 'error'); return; }
    setSavingDetails(true);
    try {
      await updateEvent.mutateAsync({ id: event.id, name: name.trim(), date: date || null, time: time || null, venue: venue || null });
      toast('Event details saved');
    } catch (err) {
      toast(classifyError(err).message, 'error');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleSaveTypography = async () => {
    setSavingTypography(true);
    try {
      const input: GuestPageSettingsInput = {
        font_title_family: titleFamily,
        font_title_size: titleSize,
        font_title_weight: titleWeight,
        font_title_color: titleColor,
        font_subtitle_family: subtitleFamily,
        font_subtitle_size: subtitleSize,
        font_subtitle_weight: subtitleWeight,
        font_subtitle_color: subtitleColor,
        font_datetime_family: datetimeFamily,
        font_datetime_size: datetimeSize,
        font_datetime_weight: datetimeWeight,
        font_datetime_color: datetimeColor,
        font_venue_family: venueFontFamily,
        font_venue_size: venueFontSize,
        font_venue_weight: venueFontWeight,
        font_venue_color: venueFontColor,
        font_welcome_family: welcomeFamily,
        font_welcome_size: welcomeSize,
        font_welcome_weight: welcomeWeight,
        font_welcome_color: welcomeColor,
        welcome_message: welcomeMessage || null,
        event_subtitle: eventSubtitle || null,
      };
      await upsertSettings.mutateAsync({ eventId: event.id, ...input });
      toast('Typography settings saved');
    } catch (err) {
      toast(classifyError(err).message, 'error');
    } finally {
      setSavingTypography(false);
    }
  };

  return (
    <>
      <style>{getDynamicFontStyles()}</style>
      <form onSubmit={handleSaveDetails} className="card">
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
        <button type="submit" className="btn btn-primary" disabled={savingDetails || !detailsDirty}>
          {savingDetails ? 'Saving...' : 'Save Details'}
        </button>
      </form>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2 className="ee-section-title">Typography</h2>
        <p className="ee-muted" style={{ marginBottom: '16px' }}>Customise how text appears on the Guest Website. Each font is shown in its own style.</p>

        <TypographySection
          title="Event Name"
          family={titleFamily} setFamily={setTitleFamily}
          size={titleSize} setSize={setTitleSize}
          weight={titleWeight} setWeight={setTitleWeight}
          color={titleColor} setColor={setTitleColor}
          preview="Your Event Title"
        />
        <TypographySection
          title="Event Subtitle"
          family={subtitleFamily} setFamily={setSubtitleFamily}
          size={subtitleSize} setSize={setSubtitleSize}
          weight={subtitleWeight} setWeight={setSubtitleWeight}
          color={subtitleColor} setColor={setSubtitleColor}
          preview="Together with their families"
        />
        <TypographySection
          title="Date & Time"
          family={datetimeFamily} setFamily={setDatetimeFamily}
          size={datetimeSize} setSize={setDatetimeSize}
          weight={datetimeWeight} setWeight={setDatetimeWeight}
          color={datetimeColor} setColor={setDatetimeColor}
          preview="Saturday, 15 June 2024 at 6:00 PM"
        />
        <TypographySection
          title="Venue"
          family={venueFontFamily} setFamily={setVenueFontFamily}
          size={venueFontSize} setSize={setVenueFontSize}
          weight={venueFontWeight} setWeight={setVenueFontWeight}
          color={venueFontColor} setColor={setVenueFontColor}
          preview="The Grand Ballroom, Hilton Hotel"
        />
        <TypographySection
          title="Welcome Message"
          family={welcomeFamily} setFamily={setWelcomeFamily}
          size={welcomeSize} setSize={setWelcomeSize}
          weight={welcomeWeight} setWeight={setWelcomeWeight}
          color={welcomeColor} setColor={setWelcomeColor}
          preview="We invite you to celebrate our special day"
        />

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Welcome Message Text</label>
          <input value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Welcome message shown to guests" />
        </div>
        <div className="form-group">
          <label className="form-label">Event Subtitle Text</label>
          <input value={eventSubtitle} onChange={(e) => setEventSubtitle(e.target.value)} placeholder="e.g. Together with their families" />
        </div>

        <button className="btn btn-primary" onClick={handleSaveTypography} disabled={savingTypography} style={{ marginTop: '16px' }}>
          {savingTypography ? 'Saving...' : 'Save Typography'}
        </button>
      </div>
    </>
  );
}

function TypographySection({ title, family, setFamily, size, setSize, weight, setWeight, color, setColor, preview }: {
  title: string;
  family: string; setFamily: (v: string) => void;
  size: number; setSize: (v: number) => void;
  weight: number; setWeight: (v: number) => void;
  color: string; setColor: (v: string) => void;
  preview: string;
}) {
  return (
    <div className="ee-typography-section">
      <h4 className="ee-typo-group-title">{title}</h4>
      <div className="ee-typo-controls">
        <div className="form-group">
          <label className="form-label">Font Family</label>
          <select value={family} onChange={(e) => setFamily(e.target.value)} style={{ fontFamily: getFontCss(family) }}>
            {GOOGLE_FONTS.map((f) => (
              <option key={f.name} value={f.name} style={{ fontFamily: getFontCss(f.name) }}>{f.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Font Size: {size}px</label>
          <input type="range" min={10} max={96} value={size} onChange={(e) => setSize(parseInt(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Font Weight</label>
          <select value={weight} onChange={(e) => setWeight(parseInt(e.target.value))}>
            {FONT_WEIGHTS.map((w) => (
              <option key={w} value={w}>{w === 300 ? 'Light 300' : w === 400 ? 'Regular 400' : w === 500 ? 'Medium 500' : w === 600 ? 'SemiBold 600' : 'Bold 700'}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Font Colour</label>
          <div className="ee-color-field">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="ee-color-picker" />
            <input value={color} onChange={(e) => setColor(e.target.value)} className="ee-color-text" />
          </div>
        </div>
      </div>
      <div className="ee-typo-preview" style={{ fontFamily: getFontCss(family), fontSize: `${size}px`, fontWeight: getFontWeight(weight), color }}>
        {preview}
      </div>
    </div>
  );
}

// ── Guests Tab (Two-column: list + management panel) ────────────────────
function GuestsTab({ eventId, guests, tables, guestsLoading, toast, confirm, dialog }: {
  eventId: string;
  guests: ReturnType<typeof useGuests>['data'];
  tables: ReturnType<typeof useTables>['data'];
  guestsLoading: boolean;
  toast: ToastFn;
  confirm: ConfirmFn;
  dialog: DialogEl;
}) {
  const createGuest = useCreateGuest();
  const deleteGuest = useDeleteGuest();
  const updateGuest = useUpdateGuest();
  const bulkCreateGuests = useBulkCreateGuests();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'table' | 'created'>('name');
  const [filterTable, setFilterTable] = useState('');
  const [editingGuest, setEditingGuest] = useState<{ id: string; name: string; tableId: string } | null>(null);

  // Manual bulk add rows
  const [manualRows, setManualRows] = useState<{ name: string; tableId: string }[]>([{ name: '', tableId: '' }]);
  const [savingManual, setSavingManual] = useState(false);

  // Import state
  const [importedGuests, setImportedGuests] = useState<GuestWithTable[]>([]);
  const [importStage, setImportStage] = useState<string>('idle');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const [confirmingImport, setConfirmingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDropRef = useRef<HTMLDivElement>(null);

  const tableMap = new Map<string, string>();
  (tables ?? []).forEach((t) => tableMap.set(t.id, t.name));

  const filteredGuests = (guests ?? [])
    .filter((g) => !filterTable || g.table_id === filterTable)
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'table') return (tableMap.get(a.table_id ?? '') || '').localeCompare(tableMap.get(b.table_id ?? '') || '');
      return b.created_at.localeCompare(a.created_at);
    });

  const handleDeleteGuest = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Guest',
      message: `Remove "${name}" from the guest list?`,
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      await deleteGuest.mutateAsync({ id, eventId });
      toast('Guest deleted');
    } catch (err) {
      toast(classifyError(err).message, 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingGuest || !editingGuest.name.trim()) return;
    try {
      await updateGuest.mutateAsync({ id: editingGuest.id, eventId, name: editingGuest.name.trim(), table_id: editingGuest.tableId || null });
      toast('Guest updated');
      setEditingGuest(null);
    } catch (err) {
      toast(classifyError(err).message, 'error');
    }
  };

  // Manual bulk add
  const addManualRow = () => setManualRows([...manualRows, { name: '', tableId: '' }]);
  const removeManualRow = (idx: number) => setManualRows(manualRows.filter((_, i) => i !== idx));
  const updateManualRow = (idx: number, field: 'name' | 'tableId', value: string) => {
    const updated = [...manualRows];
    updated[idx][field] = value;
    setManualRows(updated);
  };
  const handleManualKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addManualRow();
    }
  };

  const handleSaveManual = async () => {
    const valid = manualRows.filter((r) => r.name.trim());
    if (valid.length === 0) { toast('Add at least one guest name', 'error'); return; }
    setSavingManual(true);
    try {
      const guestsInput = valid.map((r) => ({ name: r.name.trim(), table_id: r.tableId || null }));
      const result = await bulkCreateGuests.mutateAsync({ eventId, guests: guestsInput });
      toast(`Added ${result.length} guests`);
      setManualRows([{ name: '', tableId: '' }]);
    } catch (err) {
      toast(classifyError(err).message, 'error');
    } finally {
      setSavingManual(false);
    }
  };

  // Paste from Excel
  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text.includes('\t') || text.includes('\n')) {
      e.preventDefault();
      const lines = text.split('\n').filter(l => l.trim());
      const newRows = lines.map(line => {
        const parts = line.split('\t');
        return { name: (parts[0] || '').trim(), tableId: '' };
      });
      // Try to match table from second column
      const withTables = lines.map(line => {
        const parts = line.split('\t');
        const tableName = (parts[1] || '').trim();
        const matchedTable = (tables ?? []).find(t =>
          t.name.toLowerCase() === tableName.toLowerCase() ||
          String(t.number) === tableName ||
          `table ${t.number}`.toLowerCase() === tableName.toLowerCase()
        );
        return { name: (parts[0] || '').trim(), tableId: matchedTable?.id || '' };
      });
      setManualRows(withTables.filter(r => r.name));
    }
  };

  // File import
  const handleFileUpload = async (file: File) => {
    setImportStage('parsing');
    setImportError('');
    setImportedGuests([]);

    try {
      const parsed = await parseFile(file);
      console.log('[Import] Parsed rows:', parsed.length);

      if (parsed.length === 0) {
        setImportError('No valid guest rows found. Ensure the file has a "Name" column.');
        setImportStage('error');
        return;
      }

      setImportStage('matching');
      const mapped = matchGuestsToTables(parsed, tables ?? []);
      console.log('[Import] Mapped guests:', mapped.length);

      setImportedGuests(mapped);
      setImportStage('review');
      toast(`Parsed ${mapped.length} guests. Review and confirm.`);
    } catch (err) {
      console.error('[Import] Error:', err);
      const classified = classifyError(err);
      setImportError(classified.message);
      setImportStage('error');
      toast(classified.message, 'error');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dragDropRef.current?.classList.add('ee-drag-drop-active');
  };
  const handleDragLeave = () => dragDropRef.current?.classList.remove('ee-drag-drop-active');
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDropRef.current?.classList.remove('ee-drag-drop-active');
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const updateImportedGuest = (idx: number, field: 'name' | 'tableId', value: string) => {
    const updated = [...importedGuests];
    if (field === 'name') updated[idx].name = value;
    else {
      updated[idx].table_id = value || null;
      const t = (tables ?? []).find(t => t.id === value);
      updated[idx].table_name = t?.name || '';
    }
    setImportedGuests(updated);
  };
  const removeImportedGuest = (idx: number) => setImportedGuests(importedGuests.filter((_, i) => i !== idx));
  const addImportedGuestRow = () => setImportedGuests([...importedGuests, { name: '', table_id: null, table_name: '', raw_table: '' }]);

  const handleConfirmImport = async () => {
    const valid = importedGuests.filter((g) => g.name.trim());
    if (valid.length === 0) { toast('No valid guests to import', 'error'); return; }
    setConfirmingImport(true);
    setImportStage('importing');
    try {
      const payload = valid.map((g) => ({ name: g.name.trim(), table_id: g.table_id }));
      console.log('[Import] Confirming import:', { count: payload.length, eventId });
      const result = await bulkCreateGuests.mutateAsync({ eventId, guests: payload });
      console.log('[Import] Insert result:', result.length);
      toast(`Imported ${result.length} guests successfully`);
      setImportedGuests([]);
      setImportStage('complete');
      setTimeout(() => setImportStage('idle'), 3000);
    } catch (err) {
      console.error('[Import] Confirm error:', err);
      toast(classifyError(err).message, 'error');
      setImportStage('review');
    } finally {
      setConfirmingImport(false);
    }
  };

  return (
    <div className="ee-two-col">
      {/* Left: Guest List */}
      <div className="card">
        <h2 className="ee-section-title">Guest List ({guests?.length ?? 0})</h2>

        <input className="ee-search" placeholder="Search guests..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <div className="ee-row-gap" style={{ marginBottom: '16px' }}>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'table' | 'created')} style={{ flex: 1 }}>
            <option value="name">Sort by Name</option>
            <option value="table">Sort by Table</option>
            <option value="created">Sort by Date Added</option>
          </select>
          <select value={filterTable} onChange={(e) => setFilterTable(e.target.value)} style={{ flex: 1 }}>
            <option value="">All Tables</option>
            {(tables ?? []).map((t) => (
              <option key={t.id} value={t.id}>Table {t.number} — {t.name}</option>
            ))}
          </select>
        </div>

        {guestsLoading ? (
          <p className="ee-muted">Loading guests...</p>
        ) : filteredGuests.length === 0 ? (
          <p className="ee-muted">No guests found.</p>
        ) : (
          <div className="ee-list">
            {filteredGuests.map((g) => (
              <div key={g.id} className="ee-list-row">
                {editingGuest?.id === g.id ? (
                  <>
                    <input
                      value={editingGuest.name}
                      onChange={(e) => setEditingGuest({ ...editingGuest, name: e.target.value })}
                      style={{ flex: 1, marginRight: '8px' }}
                    />
                    <select
                      value={editingGuest.tableId}
                      onChange={(e) => setEditingGuest({ ...editingGuest, tableId: e.target.value })}
                      style={{ flex: 1, marginRight: '8px' }}
                    >
                      <option value="">No table</option>
                      {(tables ?? []).map((t) => (
                        <option key={t.id} value={t.id}>Table {t.number} — {t.name}</option>
                      ))}
                    </select>
                    <button className="btn btn-primary ee-btn-sm" onClick={handleSaveEdit}>Save</button>
                    <button className="btn btn-secondary ee-btn-sm" onClick={() => setEditingGuest(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="ee-list-name">{g.name}</span>
                    {g.table_id && <span className="ee-list-meta">Table {tableMap.get(g.table_id) ?? ''}</span>}
                    <div className="ee-row-gap">
                      <button className="btn btn-secondary ee-btn-sm" onClick={() => setEditingGuest({ id: g.id, name: g.name, tableId: g.table_id ?? '' })}>Edit</button>
                      <button className="btn btn-danger ee-btn-sm" onClick={() => handleDeleteGuest(g.id, g.name)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Guest Management Panel */}
      <div className="card">
        <h2 className="ee-section-title">Guest Management</h2>

        {/* Section A: Manual Bulk Add */}
        <div className="ee-mgmt-section">
          <h3 className="ee-subsection-title">Manual Bulk Add</h3>
          <p className="ee-muted" style={{ marginBottom: '12px' }}>Type guest names directly. Press Enter to add a new row. Paste from Excel is supported.</p>

          <div className="ee-bulk-table">
            <div className="ee-bulk-header">
              <span>Guest Name</span>
              <span>Table</span>
              <span></span>
            </div>
            {manualRows.map((row, idx) => (
              <div key={idx} className="ee-bulk-row">
                <input
                  value={row.name}
                  onChange={(e) => updateManualRow(idx, 'name', e.target.value)}
                  onKeyDown={(e) => handleManualKeyDown(e, idx)}
                  onPaste={handlePaste}
                  placeholder="Guest name"
                />
                <select
                  value={row.tableId}
                  onChange={(e) => updateManualRow(idx, 'tableId', e.target.value)}
                >
                  <option value="">No table</option>
                  {(tables ?? []).map((t) => (
                    <option key={t.id} value={t.id}>Table {t.number} — {t.name}</option>
                  ))}
                </select>
                <button className="btn btn-danger ee-btn-sm" onClick={() => removeManualRow(idx)} disabled={manualRows.length === 1}>×</button>
              </div>
            ))}
          </div>

          <div className="ee-row-gap" style={{ marginTop: '12px' }}>
            <button className="btn btn-secondary" onClick={addManualRow}>Add Row</button>
            <button className="btn btn-primary" onClick={handleSaveManual} disabled={savingManual}>
              {savingManual ? 'Adding...' : 'Add Guests'}
            </button>
          </div>
        </div>

        {/* Section B: Import Guest List */}
        <div className="ee-mgmt-section" style={{ marginTop: '24px' }}>
          <h3 className="ee-subsection-title">Import Guest List</h3>
          <p className="ee-muted" style={{ marginBottom: '12px' }}>Upload CSV, XLSX, XLS, or PDF. The system will automatically detect guest names and table numbers.</p>

          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.pdf" style={{ display: 'none' }} onChange={handleFileInput} />

          <div
            ref={dragDropRef}
            className="ee-drag-drop"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p style={{ fontSize: '15px', fontWeight: 500 }}>Drag & drop a file here, or click to browse</p>
            <p style={{ fontSize: '13px', color: '#4A4A4A', marginTop: '4px' }}>Supports CSV, XLSX, XLS, PDF</p>
          </div>

          {importStage === 'parsing' && <p className="ee-muted" style={{ marginTop: '8px' }}>Parsing file...</p>}
          {importStage === 'matching' && <p className="ee-muted" style={{ marginTop: '8px' }}>Matching guests to tables...</p>}
          {importStage === 'importing' && <p className="ee-muted" style={{ marginTop: '8px' }}>Importing guests to database...</p>}
          {importStage === 'complete' && <p style={{ marginTop: '8px', color: '#166534' }}>Import complete!</p>}
          {importStage === 'error' && <p style={{ marginTop: '8px', color: '#DC2626' }}>{importError}</p>}

          {importStage === 'review' && importedGuests.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Review Import ({importedGuests.length} guests)</h4>
              <div className="ee-review-table">
                <div className="ee-bulk-header">
                  <span>Guest Name</span>
                  <span>Table</span>
                  <span></span>
                </div>
                {importedGuests.map((g, idx) => (
                  <div key={idx} className="ee-bulk-row">
                    <input value={g.name} onChange={(e) => updateImportedGuest(idx, 'name', e.target.value)} placeholder="Guest name" />
                    <select value={g.table_id ?? ''} onChange={(e) => updateImportedGuest(idx, 'tableId', e.target.value)}>
                      <option value="">No table</option>
                      {(tables ?? []).map((t) => (
                        <option key={t.id} value={t.id}>Table {t.number} — {t.name}</option>
                      ))}
                    </select>
                    <button className="btn btn-danger ee-btn-sm" onClick={() => removeImportedGuest(idx)}>×</button>
                  </div>
                ))}
              </div>
              <div className="ee-row-gap" style={{ marginTop: '12px' }}>
                <button className="btn btn-secondary" onClick={addImportedGuestRow}>Add Row</button>
                <button className="btn btn-primary" onClick={handleConfirmImport} disabled={confirmingImport}>
                  {confirmingImport ? 'Importing...' : `Confirm Import (${importedGuests.filter(g => g.name.trim()).length})`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {dialog}
    </div>
  );
}

// ── Tables Tab (Bulk Create + Custom Names) ────────────────────────────
function TablesTab({ eventId, tables, tablesLoading, toast, confirm, dialog }: {
  eventId: string;
  tables: ReturnType<typeof useTables>['data'];
  tablesLoading: boolean;
  toast: ToastFn;
  confirm: ConfirmFn;
  dialog: DialogEl;
}) {
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();
  const bulkCreateTables = useBulkCreateTables();
  const updateTable = useUpdateTable();

  // Bulk sequential
  const [prefix, setPrefix] = useState('Table');
  const [startNum, setStartNum] = useState('1');
  const [count, setCount] = useState('10');
  const [seats, setSeats] = useState('8');
  const [bulkMode, setBulkMode] = useState<'sequential' | 'custom'>('sequential');

  // Custom names
  const [customRows, setCustomRows] = useState<{ name: string; capacity: string }[]>([{ name: '', capacity: '8' }]);
  const [savingBulk, setSavingBulk] = useState(false);

  // Edit table
  const [editingTable, setEditingTable] = useState<{ id: string; name: string; capacity: string } | null>(null);

  const existingNames = new Set((tables ?? []).map(t => t.name.toLowerCase()));

  const handleBulkCreate = async () => {
    const start = parseInt(startNum) || 1;
    const num = parseInt(count) || 1;
    const cap = parseInt(seats) || 8;

    const newTables: TableInput[] = [];
    for (let i = 0; i < num; i++) {
      const tableNum = start + i;
      const name = prefix ? `${prefix} ${tableNum}` : String(tableNum);
      if (existingNames.has(name.toLowerCase())) {
        toast(`Duplicate table name: "${name}" — skipping`, 'error');
        continue;
      }
      newTables.push({ name, number: tableNum, capacity: cap });
    }

    if (newTables.length === 0) {
      toast('No new tables to create (all duplicates)', 'error');
      return;
    }

    setSavingBulk(true);
    try {
      await bulkCreateTables.mutateAsync({ event_id: eventId, tables: newTables });
      toast(`Created ${newTables.length} tables`);
    } catch (err) {
      toast(classifyError(err).message, 'error');
    } finally {
      setSavingBulk(false);
    }
  };

  const handleCustomCreate = async () => {
    const valid = customRows.filter(r => r.name.trim());
    if (valid.length === 0) { toast('Add at least one table name', 'error'); return; }

    // Check duplicates
    const seen = new Set<string>();
    for (const r of valid) {
      const key = r.name.trim().toLowerCase();
      if (existingNames.has(key) || seen.has(key)) {
        toast(`Duplicate table name: "${r.name.trim()}"`, 'error');
        return;
      }
      seen.add(key);
    }

    setSavingBulk(true);
    try {
      const newTables: TableInput[] = valid.map((r, i) => ({
        name: r.name.trim(),
        number: (tables?.length ?? 0) + i + 1,
        capacity: parseInt(r.capacity) || 8,
      }));
      await bulkCreateTables.mutateAsync({ event_id: eventId, tables: newTables });
      toast(`Created ${newTables.length} tables`);
      setCustomRows([{ name: '', capacity: '8' }]);
    } catch (err) {
      toast(classifyError(err).message, 'error');
    } finally {
      setSavingBulk(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Table',
      message: `Delete "${name}"? Guests at this table will be unassigned.`,
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      await deleteTable.mutateAsync({ id, eventId });
      toast('Table deleted');
    } catch (err) {
      toast(classifyError(err).message, 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTable || !editingTable.name.trim()) return;
    try {
      await updateTable.mutateAsync({ id: editingTable.id, name: editingTable.name.trim(), capacity: parseInt(editingTable.capacity) || 8 });
      toast('Table updated');
      setEditingTable(null);
    } catch (err) {
      toast(classifyError(err).message, 'error');
    }
  };

  return (
    <div className="card">
      <h2 className="ee-section-title">Tables ({tables?.length ?? 0})</h2>

      {/* Bulk Create Section */}
      <div className="ee-mgmt-section">
        <h3 className="ee-subsection-title">Bulk Create Tables</h3>

        <div className="ee-row-gap" style={{ marginBottom: '16px' }}>
          <button className={`btn ${bulkMode === 'sequential' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setBulkMode('sequential')}>Sequential Numbering</button>
          <button className={`btn ${bulkMode === 'custom' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setBulkMode('custom')}>Custom Names</button>
        </div>

        {bulkMode === 'sequential' ? (
          <div className="ee-form-grid">
            <div className="form-group">
              <label className="form-label">Table Prefix (optional)</label>
              <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="Table, VIP, Family..." />
            </div>
            <div className="form-group">
              <label className="form-label">Starting Number</label>
              <input type="number" value={startNum} onChange={(e) => setStartNum(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Number of Tables</label>
              <input type="number" value={count} onChange={(e) => setCount(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Seats Per Table</label>
              <input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} />
            </div>
          </div>
        ) : (
          <div>
            <div className="ee-bulk-table">
              <div className="ee-bulk-header">
                <span>Table Name</span>
                <span>Capacity</span>
                <span></span>
              </div>
              {customRows.map((row, idx) => (
                <div key={idx} className="ee-bulk-row">
                  <input
                    value={row.name}
                    onChange={(e) => {
                      const updated = [...customRows];
                      updated[idx].name = e.target.value;
                      setCustomRows(updated);
                    }}
                    placeholder="e.g. VIP, Bride Family, Sponsors..."
                  />
                  <input
                    type="number"
                    value={row.capacity}
                    onChange={(e) => {
                      const updated = [...customRows];
                      updated[idx].capacity = e.target.value;
                      setCustomRows(updated);
                    }}
                  />
                  <button className="btn btn-danger ee-btn-sm" onClick={() => setCustomRows(customRows.filter((_, i) => i !== idx))} disabled={customRows.length === 1}>×</button>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '8px' }} onClick={() => setCustomRows([...customRows, { name: '', capacity: '8' }])}>Add Row</button>
          </div>
        )}

        <button className="btn btn-primary" onClick={bulkMode === 'sequential' ? handleBulkCreate : handleCustomCreate} disabled={savingBulk} style={{ marginTop: '16px' }}>
          {savingBulk ? 'Creating...' : 'Create Tables'}
        </button>
      </div>

      {/* Existing Tables List */}
      <div style={{ marginTop: '24px' }}>
        <h3 className="ee-subsection-title">Existing Tables</h3>
        {tablesLoading ? (
          <p className="ee-muted">Loading tables...</p>
        ) : !tables || tables.length === 0 ? (
          <p className="ee-muted">No tables yet. Use the bulk creator above.</p>
        ) : (
          <div className="ee-list">
            {tables.map((t) => (
              <div key={t.id} className="ee-list-row">
                {editingTable?.id === t.id ? (
                  <>
                    <input value={editingTable.name} onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })} style={{ flex: 1 }} />
                    <input type="number" value={editingTable.capacity} onChange={(e) => setEditingTable({ ...editingTable, capacity: e.target.value })} style={{ width: '80px' }} />
                    <button className="btn btn-primary ee-btn-sm" onClick={handleSaveEdit}>Save</button>
                    <button className="btn btn-secondary ee-btn-sm" onClick={() => setEditingTable(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="ee-list-name">Table {t.number} — {t.name}</span>
                    <span className="ee-list-meta">Cap: {t.capacity}</span>
                    <div className="ee-row-gap">
                      <button className="btn btn-secondary ee-btn-sm" onClick={() => setEditingTable({ id: t.id, name: t.name, capacity: String(t.capacity) })}>Edit</button>
                      <button className="btn btn-danger ee-btn-sm" onClick={() => handleDelete(t.id, t.name)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {dialog}
    </div>
  );
}

// ── Layout Tab (Venue Layout Upload) ───────────────────────────────────
function LayoutTab({ eventId, settings, toast }: { eventId: string; settings: ReturnType<typeof useGuestPageSettings>['data']; toast: ToastFn }) {
  const upsertSettings = useUpsertGuestPageSettings();
  const [imageUrl, setImageUrl] = useState(settings?.venue_image_url || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDropRef = useRef<HTMLDivElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.match(/image\/(png|jpeg|jpg|svg\+xml|webp)/)) {
      toast('Please upload PNG, JPG, SVG, or WebP image', 'error');
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setImageUrl(dataUrl);
        try {
          await upsertSettings.mutateAsync({ eventId, venue_image_url: dataUrl });
          toast('Venue layout uploaded');
        } catch (err) {
          toast(classifyError(err).message, 'error');
        }
        setUploading(false);
      };
      reader.onerror = () => {
        toast('Failed to read image file', 'error');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast(classifyError(err).message, 'error');
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); dragDropRef.current?.classList.add('ee-drag-drop-active'); };
  const handleDragLeave = () => dragDropRef.current?.classList.remove('ee-drag-drop-active');
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDropRef.current?.classList.remove('ee-drag-drop-active');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = async () => {
    setImageUrl('');
    try {
      await upsertSettings.mutateAsync({ eventId, venue_image_url: null });
      toast('Venue layout removed');
    } catch (err) {
      toast(classifyError(err).message, 'error');
    }
  };

  return (
    <div className="card">
      <h2 className="ee-section-title">Venue Layout</h2>
      <p className="ee-muted" style={{ marginBottom: '16px' }}>Upload a floor plan or seating layout image. This will appear in the Venue Layout tab on the Guest Website.</p>

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" style={{ display: 'none' }} onChange={handleFileInput} />

      {!imageUrl ? (
        <div
          ref={dragDropRef}
          className="ee-drag-drop"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {uploading ? (
            <p style={{ fontSize: '15px', fontWeight: 500 }}>Uploading...</p>
          ) : (
            <>
              <p style={{ fontSize: '15px', fontWeight: 500 }}>Drag & drop an image here, or click to browse</p>
              <p style={{ fontSize: '13px', color: '#4A4A4A', marginTop: '4px' }}>Supports PNG, JPG, SVG, WebP</p>
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="ee-upload-preview">
            <img src={imageUrl} alt="Venue layout" style={{ width: '100%', borderRadius: '8px', objectFit: 'contain', maxHeight: '500px' }} />
          </div>
          <div className="ee-row-gap" style={{ marginTop: '12px' }}>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>Replace Image</button>
            <button className="btn btn-danger" onClick={handleRemove} disabled={uploading}>Remove Image</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Theme Tab ──────────────────────────────────────────────────────────
function ThemeTab({ eventId, settings, toast }: { eventId: string; settings: ReturnType<typeof useGuestPageSettings>['data']; toast: ToastFn }) {
  const upsert = useUpsertGuestPageSettings();

  const [colorPrimary, setColorPrimary] = useState(settings?.color_primary || '#1A1A1A');
  const [colorBg, setColorBg] = useState(settings?.color_background || '#F8F8F8');
  const [colorCard, setColorCard] = useState(settings?.color_card || '#FFFFFF');
  const [colorText, setColorText] = useState(settings?.color_text || '#1A1A1A');
  const [colorHeader, setColorHeader] = useState(settings?.color_header || '#1A1A1A');
  const [borderRadius, setBorderRadius] = useState(settings?.border_radius ?? 12);
  const [logoSize, setLogoSize] = useState(settings?.logo_size ?? 80);
  const [logoRounded, setLogoRounded] = useState(settings?.logo_rounded ?? false);
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
        logo_size: logoSize,
        logo_rounded: logoRounded,
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
    <div className="card">
      <h2 className="ee-section-title">Theme Editor</h2>

      <h3 className="ee-subsection-title">Colors</h3>
      <div className="ee-form-grid">
        <ColorField label="Primary (Accent)" value={colorPrimary} onChange={setColorPrimary} />
        <ColorField label="Background" value={colorBg} onChange={setColorBg} />
        <ColorField label="Card" value={colorCard} onChange={setColorCard} />
        <ColorField label="Text" value={colorText} onChange={setColorText} />
        <ColorField label="Header" value={colorHeader} onChange={setColorHeader} />
        <div className="form-group">
          <label className="form-label">Border Radius: {borderRadius}px</label>
          <input type="range" min="0" max="24" value={borderRadius} onChange={(e) => setBorderRadius(parseInt(e.target.value))} />
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

      <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: '16px' }}>
        {saving ? 'Saving...' : 'Save Theme'}
      </button>
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

// ── Share Tab ──────────────────────────────────────────────────────────
function ShareTab({ event, toast }: { event: Event; toast: ToastFn }) {
  const updateEvent = useUpdateEvent();
  const [slug, setSlug] = useState(event.slug);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/e` : '';
  const fullUrl = `${baseUrl}/${slug}`;
  const slugCheck = useCheckSlugAvailability(slug, event.id);

  useEffect(() => {
    if (fullUrl) {
      QRCode.toDataURL(fullUrl, { width: 300, margin: 2, color: { dark: '#1A1A1A', light: '#FFFFFF' } })
        .then(setQrDataUrl).catch(console.error);
      QRCode.toString(fullUrl, { type: 'svg', margin: 2, color: { dark: '#1A1A1A', light: '#FFFFFF' } })
        .then(setQrSvg).catch(console.error);
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
    catch { toast('Could not copy: ' + fullUrl, 'error'); }
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
            slugCheck.isLoading ? <p className="ee-muted">Checking...</p>
            : slugCheck.data?.available ? <p className="ee-share-valid">Slug is available</p>
            : <p className="ee-share-error">Slug is already taken</p>
          )}
          <button className="btn btn-primary" onClick={handleSaveSlug} disabled={updateEvent.isPending || slug === event.slug} style={{ marginTop: '8px' }}>
            Save URL
          </button>
          <div className="ee-share-actions">
            <button className="btn btn-secondary" onClick={handleCopyLink}>Copy Link</button>
            <button className="btn btn-secondary" onClick={() => window.open(fullUrl, '_blank')}>Open Website</button>
            <button className="btn btn-secondary" onClick={handleDownloadPng}>Download QR (PNG)</button>
            <button className="btn btn-secondary" onClick={handleDownloadSvg}>Download QR (SVG)</button>
            <button className="btn btn-secondary" onClick={handleNativeShare}>Share</button>
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

// ── Dynamic Font Styles ────────────────────────────────────────────────
function getDynamicFontStyles(): string {
  const imports = GOOGLE_FONTS.map((f) =>
    `@import url('https://fonts.googleapis.com/css2?family=${f.cssName.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap');`
  ).join('\n');
  return imports;
}
