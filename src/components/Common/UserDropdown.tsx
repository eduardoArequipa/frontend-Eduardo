// src/components/Common/UserDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../Specific/UserAvatar';
import { IPersonaWithRoles } from '../../types/persona';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const UserDropdown: React.FC = () => {
    const { user, logout, activeRole, availableRoles, switchRole } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [showRoleSelector, setShowRoleSelector] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const closeDropdown = () => {
        setIsOpen(false);
        setShowRoleSelector(false);
    };

    const handleRoleChange = (roleName: string) => {
        switchRole(roleName);
        setShowRoleSelector(false);
        // Mantener el dropdown abierto para que el usuario vea el cambio
    };

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
    }, []);

    if (!user) return null;

    const personaConRoles = user.persona as IPersonaWithRoles;
    const userName = `${personaConRoles?.nombre ?? ''} ${personaConRoles?.apellido_paterno ?? ''}`.trim();
    const userEmail = personaConRoles?.email || 'Sin email';
    const userPhotoUrl = user.foto_ruta ? `${BACKEND_BASE_URL}${user.foto_ruta}` : undefined;

    const handleProfileClick = () => {
        closeDropdown();
        // Navegar al perfil del usuario (puedes ajustar la ruta según tu aplicación)
        navigate('/perfil');
    };

    const handleLogout = () => {
        closeDropdown();
        logout();
    };

    return (
        <div ref={wrapperRef} className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            >
                <UserAvatar 
                    src={userPhotoUrl} 
                    alt={`${userName}'s avatar`} 
                    size="sm"
                    className="ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-indigo-500"
                />
                <div className="hidden md:block min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {userName || user.nombre_usuario}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 mr-1">
                            {activeRole || 'Sin rol'}
                        </span>
                        {availableRoles.length > 1 && (
                            <span className="text-gray-400">({availableRoles.length} roles)</span>
                        )}
                    </p>
                </div>
                {/* Chevron Icon */}
                <svg 
                    className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-slide-in-from-top-2">
                    {/* User Info Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <UserAvatar 
                                src={userPhotoUrl} 
                                alt={`${userName}'s avatar`} 
                                size="md"
                                className="ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-indigo-500"
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {userName || user.nombre_usuario}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                    {userEmail}
                                </p>
                                <div className="mt-2">
                                    {/* Rol Activo */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Rol activo:</span>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {activeRole || 'Sin rol'}
                                        </span>
                                    </div>

                                    {/* Selector de Roles */}
                                    {availableRoles.length > 1 && (
                                        <div>
                                            <button
                                                onClick={() => setShowRoleSelector(!showRoleSelector)}
                                                className="w-full flex items-center justify-between px-2 py-1 text-xs bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                            >
                                                <span className="text-gray-700 dark:text-gray-300">Cambiar rol</span>
                                                <svg
                                                    className={`w-3 h-3 text-gray-500 transition-transform ${showRoleSelector ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {/* Lista de Roles */}
                                            {showRoleSelector && (
                                                <div className="mt-2 max-h-32 overflow-y-auto">
                                                    {availableRoles.map((roleName, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => handleRoleChange(roleName)}
                                                            className={`w-full text-left px-2 py-1 text-xs rounded transition-colors flex items-center justify-between ${
                                                                roleName === activeRole
                                                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200'
                                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                                            }`}
                                                        >
                                                            <span>{roleName}</span>
                                                            {roleName === activeRole && (
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <button
                            onClick={handleProfileClick}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center"
                        >
                            <svg className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Ver Perfil
                        </button>
                        
                        {/* <button
                            onClick={() => {
                                closeDropdown();
                                navigate('/configuracion');
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center"
                        >
                            <svg className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Configuración
                        </button> */}
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 flex items-center"
                        >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;