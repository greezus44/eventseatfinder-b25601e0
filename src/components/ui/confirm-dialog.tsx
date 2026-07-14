import { type ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, children, maxWidth = 420 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(26, 26, 26, 0.4)',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: 32,
          maxWidth,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 600, color: '#1A1A1A' }}>
        {title}
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 15, lineHeight: 1.5, color: '#4A4A4A' }}>
        {message}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid #DADADA',
            background: '#FFFFFF',
            color: '#1A1A1A',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#1A1A1A',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
