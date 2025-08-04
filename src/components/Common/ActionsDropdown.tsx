// src/components/Common/ActionsDropdown.tsx
import React, { useState } from 'react';
import Button from './Button';
import { ButtonVariant } from './Button';

export interface ActionConfig {
    label: string;
    onClick: () => void;
    isVisible: boolean;
    colorClass?: string;
    buttonVariant?: ButtonVariant;
}

interface ActionsDropdownProps {
    actions: ActionConfig[];
    isLoading?: boolean;
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
    actions,
    isLoading,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const closeDropdown = () => setIsOpen(false);
    const openDropdown = () => setIsOpen(true);

    return (
        <div 
            className="relative inline-block text-left flex items-center justify-center"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
        >
            <div>
                <Button 
                    className="flex items-center justify-center p-1 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    title="Más acciones"
                    disabled={isLoading}
                >
                    <svg className="h-5 w-5 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </Button>
            </div>

            {isOpen && (
                <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 z-20 border border-gray-200 dark:border-gray-700"
                    role="menu" 
                    aria-orientation="vertical" 
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        {actions.map((action, index) => (
                            action.isVisible && (
                                <Button
                                    key={index}
                                    onClick={() => { closeDropdown(); action.onClick(); }}
                                    className={`block w-full text-left px-4 py-2 text-sm ${action.colorClass || 'text-gray-700 dark:text-gray-200'}`}
                                    variant={action.buttonVariant || 'menuItem'}
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