// src/components/Common/Modal.tsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClass?: string; // Clases de Tailwind para el ancho (ej. 'max-w-md', 'max-w-3xl')
  showConfirmButton?: boolean;
  onConfirm?: () => void;
  confirmButtonText?: string;
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
  showCancelButton = true,
  cancelButtonText = 'Cancelar',
  isConfirmButtonDisabled = false,
  isCancelButtonDisabled = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Cerrar modal al presionar ESC
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
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Contenido del Modal */}
      <div
        ref={modalRef}
        className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:w-full ${widthClass}`}
      >
        {/* Header del Modal */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
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

        {/* Body del Modal */}
        <div className="p-6 text-gray-800 dark:text-gray-200">
          {children}
        </div>

        {/* Footer del Modal (Botones de acción) */}
        {(showConfirmButton || showCancelButton) && (
          <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 space-x-3">
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
                variant="primary"
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