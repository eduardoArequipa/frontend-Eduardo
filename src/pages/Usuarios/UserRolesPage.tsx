
// src/pages/Usuarios/UserRolesPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, assignRoleToUser, removeRoleFromUser } from '../../services/userService';
import { getRoles } from '../../services/rolService';
import { useAuth } from '../../hooks/useAuth'; // Importar useAuth

// Tipos
import { IUsuarioInDB } from '../../types/usuario';
import { IRolInDB } from '../../types/rol';

// Componentes
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import UserAvatar from '../../components/Specific/UserAvatar';
import ErrorMessage from '../../components/Common/ErrorMessage';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const UserRolesPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const usuarioId = id ? parseInt(id, 10) : NaN;

    const [usuario, setUsuario] = useState<IUsuarioInDB | null>(null);
    const [allRoles, setAllRoles] = useState<IRolInDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const [isUpdatingRoles, setIsUpdatingRoles] = useState(false);
    const [updateRolesError, setUpdateRolesError] = useState<string | null>(null);

    const { user: currentUser } = useAuth(); // Obtener el usuario actual

    useEffect(() => {
        if (isNaN(usuarioId)) {
            setError("ID de usuario inválido.");
            setLoading(false);
            return;
        }

        const fetchUserDataAndRoles = async () => {
            setLoading(true);
            try {
                const [userData, rolesData] = await Promise.all([
                    getUserById(usuarioId),
                    getRoles()
                ]);
                setUsuario(userData);
                setAllRoles(rolesData);
            } catch (err: any) {
                setError(err.response?.data?.detail || "No se pudo cargar la información.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserDataAndRoles();
    }, [usuarioId]);

    const handleAssignRole = async (rolId: number) => {
        if (!usuario || isUpdatingRoles) return;
        setIsUpdatingRoles(true);
        setUpdateRolesError(null);
        try {
            const updatedUser = await assignRoleToUser(usuario.usuario_id, rolId);
            setUsuario(updatedUser);
            alert(`Rol asignado con éxito!`);
        } catch (err: any) {
            setUpdateRolesError(err.response?.data?.detail || "Error al asignar el rol.");
        } finally {
            setIsUpdatingRoles(false);
        }
    };

    const handleRemoveRole = async (rolId: number) => {
        if (!usuario || isUpdatingRoles) return;
        
        // Prevenir que un usuario se remueva sus propios roles
        if (currentUser && usuario.usuario_id === currentUser.usuario_id) {
            setUpdateRolesError("No puedes remover tus propios roles para prevenir el auto-bloqueo.");
            return;
        }

        setIsUpdatingRoles(true);
        setUpdateRolesError(null);
        try {
            const updatedUser = await removeRoleFromUser(usuario.usuario_id, rolId);
            setUsuario(updatedUser);
            alert(`Rol removido con éxito!`);
        } catch (err: any) {
            setUpdateRolesError(err.response?.data?.detail || "Error al remover el rol.");
        } finally {
            setIsUpdatingRoles(false);
        }
    };

    const { userRoles, availableRolesForAssignment } = useMemo(() => {
        if (!usuario || !allRoles) {
            return { userRoles: [], availableRolesForAssignment: [] };
        }
        
        // Manejar el caso donde el usuario no tiene persona asignada
        const currentRoles = usuario.persona?.roles || [];
        const userRoleIds = new Set(currentRoles.map(rol => rol.rol_id));
        
        const userRolesList = allRoles.filter(rol => userRoleIds.has(rol.rol_id));
        const availableForAssignmentList = allRoles.filter(rol => !userRoleIds.has(rol.rol_id));
        
        return { userRoles: userRolesList, availableRolesForAssignment: availableForAssignmentList };
    }, [usuario, allRoles]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                <LoadingSpinner /> Cargando información...
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!usuario) {
        return <ErrorMessage message="Usuario no encontrado." />;
    }

    const photoUrl = usuario.foto_ruta ? `${BACKEND_BASE_URL}${usuario.foto_ruta}` : undefined;

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Gestión de Roles para Usuario</h1>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
                <div className="flex items-center mb-4">
                    <UserAvatar src={photoUrl} alt={`Avatar de ${usuario.nombre_usuario}`} className="h-16 w-16 mr-4 rounded-full object-cover" />
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{usuario.nombre_usuario}</h2>
                        {usuario.persona ? (
                            <p className="text-gray-600 dark:text-gray-400">
                                Persona: {`${usuario.persona.nombre} ${usuario.persona.apellido_paterno || ''}`.trim()}
                            </p>
                        ) : (
                            <p className="text-orange-600 dark:text-orange-400 font-medium">
                                ⚠️ Sin persona asignada
                            </p>
                        )}
                        <p className="text-gray-600 dark:text-gray-400">Estado: {usuario.estado}</p>
                    </div>
                </div>

                {updateRolesError && <ErrorMessage message={updateRolesError} />}
                {isUpdatingRoles && (
                    <div className="flex justify-center items-center text-blue-600 dark:text-blue-400 mb-4">
                        <LoadingSpinner /> Actualizando roles...
                    </div>
                )}

                {!usuario.persona && (
                    <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <p className="text-orange-700 dark:text-orange-300">
                            <strong>Nota:</strong> Este usuario no tiene una persona asignada. Para asignar roles, primero debe asociarse con una persona desde la edición del usuario.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-1 text-gray-800 dark:text-gray-200">Roles Asignados</h3>
                        {userRoles.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">
                                {!usuario.persona ? 'Sin persona asignada - no hay roles.' : 'No tiene roles asignados.'}
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {userRoles.map(rol => (
                                    <li key={rol.rol_id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                        <span className="text-gray-800 dark:text-gray-200">{rol.nombre_rol}</span>
                                        <Button 
                                            onClick={() => handleRemoveRole(rol.rol_id)} 
                                            variant="danger" 
                                            size="sm" 
                                            disabled={isUpdatingRoles || !usuario.persona || (currentUser ? usuario.usuario_id === currentUser.usuario_id : false)}
                                        >Remover</Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-1 text-gray-800 dark:text-gray-200">Roles Disponibles</h3>
                        {availableRolesForAssignment.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">No hay roles disponibles.</p>
                        ) : (
                            <ul className="space-y-2">
                                {availableRolesForAssignment.map(rol => (
                                    <li key={rol.rol_id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                        <span className="text-gray-800 dark:text-gray-200">{rol.nombre_rol}</span>
                                        <Button onClick={() => handleAssignRole(rol.rol_id)} variant="success" size="sm" disabled={isUpdatingRoles || !usuario.persona}>Asignar</Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={() => navigate('/usuarios')} variant="secondary">Volver a Lista</Button>
            </div>
        </div>
    );
};

export default UserRolesPage;
