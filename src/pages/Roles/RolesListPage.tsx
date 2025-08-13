// src/pages/Roles/RolesListPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoles } from '../../services/rolService';
import { IRolInDB } from '../../types/rol';
import { EstadoEnum } from '../../types/enums';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import { FaShieldAlt, FaUserTie, FaUser, FaTruck, FaEdit } from 'react-icons/fa';

const RolesListPage: React.FC = () => {
    const [roles, setRoles] = useState<IRolInDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const iconMap: { [key: string]: React.ElementType } = {
        'administrador': FaShieldAlt,
        'empleado': FaUserTie,
        'cliente': FaUser,
        'proveedor': FaTruck,
    };

    useEffect(() => {
        const fetchRoles = async () => {
            setLoading(true);
            try {
                const data = await getRoles({ estado: EstadoEnum.Activo });
                setRoles(data);
            } catch (err: any) {
                setError(err.response?.data?.detail || "Error al cargar los roles.");
            } finally {
                setLoading(false);
            }
        };

        fetchRoles();
    }, []);

    const handleManagePermissions = (rolId: number) => {
        navigate(`/roles/permissions/${rolId}`);
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner /> Cargando roles...</div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Roles y Permisos del Sistema</h1>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                        Estos son los roles fundamentales. Haz clic en un rol para gestionar sus permisos de acceso.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {roles.map((rol) => {
                        const Icon = iconMap[rol.nombre_rol.toLowerCase()] || FaUser;
                        return (
                            <div
                                key={rol.rol_id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col text-center border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex-grow">
                                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-4">
                                        <Icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                        {rol.nombre_rol}
                                    </h2>
                                    <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
                                        {rol.descripcion}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <h3 className="font-semibold text-gray-700 dark:text-gray-300">Permisos Activos: {rol.menus?.length || 0}</h3>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <button
                                        onClick={() => handleManagePermissions(rol.rol_id)}
                                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                    >
                                        <FaEdit className="mr-2" />
                                        Gestionar Permisos
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RolesListPage;
