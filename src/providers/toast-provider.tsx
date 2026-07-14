import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }
interface ToastContextValue { toast: (message: string, type?: ToastType) => void; }
const ToastContext = createContext<ToastContextValue | undefined>(undefined);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: ToastType = 'info') => { const id = crypto.randomUUID(); setToasts((p) => [...p, { id, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000); }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return <ToastContext.Provider value={value}>{children}<div className="toast-container">{toasts.map((t) => <div key={t.id} className={`toast toast--${t.type}`}>{t.message}</div>)}</div></ToastContext.Provider>;
}
export function useToast() { const c = useContext(ToastContext); if (!c) throw new Error('useToast must be used within ToastProvider'); return c; }
