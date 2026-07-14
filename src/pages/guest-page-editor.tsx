import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useGuestPageSettings,
  useUpsertGuestPageSettings,
} from '@/hooks/use-guest-page-settings';
import { useEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import { LoadingScreen } from '@/components/ui/feedback';
import {
  DEFAULT_SETTINGS,
  FONT_OPTIONS,
  COLOR_PRESETS,
} from '@/types/guest-page-settings';
import type { GuestPageSettingsInput } from '@/types/guest-page-settings';

type Section = 'branding' | 'colours' | 'typography' | 'appearance' | 'content';

interface ScheduleItem {
  time: string;
  title: string;
  description: string;
}

function shadowValue(level: string): string {
  switch (level) {
    case 'none':
      return 'none';
    case 'sm':
      return '0 1px 3px rgba(0,0,0,0.06)';
    case 'lg':
      return '0 16px 48px rgba(0,0,0.12)';
    default:
      return '0 8px 24px rgba(0,0,0,0.08)';
  }
}

export function GuestPageEditor() {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const eventQuery = useEvent(eventId ?? '');
  const settingsQuery = useGuestPageSettings(eventId ?? '');
  const upsertMutation = useUpsertGuestPageSettings(eventId ?? '');
  const [settings, setSettings] = useState<GuestPageSettingsInput>(() => ({
    ...DEFAULT_SETTINGS,
  }));
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>(
    'desktop',
  );
  const [activeSection, setActiveSection] = useState<Section>('branding');
  const [dirty, setDirty] = useState(false);
  const initialized = useRef(false);

  const existing = settingsQuery.data;
  const settingsLoading = settingsQuery.isLoading;

  useEffect(() => {
    if (initialized.current) return;
    if (!settingsLoading && existing) {
      const input: GuestPageSettingsInput = {
        logo_url: existing.logo_url,
        logo_size: existing.logo_size,
        logo_position: existing.logo_position,
        logo_rounded: existing.logo_rounded,
        color_primary: existing.color_primary,
        color_secondary: existing.color_secondary,
        color_background: existing.color_background,
        color_card: existing.color_card,
        color_button: existing.color_button,
        color_button_text: existing.color_button_text,
        color_header: existing.color_header,
        color_footer: existing.color_footer,
        color_text: existing.color_text,
        color_link: existing.color_link,
        font_heading: existing.font_heading,
        font_body: existing.font_body,
        font_button: existing.font_button,
        font_heading_size: existing.font_heading_size,
        font_body_size: existing.font_body_size,
        font_heading_weight: existing.font_heading_weight,
        font_body_weight: existing.font_body_weight,
        font_heading_spacing: existing.font_heading_spacing,
        font_body_spacing: existing.font_body_spacing,
        font_heading_line_height: existing.font_heading_line_height,
        font_body_line_height: existing.font_body_line_height,
        border_radius: existing.border_radius,
        card_shadow: existing.card_shadow,
        button_style: existing.button_style,
        background_image: existing.background_image,
        background_overlay_opacity: existing.background_overlay_opacity,
        cover_image: existing.cover_image,
        banner_height: existing.banner_height,
        welcome_message: existing.welcome_message,
        event_subtitle: existing.event_subtitle,
        enable_schedule: existing.enable_schedule,
        enable_gallery: existing.enable_gallery,
        schedule_items: existing.schedule_items as ScheduleItem[] | null,
        gallery_images: existing.gallery_images as string[] | null,
        venue_image_url: existing.venue_image_url,
      };
      setSettings(input);
      initialized.current = true;
    } else if (!settingsLoading && existing === null) {
      initialized.current = true;
    }
  }, [settingsLoading, existing]);

  useEffect(() => {
    const fonts = new Set(FONT_OPTIONS);
    const fontList = Array.from(fonts);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontList
      .map((f) => f.replace(/ /g, '+'))
      .join('&family=')}&display=swap`;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const update = <K extends keyof GuestPageSettingsInput>(
    key: K,
    value: GuestPageSettingsInput[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync(settings);
      toast('Guest page settings saved.', 'success');
      setDirty(false);
    } catch {
      toast('Could not save settings. Please try again.', 'error');
    }
  };

  const event = eventQuery.data;

  const previewHeroBg = settings.cover_image
    ? `url(${settings.cover_image})`
    : settings.background_image
      ? `url(${settings.background_image})`
      : `linear-gradient(135deg, ${settings.color_primary}, ${settings.color_secondary})`;

  const previewButtonStyle: React.CSSProperties = useMemo(() => {
    const base: React.CSSProperties = {
      fontFamily: settings.font_button,
      borderRadius:
        settings.button_style === 'rounded'
          ? '9999px'
          : `${settings.border_radius}px`,
    };
    if (settings.button_style === 'outlined') {
      return {
        ...base,
        background: 'transparent',
        border: `2px solid ${settings.color_button}`,
        color: settings.color_button,
      };
    }
    return {
      ...base,
      background: settings.color_button,
      color: settings.color_button_text,
      border: 'none',
    };
  }, [settings]);

  if (eventQuery.isLoading) return <LoadingScreen message="Loading event..." />;
  if (!event) return <div style={{ padding: 32 }}>Event not found</div>;

  const sections: { id: Section; label: string }[] = [
    { id: 'branding', label: 'Branding' },
    { id: 'colours', label: 'Colours' },
    { id: 'typography', label: 'Typography' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'content', label: 'Content' },
  ];

  const colourFields: { key: keyof GuestPageSettingsInput; label: string }[] = [
    { key: 'color_primary', label: 'Primary / Accent' },
    { key: 'color_secondary', label: 'Secondary' },
    { key: 'color_background', label: 'Background' },
    { key: 'color_card', label: 'Card' },
    { key: 'color_button', label: 'Button' },
    { key: 'color_button_text', label: 'Button Text' },
    { key: 'color_header', label: 'Header' },
    { key: 'color_footer', label: 'Footer' },
    { key: 'color_text', label: 'Text' },
    { key: 'color_link', label: 'Link' },
  ];

  return (
    <div className="gpe-page">
      <div className="gpe-header">
        <div>
          <Link to="/" className="gpe-back">
            ← Dashboard
          </Link>
          <h1 className="gpe-title">Guest Page Editor</h1>
          <p className="gpe-subtitle">{event.name}</p>
        </div>
        <div className="gpe-header__actions">
          <Link
            to={`/e/${event.slug}`}
            className="btn btn--secondary btn--sm"
            target="_blank"
          >
            View Page ↗
          </Link>
          <button
            className="btn btn--primary"
            onClick={handleSave}
            disabled={!dirty || upsertMutation.isPending}
          >
            {upsertMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="gpe-layout">
        <div className="gpe-panels">
          <div className="gpe-tabs">
            {sections.map((sec) => (
              <button
                key={sec.id}
                className={`gpe-tab${activeSection === sec.id ? ' gpe-tab--active' : ''}`}
                onClick={() => setActiveSection(sec.id)}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {activeSection === 'branding' && (
            <div className="gpe-panel">
              <div className="gpe-panel__title">Branding & Images</div>
              <div className="gpe-panel__section">
                <div className="gpe-field">
                  <label className="gpe-field__label">Logo URL</label>
                  <input
                    type="text"
                    className="input"
                    value={settings.logo_url ?? ''}
                    onChange={(e) => update('logo_url', e.target.value || null)}
                    placeholder="https://..."
                  />
                  {settings.logo_url && (
                    <div className="gpe-logo-thumb">
                      <img src={settings.logo_url} alt="Logo" />
                      <button
                        className="gpe-logo-thumb__remove"
                        onClick={() => update('logo_url', null)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">Cover Image URL</label>
                  <input
                    type="text"
                    className="input"
                    value={settings.cover_image ?? ''}
                    onChange={(e) =>
                      update('cover_image', e.target.value || null)
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Background Image URL
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={settings.background_image ?? ''}
                    onChange={(e) =>
                      update('background_image', e.target.value || null)
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Venue Floor Plan Image URL
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={settings.venue_image_url ?? ''}
                    onChange={(e) =>
                      update('venue_image_url', e.target.value || null)
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Logo Size: {settings.logo_size}px
                  </label>
                  <div className="gpe-slider-row">
                    <input
                      type="range"
                      className="gpe-slider"
                      min={40}
                      max={200}
                      value={settings.logo_size}
                      onChange={(e) =>
                        update('logo_size', Number(e.target.value))
                      }
                    />
                    <span className="gpe-slider__value">
                      {settings.logo_size}px
                    </span>
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Banner Height: {settings.banner_height}px
                  </label>
                  <div className="gpe-slider-row">
                    <input
                      type="range"
                      className="gpe-slider"
                      min={200}
                      max={600}
                      step={20}
                      value={settings.banner_height}
                      onChange={(e) =>
                        update('banner_height', Number(e.target.value))
                      }
                    />
                    <span className="gpe-slider__value">
                      {settings.banner_height}px
                    </span>
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">Logo Position</label>
                  <div className="gpe-btn-group">
                    {(['left', 'center', 'right'] as const).map((pos) => (
                      <button
                        key={pos}
                        className={`gpe-btn-group__option${settings.logo_position === pos ? ' gpe-btn-group__option--active' : ''}`}
                        onClick={() => update('logo_position', pos)}
                      >
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-toggle">
                    <input
                      type="checkbox"
                      checked={settings.logo_rounded}
                      onChange={(e) => update('logo_rounded', e.target.checked)}
                    />
                    Rounded logo corners
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'colours' && (
            <div className="gpe-panel">
              <div className="gpe-panel__title">Colour Scheme</div>
              <div className="gpe-panel__section">
                {colourFields.map((field) => (
                  <div key={field.key} className="gpe-field">
                    <label className="gpe-field__label">{field.label}</label>
                    <div className="gpe-color-row">
                      <input
                        type="color"
                        className="gpe-color-picker"
                        value={settings[field.key] as string}
                        onChange={(e) => update(field.key, e.target.value)}
                      />
                      <input
                        type="text"
                        className="gpe-color-hex"
                        value={settings[field.key] as string}
                        onChange={(e) => update(field.key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <div className="gpe-field">
                  <label className="gpe-field__label">Preset Palettes</label>
                  <div className="gpe-presets">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        className="gpe-preset"
                        onClick={() => {
                          setSettings((prev) => ({
                            ...prev,
                            ...preset.colors,
                          }));
                          setDirty(true);
                        }}
                      >
                        <div className="gpe-preset__name">{preset.name}</div>
                        <div className="gpe-preset__swatches">
                          {Object.values(preset.colors).map((color, i) => (
                            <div
                              key={i}
                              className="gpe-preset__swatch"
                              style={{ background: color }}
                            />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'typography' && (
            <div className="gpe-panel">
              <div className="gpe-panel__title">Typography</div>
              <div className="gpe-panel__section">
                <div className="gpe-field">
                  <label className="gpe-field__label">Heading Font</label>
                  <select
                    className="gpe-font-select"
                    value={settings.font_heading}
                    onChange={(e) => update('font_heading', e.target.value)}
                    style={{ fontFamily: settings.font_heading }}
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option
                        key={font}
                        value={font}
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">Body Font</label>
                  <select
                    className="gpe-font-select"
                    value={settings.font_body}
                    onChange={(e) => update('font_body', e.target.value)}
                    style={{ fontFamily: settings.font_body }}
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option
                        key={font}
                        value={font}
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">Button Font</label>
                  <select
                    className="gpe-font-select"
                    value={settings.font_button}
                    onChange={(e) => update('font_button', e.target.value)}
                    style={{ fontFamily: settings.font_button }}
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option
                        key={font}
                        value={font}
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Heading Size: {settings.font_heading_size}px
                  </label>
                  <div className="gpe-slider-row">
                    <input
                      type="range"
                      className="gpe-slider"
                      min={24}
                      max={72}
                      value={settings.font_heading_size}
                      onChange={(e) =>
                        update('font_heading_size', Number(e.target.value))
                      }
                    />
                    <span className="gpe-slider__value">
                      {settings.font_heading_size}px
                    </span>
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Body Size: {settings.font_body_size}px
                  </label>
                  <div className="gpe-slider-row">
                    <input
                      type="range"
                      className="gpe-slider"
                      min={12}
                      max={24}
                      value={settings.font_body_size}
                      onChange={(e) =>
                        update('font_body_size', Number(e.target.value))
                      }
                    />
                    <span className="gpe-slider__value">
                      {settings.font_body_size}px
                    </span>
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">Heading Weight</label>
                  <select
                    className="input"
                    value={settings.font_heading_weight}
                    onChange={(e) =>
                      update('font_heading_weight', Number(e.target.value))
                    }
                  >
                    {[400, 500, 600, 700, 800].map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">Body Weight</label>
                  <select
                    className="input"
                    value={settings.font_body_weight}
                    onChange={(e) =>
                      update('font_body_weight', Number(e.target.value))
                    }
                  >
                    {[400, 500, 600, 700].map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Heading Letter Spacing: {settings.font_heading_spacing}px
                  </label>
                  <div className="gpe-slider-row">
                    <input
                      type="range"
                      className="gpe-slider"
                      min={-2}
                      max={10}
                      step={0.5}
                      value={settings.font_heading_spacing}
                      onChange={(e) =>
                        update('font_heading_spacing', Number(e.target.value))
                      }
                    />
                    <span className="gpe-slider__value">
                      {settings.font_heading_spacing}px
                    </span>
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Body Letter Spacing: {settings.font_body_spacing}px
                  </label>
                  <div className="gpe-slider-row">
                    <input
                      type="range"
                      className="gpe-slider"
                      min={-2}
                      max={10}
                      step={0.5}
                      value={settings.font_body_spacing}
                      onChange={(e) =>
                        update('font_body_spacing', Number(e.target.value))
                      }
                    />
                    <span className="gpe-slider__value">
                      {settings.font_body_spacing}px
                    </span>
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Heading Line Height: {settings.font_heading_line_height}
                  </label>
                  <div className="gpe-slider-row">
                    <input
                      type="range"
                      className="gpe-slider"
                      min={1}
                      max={2}
                      step={0.1}
                      value={settings.font_heading_line_height}
                      onChange={(e) =>
                        update(
                          'font_heading_line_height',
                          Number(e.target.value),
                        )
                      }
                    />
                    <span className="gpe-slider__value">
                      {settings.font_heading_line_height}
                    </span>
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Body Line Height: {settings.font_body_line_height}
                  </label>
                  <div className="gpe-slider-row">
                    <input
                      type="range"
                      className="gpe-slider"
                      min={1}
                      max={2}
                      step={0.1}
                      value={settings.font_body_line_height}
                      onChange={(e) =>
                        update('font_body_line_height', Number(e.target.value))
                      }
                    />
                    <span className="gpe-slider__value">
                      {settings.font_body_line_height}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="gpe-panel">
              <div className="gpe-panel__title">Appearance</div>
              <div className="gpe-panel__section">
                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Border Radius: {settings.border_radius}px
                  </label>
                  <div className="gpe-slider-row">
                    <input
                      type="range"
                      className="gpe-slider"
                      min={0}
                      max={32}
                      value={settings.border_radius}
                      onChange={(e) =>
                        update('border_radius', Number(e.target.value))
                      }
                    />
                    <span className="gpe-slider__value">
                      {settings.border_radius}px
                    </span>
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">Card Shadow</label>
                  <select
                    className="input"
                    value={settings.card_shadow}
                    onChange={(e) =>
                      update(
                        'card_shadow',
                        e.target.value as 'none' | 'sm' | 'md' | 'lg',
                      )
                    }
                  >
                    <option value="none">None</option>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">Button Style</label>
                  <div className="gpe-btn-group">
                    {(['filled', 'outlined', 'rounded'] as const).map(
                      (style) => (
                        <button
                          key={style}
                          className={`gpe-btn-group__option${settings.button_style === style ? ' gpe-btn-group__option--active' : ''}`}
                          onClick={() => update('button_style', style)}
                        >
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Background Overlay Opacity:{' '}
                    {settings.background_overlay_opacity}%
                  </label>
                  <div className="gpe-slider-row">
                    <input
                      type="range"
                      className="gpe-slider"
                      min={0}
                      max={100}
                      value={settings.background_overlay_opacity}
                      onChange={(e) =>
                        update(
                          'background_overlay_opacity',
                          Number(e.target.value),
                        )
                      }
                    />
                    <span className="gpe-slider__value">
                      {settings.background_overlay_opacity}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'content' && (
            <div className="gpe-panel">
              <div className="gpe-panel__title">Content & Sections</div>
              <div className="gpe-panel__section">
                <div className="gpe-field">
                  <label className="gpe-field__label">Event Subtitle</label>
                  <input
                    type="text"
                    className="input"
                    value={settings.event_subtitle ?? ''}
                    onChange={(e) =>
                      update('event_subtitle', e.target.value || null)
                    }
                    placeholder="e.g. The Wedding of..."
                  />
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">Welcome Message</label>
                  <textarea
                    className="input"
                    value={settings.welcome_message ?? ''}
                    onChange={(e) =>
                      update('welcome_message', e.target.value || null)
                    }
                    placeholder="Welcome to our event..."
                    rows={3}
                  />
                </div>

                <div className="gpe-field">
                  <label className="gpe-toggle">
                    <input
                      type="checkbox"
                      checked={settings.enable_schedule}
                      onChange={(e) =>
                        update('enable_schedule', e.target.checked)
                      }
                    />
                    Enable Schedule section
                  </label>
                </div>

                <div className="gpe-field">
                  <label className="gpe-toggle">
                    <input
                      type="checkbox"
                      checked={settings.enable_gallery}
                      onChange={(e) =>
                        update('enable_gallery', e.target.checked)
                      }
                    />
                    Enable Gallery section
                  </label>
                </div>

                {settings.enable_schedule && (
                  <div className="gpe-field">
                    <label className="gpe-field__label">
                      Schedule Items (JSON)
                    </label>
                    <textarea
                      className="input"
                      value={JSON.stringify(
                        settings.schedule_items ?? [],
                        null,
                        2,
                      )}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          update('schedule_items', parsed);
                        } catch {
                          // ignore invalid JSON while typing
                        }
                      }}
                      rows={6}
                      placeholder='[{"time":"6:00 PM","title":"Doors Open","description":"Welcome drinks"}]'
                    />
                  </div>
                )}

                {settings.enable_gallery && (
                  <div className="gpe-field">
                    <label className="gpe-field__label">
                      Gallery Image URLs (one per line)
                    </label>
                    <textarea
                      className="input"
                      value={(settings.gallery_images ?? []).join('\n')}
                      onChange={(e) => {
                        const images = e.target.value
                          .split('\n')
                          .filter(Boolean);
                        update(
                          'gallery_images',
                          images.length > 0 ? images : null,
                        );
                      }}
                      rows={4}
                      placeholder="https://image1.jpg&#10;https://image2.jpg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="gpe-preview">
          <div className="gpe-preview__toolbar">
            <button
              className={`gpe-preview__tab${previewMode === 'desktop' ? ' gpe-preview__tab--active' : ''}`}
              onClick={() => setPreviewMode('desktop')}
            >
              Desktop
            </button>
            <button
              className={`gpe-preview__tab${previewMode === 'mobile' ? ' gpe-preview__tab--active' : ''}`}
              onClick={() => setPreviewMode('mobile')}
            >
              Mobile
            </button>
          </div>
          <div
            className={`gpe-preview__viewport${previewMode === 'mobile' ? ' gpe-preview__viewport--mobile' : ''}`}
          >
            <div
              className="gpe-preview-hero"
              style={{
                backgroundImage: `linear-gradient(rgba(15,23,42,${settings.background_overlay_opacity / 100}), rgba(15,23,42,${settings.background_overlay_opacity / 100}), ${previewHeroBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: `${Math.min(settings.banner_height, previewMode === 'mobile' ? 200 : 300)}px`,
              }}
            >
              {settings.logo_url && (
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="gpe-preview-hero__logo"
                  style={{
                    height: `${Math.min(settings.logo_size, 60)}px`,
                    borderRadius: settings.logo_rounded
                      ? '50%'
                      : `${settings.border_radius}px`,
                  }}
                />
              )}
              <h3
                className="gpe-preview-hero__title"
                style={{
                  fontFamily: settings.font_heading,
                  fontSize: `${Math.min(settings.font_heading_size, 32)}px`,
                  fontWeight: settings.font_heading_weight,
                  color: '#fff',
                  letterSpacing: `${settings.font_heading_spacing}px`,
                  lineHeight: settings.font_heading_line_height,
                }}
              >
                {event.name}
              </h3>
              {settings.event_subtitle && (
                <p
                  className="gpe-preview-hero__subtitle"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  {settings.event_subtitle}
                </p>
              )}
              <button
                className="gpe-preview-hero__btn"
                style={previewButtonStyle}
              >
                Find Your Seat
              </button>
            </div>

            <div
              className="gpe-preview-card"
              style={{
                background: settings.color_card,
                borderRadius: `${settings.border_radius}px`,
                boxShadow: shadowValue(settings.card_shadow),
              }}
            >
              <span
                style={{
                  color: settings.color_primary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Find Your Seat
              </span>
              <h4
                style={{
                  fontFamily: settings.font_heading,
                  color: settings.color_text,
                  fontSize: '1.25rem',
                  fontWeight: settings.font_heading_weight,
                }}
              >
                Search for Your Name
              </h4>
              <div
                style={{
                  padding: '12px 16px',
                  border: `1px solid ${settings.color_background === '#0f172a' ? '#334155' : '#e2e8f0'}`,
                  borderRadius: `${settings.border_radius}px`,
                  background: settings.color_background,
                  color: settings.color_text,
                  fontSize: '0.9375rem',
                }}
              >
                Type your name...
              </div>
              <button
                style={{
                  ...previewButtonStyle,
                  marginTop: '12px',
                  padding: '10px 24px',
                  fontSize: '0.875rem',
                }}
              >
                Search
              </button>
              <a
                style={{
                  color: settings.color_link,
                  fontSize: '0.875rem',
                  textDecoration: 'underline',
                  display: 'block',
                  marginTop: '12px',
                }}
              >
                Powered by Seatly
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
