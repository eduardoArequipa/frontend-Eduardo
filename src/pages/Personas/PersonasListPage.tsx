// src/pages/Personas/PersonasListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { getPersonas, deactivatePersona, activatePersona } from '../../services/personaService';
import { getRoles } from '../../services/rolService'; // Asegúrate de que este es el nombre correcto del servicio de roles
import {  IPersonaInDB } from '../../types/persona'; // Usar la interfaz con 'I'
import { IRolInDB } from '../../types/rol'; // Usar la interfaz con 'I' (asumiendo que RolNested es ahora IRolInDB)
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Select from '../../components/Common/Select';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { EstadoEnum, GeneroEnum } from '../../types/enums';

const PersonasListPage: React.FC = () => {
    const navigate = useNavigate();
    const [personas, setPersonas] = useState<IPersonaInDB[]>([]); // Cambiado a IPersonaInDB[]
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>(EstadoEnum.Activo);
    const [generoFilter, setGeneroFilter] = useState<GeneroEnum | ''>('');
    const [rolFilterName, setRolFilterName] = useState<string>('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    // *** ESTADO PARA LA LISTA DE ROLES (para el filtro por rol) ***
    const [availableRoles, setAvailableRoles] = useState<IRolInDB[]>([]); // Cambiado a IRolInDB[]
    const [loadingRoles, setLoadingRoles] = useState(true);

    // Función para obtener la lista de roles disponibles para el filtro
    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const roles = await getRoles(); // getRoles del roleService
            setAvailableRoles(roles);
        } catch (err) {
            console.error("Error fetching roles for filter:", err);
            setError("Error al cargar los roles para el filtro."); // Añadir manejo de error para roles
        } finally {
            setLoadingRoles(false);
        }
    };

    const fetchPersonas = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {
                 search: search || undefined,
                 estado: estadoFilter || undefined,
                 genero: generoFilter || undefined,
                 rol_nombre: rolFilterName || undefined, // <-- CORRECCIÓN AQUÍ
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };

            // Limpiar parámetros undefined
            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const data = await getPersonas(params);
            setPersonas(data);

        } catch (err: any) {
            console.error("Error fetching personas:", err);
            setError(err.response?.data?.detail || "Error al cargar las personas.");
            setPersonas([]);
        } finally {
            setLoading(false);
        }
    };

    // *** Efecto para cargar Roles al montar el componente ***
    useEffect(() => {
        fetchRoles();
    }, []);

    // *** Efecto para cargar Personas cuando cambian Filtros, Búsqueda o Paginación ***
    useEffect(() => {
        fetchPersonas();
    }, [search, estadoFilter, generoFilter, rolFilterName, currentPage, itemsPerPage]);

    const handleFilterChange = (setter: React.Dispatch<any>) => (value: any) => {
        setter(value);
        setCurrentPage(1);
    };

    // Función para manejar la desactivación
    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de desactivar esta persona?')) {
            try {
                await deactivatePersona(id);
                // Actualizar el estado localmente o volver a cargar la lista
                setPersonas(prevPersonas =>
                    prevPersonas.map(p => p.persona_id === id ? { ...p, estado: EstadoEnum.Inactivo } : p)
                );
                alert("Persona desactivada con éxito!");
            } catch (err: any) {
                 console.error("Error deactivating persona:", err);
                 alert(`Error al desactivar la persona: ${err.response?.data?.detail || err.message}`);
            }
        }
    };

    // Función para manejar la activación
    const handleActivate = async (id: number) => {
      if (window.confirm('¿Estás seguro de activar esta persona?')) {
         try {
             await activatePersona(id);
             setPersonas(prevPersonas =>
                 prevPersonas.map(p => p.persona_id === id ? { ...p, estado: EstadoEnum.Activo } : p)
             );
             alert("Persona activada con éxito!");
         } catch (err: any) {
              console.error("Error activating persona:", err);
              alert(`Error al activar la persona: ${err.response?.data?.detail || err.message}`);
         }
     }
    };

    // Definición de las columnas de la tabla
    const columns = useMemo(() => [
        { Header: 'ID', accessor: 'persona_id' },
        {
            Header: 'Nombre Completo',
            accessor: 'nombre', // Se usa 'nombre' como accessor principal para la columna
            Cell: ({ row }: { row: { original: IPersonaInDB } }) => // Especificar tipo de row.original
                `${row.original.nombre} ${row.original.apellido_paterno || ''} ${row.original.apellido_materno || ''}`.trim()
        },
        { Header: 'CI', accessor: 'ci' },
        { Header: 'Email', accessor: 'email' },
        { Header: 'Teléfono', accessor: 'telefono' },
        { Header: 'Estado', accessor: 'estado' },
        {
            Header: 'Acciones',
            accessor: 'acciones',
            Cell: ({ row }: { row: { original: IPersonaInDB } }) => ( // Especificar tipo de row.original
                <div className="flex space-x-2">
                    <Button
                        onClick={() => navigate(`/personas/edit/${row.original.persona_id}`)}
                        className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
                    >
                        Editar
                    </Button>
                    {row.original.estado === EstadoEnum.Activo ? (
                         <Button
                            onClick={() => handleDelete(row.original.persona_id)}
                            className="bg-red-500 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
                         >
                            Desactivar
                         </Button>
                    ) : (
                      <Button
                         onClick={() => handleActivate(row.original.persona_id)}
                         className="bg-green-500 hover:bg-green-700 text-white text-xs py-1 px-2 rounded"
                      >
                         Activar
                      </Button>
                    )}
                </div>
            ),
        },
    ], []); // Dependencias: no necesitas personas ni handleDelete aquí si no los usas directamente en la definición de la columna

    if (loading && personas.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner /> Cargando personas...
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Gestión de Personas</h1>

            {/* *** SECCIÓN DE BÚSQUEDA Y FILTROS *** */}
            <div className="mb-4 bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-grow min-w-[150px]">
                    <label htmlFor="search" className="sr-only">Buscar</label>
                    <Input
                        id="search"
                        type="text"
                        placeholder="Buscar por nombre, CI, etc."
                        value={search}
                        onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label htmlFor="estadoFilter" className="sr-only">Filtrar por Estado</label>
                    <Select
                        id="estadoFilter"
                        value={estadoFilter}
                        onChange={(e) => handleFilterChange(setEstadoFilter)(e.target.value as EstadoEnum | '')}
                        options={[
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                            { value: '', label: 'Todos los estados' },
                        ]}
                    />
                </div>

                <div>
                    <label htmlFor="generoFilter" className="sr-only">Filtrar por Género</label>
                    <Select
                        id="generoFilter"
                        value={generoFilter}
                        onChange={(e) => handleFilterChange(setGeneroFilter)(e.target.value as GeneroEnum | '')}
                        options={[
                            { value: '', label: 'Todos los géneros' },
                            { value: GeneroEnum.Masculino, label: 'Masculino' },
                            { value: GeneroEnum.Femenino, label: 'Femenino' },
                        ]}
                    />
                </div>

                <div>
                    <label htmlFor="rolFilter" className="sr-only">Filtrar por Rol</label>
                    <Select
                        id="rolFilter"
                        value={rolFilterName}
                        onChange={(e) => handleFilterChange(setRolFilterName)(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        disabled={loadingRoles}
                    >
                        <option value="">Todos los roles</option>
                        {availableRoles.map(rol => (
                            <option key={rol.rol_id} value={rol.nombre_rol}>
                                {rol.nombre_rol}
                            </option>
                        ))}
                    </Select>
                    {loadingRoles && <LoadingSpinner />}
                </div>
                <div className="flex-grow md:flex-none flex justify-end">
                    <Button
                        onClick={() => navigate('/personas/new')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
                    >
                        Crear Nueva Persona
                    </Button>
                </div>
            </div>

            {/* *** LISTADO DE PERSONAS O MENSAJE *** */}
            {loading && personas.length > 0 && (
                <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-10">
                     <LoadingSpinner />
                </div>
            )}
            {personas.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500">No hay personas registradas que coincidan con los filtros.</p>
            ) : (
                 personas.length > 0 && (
                     <div className="relative">
                        <Table columns={columns} data={personas} />
                     </div>
                 )
            )}

            {/* *** SECCIÓN DE PAGINACIÓN *** */}
             <div className="mt-4 flex justify-center items-center space-x-4">
                 <Button
                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                     disabled={currentPage === 1 || loading}
                     className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     Anterior
                 </Button>

                 <span className="text-gray-700">Página {currentPage}</span>
                 <Button
                     onClick={() => setCurrentPage(prev => prev + 1)}
                     disabled={loading}
                     className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     Siguiente
                 </Button>
             </div>
        </div>
    );
};

export default PersonasListPage;