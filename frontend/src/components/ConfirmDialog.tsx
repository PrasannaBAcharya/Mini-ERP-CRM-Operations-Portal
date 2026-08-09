import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'accent';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ICONS: Record<string, string> = {
  danger:  '⚠️',
  warning: '🕐',
  accent:  '✓',
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal modal-sm" style={{ textAlign: 'center' }}>
        <div className="modal-body" style={{ padding: '2rem 2rem 1.5rem' }}>
          <div className={`confirm-modal-icon ${variant}`}>
            {ICONS[variant]}
          </div>
          <div className="confirm-modal-title">{title}</div>
          <p className="confirm-modal-desc">{description}</p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
