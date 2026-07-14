import { createContext, useCallback, useContext, useState, ReactNode, CSSProperties } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const containerStyle: CSSProperties = {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const toastStyle = (type: ToastType): CSSProperties => ({
    padding: '12px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#FFFFFF',
    background: type === 'success' ? '#1A1A1A' : type === 'error' ? '#4A4A4A' : '#1A1A1A',
    border: '1px solid #1A1A1A',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: 200,
    maxWidth: 360,
    cursor: 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif',
  });

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={containerStyle}>
        {toasts.map((t) => (
          <div key={t.id} style={toastStyle(t.type)} onClick={() => remove(t.id)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
