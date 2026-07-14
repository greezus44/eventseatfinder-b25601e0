import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

interface ConfirmDialogContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  dialog: ReactNode
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | undefined>(undefined)

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve)
    })
  }, [])

  const handleConfirm = () => {
    setOpen(false)
    resolver?.(true)
    setResolver(null)
  }

  const handleCancel = () => {
    setOpen(false)
    resolver?.(false)
    setResolver(null)
  }

  const dialog: ReactNode = open && options ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        {options.title && <h2 className="text-lg font-semibold mb-2">{options.title}</h2>}
        <p className="text-slate-600 mb-6">{options.message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            {options.cancelText || 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            {options.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <ConfirmDialogContext.Provider value={{ confirm, dialog }}>
      {children}
      {dialog}
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog(): ConfirmDialogContextValue {
  const ctx = useContext(ConfirmDialogContext)
  if (!ctx) throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider')
  return ctx
}
