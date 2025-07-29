// src/pages/Usuarios/UsuariosListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUsers, deactivateUser, activarUsuario } from '../../services/userService';
import UserAvatar from '../../components/Specific/UserAvatar';

// Importa los tipos necesarios
import { IUsuarioReadAudit } from '../../types/usuario';
import { EstadoEnum } from '../../types/enums';
import { IRolInDB } from '../../types/rol';
import { IPersonaInDB, IPersonaNested } from '../../types/persona'; // <--- Asegúrate de importar IPersonaNested si la usas

// Importa componentes comunes
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select';

// Importa servicios para filtros
import { getRoles } from '../../services/rolService';
import { getPersonas } from '../../services/personaService';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const UsuariosListPage: React.FC = () => {
    const navigate = useNavigate();

    // Estados de la lista de usuarios
    const [usuarios, setUsuarios] = useState<IUsuarioReadAudit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para filtros y búsqueda
    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>('');
    const [rolFilter, setRolFilter] = useState<number | ''>('');
    const [personaFilter, setPersonaFilter] = useState<number | ''>('');

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    // Estados para los datos de los filtros (si usas selectores de roles/personas)
    const [availableRolesFilter, setAvailableRolesFilter] = useState<IRolInDB[]>([]);
    const [availablePersonasFilter, setAvailablePersonasFilter] = useState<IPersonaInDB[]>([]);
    const [loadingFilterData, setLoadingFilterData] = useState(true);

    // Estado para controlar la visibilidad del modal de opciones de creación
    const [showCreateOptionsModal, setShowCreateOptionsModal] = useState(false);

    // Función para obtener la lista de usuarios con los parámetros actuales
    const fetchUsuarios = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: {
                search?: string;
                estado?: EstadoEnum;
                rol_id?: number;
                persona_id?: number;
                skip?: number;
                limit?: number;
            } = {
                 ...(search && { search }),
                 ...(estadoFilter && { estado: estadoFilter }),
                 // NOTA: Si los roles son solo de persona, el filtro por rol_id en el USUARIO aquí puede ser incorrecto
                 // Tendrías que filtrar usuarios por los roles de SU PERSONA asociada en el backend.
                 // Este 'rol_id' en los parámetros de getUsers implica que getUsers filtra por roles de usuario,
                 // lo cual contradice "usuario y roles no están relacionados directamente".
                 // Revisa la implementación de tu backend de `getUsers` para asegurar que este filtro funciona como esperas.
                 ...(rolFilter !== '' && rolFilter !== null && { rol_id: rolFilter }),
                 ...(personaFilter !== '' && personaFilter !== null && { persona_id: personaFilter }),
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };
             const data = await getUsers(params);
             setUsuarios(data);
        } catch (err: any) {
            console.error("Error fetching usuarios:", err);
            setError(err.response?.data?.detail || "Error al cargar los usuarios.");
            setUsuarios([]);
        } finally {
            setLoading(false);
        }
    };

    // Efecto para cargar datos de filtros (roles y personas para selectores)
    useEffect(() => {
        const loadFilterData = async () => {
            setLoadingFilterData(true);
            try {
                const rolesData = await getRoles({ limit: 100 });
                setAvailableRolesFilter(rolesData);

                const personasData = await getPersonas({ limit: 100 });
                setAvailablePersonasFilter(personasData);

            } catch (err) {
                console.error("Error loading filter data:", err);
                setError("Error al cargar los datos para los filtros.");
            } finally {
                setLoadingFilterData(false);
            }
        };
        loadFilterData();
    }, []);

    // Efecto para cargar Usuarios cuando cambian Filtros, Búsqueda o Paginación
    useEffect(() => {
        if (!loadingFilterData) {
             fetchUsuarios();
        }
    }, [search, estadoFilter, rolFilter, personaFilter, currentPage, itemsPerPage, loadingFilterData]);

    // Handler genérico para cambios en filtros (resetea la página a 1)
    const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
        setter(value);
        setCurrentPage(1);
    };

    // Handler para eliminar (desactivar) un Usuario
    const handleDelete = async (id: number, nombreUsuario: string) => {
        if (window.confirm(`¿Estás seguro de desactivar al usuario "${nombreUsuario}"?`)) {
            try {
                await deactivateUser(id);
                setUsuarios(prev => prev.map(u => u.usuario_id === id ? { ...u, estado: EstadoEnum.Inactivo } : u));
                alert(`Usuario "${nombreUsuario}" desactivado con éxito!`);
            } catch (err: any) {
                 console.error(`Error deactivating usuario ${id}:`, err.response?.data || err);
                 alert(`Error al desactivar el usuario "${nombreUsuario}": ${err.response?.data?.detail || err.message}`);
            }
        }
    };

    // Handler para activar un Usuario
    const handleActivate = async (id: number, nombreUsuario: string) => {
        if (window.confirm(`¿Estás seguro de activar al usuario "${nombreUsuario}"?`)) {
            try {
                await activarUsuario(id);
                setUsuarios(prev => prev.map(u => u.usuario_id === id ? { ...u, estado: EstadoEnum.Activo } : u));
                alert(`Usuario "${nombreUsuario}" activado con éxito!`);
            } catch (err: any) {
                 console.error(`Error activating usuario ${id}:`, err.response?.data || err);
                 alert(`Error al activar el usuario "${nombreUsuario}": ${err.response?.data?.detail || err.message}`);
            }
        }
    };

    // Definición de las columnas de la tabla de Usuarios
    const columns = useMemo(() => {
         // Asegúrate de que IUsuarioReadAudit tiene 'persona: IPersonaNested | null | undefined'
         // Y que IPersonaNested (o el tipo de 'persona' que uses) tiene 'roles?: IRolInDB[]'
         type RowData = IUsuarioReadAudit;

         type TableCellProps = {
             row: {
                 original: RowData;
             };
         };

        return [
            { Header: 'ID', accessor: 'usuario_id' },
            {
                Header: 'Foto',
                accessor: 'foto_ruta',
                Cell: ({ row }: TableCellProps): React.ReactNode => {
                    const fotoRuta = row.original.foto_ruta;
                    const fullPhotoUrl = (fotoRuta && fotoRuta.startsWith('/'))
                        ? `${BACKEND_BASE_URL}${fotoRuta}`
                        : undefined;
                    return (
                         <UserAvatar
                             src={fullPhotoUrl || ''}
                             alt={`Foto de ${row.original.nombre_usuario || 'usuario'}`}
                             className="h-10 w-10 rounded-full object-cover"
                         />
                    );
                },
            },
            { Header: 'Nombre de Usuario', accessor: 'nombre_usuario' },
            {
                 Header: 'Persona',
                 accessor: 'persona',
                 Cell: ({ row }: TableCellProps): React.ReactNode => {
                     const persona = row.original.persona;
                     return persona ? `${persona.nombre || ''} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim() : 'N/A';
                 },
             },
             {
                 Header: 'Roles',
                 accessor: 'rolesDisplay', // Nombre ficticio del accesor
                 Cell: ({ row }: TableCellProps): React.ReactNode => {
                     // 🚨🚨🚨 ¡LA CORRECCIÓN ESTÁ AQUÍ! Accede a los roles a través de la persona.
                     // Esto asume que row.original.persona existe y que tiene una propiedad 'roles'.
                     const personaRoles = row.original.persona?.roles || [];
                     return personaRoles.length > 0 ? personaRoles.map(rol => rol.nombre_rol).join(', ') : 'Sin roles';
                 },
             },
            { Header: 'Estado', accessor: 'estado' },
            {
                Header: 'Acciones',
                accessor: 'acciones',
                Cell: ({ row }: TableCellProps): React.ReactNode => (
                    <div className="flex space-x-2">
                        <Link to={`/usuarios/edit/${row.original.usuario_id}`}>
                            <Button className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded">
                                Editar
                            </Button>
                        </Link>

                        {row.original.estado === EstadoEnum.Activo ? (
                             <Button
                                onClick={() => handleDelete(row.original.usuario_id, row.original.nombre_usuario)}
                                className="bg-red-500 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
                                disabled={loading}
                             >
                                Desactivar
                             </Button>
                         ) : (
                             <Button
                                onClick={() => handleActivate(row.original.usuario_id, row.original.nombre_usuario)}
                                className="bg-green-500 hover:bg-green-700 text-white text-xs py-1 px-2 rounded"
                                disabled={loading}
                             >
                                Activar
                             </Button>
                         )}

                        <Link to={`/usuarios/roles/${row.original.usuario_id}`}>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs py-1 px-2 rounded">
                                Roles
                            </Button>
                        </Link>
                    </div>
                ),
            },
        ];
    }, [handleDelete, handleActivate, loading]);

    // --- Handlers para el Modal de Opciones de Creación ---
    const handleShowCreateOptions = () => {
        setShowCreateOptionsModal(true);
    };

    const handleCloseCreateOptions = () => {
        setShowCreateOptionsModal(false);
    };

    const handleCreateWithExistingPerson = () => {
        handleCloseCreateOptions();
        navigate('/usuarios/new');
    };

    const handleCreateNewPersonAndUser = () => {
        handleCloseCreateOptions();
        navigate('/personas/new', { state: { createPersonaAndUser: true } });
    };

    // --- Renderizado Condicional ---
    if ((loading || loadingFilterData) && usuarios.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner /> Cargando datos...
            </div>
        );
    }

    if (error && !loading) {
        return <div className="text-red-500 text-center mt-4">Error: {error}</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>

            {/* Sección de Búsqueda y Filtros */}
            <div className="mb-4 bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-grow min-w-[150px]">
                    <label htmlFor="search" className="sr-only">Buscar Usuario/Persona</label>
                    <Input
                        id="search"
                        type="text"
                        placeholder="Buscar por usuario o persona"
                        value={search}
                        onChange={(e) => handleFilterValueChange(setSearch)(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label htmlFor="estadoFilter" className="sr-only">Filtrar por Estado</label>
                    <Select
                        id="estadoFilter"
                        value={estadoFilter}
                        onChange={(e) => handleFilterValueChange(setEstadoFilter)(e.target.value as EstadoEnum | '')}
                        options={[
                            { value: '', label: 'Todos los estados' },
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                            { value: EstadoEnum.Bloqueado, label: 'Bloqueado' },
                        ]}
                    />
                </div>

                {/* NOTA: Este filtro de rol_id en el frontend asume que tu backend puede filtrar usuarios por los roles de SU PERSONA.
                   Si tu endpoint `getUsers` no hace esto a través del `persona_id` y sus roles, el filtro no funcionará correctamente. */}
                {availableRolesFilter.length > 0 && !loadingFilterData && (
                    <div>
                        <label htmlFor="rolFilter" className="sr-only">Filtrar por Rol</label>
                        <Select
                            id="rolFilter"
                            value={rolFilter || ''}
                            onChange={(e) => handleFilterValueChange(setRolFilter)(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                            options={[
                                { value: '', label: 'Todos los roles' },
                                ...availableRolesFilter.map(rol => ({
                                    value: rol.rol_id,
                                    label: rol.nombre_rol,
                                })),
                            ]}
                        />
                    </div>
                )}

                {availablePersonasFilter.length > 0 && !loadingFilterData && (
                     <div>
                        <label htmlFor="personaFilter" className="sr-only">Filtrar por Persona</label>
                        <Select
                            id="personaFilter"
                            value={personaFilter || ''}
                            onChange={(e) => handleFilterValueChange(setPersonaFilter)(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                            options={[
                                { value: '', label: 'Todas las Personas' },
                                ...availablePersonasFilter.map(p => ({
                                    value: p.persona_id,
                                    label: `${p.nombre} ${p.apellido_paterno || ''}`.trim(),
                                })),
                            ]}
                        />
                     </div>
                )}


                <div className="flex-grow md:flex-none flex justify-end">
                    <Button
                        onClick={handleShowCreateOptions}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
                        disabled={loading || loadingFilterData}
                    >
                        Crear Nuevo Usuario
                    </Button>
                </div>
            </div>

            {loading && usuarios.length > 0 && (
                 <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-10">
                     <LoadingSpinner />
                 </div>
            )}

            {usuarios.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500">No hay usuarios registrados que coincidan con los filtros.</p>
            ) : (
                 usuarios.length > 0 && (
                     <div className="relative">
                        <Table columns={columns} data={usuarios} />
                     </div>
                 )
            )}

            <div className="mt-4 flex justify-center items-center space-x-4">
                <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">Anterior</Button>
                <span className="text-gray-700">Página {currentPage}</span>
                <Button onClick={() => setCurrentPage(prev => prev + 1)} disabled={loading} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</Button>
            </div>

            {/* *** MODAL DE OPCIONES DE CREACIÓN *** */}
            {showCreateOptionsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl">
                        <h2 className="text-xl font-semibold mb-4 text-center">¿Cómo quieres crear el Usuario?</h2>
                        <p className="text-gray-700 mb-6 text-center">Selecciona una opción:</p>

                        <div className="flex justify-center space-x-4">
                            <Button
                                onClick={handleCreateWithExistingPerson}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded shadow"
                            >
                                Con Persona Existente
                            </Button>

                            <Button
                                onClick={handleCreateNewPersonAndUser}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded shadow"
                            >
                                Crear Nueva Persona y Usuario
                            </Button>
                        </div>

                        <div className="mt-6 text-center">
                            <Button
                                onClick={handleCloseCreateOptions}
                                className="text-gray-600 hover:text-gray-800 text-sm"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsuariosListPage;