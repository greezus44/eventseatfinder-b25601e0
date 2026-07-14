import { Spinner } from '@/components/ui/feedback';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  loading,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">{title}</h2>
        <p className="text-secondary">{message}</p>
        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn--primary btn--danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Spinner size={18} /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
