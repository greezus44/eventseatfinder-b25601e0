import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={overlayStyle}>
        {toasts.map((t) => (
          <div key={t.id} style={{ ...toastBaseStyle, ...borderByType(t.type) }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 24,
  right: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  zIndex: 9999,
  pointerEvents: 'none',
};

const toastBaseStyle: React.CSSProperties = {
  background: '#FFFFFF',
  color: '#1A1A1A',
  padding: '12px 20px',
  borderRadius: 8,
  border: '1px solid #EFEFEF',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14,
  maxWidth: 360,
};

function borderByType(type: ToastType): React.CSSProperties {
  switch (type) {
    case 'success':
      return { borderLeft: '4px solid #1A1A1A' };
    case 'error':
      return { borderLeft: '4px solid #4A4A4A' };
    default:
      return { borderLeft: '4px solid #DADADA' };
  }
}
