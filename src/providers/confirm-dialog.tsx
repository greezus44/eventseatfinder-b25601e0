import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

interface ConfirmDialogState extends ConfirmOptions {
  open: boolean
  resolve: ((value: boolean) => void) | null
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>
  dialog: ConfirmDialogState
  handleConfirm: () => void
  handleCancel: () => void
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | undefined>(undefined)

const DEFAULT_STATE: ConfirmDialogState = {
  open: false,
  message: '',
  resolve: null,
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmDialogState>(DEFAULT_STATE)

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options
    return new Promise<boolean>((resolve) => {
      setDialog({
        open: true,
        title: opts.title,
        message: opts.message,
        confirmText: opts.confirmText,
        cancelText: opts.cancelText,
        resolve,
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setDialog((current) => {
      current.resolve?.(true)
      return DEFAULT_STATE
    })
  }, [])

  const handleCancel = useCallback(() => {
    setDialog((current) => {
      current.resolve?.(false)
      return DEFAULT_STATE
    })
  }, [])

  return (
    <ConfirmDialogContext.Provider value={{ confirm, dialog, handleConfirm, handleCancel }}>
      {children}
      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            {dialog.title && (
              <h2 className="mb-2 text-lg font-semibold text-slate-900">{dialog.title}</h2>
            )}
            <p className="mb-6 text-sm text-slate-600">{dialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {dialog.cancelText ?? 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
              >
                {dialog.confirmText ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog(): ConfirmDialogContextValue {
  const context = useContext(ConfirmDialogContext)
  if (!context) throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider')
  return context
}
