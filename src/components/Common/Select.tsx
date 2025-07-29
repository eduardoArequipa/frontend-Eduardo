// src/components/Common/Select.tsx
import React, { SelectHTMLAttributes } from 'react';

// Define la interfaz para cada opción del select
interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean; // Opcional: para deshabilitar opciones específicas
}

// Define las propiedades que tu componente Select puede aceptar
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; // Etiqueta opcional para el campo select
  options?: SelectOption[]; // NUEVO: Prop para pasar las opciones como un array de objetos
  // Puedes añadir más props si tu componente Select las usa (ej. `variant`, `error`)
}

const Select: React.FC<SelectProps> = ({ label, id, children, className, options, ...rest }) => {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${className || ''}`}
        {...rest}
      >
        {/* Renderiza las opciones pasadas por la prop 'options' si existen */}
        {options && options.map((option, index) => (
          <option 
            key={option.value || index} // Usa el valor o el índice como key
            value={option.value} 
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
        {/* Mantén {children} por si todavía se usa para otras partes,
            pero para clientes/metodos de pago usaremos 'options' */}
        {children} 
      </select>
    </div>
  );
};

export default Select;
