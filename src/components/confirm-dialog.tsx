import React, { createContext, useCallback, useContext, useState } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  dialog: React.ReactNode;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    resolver?.(true);
    setResolver(null);
  };

  const handleCancel = () => {
    setOpen(false);
    resolver?.(false);
    setResolver(null);
  };

  const dialog = open
    ? React.createElement(
        'div',
        { className: 'confirm-overlay' },
        React.createElement(
          'div',
          { className: 'confirm-dialog' },
          options.title
            ? React.createElement('h3', { className: 'confirm-title' }, options.title)
            : null,
          React.createElement('p', { className: 'confirm-message' }, options.message),
          React.createElement(
            'div',
            { className: 'confirm-actions' },
            React.createElement(
              'button',
              { className: 'btn btn-secondary', onClick: handleCancel },
              options.cancelText || 'Cancel',
            ),
            React.createElement(
              'button',
              { className: 'btn btn-danger', onClick: handleConfirm },
              options.confirmText || 'Confirm',
            ),
          ),
        ),
      )
    : null;

  const value: ConfirmDialogContextValue = { confirm, dialog };

  return React.createElement(ConfirmDialogContext.Provider, { value }, children, dialog);
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  return ctx;
}

export const ConfirmDialog = ConfirmDialogProvider;
