import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
interface ConfirmOptions { title?: string; message: string; confirmText?: string; cancelText?: string }
interface State extends ConfirmOptions { open: boolean; resolve: ((v: boolean) => void) | null }
const Ctx = createContext<{ confirm: (o: ConfirmOptions | string) => Promise<boolean> } | undefined>(undefined)
const DEF: State = { open: false, message: '', resolve: null }
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [d, setD] = useState<State>(DEF)
  const confirm = useCallback((o: ConfirmOptions | string): Promise<boolean> => {
    const opts = typeof o === 'string' ? { message: o } : o
    return new Promise<boolean>((resolve) => setD({ open: true, title: opts.title, message: opts.message, confirmText: opts.confirmText, cancelText: opts.cancelText, resolve }))
  }, [])
  const confirmBtn = useCallback(() => setD((c) => { c.resolve?.(true); return DEF }), [])
  const cancelBtn = useCallback(() => setD((c) => { c.resolve?.(false); return DEF }), [])
  return <Ctx.Provider value={{ confirm }}>{children}{d.open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">{d.title && <h2 className="mb-2 text-lg font-semibold text-slate-900">{d.title}</h2>}<p className="mb-6 text-sm text-slate-600">{d.message}</p><div className="flex justify-end gap-3"><button type="button" onClick={cancelBtn} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{d.cancelText ?? 'Cancel'}</button><button type="button" onClick={confirmBtn} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">{d.confirmText ?? 'Confirm'}</button></div></div></div>}</Ctx.Provider>
}
export function useConfirmDialog() { const c = useContext(Ctx); if (!c) throw new Error('useConfirmDialog must be used within ConfirmDialogProvider'); return c }
