// src/pages/Usuarios/UsuariosListPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, deactivateUser, activarUsuario } from '../../services/userService';
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
import { ProfileCard } from '../../components/Common/Card';
import InfoIcon from '../../components/Common/InfoIcon';
import Modal from '../../components/Common/Modal';
import { useNotification } from '../../context/NotificationContext';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const UsuariosListPage: React.FC = () => {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState<IUsuarioReadAudit[]>([]);
    const [totalUsuarios, setTotalUsuarios] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateOptionsModal, setShowCreateOptionsModal] = useState(false);
    const { addNotification } = useNotification();

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        action: (() => Promise<void>) | null;
        title: string;
        message: React.ReactNode;
        confirmText: string;
        confirmVariant: 'danger' | 'success';
    }>({
        isOpen: false,
        action: null,
        title: '',
        message: null,
        confirmText: '',
        confirmVariant: 'danger',
    });

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
        console.error(contextMessage, err); 
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

    const handleCloseModal = () => {
        setModalState({ isOpen: false, action: null, title: '', message: null, confirmText: '', confirmVariant: 'danger' });
    };

    const handleConfirmAction = async () => {
        if (modalState.action) {
            try {
                await modalState.action();
                addNotification('Acción completada con éxito', 'success');
            } catch (err: any) {
                const errorMessage = err.response?.data?.detail || 'Ocurrió un error al realizar la acción.';
                addNotification(errorMessage, 'error');
            } finally {
                handleCloseModal();
                refetchUsers();
            }
        }
    };

    const handleDelete = (id: number, nombreUsuario: string) => {
        setModalState({
            isOpen: true,
            title: 'Confirmar Desactivación',
            message: (
                <p>¿Estás seguro de desactivar al usuario <strong>{nombreUsuario}</strong>?</p>
            ),
            confirmText: 'Sí, Desactivar',
            confirmVariant: 'danger',
            action: () => deactivateUser(id),
        });
    };

    const handleActivate = (id: number, nombreUsuario: string) => {
        setModalState({
            isOpen: true,
            title: 'Confirmar Activación',
            message: (
                <p>¿Estás seguro de activar al usuario <strong>{nombreUsuario}</strong>?</p>
            ),
            confirmText: 'Sí, Activar',
            confirmVariant: 'success',
            action: () => activarUsuario(id),
        });
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
                    Registrar Nuevo Usuario
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

                        // Generar badges dinámicos
                        const badges: Array<{
                            text: string;
                            variant?: 'success' | 'danger' | 'warning' | 'info' | 'secondary';
                        }> = [
                            {
                                text: user.estado.charAt(0).toUpperCase() + user.estado.slice(1),
                                variant: user.estado === EstadoEnum.Activo ? 'success' : 'danger'
                            }
                        ];

                        // Agregar badge de número de roles
                        const rolesCount = user.persona?.roles?.length || 0;
                        if (rolesCount > 0) {
                            badges.push({
                                text: `${rolesCount} rol${rolesCount > 1 ? 'es' : ''}`,
                                variant: 'secondary'
                            });
                        }

                        // Agregar badge si es usuario sin persona
                        if (!user.persona) {
                            badges.push({
                                text: 'Sin persona',
                                variant: 'warning'
                            });
                        }

                        const nombrePersona = user.persona 
                            ? `${user.persona.nombre} ${user.persona.apellido_paterno || ''}`.trim()
                            : 'Sin persona asignada';

                        const avatarName = user.persona 
                            ? nombrePersona
                            : user.nombre_usuario;

                        return (
                            <ProfileCard
                                key={user.usuario_id}
                                avatar={{
                                    src: user.foto_ruta ? `${BACKEND_BASE_URL}${user.foto_ruta}` : undefined,
                                    alt: avatarName,
                                    size: 'md',
                                    showFallback: true
                                }}
                                title={user.nombre_usuario}
                                subtitle={nombrePersona}
                                badges={badges}
                                actions={<ActionsDropdown actions={userActions} isLoading={loading} />}
                                className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500/30 hover:border-l-blue-500"
                            >
                                <div className="space-y-3">
                                    {user.persona && (
                                        <>
                                            <div className="flex items-center space-x-2">
                                                <InfoIcon type="email" className="w-4 h-4 text-indigo-500" />
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">EMAIL PERSONAL</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={user.persona.email || 'No especificado'}>
                                                        {user.persona.email || (
                                                            <span className="text-gray-400 italic">No especificado</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                                <InfoIcon type="phone" className="w-4 h-4 text-green-500" />
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">TELÉFONO</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {user.persona.telefono || (
                                                            <span className="text-gray-400 italic">No especificado</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <InfoIcon type="id" className="w-4 h-4 text-orange-500" />
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">CI</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {user.persona.ci}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    
                                    <div className="flex items-start space-x-2">
                                        <InfoIcon type="role" className="w-4 h-4 text-purple-500 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">ROLES ASIGNADOS</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {user.persona?.roles?.length ? (
                                                    user.persona.roles.map((rol, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium"
                                                        >
                                                            {rol.nombre_rol}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 italic text-sm">Sin roles asignados</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información adicional del usuario */}
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>ID Usuario: {user.usuario_id}</span>
                                            <span className="font-medium">{user.nombre_usuario}</span>
                                        </div>
                                    </div>
                                </div>
                            </ProfileCard>
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
                            <Button onClick={handleCreateNewPersonAndUser} variant="success">Crear Nueva Persona con Usuario</Button>
                        </div>
                        <div className="mt-6 text-center">
                            <Button onClick={handleCloseCreateOptions} variant="secondary">Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmAction}
                title={modalState.title}
                confirmButtonText={modalState.confirmText}
                confirmButtonVariant={modalState.confirmVariant}
                showConfirmButton={true}
                isConfirmButtonDisabled={loading}
            >
                <div>{modalState.message}</div>
            </Modal>
        </div>
    );
};

export default UsuariosListPage;
