import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { getFontCss, getFontSize, getFontWeight } from '@/lib/fonts';

type Tab = 'find-seat' | 'venue-layout';

function loadGoogleFonts(fontFamilies: (string | null | undefined)[]) {
  const unique = [...new Set(fontFamilies.filter((f): f is string => !!f))];
  unique.forEach((family) => {
    const id = `font-${family.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
  });
}

export function FindYourSeatPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: settings, isLoading } = useGuestPageSettingsBySlug(slug);
  const { data: guests } = useGuests(settings?.event?.id);
  const { data: tables } = useTables(settings?.event?.id);

  const [activeTab, setActiveTab] = useState<Tab>('find-seat');
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    if (!settings) return;
    loadGoogleFonts([
      settings.font_title_family,
      settings.font_subtitle_family,
      settings.font_datetime_family,
      settings.font_venue_family,
    ]);
  }, [settings]);

  const accentColor = settings?.color_primary || '#1A1A1A';
  const bgColor = settings?.color_background || '#F8F8F8';

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const zoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  if (isLoading) {
    return React.createElement(
      'div',
      { className: 'loading-screen' },
      React.createElement('div', { className: 'spinner' }),
    );
  }

  if (!settings || !settings.event) {
    return React.createElement(
      'div',
      { className: 'loading-screen' },
      React.createElement(
        'div',
        { className: 'card text-center' },
        React.createElement('h2', null, 'Page Not Found'),
        React.createElement('p', { className: 'text-muted mt-4' }, 'This page may have been disabled or the link is incorrect.'),
      ),
    );
  }

  const event = settings.event;
  const logoSize = settings.logo_size ? Math.min(settings.logo_size, 500) : 80;

  const titleStyle: React.CSSProperties = {
    fontFamily: getFontCss(settings.font_title_family),
    fontSize: getFontSize(settings.font_title_size),
    fontWeight: getFontWeight(settings.font_title_weight),
    color: settings.font_title_color || '#1A1A1A',
  };

  const subtitleStyle: React.CSSProperties = {
    fontFamily: getFontCss(settings.font_subtitle_family),
    fontSize: getFontSize(settings.font_subtitle_size),
    fontWeight: getFontWeight(settings.font_subtitle_weight),
    color: settings.font_subtitle_color || '#4A4A4A',
  };

  const datetimeStyle: React.CSSProperties = {
    fontFamily: getFontCss(settings.font_datetime_family),
    fontSize: getFontSize(settings.font_datetime_size),
    fontWeight: getFontWeight(settings.font_datetime_weight),
    color: settings.font_datetime_color || '#4A4A4A',
  };

  const venueStyle: React.CSSProperties = {
    fontFamily: getFontCss(settings.font_venue_family),
    fontSize: getFontSize(settings.font_venue_size),
    fontWeight: getFontWeight(settings.font_venue_weight),
    color: settings.font_venue_color || '#4A4A4A',
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const dateStr = formatDate(event.date);
  const timeStr = formatTime(event.time);

  // Build table lookup
  const tableMap: Record<string, any> = {};
  (tables || []).forEach((t) => { tableMap[t.id] = t; });

  // Filter guests by search
  const searchResults = search.trim()
    ? (guests || []).filter((g) => g.name.toLowerCase().includes(search.toLowerCase().trim())).slice(0, 8)
    : [];

  const eventHeader = React.createElement(
    'div',
    { style: { textAlign: 'center', marginBottom: '32px' } },
    settings.logo_url
      ? React.createElement('img', {
          src: settings.logo_url,
          alt: event.name,
          style: {
            maxHeight: `${logoSize}px`,
            borderRadius: settings.logo_rounded ? '50%' : '0',
            margin: '0 auto 16px',
          },
        })
      : null,
    React.createElement('h1', { style: { ...titleStyle, marginBottom: '8px' } }, event.name),
    settings.event_subtitle
      ? React.createElement('p', { style: { ...subtitleStyle, marginBottom: '8px' } }, settings.event_subtitle)
      : null,
    dateStr
      ? React.createElement('p', { style: { ...datetimeStyle, marginBottom: '4px' } }, dateStr)
      : null,
    timeStr
      ? React.createElement('p', { style: { ...datetimeStyle, marginBottom: '4px' } }, timeStr)
      : null,
    event.venue
      ? React.createElement('p', { style: { ...venueStyle, marginBottom: '4px' } }, event.venue)
      : null,
  );

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '8px',
    border: `1px solid ${isActive ? accentColor : '#DADADA'}`,
    background: isActive ? accentColor : '#FFFFFF',
    color: isActive ? (settings.color_button_text || '#FFFFFF') : '#1A1A1A',
    cursor: 'pointer',
  });

  return React.createElement(
    'div',
    { className: 'guest-page', style: { background: bgColor } },
    React.createElement(
      'div',
      { style: { maxWidth: '700px', width: '100%' } },
      eventHeader,
      // Tab buttons
      React.createElement(
        'div',
        { style: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' } },
        React.createElement(
          'button',
          { style: tabButtonStyle(activeTab === 'find-seat'), onClick: () => setActiveTab('find-seat') },
          'Find Seat',
        ),
        React.createElement(
          'button',
          { style: tabButtonStyle(activeTab === 'venue-layout'), onClick: () => setActiveTab('venue-layout') },
          'Venue Layout',
        ),
      ),
      // Find Seat tab
      activeTab === 'find-seat'
        ? React.createElement(
            'div',
            { className: 'guest-page-card' },
            React.createElement('h2', { style: { fontSize: '20px', fontWeight: 600, marginBottom: '16px', textAlign: 'center' } }, 'Search Your Name'),
            React.createElement('input', {
              type: 'search',
              value: search,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
              placeholder: 'Type your name...',
              style: {
                border: `1px solid ${accentColor}`,
                height: '52px',
                fontSize: '16px',
              },
            }),
            searchResults.length > 0
              ? React.createElement(
                  'div',
                  { style: { marginTop: '12px' } },
                  searchResults.map((g) => {
                    const table = g.table_id ? tableMap[g.table_id] : null;
                    return React.createElement(
                      'div',
                      {
                        key: g.id,
                        style: {
                          padding: '14px 16px',
                          borderRadius: '8px',
                          border: '1px solid #EFEFEF',
                          marginBottom: '8px',
                          background: '#F8F8F8',
                        },
                      },
                      React.createElement('div', { style: { fontWeight: 600, fontSize: '15px' } }, g.name),
                      table
                        ? React.createElement('div', { className: 'ee-muted', style: { marginTop: '4px' } }, `Table ${table.number} — ${table.name}`)
                        : React.createElement('div', { className: 'ee-muted', style: { marginTop: '4px' } }, 'No table assigned yet'),
                    );
                  }),
                )
              : search.trim()
                ? React.createElement('p', { className: 'ee-muted text-center mt-4' }, 'No matching guests found.')
                : null,
          )
        : // Venue Layout tab
          React.createElement(
            'div',
            null,
            // Zoom controls
            React.createElement(
              'div',
              { style: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' } },
              React.createElement('button', { className: 'btn btn-secondary ee-btn-sm', onClick: zoomOut }, 'Zoom Out'),
              React.createElement('button', { className: 'btn btn-secondary ee-btn-sm', onClick: zoomReset }, 'Reset'),
              React.createElement('button', { className: 'btn btn-secondary ee-btn-sm', onClick: zoomIn }, 'Zoom In'),
            ),
            // Image container
            settings.venue_image_url
              ? React.createElement(
                  'div',
                  {
                    style: {
                      overflow: 'hidden',
                      borderRadius: '12px',
                      border: '1px solid #DADADA',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      maxHeight: '600px',
                    },
                    onMouseDown: handleMouseDown,
                    onMouseMove: handleMouseMove,
                    onMouseUp: handleMouseUp,
                    onMouseLeave: handleMouseUp,
                  },
                  React.createElement('img', {
                    src: settings.venue_image_url,
                    alt: 'Venue Layout',
                    style: {
                      width: '100%',
                      transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                      transformOrigin: 'center',
                      transition: isDragging ? 'none' : 'transform 0.15s ease',
                      maxHeight: '800px',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                    draggable: false,
                  }),
                )
              : React.createElement('div', { className: 'card text-center text-muted' }, 'No venue layout image available.'),
          ),
    ),
  );
}
