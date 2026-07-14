import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
type ToastType = 'success' | 'error' | 'info' | 'warning'
interface Toast { id: number; message: string; type: ToastType }
const ToastContext = createContext<{ toast: (m: string, t?: ToastType) => void } | undefined>(undefined)
const STYLES: Record<ToastType, string> = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-slate-800', warning: 'bg-amber-500' }
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), [])
  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((p) => [...p, { id, message, type }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])
  return <ToastContext.Provider value={{ toast }}>{children}<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">{toasts.map((t) => <div key={t.id} className={`${STYLES[t.type]} cursor-pointer rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg`} onClick={() => dismiss(t.id)}>{t.message}</div>)}</div></ToastContext.Provider>
}
export function useToast() { const c = useContext(ToastContext); if (!c) throw new Error('useToast must be used within ToastProvider'); return c.toast }
