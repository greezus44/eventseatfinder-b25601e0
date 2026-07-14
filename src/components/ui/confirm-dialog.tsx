import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export function Modal({ open, onClose, children, width = 440 }: ModalProps) {
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
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{ ...cardStyle, width }}
        onClick={(e) => e.stopPropagation()}
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
    <Modal open={open} onClose={onCancel} width={420}>
      <h2 style={titleStyle}>{title}</h2>
      <p style={messageStyle}>{message}</p>
      <div style={actionsStyle}>
        <button style={cancelBtnStyle} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button style={confirmBtnStyle} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(26,26,26,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 12,
  padding: 32,
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 600,
  color: '#1A1A1A',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const messageStyle: React.CSSProperties = {
  marginTop: 12,
  marginBottom: 24,
  fontSize: 15,
  lineHeight: 1.5,
  color: '#4A4A4A',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 8,
  border: '1px solid #DADADA',
  background: '#FFFFFF',
  color: '#4A4A4A',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const confirmBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  background: '#1A1A1A',
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui, sans-serif',
};
