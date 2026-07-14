import { useState, useCallback, ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
  }, []);

  const handleConfirm = useCallback(() => {
    options?.onConfirm();
    setOptions(null);
  }, [options]);

  const handleCancel = useCallback(() => {
    setOptions(null);
  }, []);

  const dialog = (): ReactNode => {
    if (!options) return null;
    return (
      <div className="confirm-dialog-overlay">
        <div className="confirm-dialog">
          <h2 className="confirm-dialog-title">{options.title}</h2>
          <p className="confirm-dialog-message">{options.message}</p>
          <div className="confirm-dialog-actions">
            <button
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirm}
            >
              {options.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return { confirm, dialog };
}
