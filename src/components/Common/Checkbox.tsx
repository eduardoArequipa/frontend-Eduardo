// src/components/Common/Checkbox.tsx
import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label?: string; // El label es opcional, ya que en la página de permisos lo manejamos fuera.
}

const Checkbox: React.FC<CheckboxProps> = ({ id, label, ...props }) => {
    return (
        <div className="flex items-center">
            <input
                id={id}
                type="checkbox"
                {...props}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:ring-offset-gray-800"
            />
            {label && (
                <label htmlFor={id} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    {label}
                </label>
            )}
        </div>
    );
};

export default Checkbox;
