// src/components/Common/LoadingSpinner.tsx
import React from 'react';

// Define los tipos de tamaño que tu spinner puede aceptar
type SpinnerSize = 'small' | 'medium' | 'large';

interface LoadingSpinnerProps {
  size?: SpinnerSize;     // Prop opcional para definir el tamaño del spinner
  className?: string;     // Prop opcional para permitir pasar clases CSS adicionales
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', className = '' }) => {
  // Clases base para el spinner
  const baseSpinnerClasses = 'animate-spin rounded-full border-t-2 border-b-2 border-blue-500 border-opacity-75';

  // Determina las clases de tamaño según la prop 'size'
  let sizeClasses = '';
  switch (size) {
    case 'small':
      sizeClasses = 'h-5 w-5'; // Pequeño (como el que ya tenías)
      break;
    case 'medium':
      sizeClasses = 'h-8 w-8'; // Mediano (por defecto si no se especifica)
      break;
    case 'large':
      sizeClasses = 'h-12 w-12'; // Grande
      break;
    default:
      sizeClasses = 'h-8 w-8'; // Por si acaso, fallback a mediano
  }

  return (
    // Contenedor para centrar el spinner si es necesario y aplicar clases adicionales
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${baseSpinnerClasses} ${sizeClasses}`}></div>
    </div>
  );
};

export default LoadingSpinner;