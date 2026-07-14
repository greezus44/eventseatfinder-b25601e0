import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuestPageSettings, useUpsertGuestPageSettings } from '@/hooks/use-guest-page-settings';
import { useToast } from '@/providers/toast-provider';
import { DEFAULT_SETTINGS, FONT_OPTIONS, COLOR_PRESETS } from '@/types/guest-page-settings';
import type { GuestPageSettingsInput } from '@/types/guest-page-settings';

type Tab = 'branding' | 'colours' | 'typography' | 'appearance' | 'content';
type PreviewMode = 'desktop' | 'mobile';

const TABS: { id: Tab; label: string }[] = [
  { id: 'branding', label: 'Branding' },
  { id: 'colours', label: 'Colours' },
  { id: 'typography', label: 'Typography' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'content', label: 'Content' },
];

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.08)',
  md: '0 4px 12px rgba(0,0,0,0.10)',
  lg: '0 10px 24px rgba(0,0,0,0.12)',
  xl: '0 20px 40px rgba(0,0,0,0.16)',
};

const BUTTON_STYLE_MAP: Record<string, React.CSSProperties> = {
  filled: {},
  outline: { background: 'transparent', borderWidth: 2, borderStyle: 'solid' },
  ghost: { background: 'transparent', border: 'none' },
};

