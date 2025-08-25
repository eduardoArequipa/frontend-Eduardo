// src/pages/Usuarios/UsuariosListPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, deactivateUser, activarUsuario, UsuarioPagination } from '../../services/userService';
import UserAvatar from '../../components/Specific/UserAvatar';
import { IUsuarioReadAudit } from '../../types/usuario';
import { EstadoEnum } from '../../types/enums';
import { IRolInDB } from '../../types/rol';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select';
import { getRoles } from '../../services/rolService';
import ActionsDropdown, { ActionConfig } from '../../components/Common/ActionsDropdown';
import ErrorMessage from '../../components/Common/ErrorMessage';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const UsuariosListPage: React.FC = () => {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState<IUsuarioReadAudit[]>([]);
    const [totalUsuarios, setTotalUsuarios] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateOptionsModal, setShowCreateOptionsModal] = useState(false);

    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>(EstadoEnum.Activo);
    const [rolFilter, setRolFilter] = useState<number | ''>( '');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8); // Adjusted for card view

    const [availableRolesFilter, setAvailableRolesFilter] = useState<IRolInDB[]>([]);

    const handleError = (err: any, contextMessage: string) => {
        const errorDetail = err.response?.data?.detail;
        let displayMessage = contextMessage;
        if (typeof errorDetail === 'string') {
            displayMessage = errorDetail;
        } else if (typeof errorDetail === 'object' && errorDetail !== null) {
            displayMessage = JSON.stringify(errorDetail);
        } else if (err.message) {
            displayMessage = err.message;
        }
        setError(displayMessage);
        console.error(contextMessage, err); // Log for debugging
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            try {
                const rolesPromise = getRoles({ estado: EstadoEnum.Activo });
                const usersPromise = getUsers({
                    search: search || undefined,
                    estado: estadoFilter || undefined,
                    rol_id: rolFilter !== '' ? rolFilter : undefined,
                    skip: (currentPage - 1) * itemsPerPage,
                    limit: itemsPerPage,
                });

                const [rolesData, usersData] = await Promise.all([rolesPromise, usersPromise]);
                
                setAvailableRolesFilter(rolesData);
                setUsuarios(usersData.items);
                setTotalUsuarios(usersData.total);

            } catch (err: any) {
                handleError(err, "Error al cargar la página de usuarios.");
                setUsuarios([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [search, estadoFilter, rolFilter, currentPage, itemsPerPage]);

    const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
        setter(value);
        setCurrentPage(1);
    };

    const refetchUsers = async () => {
        setLoading(true);
        try {
            const usersData = await getUsers({ search: search || undefined, estado: estadoFilter || undefined, rol_id: rolFilter !== '' ? rolFilter : undefined, skip: (currentPage - 1) * itemsPerPage, limit: itemsPerPage });
            setUsuarios(usersData.items);
            setTotalUsuarios(usersData.total);
        } catch (err) {
            handleError(err, "Error al recargar usuarios.");
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id: number, nombreUsuario: string) => {
        if (window.confirm(`¿Estás seguro de desactivar al usuario "${nombreUsuario}"?`)) {
            try {
                await deactivateUser(id);
                await refetchUsers();
                alert(`Usuario "${nombreUsuario}" desactivado con éxito!`);
            } catch (err: any) {
                 alert(`Error al desactivar el usuario: ${err.response?.data?.detail || err.message}`);
            }
        }
    };

    const handleActivate = async (id: number, nombreUsuario: string) => {
        if (window.confirm(`¿Estás seguro de activar al usuario "${nombreUsuario}"?`)) {
            try {
                await activarUsuario(id);
                await refetchUsers();
                alert(`Usuario "${nombreUsuario}" activado con éxito!`);
            } catch (err: any) {
                 alert(`Error al activar el usuario: ${err.response?.data?.detail || err.message}`);
            }
        }
    };

    const totalPages = Math.ceil(totalUsuarios / itemsPerPage);

    if (loading && usuarios.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                 <LoadingSpinner /> Cargando datos...
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    const handleShowCreateOptions = () => setShowCreateOptionsModal(true);
    const handleCloseCreateOptions = () => setShowCreateOptionsModal(false);
    const handleCreateWithExistingPerson = () => {
        handleCloseCreateOptions();
        navigate('/usuarios/new');
    };
    const handleCreateNewPersonAndUser = () => {
        handleCloseCreateOptions();
        navigate('/personas/new', { state: { createPersonaAndUser: true } });
    }; 

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-lg min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gestión de Usuarios</h1>
                <Button onClick={handleShowCreateOptions} variant="success" className="mt-4 md:mt-0">
                    Crear Nuevo Usuario
                </Button>
            </div>

            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input
                        id="search"
                        type="text"
                        placeholder="Buscar por usuario o persona..."
                        value={search}
                        onChange={(e) => handleFilterValueChange(setSearch)(e.target.value)}
                    />
                    <Select
                        id="estadoFilter"
                        value={estadoFilter}
                        onChange={(e) => handleFilterValueChange(setEstadoFilter)(e.target.value as EstadoEnum | '')}
                        options={[
                            { value: '', label: 'Todos los estados' },
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                        ]}
                    />
                    {availableRolesFilter.length > 0 && (
                        <Select
                            id="rolFilter"
                            value={rolFilter || ''}
                            onChange={(e) => handleFilterValueChange(setRolFilter)(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                            options={[
                                { value: '', label: 'Todos los roles' },
                                ...availableRolesFilter.map(rol => ({ value: rol.rol_id, label: rol.nombre_rol })),
                            ]}
                        />
                    )}
                </div>
            </div>

            {loading && <div className="flex justify-center items-center min-h-[calc(100vh-400px)]"><LoadingSpinner /></div>}

            {!loading && !error && usuarios.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-lg text-gray-500 dark:text-gray-400">No se encontraron usuarios que coincidan con los filtros.</p>
                </div>
            )}

            <div className="relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {usuarios.map(user => {
                        const userActions: ActionConfig[] = [
                            { label: 'Editar Usuario', onClick: () => navigate(`/usuarios/edit/${user.usuario_id}`), isVisible: true },
                            { label: 'Asignar Roles', onClick: () => navigate(`/usuarios/roles/${user.usuario_id}`), isVisible: true, colorClass: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50' },
                            { label: 'Desactivar', onClick: () => handleDelete(user.usuario_id, user.nombre_usuario), isVisible: user.estado === EstadoEnum.Activo, colorClass: 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50' },
                            { label: 'Activar', onClick: () => handleActivate(user.usuario_id, user.nombre_usuario), isVisible: user.estado !== EstadoEnum.Activo, colorClass: 'text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50' },
                        ];
                        const roles = user.persona?.roles?.map(rol => rol.nombre_rol).join(', ') || 'Sin roles';

                        return (
                            <div key={user.usuario_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out flex flex-col">
                                <div className="p-4 relative">
                                    <div className="absolute top-4 right-4">
                                        <ActionsDropdown actions={userActions} isLoading={loading} />
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <UserAvatar
                                            src={user.foto_ruta ? `${BACKEND_BASE_URL}${user.foto_ruta}` : undefined}
                                            alt={`Foto de ${user.nombre_usuario}`}
                                            className="h-16 w-16 rounded-full object-cover ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-indigo-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate" title={user.nombre_usuario}>{user.nombre_usuario}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={user.persona ? `${user.persona.nombre} ${user.persona.apellido_paterno}` : 'Sin persona asignada'}>
                                                {user.persona ? `${user.persona.nombre} ${user.persona.apellido_paterno || ''}`.trim() : 'Sin persona asignada'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 pb-4 flex-grow flex flex-col justify-between">
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">ROLES:</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={roles}>{roles}</p>
                                    </div>
                                    <div className="mt-4 text-right">
                                        <span className={`px-3 py-1 text-xs font-semibold leading-tight rounded-full ${user.estado === EstadoEnum.Activo ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
                                            {user.estado.charAt(0).toUpperCase() + user.estado.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {usuarios.length > 0 && totalPages > 1 && (
                    <div className="mt-8 flex justify-center items-center space-x-4">
                        <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} variant="secondary">Anterior</Button>
                        <span className="text-gray-700 dark:text-gray-300">
                            Página {currentPage} de {totalPages} (Total: {totalUsuarios} usuarios)
                        </span>
                        <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} variant="secondary">Siguiente</Button>
                    </div>
                )}
            </div>

            {showCreateOptionsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
                        <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-gray-100">¿Cómo quieres crear el Usuario?</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">Selecciona una opción:</p>
                        <div className="flex flex-col space-y-4">
                            <Button onClick={handleCreateWithExistingPerson} variant="primary">Con Persona Existente</Button>
                            <Button onClick={handleCreateNewPersonAndUser} variant="success">Crear Nueva Persona y Usuario</Button>
                        </div>
                        <div className="mt-6 text-center">
                            <Button onClick={handleCloseCreateOptions} variant="secondary">Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsuariosListPage;
