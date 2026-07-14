import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  title?: string;
}

export function Modal({ open, onClose, children, title }: ModalProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 26, 26, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid #EFEFEF',
        }}
      >
        {title && (
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#1A1A1A',
            }}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p
        style={{
          margin: '0 0 24px 0',
          fontSize: '14px',
          color: '#4A4A4A',
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: '8px 20px',
            border: '1px solid #DADADA',
            background: '#FFFFFF',
            color: '#1A1A1A',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          style={{
            padding: '8px 20px',
            border: 'none',
            background: '#1A1A1A',
            color: '#FFFFFF',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
