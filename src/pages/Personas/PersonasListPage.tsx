import React, { useEffect, useState, useMemo } from 'react';
import { getPersonas, deactivatePersona, activatePersona, GetPersonasParams } from '../../services/personaService';
import { getRoles } from '../../services/rolService'; // Importar servicio de roles
import { IPersonaWithRoles } from '../../types/persona';
import { IRolInDB } from '../../types/rol'; // Importar tipo de Rol
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Select from '../../components/Common/Select';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { EstadoEnum, GeneroEnum } from '../../types/enums';

const PersonasListPage: React.FC = () => {
    const navigate = useNavigate();
    const [personas, setPersonas] = useState<IPersonaWithRoles[]>([]);
    const [roles, setRoles] = useState<IRolInDB[]>([]); // Estado para roles
    const [totalPersonas, setTotalPersonas] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados de los filtros
    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>(EstadoEnum.Activo);
    const [generoFilter, setGeneroFilter] = useState<GeneroEnum | '' > ('');
    const [rolFilter, setRolFilter] = useState<string>(''); // Estado para el filtro de rol

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Fetch de Roles para el dropdown
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const rolesData = await getRoles({ estado: EstadoEnum.Activo });
                setRoles(rolesData);
            } catch (err) {
                console.error("Error fetching roles:", err);
            }
        };
        fetchRoles();
    }, []);

    const fetchPersonas = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: GetPersonasParams = {
                 search: search || undefined,
                 estado: estadoFilter || undefined,
                 genero: generoFilter || undefined,
                 rol_nombre: rolFilter || undefined, // Añadir rol_nombre a los parámetros
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };

            Object.keys(params).forEach(key => params[key as keyof GetPersonasParams] === undefined && delete params[key as keyof GetPersonasParams]);

            const fetchedData = await getPersonas(params);
            setPersonas(fetchedData.items);
            setTotalPersonas(fetchedData.total);

        } catch (err: any) {
            console.error("Error fetching personas:", err);
            setError(err.response?.data?.detail || "Error al cargar las personas.");
            setPersonas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPersonas();
    }, [search, estadoFilter, generoFilter, rolFilter, currentPage, itemsPerPage]); // Añadir rolFilter a las dependencias

    const handleFilterChange = (setter: React.Dispatch<any>) => (value: any) => {
        setter(value);
        setCurrentPage(1);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de desactivar esta persona?')) {
            try {
                await deactivatePersona(id);
                fetchPersonas();
                alert("Persona desactivada con éxito!");
            } catch (err: any) {
                 console.error("Error deactivating persona:", err);
                 alert(`Error al desactivar la persona: ${err.response?.data?.detail || err.message}`);
            }
        }
    };

    const handleActivate = async (id: number) => {
      if (window.confirm('¿Estás seguro de activar esta persona?')) {
         try {
             await activatePersona(id);
             fetchPersonas();
             alert("Persona activada con éxito!");
         } catch (err: any) {
              console.error("Error activating persona:", err);
              alert(`Error al activar la persona: ${err.response?.data?.detail || err.message}`);
         }
     }
    };

    const totalPages = Math.ceil(totalPersonas / itemsPerPage);

    const columns = useMemo(() => [
        { Header: 'ID', accessor: 'persona_id' },
        {
            Header: 'Nombre Completo',
            accessor: 'nombre',
            Cell: ({ row }: { row: { original: IPersonaWithRoles } }) => 
                `${row.original.nombre} ${row.original.apellido_paterno || ''} ${row.original.apellido_materno || ''}`.trim()
        },
        { Header: 'CI', accessor: 'ci' },
        { Header: 'Email', accessor: 'email' },
        { Header: 'Teléfono', accessor: 'telefono' },
        { Header: 'Estado', accessor: 'estado' },
        {
            Header: 'Rol',
            accessor: 'roles',
            Cell: ({ row }: { row: { original: IPersonaWithRoles } }) => 
                row.original.roles.map(rol => rol.nombre_rol).join(', ')
        },
                {
            Header: 'Acciones',
            accessor: 'acciones',
            Cell: ({ row }: { row: { original: IPersonaWithRoles } }) => (
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
    ], [navigate]);

    if (loading && personas.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                 <LoadingSpinner /> Cargando personas...
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Gestión de Personas</h1>

            <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-grow min-w-[150px]">
                    <label htmlFor="search" className="sr-only">Buscar</label>
                    <Input
                        id="search"
                        type="text"
                        placeholder="Buscar por nombre, CI, etc."
                        value={search}
                        onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="rolFilter" className="sr-only">Filtrar por Rol</label>
                    <Select
                        id="rolFilter"
                        value={rolFilter}
                        onChange={(e) => handleFilterChange(setRolFilter)(e.target.value)}
                        options={[
                            { value: '', label: 'Todos los roles' },
                            ...roles.map(rol => ({ value: rol.nombre_rol, label: rol.nombre_rol }))
                        ]}
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

                <div className="flex-grow md:flex-none flex justify-end">
                    <Button
                        onClick={() => navigate('/personas/new')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
                    >
                        Crear Nueva Persona
                    </Button>
                </div>
            </div>

            {loading && personas.length > 0 && (
                <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 z-10">
                     <LoadingSpinner />
                </div>
            )}
            {personas.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No hay personas registradas que coincidan con los filtros.</p>
            ) : (
                 personas.length > 0 && (
                     <div className="relative">
                        <Table columns={columns} data={personas} />
                        <div className="mt-4 flex justify-center items-center space-x-4">
                            <Button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || loading}
                            >
                                Anterior
                            </Button>
                            <span className="text-gray-700 dark:text-gray-300">
                                Página {currentPage} de {totalPages} (Total: {totalPersonas} personas)
                            </span>
                            <Button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || loading}
                            >
                                Siguiente
                            </Button>
                        </div>
                     </div>
                 )
            )}
        </div>
    );
};

export default PersonasListPage;