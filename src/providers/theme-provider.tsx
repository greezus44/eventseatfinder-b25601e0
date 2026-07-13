import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type AccentColor =
  'rose' | 'amber' | 'emerald' | 'sky' | 'slate' | 'violet';

interface AccentConfig {
  name: string;
  label: string;
  hex: string;
  scale: Record<number, string>;
}

export const ACCENT_COLORS: Record<AccentColor, AccentConfig> = {
  rose: {
    name: 'rose',
    label: 'Rose',
    hex: '#e11d48',
    scale: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
    },
  },
  amber: {
    name: 'amber',
    label: 'Amber',
    hex: '#d97706',
    scale: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
  },
  emerald: {
    name: 'emerald',
    label: 'Emerald',
    hex: '#059669',
    scale: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
  },
  sky: {
    name: 'sky',
    label: 'Sky',
    hex: '#0284c7',
    scale: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
  },
  slate: {
    name: 'slate',
    label: 'Slate',
    hex: '#475569',
    scale: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  violet: {
    name: 'violet',
    label: 'Violet',
    hex: '#7c3aed',
    scale: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
  },
};

interface ThemeContextValue {
  accent: AccentColor;
  setAccent: (color: AccentColor) => void;
  accentConfig: AccentConfig;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'seatly:accent-color';

function applyAccentVars(config: AccentConfig) {
  const root = document.documentElement;
  Object.entries(config.scale).forEach(([key, value]) => {
    root.style.setProperty(`--accent-${key}`, value);
  });
  root.style.setProperty('--accent', config.hex);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentColor>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AccentColor | null;
    return stored && stored in ACCENT_COLORS ? stored : 'rose';
  });

  useEffect(() => {
    applyAccentVars(ACCENT_COLORS[accent]);
    localStorage.setItem(STORAGE_KEY, accent);
  }, [accent]);

  const setAccent = (color: AccentColor) => setAccentState(color);

  return (
    <ThemeContext.Provider
      value={{ accent, setAccent, accentConfig: ACCENT_COLORS[accent] }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
