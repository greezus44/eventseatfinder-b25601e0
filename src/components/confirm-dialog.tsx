import React, { useState, useCallback } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmDialogState extends ConfirmOptions {
  open: boolean;
  resolve: (value: boolean) => void;
}

interface UseConfirmDialogReturn {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  dialog: React.ReactNode;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [state, setState] = useState<ConfirmDialogState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ ...options, open: true, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (state) {
      state.resolve(result);
      setState(null);
    }
  };

  const dialog = state ? (
    <div className="confirm-overlay" onClick={() => handleClose(false)}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        {state.title && <h2 className="confirm-title">{state.title}</h2>}
        <p className="confirm-message">{state.message}</p>
        <div className="confirm-actions">
          <button
            className="btn btn-secondary"
            onClick={() => handleClose(false)}
          >
            {state.cancelText ?? 'Cancel'}
          </button>
          <button
            className="btn btn-danger"
            onClick={() => handleClose(true)}
          >
            {state.confirmText ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        {title && <h2 className="confirm-title">{title}</h2>}
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelText ?? 'Cancel'}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmText ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
