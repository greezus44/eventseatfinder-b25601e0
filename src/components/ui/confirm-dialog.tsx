import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  children: ReactNode;
  onClose?: () => void;
}

export function Modal({ open, children, onClose }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,26,26,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: 32,
          maxWidth: 440,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
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
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,26,26,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: 32,
          maxWidth: 440,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <h2
          style={{
            margin: '0 0 12px',
            fontSize: 20,
            fontWeight: 600,
            color: '#1A1A1A',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: '0 0 24px',
            fontSize: 14,
            color: '#4A4A4A',
            lineHeight: 1.6,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
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
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #1A1A1A',
              background: '#1A1A1A',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
