interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>{title}</h2>
        <p
          className="text-secondary"
          style={{ marginBottom: 'var(--space-5)' }}
        >
          {message}
        </p>
        <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onConfirm}
            style={{ background: 'var(--error)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
