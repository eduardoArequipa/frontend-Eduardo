// src/pages/Roles/RolesListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { getRoles } from '../../services/rolService';
import { IRolInDB } from '../../types/rol';
import { EstadoEnum } from '../../types/enums';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';
import { FaShieldAlt, FaUserTie, FaUser, FaTruck } from 'react-icons/fa';

const RolesListPage: React.FC = () => {
    const { theme } = useTheme();
    const [roles, setRoles] = useState<IRolInDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Mapeo de iconos para cada rol
    const iconMap: { [key: string]: React.ElementType } = {
        'administrador': FaShieldAlt,
        'empleado': FaUserTie,
        'cliente': FaUser,
        'proveedor': FaTruck,
    };

    useEffect(() => {
        const fetchRoles = async () => {
            setLoading(true);
            setError(null);
            try {
                // Filtramos solo los roles activos, que son los que nos interesan mostrar
                const data = await getRoles({ estado: EstadoEnum.Activo, limit: 10 });
                setRoles(data);
            } catch (err: any) {
                setError(err.response?.data?.detail || "Error al cargar los roles.");
                setRoles([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRoles();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner /> <span className={`ml-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Cargando roles...</span>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center mt-4">Error: {error}</div>;
    }

    return (
        <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6 rounded-lg min-h-screen`}>
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Roles del Sistema</h1>
                    <p className={`mt-4 text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Estos son los roles fundamentales que definen los permisos y accesos dentro de la aplicación.
                    </p>
                </div>

                {roles.length === 0 && !loading ? (
                    <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        No se encontraron roles activos en el sistema.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {roles.map((rol) => {
                            const Icon = iconMap[rol.nombre_rol.toLowerCase()] || FaUser; // Icono por defecto
                            return (
                                <div
                                    key={rol.rol_id}
                                    className={`rounded-xl shadow-lg p-6 flex flex-col items-center text-center transition-transform transform hover:scale-105 ${
                                        theme === 'dark'
                                            ? 'bg-gray-800 border border-gray-700'
                                            : 'bg-white border'
                                    }`}
                                >
                                    <div className="mb-4">
                                        <Icon className={`text-5xl ${
                                            rol.nombre_rol.toLowerCase() === 'administrador' ? 'text-indigo-500' :
                                            rol.nombre_rol.toLowerCase() === 'empleado' ? 'text-blue-500' :
                                            rol.nombre_rol.toLowerCase() === 'cliente' ? 'text-green-500' :
                                            rol.nombre_rol.toLowerCase() === 'proveedor' ? 'text-yellow-500' :
                                            'text-gray-500'
                                        }`} />
                                    </div>
                                    <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {rol.nombre_rol}
                                    </h2>
                                    <p className={`mt-2 text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {rol.descripcion}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RolesListPage;