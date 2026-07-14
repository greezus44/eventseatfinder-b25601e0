import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useEvent, useUpdateEvent, useCheckSlugAvailability } from '@/hooks/use-events';
import {
  useGuests,
  useCreateGuest,
  useDeleteGuest,
  useBulkCreateGuests,
} from '@/hooks/use-guests';
import { useTables, useCreateTable, useUpdateTable, useDeleteTable, useBulkCreateTables } from '@/hooks/use-tables';
import { useGuestPageSettings, useUpsertGuestPageSettings } from '@/hooks/use-guest-page-settings';
import { useToast } from '@/providers/toast-provider';
import { useConfirmDialog } from '@/components/confirm-dialog';
import { classifyError, parseFile, matchGuestsToTables, buildGuestPayload } from '@/lib/guest-import';
import {
  GOOGLE_FONTS,
  FONT_WEIGHTS,
  FONT_SIZE_OPTIONS,
  getFontLinkTag,
  getFontCss,
  getFontSize,
  getFontWeight,
} from '@/lib/fonts';
import type { GuestPageSettingsInput, TableInput } from '@/types';

type Tab = 'settings' | 'guests' | 'tables' | 'layout' | 'theme' | 'share';

export function EventEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();

  const [activeTab, setActiveTab] = useState<Tab>('settings');

  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');

  if (eventLoading) {
    return (
      <div className="full-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Event not found</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'settings', label: 'Settings' },
    { key: 'guests', label: 'Guests' },
    { key: 'tables', label: 'Tables' },
    { key: 'layout', label: 'Layout' },
    { key: 'theme', label: 'Theme' },
    { key: 'share', label: 'Share' },
  ];

  return (
    <div>
      {dialog}
      <div className="editor-header">
        <Link to="/dashboard" className="editor-back">
          ← Back to events
        </Link>
        <h1 className="editor-title">{event.name}</h1>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'settings' && (
          <SettingsTab eventId={event.id} event={event} toast={toast} />
        )}
        {activeTab === 'guests' && (
          <GuestsTab eventId={event.id} toast={toast} confirm={confirm} />
        )}
        {activeTab === 'tables' && (
          <TablesTab eventId={event.id} toast={toast} confirm={confirm} />
        )}
        {activeTab === 'layout' && <LayoutTab eventId={event.id} toast={toast} />}
        {activeTab === 'theme' && <ThemeTab eventId={event.id} toast={toast} />}
        {activeTab === 'share' && <ShareTab event={event} toast={toast} />}
      </div>
    </div>
  );
}

