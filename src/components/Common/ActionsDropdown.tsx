// src/components/Common/ActionsDropdown.tsx
import React, { useState } from 'react';
import Button from './Button'; // Importa tu componente Button
import { ButtonVariant } from './Button'; // Importa el tipo ButtonVariant

// Interfaz para la configuración de cada acción individual
export interface ActionConfig {
    label: string; // Etiqueta del botón de acción (ej. "Editar", "Activar")
    onClick: () => void; // Función a ejecutar cuando se hace clic en la acción
    isVisible: boolean; // true si la acción debe mostrarse, false en caso contrario
    colorClass?: string; // Clases de color de texto para Tailwind (ej. "text-red-700") - para sobrescribir el color de texto de la variante base
    buttonVariant?: ButtonVariant; // Permite especificar una variante de Button para esta acción
}

interface ActionsDropdownProps {
    // La lista de acciones que este dropdown puede mostrar
    actions: ActionConfig[];
    
    // Opcional: para deshabilitar el botón del dropdown si hay una carga global en la tabla padre
    isLoading?: boolean; 
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
    actions,
    isLoading,
}) => {
    const [isOpen, setIsOpen] = useState(false); // Estado para controlar la visibilidad del dropdown

    const closeDropdown = () => setIsOpen(false);
    const openDropdown = () => setIsOpen(true);

    return (
        // Contenedor principal con posicionamiento relativo para el dropdown absoluto
        // Añadimos 'flex items-center justify-center' para centrar el icono de 3 puntos
        <div 
            className="relative inline-block text-left flex items-center justify-center"
            onMouseEnter={openDropdown} // Abre el dropdown al pasar el mouse
            onMouseLeave={closeDropdown} // Cierra el dropdown al quitar el mouse
        >
            {/* Botón de tres puntos (trigger del dropdown) */}
            <div>
                <Button 
                    // El botón activador del dropdown mantiene sus estilos de fondo transparente y hover gris sutil
                    className="flex items-center justify-center p-1 rounded-full bg-transparent hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    title="Más acciones"
                    disabled={isLoading} // Deshabilita el botón si hay una carga global
                >
                    {/* Icono de tres puntos (SVG) */}
                    <svg className="h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </Button>
            </div>

            {/* Panel del Dropdown (oculto por defecto, visible con isOpen) */}
            {isOpen && (
                <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 border border-gray-200"
                    role="menu" 
                    aria-orientation="vertical" 
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        {/* Mapea sobre las acciones pasadas como prop */}
                        {actions.map((action, index) => (
                            action.isVisible && ( // Solo renderiza si isVisible es true
                                <Button
                                    key={index} // Usa el índice como key si no hay un ID único para la acción
                                    onClick={() => { closeDropdown(); action.onClick(); }} // Llama a la función de la acción y cierra el dropdown
                                    // La clase `colorClass` se aplica para el color del texto.
                                    // La `variant` del botón se encarga del fondo y hover de cada item del menú.
                                    className={`block w-full text-left px-4 py-2 text-sm ${action.colorClass || ''}`}
                                    variant={action.buttonVariant || 'menuItem'} // Usa la variante pasada o 'menuItem' por defecto
                                    role="menuitem"
                                    disabled={isLoading}
                                >
                                    {action.label}
                                </Button>
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionsDropdown;
