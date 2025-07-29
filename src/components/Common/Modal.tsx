import React, { FC, ReactNode } from 'react';
import Button from './Button';

interface ModalProps {
    isOpen: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    isConfirmDisabled?: boolean;
    showConfirmButton?: boolean;
    showCancelButton?: boolean;
    widthClass?: string; // Permite controlar el ancho del modal (ej: "max-w-md", "w-full")
}

const Modal: FC<ModalProps> = ({
    isOpen,
    title,
    children,
    onClose,
    onConfirm,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    isConfirmDisabled = false,
    showConfirmButton = true,
    showCancelButton = true,
    widthClass = "max-w-2xl", // Ancho por defecto más amplio
}) => {
    if (!isOpen) {
        return null;
    }

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center transition-opacity duration-300 ease-out"
            onClick={handleBackdropClick}
        >
            <div
                className={`relative bg-white rounded-lg shadow-xl transform transition-all duration-300 ease-out ${widthClass} mx-auto my-8 p-6`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Encabezado del Modal */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
                    <h3 className="text-2xl font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        aria-label="Cerrar modal"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Contenido del Modal (con scroll si es necesario) */}
                <div className="max-h-[75vh] overflow-y-auto pr-4 -mr-4 mb-6">
                    {children}
                </div>

                {/* Pie de página del Modal (Botones de acción) */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    {showCancelButton && (
                        <Button
                            onClick={onClose}
                            variant="secondary"
                            disabled={isConfirmDisabled}
                        >
                            {cancelText}
                        </Button>
                    )}
                    {showConfirmButton && onConfirm && (
                        <Button
                            onClick={onConfirm}
                            variant="primary"
                            disabled={isConfirmDisabled}
                        >
                            {confirmText}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