export function GuestPageEditor() {
  const eventId = useParams<{ eventId: string }>().eventId ?? '';
  const safeEventId = eventId ?? '';
  const { data: event, isLoading: eventLoading } = useEvent(safeEventId);
  const { data: settings, isLoading: settingsLoading } = useGuestPageSettings(safeEventId);
  const { mutateAsync } = useUpsertGuestPageSettings(safeEventId);
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>('branding');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [saving, setSaving] = useState(false);

  // Local editable settings state, seeded from defaults then overwritten by loaded settings.
  const [draft, setDraft] = useState<GuestPageSettingsInput>({ ...DEFAULT_SETTINGS });

  // JSON / multiline text buffers for the content tab.
  const [scheduleText, setScheduleText] = useState('[]');
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [galleryText, setGalleryText] = useState('');

  // Populate draft + text buffers once settings have loaded.
  useEffect(() => {
    if (!settings) return;
    const merged: GuestPageSettingsInput = {
      logo_url: settings.logo_url,
      logo_size: settings.logo_size,
      logo_rounded: settings.logo_rounded,
      logo_position: settings.logo_position,
      color_primary: settings.color_primary,
      color_secondary: settings.color_secondary,
      color_background: settings.color_background,
      color_card: settings.color_card,
      color_text: settings.color_text,
      color_header: settings.color_header,
      color_button: settings.color_button,
      color_button_text: settings.color_button_text,
      color_link: settings.color_link,
      color_footer: settings.color_footer,
      font_heading: settings.font_heading,
      font_body: settings.font_body,
      font_button: settings.font_button,
      font_heading_size: settings.font_heading_size,
      font_body_size: settings.font_body_size,
      font_heading_weight: settings.font_heading_weight,
      font_body_weight: settings.font_body_weight,
      font_heading_spacing: settings.font_heading_spacing,
      font_body_spacing: settings.font_body_spacing,
      font_heading_line_height: settings.font_heading_line_height,
      font_body_line_height: settings.font_body_line_height,
      border_radius: settings.border_radius,
      background_overlay_opacity: settings.background_overlay_opacity,
      background_image: settings.background_image,
      cover_image: settings.cover_image,
      banner_height: settings.banner_height,
      welcome_message: settings.welcome_message,
      event_subtitle: settings.event_subtitle,
      card_shadow: settings.card_shadow,
      button_style: settings.button_style,
      venue_image_url: settings.venue_image_url,
      enable_schedule: settings.enable_schedule,
      enable_gallery: settings.enable_gallery,
      schedule_items: settings.schedule_items ?? [],
      gallery_images: settings.gallery_images ?? [],
    };
    setDraft(merged);
    setScheduleText(JSON.stringify(merged.schedule_items ?? [], null, 2));
    setScheduleError(null);
    setGalleryText((merged.gallery_images ?? []).join('\n'));
  }, [settings]);

  const update = (partial: Partial<GuestPageSettingsInput>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const applyPreset = (preset: (typeof COLOR_PRESETS)[number]) => {
    update({
      color_primary: preset.primary,
      color_secondary: preset.secondary,
      color_background: preset.background,
      color_footer: preset.footer,
    });
  };

  const handleScheduleTextChange = (value: string) => {
    setScheduleText(value);
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        setScheduleError('Schedule must be a JSON array.');
        return;
      }
      setScheduleError(null);
      update({ schedule_items: parsed });
    } catch {
      setScheduleError('Invalid JSON.');
    }
  };

  const handleGalleryTextChange = (value: string) => {
    setGalleryText(value);
    const urls = value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    update({ gallery_images: urls });
  };

  const handleSave = async () => {
    if (!eventId) return;
    setSaving(true);
    try {
      await mutateAsync(draft);
      toast('Guest page settings saved', 'success');
    } catch {
      toast('Failed to save guest page settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (eventLoading || settingsLoading) {
    return (
      <div className="gpe-page">
        <div className="gpe-loading">
          <p className="gpe-loading-text">Loading guest page editor...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="gpe-page">
        <div className="gpe-error">
          <p className="gpe-error-text">Event not found.</p>
          <Link to="/" className="gpe-back-link">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gpe-page">
      <div className="gpe-container">
        {/* Header */}
        <div className="gpe-header">
          <Link to={`/events/${eventId}`} className="gpe-back-link">
            ← Back to event
          </Link>
          <h1 className="gpe-title">Guest Page Editor</h1>
          <p className="gpe-subtitle">
            Customize the public guest page for "{event.name}"
          </p>
        </div>

        <div className="gpe-body">
          {/* Editor column */}
          <div className="gpe-editor">
            {/* Tabs */}
            <div className="gpe-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`gpe-tab${tab === t.id ? ' gpe-tab-active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="gpe-tab-panel">
              {tab === 'branding' && (
                <BrandingTab draft={draft} update={update} />
              )}
              {tab === 'colours' && (
                <ColoursTab draft={draft} update={update} applyPreset={applyPreset} />
              )}
              {tab === 'typography' && <TypographyTab draft={draft} update={update} />}
              {tab === 'appearance' && <AppearanceTab draft={draft} update={update} />}
              {tab === 'content' && (
                <ContentTab
                  draft={draft}
                  update={update}
                  scheduleText={scheduleText}
                  scheduleError={scheduleError}
                  onScheduleTextChange={handleScheduleTextChange}
                  galleryText={galleryText}
                  onGalleryTextChange={handleGalleryTextChange}
                />
              )}
            </div>

            {/* Save bar */}
            <div className="gpe-actions">
              <button
                className="gpe-btn gpe-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <Link to={`/events/${eventId}`} className="gpe-btn gpe-btn-ghost">
                Cancel
              </Link>
            </div>
          </div>

          {/* Live preview column */}
          <div className="gpe-preview-wrap">
            <div className="gpe-preview-toolbar">
              <span className="gpe-preview-label">Live preview</span>
              <div className="gpe-preview-toggle">
                <button
                  className={`gpe-toggle-btn${previewMode === 'desktop' ? ' gpe-toggle-active' : ''}`}
                  onClick={() => setPreviewMode('desktop')}
                >
                  Desktop
                </button>
                <button
                  className={`gpe-toggle-btn${previewMode === 'mobile' ? ' gpe-toggle-active' : ''}`}
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </button>
              </div>
            </div>
            <div className="gpe-preview-frame">
              <GuestPagePreview settings={draft} mode={previewMode} eventName={event.name} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Tab panels ------------------------------- */

interface TabProps {
  draft: GuestPageSettingsInput;
  update: (partial: Partial<GuestPageSettingsInput>) => void;
}

function BrandingTab({ draft, update }: TabProps) {
  return (
    <div className="gpe-section">
      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-logo-url">Logo URL</label>
        <input
          id="gpe-logo-url"
          type="text"
          className="gpe-input"
          value={draft.logo_url ?? ''}
          onChange={(e) => update({ logo_url: e.target.value || null })}
          placeholder="https://example.com/logo.png"
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-logo-size">
          Logo size: <span className="gpe-value">{draft.logo_size}px</span>
        </label>
        <input
          id="gpe-logo-size"
          type="range"
          min={40}
          max={200}
          className="gpe-range"
          value={draft.logo_size}
          onChange={(e) => update({ logo_size: Number(e.target.value) })}
        />
      </div>

      <div className="gpe-field gpe-checkbox-field">
        <label className="gpe-checkbox-label">
          <input
            type="checkbox"
            className="gpe-checkbox"
            checked={draft.logo_rounded}
            onChange={(e) => update({ logo_rounded: e.target.checked })}
          />
          <span>Rounded logo</span>
        </label>
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-logo-position">Logo position</label>
        <select
          id="gpe-logo-position"
          className="gpe-select"
          value={draft.logo_position}
          onChange={(e) => update({ logo_position: e.target.value })}
        >
          <option value="center">Center</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}

interface ColoursTabProps extends TabProps {
  applyPreset: (preset: (typeof COLOR_PRESETS)[number]) => void;
}

function ColoursTab({ draft, update, applyPreset }: ColoursTabProps) {
  const colourFields: { key: keyof GuestPageSettingsInput; label: string }[] = [
    { key: 'color_primary', label: 'Primary' },
    { key: 'color_secondary', label: 'Secondary' },
    { key: 'color_background', label: 'Background' },
    { key: 'color_card', label: 'Card' },
    { key: 'color_text', label: 'Text' },
    { key: 'color_header', label: 'Header' },
    { key: 'color_button', label: 'Button' },
    { key: 'color_button_text', label: 'Button text' },
    { key: 'color_link', label: 'Link' },
    { key: 'color_footer', label: 'Footer' },
  ];

  return (
    <div className="gpe-section">
      <div className="gpe-field">
        <span className="gpe-label">Colour presets</span>
        <div className="gpe-presets">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="gpe-preset"
              title={preset.name}
              onClick={() => applyPreset(preset)}
            >
              <span
                className="gpe-preset-swatch"
                style={{ background: preset.primary }}
              />
              <span className="gpe-preset-name">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="gpe-colour-grid">
        {colourFields.map(({ key, label }) => (
          <div className="gpe-field" key={key}>
            <label className="gpe-label" htmlFor={`gpe-${key}`}>{label}</label>
            <div className="gpe-color-row">
              <input
                id={`gpe-${key}`}
                type="color"
                className="gpe-color-picker"
                value={(draft[key] as string) ?? '#000000'}
                onChange={(e) => update({ [key]: e.target.value } as Partial<GuestPageSettingsInput>)}
              />
              <input
                type="text"
                className="gpe-input gpe-color-text"
                value={(draft[key] as string) ?? ''}
                onChange={(e) => update({ [key]: e.target.value } as Partial<GuestPageSettingsInput>)}
                placeholder="#000000"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypographyTab({ draft, update }: TabProps) {
  return (
    <div className="gpe-section">
      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-font-heading">Heading font</label>
        <select
          id="gpe-font-heading"
          className="gpe-select"
          value={draft.font_heading}
          onChange={(e) => update({ font_heading: e.target.value })}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-font-body">Body font</label>
        <select
          id="gpe-font-body"
          className="gpe-select"
          value={draft.font_body}
          onChange={(e) => update({ font_body: e.target.value })}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-font-button">Button font</label>
        <select
          id="gpe-font-button"
          className="gpe-select"
          value={draft.font_button}
          onChange={(e) => update({ font_button: e.target.value })}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-font-heading-size">
          Heading size: <span className="gpe-value">{draft.font_heading_size}px</span>
        </label>
        <input
          id="gpe-font-heading-size"
          type="range"
          min={12}
          max={96}
          className="gpe-range"
          value={draft.font_heading_size}
          onChange={(e) => update({ font_heading_size: Number(e.target.value) })}
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-font-body-size">
          Body size: <span className="gpe-value">{draft.font_body_size}px</span>
        </label>
        <input
          id="gpe-font-body-size"
          type="range"
          min={10}
          max={32}
          className="gpe-range"
          value={draft.font_body_size}
          onChange={(e) => update({ font_body_size: Number(e.target.value) })}
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-font-heading-weight">
          Heading weight: <span className="gpe-value">{draft.font_heading_weight}</span>
        </label>
        <input
          id="gpe-font-heading-weight"
          type="range"
          min={100}
          max={900}
          step={100}
          className="gpe-range"
          value={draft.font_heading_weight}
          onChange={(e) => update({ font_heading_weight: Number(e.target.value) })}
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-font-body-weight">
          Body weight: <span className="gpe-value">{draft.font_body_weight}</span>
        </label>
        <input
          id="gpe-font-body-weight"
          type="range"
          min={100}
          max={900}
          step={100}
          className="gpe-range"
          value={draft.font_body_weight}
          onChange={(e) => update({ font_body_weight: Number(e.target.value) })}
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-font-heading-spacing">
          Heading letter spacing: <span className="gpe-value">{draft.font_heading_spacing}px</span>
        </label>
        <input
          id="gpe-font-heading-spacing"
          type="range"
          min={-5}
          max={20}
          step={0.5}
          className="gpe-range"
          value={draft.font_heading_spacing}
          onChange={(e) => update({ font_heading_spacing: Number(e.target.value) })}
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-font-body-spacing">
          Body letter spacing: <span className="gpe-value">{draft.font_body_spacing}px</span>
        </label>
        <input
          id="gpe-font-body-spacing"
          type="range"
          min={-5}
          max={20}
          step={0.5}
          className="gpe-range"
          value={draft.font_body_spacing}
          onChange={(e) => update({ font_body_spacing: Number(e.target.value) })}
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-font-heading-line-height">
          Heading line height: <span className="gpe-value">{draft.font_heading_line_height}</span>
        </label>
        <input
          id="gpe-font-heading-line-height"
          type="range"
          min={0.8}
          max={2.4}
          step={0.05}
          className="gpe-range"
          value={draft.font_heading_line_height}
          onChange={(e) => update({ font_heading_line_height: Number(e.target.value) })}
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-font-body-line-height">
          Body line height: <span className="gpe-value">{draft.font_body_line_height}</span>
        </label>
        <input
          id="gpe-font-body-line-height"
          type="range"
          min={0.8}
          max={2.4}
          step={0.05}
          className="gpe-range"
          value={draft.font_body_line_height}
          onChange={(e) => update({ font_body_line_height: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}

function AppearanceTab({ draft, update }: TabProps) {
  return (
    <div className="gpe-section">
      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-border-radius">
          Border radius: <span className="gpe-value">{draft.border_radius}px</span>
        </label>
        <input
          id="gpe-border-radius"
          type="range"
          min={0}
          max={48}
          className="gpe-range"
          value={draft.border_radius}
          onChange={(e) => update({ border_radius: Number(e.target.value) })}
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-overlay-opacity">
          Background overlay opacity: <span className="gpe-value">{Math.round((draft.background_overlay_opacity ?? 0) * 100)}%</span>
        </label>
        <input
          id="gpe-overlay-opacity"
          type="range"
          min={0}
          max={1}
          step={0.05}
          className="gpe-range"
          value={draft.background_overlay_opacity}
          onChange={(e) => update({ background_overlay_opacity: Number(e.target.value) })}
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-card-shadow">Card shadow</label>
        <select
          id="gpe-card-shadow"
          className="gpe-select"
          value={draft.card_shadow}
          onChange={(e) => update({ card_shadow: e.target.value })}
        >
          <option value="none">None</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
          <option value="xl">Extra large</option>
        </select>
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-button-style">Button style</label>
        <select
          id="gpe-button-style"
          className="gpe-select"
          value={draft.button_style}
          onChange={(e) => update({ button_style: e.target.value })}
        >
          <option value="filled">Filled</option>
          <option value="outline">Outline</option>
          <option value="ghost">Ghost</option>
        </select>
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-background-image">Background image URL</label>
        <input
          id="gpe-background-image"
          type="text"
          className="gpe-input"
          value={draft.background_image ?? ''}
          onChange={(e) => update({ background_image: e.target.value || null })}
          placeholder="https://example.com/bg.jpg"
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-cover-image">Cover image URL</label>
        <input
          id="gpe-cover-image"
          type="text"
          className="gpe-input"
          value={draft.cover_image ?? ''}
          onChange={(e) => update({ cover_image: e.target.value || null })}
          placeholder="https://example.com/cover.jpg"
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-banner-height">
          Banner height: <span className="gpe-value">{draft.banner_height}px</span>
        </label>
        <input
          id="gpe-banner-height"
          type="range"
          min={200}
          max={800}
          step={10}
          className="gpe-range"
          value={draft.banner_height}
          onChange={(e) => update({ banner_height: Number(e.target.value) })}
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-venue-image">Venue image URL</label>
        <input
          id="gpe-venue-image"
          type="text"
          className="gpe-input"
          value={draft.venue_image_url ?? ''}
          onChange={(e) => update({ venue_image_url: e.target.value || null })}
          placeholder="https://example.com/venue.jpg"
        />
      </div>
    </div>
  );
}

interface ContentTabProps extends TabProps {
  scheduleText: string;
  scheduleError: string | null;
  onScheduleTextChange: (value: string) => void;
  galleryText: string;
  onGalleryTextChange: (value: string) => void;
}

function ContentTab({
  draft,
  update,
  scheduleText,
  scheduleError,
  onScheduleTextChange,
  galleryText,
  onGalleryTextChange,
}: ContentTabProps) {
  return (
    <div className="gpe-section">
      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-welcome-message">Welcome message</label>
        <textarea
          id="gpe-welcome-message"
          className="gpe-textarea"
          rows={4}
          value={draft.welcome_message ?? ''}
          onChange={(e) => update({ welcome_message: e.target.value || null })}
          placeholder="Welcome to our event!"
        />
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-event-subtitle">Event subtitle</label>
        <input
          id="gpe-event-subtitle"
          type="text"
          className="gpe-input"
          value={draft.event_subtitle ?? ''}
          onChange={(e) => update({ event_subtitle: e.target.value || null })}
          placeholder="Join us for a celebration"
        />
      </div>

      <div className="gpe-field gpe-checkbox-field">
        <label className="gpe-checkbox-label">
          <input
            type="checkbox"
            className="gpe-checkbox"
            checked={draft.enable_schedule}
            onChange={(e) => update({ enable_schedule: e.target.checked })}
          />
          <span>Enable schedule</span>
        </label>
      </div>

      <div className="gpe-field gpe-checkbox-field">
        <label className="gpe-checkbox-label">
          <input
            type="checkbox"
            className="gpe-checkbox"
            checked={draft.enable_gallery}
            onChange={(e) => update({ enable_gallery: e.target.checked })}
          />
          <span>Enable gallery</span>
        </label>
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-schedule-items">
          Schedule items (JSON array)
        </label>
        <textarea
          id="gpe-schedule-items"
          className="gpe-textarea gpe-code"
          rows={8}
          value={scheduleText}
          onChange={(e) => onScheduleTextChange(e.target.value)}
          placeholder='[{"time":"18:00","label":"Doors open"}]'
          spellCheck={false}
        />
        {scheduleError && <span className="gpe-hint gpe-hint-error">{scheduleError}</span>}
      </div>

      <div className="gpe-field">
        <label className="gpe-label" htmlFor="gpe-gallery-images">
          Gallery images (one URL per line)
        </label>
        <textarea
          id="gpe-gallery-images"
          className="gpe-textarea"
          rows={6}
          value={galleryText}
          onChange={(e) => onGalleryTextChange(e.target.value)}
          placeholder={'https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg'}
        />
      </div>
    </div>
  );
}

/* ------------------------------- Live preview ------------------------------- */

interface PreviewProps {
  settings: GuestPageSettingsInput;
  mode: PreviewMode;
  eventName: string;
}

function GuestPagePreview({ settings, mode, eventName }: PreviewProps) {
  const headingFont = settings.font_heading ?? 'Inter';
  const bodyFont = settings.font_body ?? 'Inter';
  const buttonFont = settings.font_button ?? 'Inter';

  const buttonBase: React.CSSProperties = {
    fontFamily: `'${buttonFont}', sans-serif`,
    color: settings.button_style === 'filled' ? settings.color_button_text : settings.color_primary,
    background: settings.button_style === 'filled' ? settings.color_button : 'transparent',
    borderColor: settings.color_primary,
    borderRadius: settings.border_radius,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    ...BUTTON_STYLE_MAP[settings.button_style ?? 'filled'],
  };

  const cardStyle: React.CSSProperties = {
    background: settings.color_card,
    color: settings.color_text,
    borderRadius: settings.border_radius,
    boxShadow: SHADOW_MAP[settings.card_shadow ?? 'md'],
    fontFamily: `'${bodyFont}', sans-serif`,
    fontSize: settings.font_body_size,
    fontWeight: settings.font_body_weight,
    letterSpacing: settings.font_body_spacing,
    lineHeight: settings.font_body_line_height,
    padding: 20,
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: `'${headingFont}', serif`,
    fontSize: settings.font_heading_size,
    fontWeight: settings.font_heading_weight,
    letterSpacing: settings.font_heading_spacing,
    lineHeight: settings.font_heading_line_height,
    color: settings.color_text,
    margin: 0,
  };

  const bannerHeight = Math.round((settings.banner_height ?? 400) * (mode === 'mobile' ? 0.5 : 0.7));
  const overlayOpacity = settings.background_overlay_opacity ?? 0;

  const justify =
    settings.logo_position === 'left'
      ? 'flex-start'
      : settings.logo_position === 'right'
        ? 'flex-end'
        : 'center';

  return (
    <div
      className={`gpe-preview gpe-preview-${mode}`}
      style={{
        background: settings.color_background,
        fontFamily: `'${bodyFont}', sans-serif`,
        color: settings.color_text,
      }}
    >
      {/* Banner */}
      <div
        className="gpe-preview-banner"
        style={{
          height: bannerHeight,
          backgroundImage: settings.cover_image ? `url(${settings.cover_image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {overlayOpacity > 0 && (
          <div
            className="gpe-preview-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              background: settings.color_secondary,
              opacity: overlayOpacity,
            }}
          />
        )}
        <div
          className="gpe-preview-banner-content"
          style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: justify, justifyContent: 'center', height: '100%', padding: 16, gap: 12 }}
        >
          {settings.logo_url && (
            <img
              src={settings.logo_url}
              alt="logo"
              style={{
                width: Math.min(settings.logo_size ?? 80, mode === 'mobile' ? 60 : settings.logo_size ?? 80),
                height: Math.min(settings.logo_size ?? 80, mode === 'mobile' ? 60 : settings.logo_size ?? 80),
                objectFit: 'contain',
                borderRadius: settings.logo_rounded ? '50%' : 0,
              }}
            />
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: mode === 'mobile' ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ ...headingStyle, fontSize: Math.round((settings.font_heading_size ?? 48) * 0.6) }}>
            {eventName}
          </h1>
          {settings.event_subtitle && (
            <p style={{ color: settings.color_primary, marginTop: 8, fontStyle: 'italic' }}>
              {settings.event_subtitle}
            </p>
          )}
        </div>

        {settings.welcome_message && (
          <div style={cardStyle}>
            <p style={{ margin: 0 }}>{settings.welcome_message}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
          <button type="button" style={buttonBase}>RSVP Now</button>
          <button
            type="button"
            style={{ ...buttonBase, color: settings.color_link, background: 'transparent', border: 'none' }}
          >
            Find your seat
          </button>
        </div>

        {settings.enable_schedule && Array.isArray(settings.schedule_items) && settings.schedule_items.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ ...headingStyle, fontSize: 20, marginBottom: 12 }}>Schedule</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {(settings.schedule_items as Array<Record<string, string>>).map((item, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  <strong>{item.time ?? ''}</strong> — {item.label ?? ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {settings.enable_gallery && Array.isArray(settings.gallery_images) && settings.gallery_images.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ ...headingStyle, fontSize: 20, marginBottom: 12 }}>Gallery</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
              {(settings.gallery_images as string[]).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Gallery ${idx + 1}`}
                  style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 6 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          background: settings.color_footer,
          color: '#ffffff',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: 12,
          fontFamily: `'${bodyFont}', sans-serif`,
        }}
      >
        © {new Date().getFullYear()} {eventName}
      </div>
    </div>
  );
}
