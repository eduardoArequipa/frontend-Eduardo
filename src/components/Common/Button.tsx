// frontEnd/src/components/Common/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';

// Define los tipos posibles para las props 'variant' y 'size'
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'menuItem';
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

  const baseStyles = 'font-semibold rounded transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50';

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

  let variantStyles = '';
  let focusRingColor = '';

  switch (variant) {
    case 'primary':
      variantStyles = 'bg-blue-600 text-white hover:bg-blue-700';
      focusRingColor = 'focus:ring-blue-500';
      break;
    case 'secondary':
      variantStyles = 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600';
      focusRingColor = 'focus:ring-gray-500 dark:focus:ring-gray-400';
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
    case 'menuItem':
      variantStyles = 'bg-transparent text-gray-800 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700';
      focusRingColor = 'focus:ring-gray-300 dark:focus:ring-gray-600';
      break;
    default:
      variantStyles = 'bg-blue-600 text-white hover:bg-blue-700';
      focusRingColor = 'focus:ring-blue-500';
  }

  const disabledStyles = rest.disabled ? 'opacity-50 cursor-not-allowed' : '';

  const allClassNames = `${baseStyles} ${sizeStyles} ${variantStyles} ${focusRingColor} ${disabledStyles} ${className}`;

  return (
    <button className={allClassNames} {...rest}>
      {children}
    </button>
  );
};

export default Button;