// ── Settings Tab ─────────────────────────────────────────
function SettingsTab({
  eventId,
  event,
  toast,
}: {
  eventId: string;
  event: any;
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const updateEvent = useUpdateEvent();
  const [name, setName] = useState(event.name ?? '');
  const [date, setDate] = useState(event.date ?? '');
  const [time, setTime] = useState(event.time ?? '');
  const [venue, setVenue] = useState(event.venue ?? '');

  const isDirty =
    name !== (event.name ?? '') ||
    date !== (event.date ?? '') ||
    time !== (event.time ?? '') ||
    venue !== (event.venue ?? '');

  const handleSave = async () => {
    try {
      await updateEvent.mutateAsync({
        id: eventId,
        name,
        date: date || null,
        time: time || null,
        venue: venue || null,
      });
      toast('Settings saved', 'success');
    } catch (err) {
      const { message } = classifyError(err);
      toast(message, 'error');
    }
  };

  return (
    <div className="card">
      <div className="form-group">
        <label htmlFor="name">Event Name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="time">Time</label>
          <input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="venue">Venue</label>
        <input
          id="venue"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="Venue name"
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={!isDirty || updateEvent.isPending}
      >
        {updateEvent.isPending ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}

// ── Guests Tab ───────────────────────────────────────────
function GuestsTab({
  eventId,
  toast,
  confirm,
}: {
  eventId: string;
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
  confirm: (o: { title?: string; message: string; confirmText?: string }) => Promise<boolean>;
}) {
  const { data: guests, isLoading } = useGuests(eventId);
  const { data: tables } = useTables(eventId);
  const createGuest = useCreateGuest();
  const deleteGuest = useDeleteGuest();
  const bulkCreate = useBulkCreateGuests();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState(false);

  const tableNameMap = React.useMemo(() => {
    const m = new Map<string, string>();
    if (tables) for (const t of tables) m.set(t.id, t.name);
    return m;
  }, [tables]);

  const filtered = (guests ?? []).filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createGuest.mutateAsync({ eventId, name: newName.trim(), table_id: null });
      setNewName('');
      toast('Guest added', 'success');
    } catch (err) {
      const { message } = classifyError(err);
      toast(message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete guest',
      message: 'Are you sure you want to remove this guest?',
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await deleteGuest.mutateAsync({ id, eventId });
      toast('Guest removed', 'success');
    } catch (err) {
      const { message } = classifyError(err);
      toast(message, 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const rows = await parseFile(file);
      const matchResult = matchGuestsToTables(
        rows,
        (tables ?? []).map((t) => ({ id: t.id, name: t.name }))
      );
      const payload = buildGuestPayload(matchResult);
      if (payload.length === 0) {
        toast('No guests found in file', 'error');
        return;
      }
      await bulkCreate.mutateAsync({ eventId, guests: payload });
      toast(
        `Imported ${payload.length} guests${matchResult.unmatched.length > 0 ? ` (${matchResult.unmatched.length} unmatched tables)` : ''}`,
        'success'
      );
    } catch (err) {
      const { message } = classifyError(err);
      toast(message, 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Guest name"
          />
          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
            Add Guest
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests…"
            style={{ flex: 1 }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? 'Importing…' : 'Bulk Import'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p className="loading-text">Loading guests…</p>
        </div>
      ) : !filtered.length ? (
        <div className="empty-state">
          <p className="empty-state-title">No guests</p>
          <p>Add guests individually or import from a file.</p>
        </div>
      ) : (
        <div>
          {filtered.map((g) => (
            <div key={g.id} className="list-item">
              <div>
                <div className="list-item-name">{g.name}</div>
                <div className="list-item-meta">
                  {g.table_id ? tableNameMap.get(g.table_id) ?? 'Unknown table' : 'No table assigned'}
                </div>
              </div>
              <div className="list-item-actions">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(g.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tables Tab ───────────────────────────────────────────
function TablesTab({
  eventId,
  toast,
  confirm,
}: {
  eventId: string;
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
  confirm: (o: { title?: string; message: string; confirmText?: string }) => Promise<boolean>;
}) {
  const { data: tables, isLoading } = useTables(eventId);
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();
  const bulkCreateTables = useBulkCreateTables();

  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState(8);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createTable.mutateAsync({
        eventId,
        name: newName.trim(),
        capacity: newCapacity,
        x: null,
        y: null,
      });
      setNewName('');
      toast('Table added', 'success');
    } catch (err) {
      const { message } = classifyError(err);
      toast(message, 'error');
    }
  };

  const handleBulkAdd = async () => {
    const ok = await confirm({
      title: 'Add 10 tables',
      message: 'This will create 10 new tables (Table 1 through Table 10) with 8 seats each.',
      confirmText: 'Add',
    });
    if (!ok) return;
    const tables: TableInput[] = Array.from({ length: 10 }, (_, i) => ({
      name: `Table ${i + 1}`,
      capacity: 8,
      x: null,
      y: null,
    }));
    try {
      await bulkCreateTables.mutateAsync({ event_id: eventId, tables });
      toast('10 tables added', 'success');
    } catch (err) {
      const { message } = classifyError(err);
      toast(message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete table',
      message: 'Are you sure you want to remove this table?',
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await deleteTable.mutateAsync({ id, eventId });
      toast('Table removed', 'success');
    } catch (err) {
      const { message } = classifyError(err);
      toast(message, 'error');
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <form onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="table-name">Table Name</label>
              <input
                id="table-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Table 1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="table-capacity">Capacity</label>
              <input
                id="table-capacity"
                type="number"
                min={1}
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number(e.target.value))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">
              Add Table
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBulkAdd}
              disabled={bulkCreateTables.isPending}
            >
              {bulkCreateTables.isPending ? 'Adding…' : 'Add 10 Tables'}
            </button>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p className="loading-text">Loading tables…</p>
        </div>
      ) : !tables || tables.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No tables</p>
          <p>Add tables individually or use bulk add.</p>
        </div>
      ) : (
        <div>
          {tables.map((t) => (
            <div key={t.id} className="list-item">
              <div>
                <div className="list-item-name">{t.name}</div>
                <div className="list-item-meta">Capacity: {t.capacity}</div>
              </div>
              <div className="list-item-actions">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(t.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Layout Tab ──────────────────────────────────────────
function LayoutTab({
  eventId,
  toast,
}: {
  eventId: string;
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const { data: tables } = useTables(eventId);
  const updateTable = useUpdateTable();
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, table: any) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    draggingRef.current = {
      id: table.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - draggingRef.current.offsetX;
    const y = e.clientY - canvasRect.top - draggingRef.current.offsetY;
    // Update visual position directly via DOM for smoothness
    const el = canvasRef.current.querySelector(
      `[data-table-id="${draggingRef.current.id}"]`
    ) as HTMLElement;
    if (el) {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
  };

  const handleMouseUp = async () => {
    if (!draggingRef.current || !canvasRef.current) return;
    const el = canvasRef.current.querySelector(
      `[data-table-id="${draggingRef.current.id}"]`
    ) as HTMLElement;
    if (el) {
      const x = parseFloat(el.style.left) || 0;
      const y = parseFloat(el.style.top) || 0;
      try {
        await updateTable.mutateAsync({
          eventId,
          id: draggingRef.current.id,
          name: el.querySelector('.layout-table-name')?.textContent ?? '',
          capacity: 8,
          x,
          y,
        });
        toast('Layout saved', 'success');
      } catch (err) {
        const { message } = classifyError(err);
        toast(message, 'error');
      }
    }
    draggingRef.current = null;
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          Drag tables to position them on the floor plan. Positions are saved automatically when you drop a table.
        </p>
      </div>
      <div
        ref={canvasRef}
        className="layout-canvas"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {!tables || tables.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 24px' }}>
            <p className="empty-state-title">No tables</p>
            <p>Add tables in the Tables tab first.</p>
          </div>
        ) : (
          tables.map((t) => (
            <div
              key={t.id}
              data-table-id={t.id}
              className="layout-table"
              style={{ left: t.x ?? 20, top: t.y ?? 20 }}
              onMouseDown={(e) => handleMouseDown(e, t)}
            >
              <span className="layout-table-name">{t.name}</span>
              <span className="layout-table-capacity">{t.capacity} seats</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Theme Tab ───────────────────────────────────────────
function ThemeTab({
  eventId,
  toast,
}: {
  eventId: string;
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const { data: settings } = useGuestPageSettings(eventId);
  const upsert = useUpsertGuestPageSettings();

  const [form, setForm] = useState<GuestPageSettingsInput>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (settings && !loaded) {
      setForm({
        event_id: eventId,
        color_primary: settings.color_primary,
        color_background: settings.color_background,
        color_card: settings.color_card,
        color_text: settings.color_text,
        color_header: settings.color_header,
        border_radius: settings.border_radius,
        logo_url: settings.logo_url,
        logo_size: settings.logo_size,
        logo_rounded: settings.logo_rounded,
        venue_image_url: settings.venue_image_url,
        welcome_message: settings.welcome_message,
        event_subtitle: settings.event_subtitle,
        font_title_family: settings.font_title_family,
        font_title_size: settings.font_title_size,
        font_title_weight: settings.font_title_weight,
        font_subtitle_family: settings.font_subtitle_family,
        font_subtitle_size: settings.font_subtitle_size,
        font_subtitle_weight: settings.font_subtitle_weight,
        font_datetime_family: settings.font_datetime_family,
        font_datetime_size: settings.font_datetime_size,
        font_datetime_weight: settings.font_datetime_weight,
        font_venue_family: settings.font_venue_family,
        font_venue_size: settings.font_venue_size,
        font_venue_weight: settings.font_venue_weight,
      });
      setLoaded(true);
    }
  }, [settings, loaded, eventId]);

  // Load Google Fonts dynamically
  const fontFamilies = [
    form.font_title_family,
    form.font_subtitle_family,
    form.font_datetime_family,
    form.font_venue_family,
  ].filter(Boolean) as string[];

  useEffect(() => {
    const href = getFontLinkTag(fontFamilies);
    if (!href) return;
    const existing = document.querySelector(`link[href="${href}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }, [fontFamilies.join(',')]);

  const update = (patch: Partial<GuestPageSettingsInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({ ...form, event_id: eventId });
      toast('Theme saved', 'success');
    } catch (err) {
      const { message } = classifyError(err);
      toast(message, 'error');
    }
  };

  return (
    <div>
      {/* Colors */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="theme-section">
          <div className="theme-section-title">Colors</div>
          {(
            [
              ['color_primary', 'Primary'],
              ['color_background', 'Background'],
              ['color_card', 'Card'],
              ['color_text', 'Text'],
              ['color_header', 'Header'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="color-row">
              <label>{label}</label>
              <input
                type="color"
                className="color-input"
                value={(form as any)[key] ?? '#1A1A1A'}
                onChange={(e) => update({ [key]: e.target.value } as any)}
              />
              <input
                className="color-text"
                value={(form as any)[key] ?? ''}
                onChange={(e) => update({ [key]: e.target.value } as any)}
                placeholder="#1A1A1A"
              />
            </div>
          ))}
        </div>

        <div className="theme-section">
          <div className="theme-section-title">Border Radius</div>
          <div className="range-row">
            <input
              type="range"
              className="range-input"
              min={0}
              max={24}
              value={form.border_radius ?? 12}
              onChange={(e) => update({ border_radius: Number(e.target.value) })}
            />
            <span className="range-value">{form.border_radius ?? 12}px</span>
          </div>
        </div>

        <div className="theme-section">
          <div className="theme-section-title">Logo</div>
          <div className="form-group">
            <label>Logo URL</label>
            <input
              value={form.logo_url ?? ''}
              onChange={(e) => update({ logo_url: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="range-row">
            <label>Logo Size</label>
            <input
              type="range"
              className="range-input"
              min={40}
              max={500}
              value={form.logo_size ?? 120}
              onChange={(e) => update({ logo_size: Number(e.target.value) })}
            />
            <span className="range-value">{form.logo_size ?? 120}px</span>
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                style={{ width: 'auto', height: 'auto' }}
                checked={form.logo_rounded ?? false}
                onChange={(e) => update({ logo_rounded: e.target.checked })}
              />
              Rounded logo
            </label>
          </div>
        </div>

        <div className="theme-section">
          <div className="theme-section-title">Venue Image</div>
          <div className="form-group">
            <label>Venue Image URL</label>
            <input
              value={form.venue_image_url ?? ''}
              onChange={(e) => update({ venue_image_url: e.target.value })}
              placeholder="https://…"
            />
          </div>
        </div>

        <div className="theme-section">
          <div className="theme-section-title">Content</div>
          <div className="form-group">
            <label>Event Subtitle</label>
            <input
              value={form.event_subtitle ?? ''}
              onChange={(e) => update({ event_subtitle: e.target.value })}
              placeholder="Join us for our special day"
            />
          </div>
          <div className="form-group">
            <label>Welcome Message</label>
            <textarea
              value={form.welcome_message ?? ''}
              onChange={(e) => update({ welcome_message: e.target.value })}
              placeholder="Welcome to our event! Find your seat below."
            />
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="theme-section-title" style={{ marginBottom: 16 }}>
          Typography
        </div>

        {(
          [
            ['title', 'Title'],
            ['subtitle', 'Subtitle'],
            ['datetime', 'Date & Time'],
            ['venue', 'Venue'],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              {label}
            </div>
            <div className="typography-row">
              <div>
                <label>Font Family</label>
                <select
                  value={(form as any)[`font_${key}_family`] ?? 'Inter'}
                  onChange={(e) =>
                    update({ [`font_${key}_family`]: e.target.value } as any)
                  }
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Size</label>
                <select
                  value={(form as any)[`font_${key}_size`] ?? 16}
                  onChange={(e) =>
                    update({ [`font_${key}_size`]: Number(e.target.value) } as any)
                  }
                >
                  {FONT_SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}px
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Weight</label>
                <select
                  value={(form as any)[`font_${key}_weight`] ?? 400}
                  onChange={(e) =>
                    update({ [`font_${key}_weight`]: Number(e.target.value) } as any)
                  }
                >
                  {FONT_WEIGHTS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="typography-preview">
              <span
                style={{
                  fontFamily: getFontCss((form as any)[`font_${key}_family`]),
                  fontSize: getFontSize((form as any)[`font_${key}_size`]),
                  fontWeight: getFontWeight((form as any)[`font_${key}_weight`]),
                }}
              >
                {label} Preview
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={upsert.isPending}
      >
        {upsert.isPending ? 'Saving…' : 'Save Theme'}
      </button>
    </div>
  );
}

// ── Share Tab ───────────────────────────────────────────
function ShareTab({
  event,
  toast,
}: {
  event: any;
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const updateEvent = useUpdateEvent();
  const checkSlug = useCheckSlugAvailability();
  const [slug, setSlug] = useState(event.slug ?? '');
  const [qrPng, setQrPng] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');

  const baseUrl = window.location.origin;
  const inviteUrl = `${baseUrl}/e/${slug}`;

  useEffect(() => {
    QRCode.toDataURL(inviteUrl, { width: 200, margin: 2 })
      .then(setQrPng)
      .catch(() => {});
    QRCode.toString(inviteUrl, { type: 'svg', margin: 2 })
      .then(setQrSvg)
      .catch(() => {});
  }, [inviteUrl]);

  const handleSaveSlug = async () => {
    if (slug === event.slug) return;
    try {
      const available = await checkSlug.mutateAsync(slug);
      if (!available) {
        toast('Slug already taken', 'error');
        return;
      }
      await updateEvent.mutateAsync({ id: event.id, name: event.name, slug });
      toast('Slug updated', 'success');
    } catch (err) {
      const { message } = classifyError(err);
      toast(message, 'error');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast('Link copied', 'success');
    } catch {
      toast('Failed to copy', 'error');
    }
  };

  const handleOpen = () => {
    window.open(inviteUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          url: inviteUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  const downloadQr = (format: 'png' | 'svg') => {
    if (format === 'png' && qrPng) {
      const a = document.createElement('a');
      a.href = qrPng;
      a.download = `${slug}-qr.png`;
      a.click();
    } else if (format === 'svg' && qrSvg) {
      const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}-qr.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="theme-section-title">Invitation Link</div>
        <div className="share-url-box">
          <input value={inviteUrl} readOnly />
          <button className="btn btn-secondary" onClick={handleCopy}>
            Copy
          </button>
          <button className="btn btn-secondary" onClick={handleOpen}>
            Open
          </button>
          <button className="btn btn-primary" onClick={handleShare}>
            Share
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="theme-section-title">URL Slug</div>
        <div className="form-group">
          <label>Slug</label>
          <div className="share-url-box">
            <input
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9-]/g, '')
                )
              }
            />
            <button
              className="btn btn-primary"
              onClick={handleSaveSlug}
              disabled={slug === event.slug || updateEvent.isPending}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="theme-section-title">QR Code</div>
        {qrPng && (
          <div className="qr-preview">
            <img src={qrPng} alt="QR Code" />
          </div>
        )}
        <div className="share-actions">
          <button className="btn btn-secondary" onClick={() => downloadQr('png')}>
            Download PNG
          </button>
          <button className="btn btn-secondary" onClick={() => downloadQr('svg')}>
            Download SVG
          </button>
        </div>
      </div>
    </div>
  );
}
