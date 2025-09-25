// src/components/Specific/EstadisticasUsuario.tsx
import React, { useEffect, useState } from 'react';
import { IUsuarioReadAudit } from '../../types/usuario';
import { ProfileCard } from '../Common/Card';
import LoadingSpinner from '../Common/LoadingSpinner';
import InfoIcon from '../Common/InfoIcon';

interface EstadisticasUsuarioProps {
    usuario: IUsuarioReadAudit;
}

interface UserStats {
    diasEnSistema: number;
    ultimaActividad: string;
    fechaCreacion: string | null;
    // TODO: Agregar más estadísticas cuando tengas endpoints específicos
    // totalVentas?: number;
    // totalCompras?: number;
    // productosCreados?: number;
}

const EstadisticasUsuario: React.FC<EstadisticasUsuarioProps> = ({ usuario }) => {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateStats = () => {
            setLoading(true);

            let diasEnSistema = 0;

            // Buscar fecha de creación en diferentes campos posibles
            const posiblesFechas = [
                usuario.fecha_creacion, // Campo nuevo en español
                // @ts-ignore - campos que podrían existir por compatibilidad
                usuario.creado_en,
                // @ts-ignore
                usuario.created_at
            ];

            let fechaCreacion: Date | null = null;
            let fechaCreacionString: string | null = null;

            for (const fecha of posiblesFechas) {
                if (fecha) {
                    const fechaParseada = new Date(fecha);
                    if (!isNaN(fechaParseada.getTime())) {
                        fechaCreacion = fechaParseada;
                        fechaCreacionString = fecha;
                        break;
                    }
                }
            }

            // Si no hay fecha de creación válida, usar un placeholder silencioso
            if (!fechaCreacion || isNaN(fechaCreacion.getTime())) {
                // Como no tenemos fecha real, mostrar como usuario reciente
                diasEnSistema = 0; // Usuario nuevo
                fechaCreacionString = 'Usuario reciente';
            } else {
                const hoy = new Date();
                diasEnSistema = Math.floor((hoy.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
                diasEnSistema = Math.max(0, diasEnSistema);
            }

            const calculatedStats: UserStats = {
                diasEnSistema,
                ultimaActividad: 'Hoy', // Placeholder - debería venir del backend
                fechaCreacion: fechaCreacionString,
            };

            setStats(calculatedStats);
            setLoading(false);
        };

        calculateStats();
    }, [usuario]);

    const formatDaysText = (days: number): string => {
        if (days <= 0) return 'Usuario nuevo';
        if (days === 1) return '1 día';
        if (days < 7) return `${days} días`;
        if (days < 30) {
            const weeks = Math.floor(days / 7);
            return weeks === 1 ? '1 semana' : `${weeks} semanas`;
        }
        if (days < 365) {
            const months = Math.floor(days / 30);
            return months === 1 ? '1 mes' : `${months} meses`;
        }
        const years = Math.floor(days / 365);
        const remainingMonths = Math.floor((days % 365) / 30);
        if (years === 1) {
            return remainingMonths > 0 ? `1 año, ${remainingMonths} meses` : '1 año';
        }
        return remainingMonths > 0 ? `${years} años, ${remainingMonths} meses` : `${years} años`;
    };

    if (loading) {
        return (
            <ProfileCard title="Estadísticas" className="border-l-4 border-l-blue-500">
                <div className="flex justify-center items-center h-24">
                    <LoadingSpinner />
                </div>
            </ProfileCard>
        );
    }

    if (!stats) {
        return (
            <ProfileCard title="Estadísticas" className="border-l-4 border-l-blue-500">
                <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">No se pudieron cargar las estadísticas</p>
                </div>
            </ProfileCard>
        );
    }

    return (
        <ProfileCard title="Estadísticas" className="border-l-4 border-l-blue-500">
            <div className="space-y-4">
                {/* Tiempo en el sistema */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Tiempo en el sistema
                            </p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {formatDaysText(stats.diasEnSistema)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Última actividad */}
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Última actividad
                            </p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {stats.ultimaActividad}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Estado del usuario */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <InfoIcon
                                type="status"
                                className={`w-8 h-8 ${
                                    usuario.estado === 'activo'
                                        ? 'text-green-500'
                                        : 'text-red-500'
                                }`}
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Estado de la cuenta
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                usuario.estado === 'activo'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                                {usuario.estado.charAt(0).toUpperCase() + usuario.estado.slice(1)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Información de cuenta */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Resumen de Cuenta
                    </h5>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">ID de Usuario:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                                #{usuario.usuario_id}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Roles activos:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {usuario.persona?.roles?.length || 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Usuario desde:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {usuario.fecha_creacion ? (
                                    (() => {
                                        const fecha = new Date(usuario.fecha_creacion);
                                        return !isNaN(fecha.getTime())
                                            ? fecha.toLocaleDateString('es-ES', {
                                                month: 'short',
                                                year: 'numeric'
                                            })
                                            : 'Fecha no disponible';
                                    })()
                                ) : 'Fecha no disponible'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Nota sobre estadísticas futuras */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                <strong>Próximamente:</strong> Estadísticas detalladas como ventas realizadas, productos creados, y más métricas de actividad.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ProfileCard>
    );
};

export default EstadisticasUsuario;