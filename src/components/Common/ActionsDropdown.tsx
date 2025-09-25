// src/components/Common/ActionsDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
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
    const wrapperRef = useRef<HTMLDivElement>(null);

    const closeDropdown = () => setIsOpen(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                closeDropdown();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const visibleActions = actions.filter(a => a.isVisible);

    if (visibleActions.length === 0) {
        return null;
    }

    return (
        <div ref={wrapperRef} className="relative inline-block text-left">
            <div>
                <Button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-center p-1.5 rounded-full bg-gray-100/50 dark:bg-gray-700/50 hover:bg-gray-200/70 dark:hover:bg-gray-600/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    title="Más acciones"
                    disabled={isLoading}
                >
                    <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </Button>
            </div>

            {isOpen && (
                <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 border border-gray-200 dark:border-gray-700"
                    style={{ zIndex: 9999 }}
                    role="menu" 
                    aria-orientation="vertical" 
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        {visibleActions.map((action, index) => {
                            const baseClasses = 'block w-full text-left px-4 py-2 text-sm transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700';
                            const colorClasses = action.colorClass || 'text-gray-700 dark:text-gray-200';

                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        action.onClick();
                                        closeDropdown();
                                    }}
                                    className={`${baseClasses} ${colorClasses}`}
                                    role="menuitem"
                                    disabled={isLoading}
                                >
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionsDropdown;