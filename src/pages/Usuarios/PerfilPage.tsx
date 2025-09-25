// src/pages/Usuario/PerfilPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUserById } from '../../services/userService';
import { IUsuarioReadAudit } from '../../types/usuario';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import { ProfileCard } from '../../components/Common/Card';
import UserAvatar from '../../components/Specific/UserAvatar';
import Button from '../../components/Common/Button';
import PerfilForm from '../../components/Specific/PerfilForm';
import EstadisticasUsuario from '../../components/Specific/EstadisticasUsuario';
import { useNotification } from '../../context/NotificationContext';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const PerfilPage: React.FC = () => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const [perfilData, setPerfilData] = useState<IUsuarioReadAudit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditingPerfil, setIsEditingPerfil] = useState(false);

    const fetchPerfilData = async () => {
        if (!user?.usuario_id) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getUserById(user.usuario_id);
            console.log('Datos del perfil recibidos:', data); // Debug
            setPerfilData(data);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Error al cargar el perfil';
            setError(errorMessage);
            addNotification(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerfilData();
    }, [user?.usuario_id]);

    const handlePerfilUpdated = async (updatedUser: IUsuarioReadAudit) => {
        setPerfilData(updatedUser);
        setIsEditingPerfil(false);
        addNotification('Perfil actualizado con éxito', 'success');
        // Refrescar datos completos
        await fetchPerfilData();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                <LoadingSpinner /> Cargando perfil...
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!perfilData || !user) {
        return <ErrorMessage message="No se pudo cargar la información del perfil" />;
    }

    const nombreCompleto = perfilData.persona
        ? `${perfilData.persona.nombre} ${perfilData.persona.apellido_paterno || ''}`.trim()
        : perfilData.nombre_usuario;

    const userPhotoUrl = perfilData.foto_ruta
        ? `${BACKEND_BASE_URL}${perfilData.foto_ruta}`
        : undefined;

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-lg min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div className="flex items-center space-x-4">
                    <UserAvatar
                        src={userPhotoUrl}
                        alt={nombreCompleto}
                        size="lg"
                        className="ring-4 ring-offset-4 ring-offset-gray-50 dark:ring-offset-gray-900 ring-indigo-500"
                    />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                            Mi Perfil
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            {nombreCompleto}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            @{perfilData.nombre_usuario}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Columna Principal - Información del Perfil */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Información Personal */}
                    <ProfileCard
                        title="Información Personal"
                        className="border-l-4 border-l-indigo-500"
                        actions={
                            <Button
                                variant={isEditingPerfil ? "secondary" : "primary"}
                                onClick={() => setIsEditingPerfil(!isEditingPerfil)}
                                size="sm"
                            >
                                {isEditingPerfil ? 'Cancelar' : 'Editar Perfil'}
                            </Button>
                        }
                    >
                        {isEditingPerfil ? (
                            <PerfilForm
                                usuario={perfilData}
                                onSuccess={handlePerfilUpdated}
                                onCancel={() => setIsEditingPerfil(false)}
                            />
                        ) : (
                            <div className="space-y-4">
                                {/* Información de Usuario */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Nombre de Usuario
                                        </label>
                                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                            {perfilData.nombre_usuario}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Estado
                                        </label>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            perfilData.estado === 'activo'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                        }`}>
                                            {perfilData.estado.charAt(0).toUpperCase() + perfilData.estado.slice(1)}
                                        </span>
                                    </div>
                                </div>

                                {/* Información Personal */}
                                {perfilData.persona && (
                                    <>
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                                Datos Personales
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Nombre Completo
                                                    </label>
                                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                                        {`${perfilData.persona.nombre} ${perfilData.persona.apellido_paterno || ''} ${perfilData.persona.apellido_materno || ''}`.trim()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        CI
                                                    </label>
                                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                                        {perfilData.persona.ci || 'No especificado'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Email
                                                    </label>
                                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                                        {perfilData.persona.email || 'No especificado'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Teléfono
                                                    </label>
                                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                                        {perfilData.persona.telefono || 'No especificado'}
                                                    </p>
                                                </div>
                                                {perfilData.persona.direccion && (
                                                    <div className="md:col-span-2">
                                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Dirección
                                                        </label>
                                                        <p className="text-sm text-gray-900 dark:text-gray-100">
                                                            {perfilData.persona.direccion}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Roles */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                                Roles Asignados
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {perfilData.persona.roles?.length ? (
                                                    perfilData.persona.roles.map((rol, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                                        >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {rol.nombre_rol}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 italic text-sm">Sin roles asignados</span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </ProfileCard>
                </div>

                {/* Columna Lateral - Estadísticas */}
                <div className="space-y-6">
                    <EstadisticasUsuario usuario={perfilData} />

                    {/* Información Adicional */}
                    <ProfileCard
                        title="Información de Cuenta"
                        className="border-l-4 border-l-green-500"
                    >
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    ID de Usuario
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                                    #{perfilData.usuario_id}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Creado en
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                    {perfilData.fecha_creacion ? (
                                        (() => {
                                            const fecha = new Date(perfilData.fecha_creacion);
                                            return !isNaN(fecha.getTime())
                                                ? fecha.toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })
                                                : 'Fecha no disponible';
                                        })()
                                    ) : 'Fecha no disponible'}
                                </p>
                            </div>
                            {perfilData.creador && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Creado por
                                    </label>
                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                        {perfilData.creador.nombre_usuario}
                                    </p>
                                </div>
                            )}
                        </div>
                    </ProfileCard>
                </div>
            </div>
        </div>
    );
};

export default PerfilPage;