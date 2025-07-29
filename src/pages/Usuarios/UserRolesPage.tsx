// src/pages/Usuarios/UserRolesPage.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserById, assignRoleToUser, removeRoleFromUser } from '../../services/userService';
import { getRoles } from '../../services/rolService';

// Importa los tipos necesarios con el prefijo 'I'
import { IUsuarioInDB } from '../../types/usuario';
import { IRolInDB } from '../../types/rol';
import { EstadoEnum } from '../../types/enums';

import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import UserAvatar from '../../components/Specific/UserAvatar';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const UserRolesPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    // Parseamos el ID del usuario. Si no es un número válido, lo manejamos.
    const usuarioId = parseInt(id as string, 10);

    const [usuario, setUsuario] = useState<IUsuarioInDB | null>(null);
    const [allRoles, setAllRoles] = useState<IRolInDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isUpdatingRoles, setIsUpdatingRoles] = useState(false);
    const [updateRolesError, setUpdateRolesError] = useState<string | null>(null);

    // Efecto para cargar datos del usuario y todos los roles
    useEffect(() => {
        setLoading(true);
        setError(null);
        setUpdateRolesError(null);

        const fetchUserDataAndRoles = async () => {
            if (isNaN(usuarioId)) {
                setError("ID de usuario inválido.");
                setLoading(false);
                return;
            }

            try {
                // Cargar datos del usuario
                const userData = await getUserById(usuarioId);
                setUsuario(userData);

                // Cargar todos los roles disponibles
                const rolesData = await getRoles();
                setAllRoles(rolesData);

                setLoading(false);
            } catch (err: any) {
                console.error("Error fetching user or roles:", err);
                if (err.response && err.response.status === 404) {
                    setUsuario(null); // Asegura que el estado es null si el usuario no existe
                    setError("Usuario no encontrado."); // Mensaje más específico
                } else {
                    setError(err.response?.data?.detail || "No se pudo cargar la información del usuario o los roles.");
                }
                setLoading(false);
            }
        };

        fetchUserDataAndRoles();
    }, [usuarioId]); // Dependencia: usuarioId

    // Función para asignar un rol a un usuario
    const handleAssignRole = async (rolId: number) => {
        // Asegura que usuario y usuario.persona no sean null/undefined antes de continuar
        if (!usuario || !usuario.persona || isUpdatingRoles) return;

        setIsUpdatingRoles(true);
        setUpdateRolesError(null);
        try {
            // Llama al servicio para asignar el rol
            const updatedUser = await assignRoleToUser(usuario.usuario_id, rolId);
            setUsuario(updatedUser); // Actualiza el estado del usuario con los roles nuevos
            setIsUpdatingRoles(false);
            alert(`Rol asignado con éxito a ${usuario.nombre_usuario}!`); // Feedback al usuario
        } catch (err: any) {
            console.error(`Error assigning role ${rolId} to user ${usuario.usuario_id}:`, err.response?.data || err);
            setUpdateRolesError(err.response?.data?.detail || "Error al asignar el rol.");
            setIsUpdatingRoles(false);
        }
    };

    // Función para remover un rol de un usuario
    const handleRemoveRole = async (rolId: number) => {
        // Asegura que usuario y usuario.persona no sean null/undefined antes de continuar
        if (!usuario || !usuario.persona || isUpdatingRoles) return;

        setIsUpdatingRoles(true);
        setUpdateRolesError(null);
        try {
            // Llama al servicio para remover el rol (CORRECCIÓN: Nombre de la función)
            const updatedUser = await removeRoleFromUser(usuario.usuario_id, rolId);
            setUsuario(updatedUser); // Actualiza el estado del usuario con los roles nuevos
            setIsUpdatingRoles(false);
            alert(`Rol removido con éxito de ${usuario.nombre_usuario}!`); // Feedback al usuario
        } catch (err: any) {
            console.error(`Error removing role ${rolId} from user ${usuario.usuario_id}:`, err.response?.data || err);
            setUpdateRolesError(err.response?.data?.detail || "Error al remover el rol.");
            setIsUpdatingRoles(false);
        }
    };

    // Lógica para determinar qué roles tiene la persona del usuario y cuáles no
    const { userRoles, availableRolesForAssignment } = useMemo(() => {
        // Asegúrate de que usuario, allRoles Y usuario.persona existan
        if (!usuario || !allRoles || !usuario.persona) {
            return { userRoles: [], availableRolesForAssignment: [] };
        }

        // Asegura que usuario.persona.roles sea un array (o un array vacío si es null/undefined)
        const currentUserRoles = usuario.persona.roles || [];
        const userRoleIds = new Set(currentUserRoles.map(rol => rol.rol_id));

        const userRolesList = allRoles.filter(rol => userRoleIds.has(rol.rol_id));
        const availableForAssignmentList = allRoles.filter(rol => !userRoleIds.has(rol.rol_id));

        return { userRoles: userRolesList, availableRolesForAssignment: availableForAssignmentList };
    }, [usuario, allRoles]);

    // --- Renderizado Condicional ---
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <LoadingSpinner /> Cargando información de usuario y roles...
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center mt-4">Error: {error}</div>;
    }

    // Si usuario es null en este punto, significa que el ID era válido pero el usuario no fue encontrado
    if (!usuario) {
        return <div className="text-red-500 text-center mt-4">Usuario no encontrado. Por favor, verifica el ID.</div>;
    }

    // Calcular la URL de la foto solo si el usuario no es null
    const photoUrl = (usuario.foto_ruta && usuario.foto_ruta.startsWith('/'))
        ? `${BACKEND_BASE_URL}${usuario.foto_ruta}`
        : '/assets/default-avatar.png'; // Ruta de imagen por defecto (asegúrate de que exista)

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Gestión de Roles para Usuario</h1>

            {/* Información básica del usuario */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex items-center mb-4">
                    <UserAvatar
                        src={photoUrl}
                        alt={`Avatar de ${usuario.nombre_usuario}`}
                        className="h-16 w-16 mr-4 rounded-full object-cover"
                    />

                    <div>
                        <h2 className="text-xl font-semibold">{usuario.nombre_usuario}</h2>
                        {usuario.persona && ( // Usa optional chaining para `usuario.persona` en el renderizado
                            <p className="text-gray-600">
                                Persona: {`${usuario.persona.nombre} ${usuario.persona.apellido_paterno || ''} ${usuario.persona.apellido_materno || ''}`.trim()}
                            </p>
                        )}
                        <p className="text-gray-600">Estado: {usuario.estado}</p>
                    </div>
                </div>

                {/* Mensaje de error para asignación/remoción */}
                {updateRolesError && (
                    <div className="text-red-500 text-center mb-4">{updateRolesError}</div>
                )}

                {/* Spinner de actualización */}
                {isUpdatingRoles && (
                    <div className="flex justify-center items-center text-blue-600 mb-4">
                        <LoadingSpinner /> Actualizando roles...
                    </div>
                )}

                {/* Sección de Roles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Columna: Roles del Usuario */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-1">Roles Asignados (de la Persona)</h3>
                        {/* Usa optional chaining y asegura que sea un array antes de map */}
                        {(usuario.persona?.roles?.length === 0 || !usuario.persona?.roles) ? (
                            <p className="text-gray-500">La persona de este usuario no tiene roles asignados.</p>
                        ) : (
                            <ul className="space-y-2">
                                {usuario.persona.roles.map((rol: IRolInDB, index: number) => {
                                    // DEBUGGING: Comprueba si rol.rol_id es válido
                                    if (rol.rol_id === undefined || rol.rol_id === null) {
                                        console.warn("Advertencia: rol.rol_id es undefined o null para un rol asignado:", rol);
                                    }
                                    // Usa una combinación de rol_id y index para garantizar unicidad
                                    const uniqueKey = rol.rol_id !== undefined && rol.rol_id !== null ? `assigned-${rol.rol_id}` : `assigned-index-${index}`;
                                    
                                    return (
                                        <li key={uniqueKey} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                            <span>{rol.nombre_rol}</span>
                                            <Button
                                                onClick={() => handleRemoveRole(rol.rol_id)}
                                                className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={isUpdatingRoles || rol.rol_id === undefined || rol.rol_id === null}
                                            >
                                                Remover
                                            </Button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Columna: Roles Disponibles para Asignar */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-1">Roles Disponibles para Asignar</h3>
                        {availableRolesForAssignment.length === 0 ? (
                            <p className="text-gray-500">No hay roles disponibles para asignar a la persona de este usuario.</p>
                        ) : (
                            <ul className="space-y-2">
                                {availableRolesForAssignment.map((rol: IRolInDB, index: number) => {
                                    // DEBUGGING: Comprueba si rol.rol_id es válido
                                    if (rol.rol_id === undefined || rol.rol_id === null) {
                                        console.warn("Advertencia: rol.rol_id es undefined o null para un rol disponible:", rol);
                                    }
                                    // Usa una combinación de rol_id y index para garantizar unicidad
                                    const uniqueKey = rol.rol_id !== undefined && rol.rol_id !== null ? `available-${rol.rol_id}` : `available-index-${index}`;
                                    
                                    return (
                                        <li key={uniqueKey} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                            <span>{rol.nombre_rol}</span>
                                            <Button
                                                onClick={() => handleAssignRole(rol.rol_id)}
                                                className="bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={isUpdatingRoles || rol.rol_id === undefined || rol.rol_id === null}
                                            >
                                                Asignar
                                            </Button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Botón para regresar */}
            <div className="flex justify-end">
                <Link to="/usuarios">
                    <Button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded shadow">
                        Volver a Lista de Usuarios
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default UserRolesPage;