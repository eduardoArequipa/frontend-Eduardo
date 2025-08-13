// src/pages/Usuarios/UsuariosListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUsers, deactivateUser, activarUsuario } from '../../services/userService';
import UserAvatar from '../../components/Specific/UserAvatar';
import { IUsuarioReadAudit } from '../../types/usuario';
import { EstadoEnum } from '../../types/enums';
import { IRolInDB } from '../../types/rol';
import { IPersonaInDB } from '../../types/persona';
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select';
import { getRoles } from '../../services/rolService';
import { getPersonas } from '../../services/personaService';
import { UsuarioPagination } from '../../types/usuario';
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
    const [personaFilter, setPersonaFilter] = useState<number | ''>( '');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    const [availableRolesFilter, setAvailableRolesFilter] = useState<IRolInDB[]>([]);
    const [availablePersonasFilter, setAvailablePersonasFilter] = useState<IPersonaInDB[]>([]);
    const [loadingFilterData, setLoadingFilterData] = useState(true);

    const fetchUsuarios = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                 ...(search && { search }),
                 ...(estadoFilter && { estado: estadoFilter }),
                 ...(rolFilter !== '' && { rol_id: rolFilter }),
                 ...(personaFilter !== '' && { persona_id: personaFilter }),
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };
             const fetchedData: UsuarioPagination = await getUsers(params);
             setUsuarios(fetchedData.items);
             setTotalUsuarios(fetchedData.total);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Error al cargar los usuarios.");
            setUsuarios([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadFilterData = async () => {
            setLoadingFilterData(true);
            try {
                const rolesData = await getRoles({ estado: EstadoEnum.Activo });
                setAvailableRolesFilter(rolesData);
                const personasData = await getPersonas({ limit: 100 });
                setAvailablePersonasFilter(personasData.items);
            } catch (err) {
                setError("Error al cargar los datos para los filtros.");
            } finally {
                setLoadingFilterData(false);
            }
        };
        loadFilterData();
    }, []);

    useEffect(() => {
        if (!loadingFilterData) {
             fetchUsuarios();
        }
    }, [search, estadoFilter, rolFilter, personaFilter, currentPage, itemsPerPage, loadingFilterData]);

    const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
        setter(value);
        setCurrentPage(1);
    };

    const handleDelete = async (id: number, nombreUsuario: string) => {
        if (window.confirm(`¿Estás seguro de desactivar al usuario "${nombreUsuario}"?`)) {
            try {
                await deactivateUser(id);
                fetchUsuarios();
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
                fetchUsuarios();
                alert(`Usuario "${nombreUsuario}" activado con éxito!`);
            } catch (err: any) {
                 alert(`Error al activar el usuario: ${err.response?.data?.detail || err.message}`);
            }
        }
    };

    const totalPages = Math.ceil(totalUsuarios / itemsPerPage);

    const columns = useMemo(() => {
        return [
            { Header: 'ID', accessor: 'usuario_id' },
            {
                Header: 'Foto',
                accessor: 'foto_ruta',
                Cell: ({ row }: { row: { original: IUsuarioReadAudit } }) => (
                     <UserAvatar
                         src={row.original.foto_ruta ? `${BACKEND_BASE_URL}${row.original.foto_ruta}` : undefined}
                         alt={`Foto de ${row.original.nombre_usuario}`}
                         className="h-10 w-10 rounded-full object-cover"
                     />
                ),
            },
            { Header: 'Nombre de Usuario', accessor: 'nombre_usuario' },
            {
                 Header: 'Persona',
                 accessor: 'persona',
                 Cell: ({ row }: { row: { original: IUsuarioReadAudit } }) => (
                     row.original.persona ? `${row.original.persona.nombre} ${row.original.persona.apellido_paterno || ''}`.trim() : 'N/A'
                 ),
             },
             {
                 Header: 'Roles',
                 Cell: ({ row }: { row: { original: IUsuarioReadAudit } }) => (
                     row.original.persona?.roles?.map(rol => rol.nombre_rol).join(', ') || 'Sin roles'
                 ),
             },
            { Header: 'Estado', accessor: 'estado' },
            {
                Header: 'Acciones',
                Cell: ({ row }: { row: { original: IUsuarioReadAudit } }) => (
                    <div className="flex space-x-2">
                        <Button onClick={() => navigate(`/usuarios/edit/${row.original.usuario_id}`)} variant="primary" size="sm">Editar</Button>
                        {row.original.estado === EstadoEnum.Activo ? (
                             <Button onClick={() => handleDelete(row.original.usuario_id, row.original.nombre_usuario)} variant="danger" size="sm">Desactivar</Button>
                         ) : (
                             <Button onClick={() => handleActivate(row.original.usuario_id, row.original.nombre_usuario)} variant="success" size="sm">Activar</Button>
                         )}
                        <Button onClick={() => navigate(`/usuarios/roles/${row.original.usuario_id}`)} className="bg-purple-600 hover:bg-purple-700" size="sm">Roles</Button>
                    </div>
                ),
            },
        ];
    }, [navigate, handleDelete, handleActivate]);

    if ((loading || loadingFilterData) && usuarios.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                 <LoadingSpinner /> Cargando datos...
            </div>
        );
    }

    if (error && !loading) {
        return <div className="text-red-500 text-center mt-4">Error: {error}</div>;
    }

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
    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Gestión de Usuarios</h1>

            <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-grow min-w-[150px]">
                    <Input
                        id="search"
                        type="text"
                        placeholder="Buscar por usuario o persona"
                        value={search}
                        onChange={(e) => handleFilterValueChange(setSearch)(e.target.value)}
                    />
                </div>

                <div>
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

                {availableRolesFilter.length > 0 && !loadingFilterData && (
                    <div>
                        <Select
                            id="rolFilter"
                            value={rolFilter || ''}
                            onChange={(e) => handleFilterValueChange(setRolFilter)(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                            options={[
                                { value: '', label: 'Todos los roles' },
                                ...availableRolesFilter.map(rol => ({ value: rol.rol_id, label: rol.nombre_rol })),
                            ]}
                        />
                    </div>
                )}



                    <Button
                        onClick={handleShowCreateOptions}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
                        disabled={loading || loadingFilterData}
                    >
                        Crear Nuevo Usuario
                    </Button>

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

            {loading && usuarios.length > 0 && (
                 <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 z-10">
                     <LoadingSpinner />
                 </div>
            )}

            {usuarios.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No hay usuarios que coincidan con los filtros.</p>
            ) : (
                 usuarios.length > 0 && (
                     <div className="relative">
                        <Table columns={columns} data={usuarios} />
                        <div className="mt-4 flex justify-center items-center space-x-4">
                            <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} variant="secondary">
                                Anterior
                            </Button>
                            <span className="text-gray-700 dark:text-gray-300">
                                Página {currentPage} de {totalPages} (Total: {totalUsuarios} usuarios)
                            </span>
                            <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} variant="secondary">
                                Siguiente
                            </Button>
                        </div>
                     </div>
                 )
            )}
        </div>
    );
};

export default UsuariosListPage;