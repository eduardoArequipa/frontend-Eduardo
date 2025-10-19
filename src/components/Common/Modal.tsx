// src/components/Common/Modal.tsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button, { ButtonVariant } from './Button'; // Importar ButtonVariant

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClass?: string;
  showConfirmButton?: boolean;
  onConfirm?: () => void;
  confirmButtonText?: string;
  confirmButtonVariant?: ButtonVariant; // 1. Añadir prop opcional
  showCancelButton?: boolean;
  cancelButtonText?: string;
  isConfirmButtonDisabled?: boolean;
  isCancelButtonDisabled?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  widthClass = 'max-w-lg',
  showConfirmButton = false,
  onConfirm,
  confirmButtonText = 'Confirmar',
  confirmButtonVariant = 'primary', // 2. Añadir a la desestructuración con valor por defecto
  showCancelButton = false,
  cancelButtonText = 'Cancelar',
  isConfirmButtonDisabled = false,
  isCancelButtonDisabled = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      <div
        ref={modalRef}
        className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:w-full ${widthClass} max-h-[90vh] flex flex-col`}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 text-gray-800 dark:text-gray-200 overflow-y-auto flex-grow">
          {children}
        </div>

        {(showConfirmButton || showCancelButton) && (
          <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 space-x-3 flex-shrink-0">
            {showCancelButton && (
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isCancelButtonDisabled}
              >
                {cancelButtonText}
              </Button>
            )}
            {showConfirmButton && (
              <Button
                type="button"
                variant={confirmButtonVariant} // 3. Usar la prop
                onClick={onConfirm}
                disabled={isConfirmButtonDisabled}
              >
                {confirmButtonText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
