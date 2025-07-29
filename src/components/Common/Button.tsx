// frontEnd/src/components/Common/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';

// Define los tipos posibles para las props 'variant' y 'size'
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'menuItem'; // Asegúrate de que 'menuItem' está aquí
type ButtonSize = 'sm' | 'md' | 'lg';

// Define la interfaz de props para tu componente Button.
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

// Implementación del componente funcional Button.
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}) => {

  // 1. Define las clases CSS base que se aplican a TODOS los botones.
  const baseStyles = 'font-semibold rounded transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50';

  // 2. Define las clases específicas para el TAMAÑO del botón.
  let sizeStyles = '';
  switch (size) {
    case 'sm':
      sizeStyles = 'text-xs px-2.5 py-1.5';
      break;
    case 'lg':
      sizeStyles = 'text-lg px-6 py-3';
      break;
    case 'md':
    default:
      sizeStyles = 'text-sm px-4 py-2';
      break;
  }

  // 3. Define las clases específicas para la VARIANTE del botón.
  let variantStyles = '';
  let focusRingColor = '';

  switch (variant) {
    case 'primary':
      variantStyles = 'bg-blue-600 text-white hover:bg-blue-700';
      focusRingColor = 'focus:ring-blue-500';
      break;
    case 'secondary':
      variantStyles = 'bg-gray-200 text-gray-800 hover:bg-gray-300';
      focusRingColor = 'focus:ring-gray-500';
      break;
    case 'danger':
      variantStyles = 'bg-red-600 text-white hover:bg-red-700';
      focusRingColor = 'focus:ring-red-500';
      break;
    case 'success':
      variantStyles = 'bg-green-600 text-white hover:bg-green-700';
      focusRingColor = 'focus:ring-green-500';
      break;
    case 'warning':
      variantStyles = 'bg-yellow-500 text-gray-900 hover:bg-yellow-600';
      focusRingColor = 'focus:ring-yellow-400';
      break;
    case 'info':
      variantStyles = 'bg-cyan-500 text-white hover:bg-cyan-600';
      focusRingColor = 'focus:ring-cyan-400';
      break;
    case 'menuItem': // <--- ESTA ES LA CLAVE PARA EL MENÚ
      variantStyles = 'bg-transparent text-gray-800 hover:bg-gray-100 hover:text-gray-900'; // Define los estilos para el menú aquí
      focusRingColor = 'focus:ring-gray-300'; // Anillo de foco neutral
      break;
    default:
      variantStyles = 'bg-blue-600 text-white hover:bg-blue-700';
      focusRingColor = 'focus:ring-blue-500';
  }

  // 4. Define las clases para el estado DESHABILITADO.
  const disabledStyles = rest.disabled ? 'opacity-50 cursor-not-allowed' : '';

  // 5. Combina todas las clases CSS en un solo string.
  const allClassNames = `${baseStyles} ${sizeStyles} ${variantStyles} ${focusRingColor} ${disabledStyles} ${className}`;


  return (
    <button className={allClassNames} {...rest}>
      {children}
    </button>
  );
};

export default Button;
