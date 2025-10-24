// src/components/Common/ErrorMessage.tsx
import React from 'react';

interface ErrorMessageProps {
  message?: string;
  onClose?: () => void; // onClose es opcional
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  if (!message) {
    return null;
  }

  return (
    <div
      className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center"
      role="alert"
    >
      <div>
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline ml-2">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 px-2 py-1 text-red-700 hover:bg-red-200 rounded-md"
          aria-label="Cerrar"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
