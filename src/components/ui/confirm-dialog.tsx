import { ReactNode, CSSProperties } from 'react';

interface ModalProps {
  open: boolean;
  children: ReactNode;
  onClose?: () => void;
}

export function Modal({ open, children, onClose }: ModalProps) {
  if (!open) return null;

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(26, 26, 26, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  };

  const cardStyle: CSSProperties = {
    background: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    maxWidth: 480,
    width: '100%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  const titleStyle: CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: '#1A1A1A',
    margin: 0,
  };

  const messageStyle: CSSProperties = {
    fontSize: 14,
    color: '#4A4A4A',
    margin: '12px 0 24px',
    lineHeight: 1.5,
  };

  const buttonRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  };

  const baseButton: CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid #1A1A1A',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const cancelButton: CSSProperties = {
    ...baseButton,
    background: '#FFFFFF',
    color: '#1A1A1A',
  };

  const confirmButton: CSSProperties = {
    ...baseButton,
    background: '#1A1A1A',
    color: '#FFFFFF',
  };

  return (
    <Modal open={open} onClose={onCancel}>
      <h2 style={titleStyle}>{title}</h2>
      <p style={messageStyle}>{message}</p>
      <div style={buttonRowStyle}>
        <button style={cancelButton} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button style={confirmButton} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
