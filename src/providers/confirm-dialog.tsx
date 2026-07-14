import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface ConfirmOptions { title: string; message: string; confirmText?: string; cancelText?: string }

const ConfirmContext = createContext<{ confirm: (o: ConfirmOptions) => Promise<boolean>; dialog: ReactNode } | null>(null)

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ opts, resolve })), [])

  const handleConfirm = () => { state?.resolve(true); setState(null) }
  const handleCancel = () => { state?.resolve(false); setState(null) }

  const dialog: ReactNode = state ? (
    <div className="confirm-overlay" onClick={handleCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title">{state.opts.title}</h3>
        <p className="confirm-message">{state.opts.message}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={handleCancel}>{state.opts.cancelText ?? 'Cancel'}</button>
          <button className="btn btn-danger" onClick={handleConfirm}>{state.opts.confirmText ?? 'Confirm'}</button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <ConfirmContext.Provider value={{ confirm, dialog }}>
      {children}
      {dialog}
    </ConfirmContext.Provider>
  )
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirmDialog must be used within ConfirmDialogProvider')
  return ctx
}
