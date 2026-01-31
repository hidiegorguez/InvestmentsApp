import React from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  success?: boolean;
  successMessage?: string;
  variant?: 'danger' | 'secondary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  success = false,
  successMessage,
  variant = 'secondary',
}) => {
  return (
    <Modal isOpen={isOpen} size="sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      
      {success ? (
        <p className="mb-6 text-emerald-600 text-center">{successMessage}</p>
      ) : (
        <>
          <div className="mb-6 text-sm sm:text-base text-gray-600">{message}</div>
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={onCancel}
              disabled={loading}
              className="order-2 sm:order-1"
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              size="lg"
              onClick={onConfirm}
              loading={loading}
              className="order-1 sm:order-2"
            >
              {loading ? `${confirmText.replace(/e$/, '')}ing...` : confirmText}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ConfirmDialog;
