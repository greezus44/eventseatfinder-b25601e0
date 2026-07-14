import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ConfirmOptions = {
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
}

type ConfirmContextType = { confirm: (opts: ConfirmOptions) => void }

const ConfirmContext = createContext<ConfirmContextType>({ confirm: () => {} })

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)

  const confirm = useCallback((o: ConfirmOptions) => setOpts(o), [])

  const handleConfirm = () => {
    opts?.onConfirm()
    setOpts(null)
  }

  const handleCancel = () => setOpts(null)

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {opts && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Confirm</h3>
            <p className="confirm-dialog-message">{opts.message}</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={handleCancel}>{opts.cancelText || 'Cancel'}</button>
              <button className="btn btn-danger" onClick={handleConfirm}>{opts.confirmText || 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
