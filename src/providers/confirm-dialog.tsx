import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
interface ConfirmOptions { title: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean }
type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>
const ConfirmContext = createContext<ConfirmFn>(async () => false)
export function useConfirmDialog() { return { confirm: useContext(ConfirmContext) } }
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null)
  const confirm = useCallback((opts: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...opts, resolve })), [])
  const handleClose = (value: boolean) => { state?.resolve(value); setState(null) }
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-overlay" onClick={() => handleClose(false)}>
          <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{state.title}</h3>
            <p className="confirm-dialog-message">{state.message}</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => handleClose(false)}>{state.cancelText ?? 'Cancel'}</button>
              <button className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => handleClose(true)}>{state.confirmText ?? 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
