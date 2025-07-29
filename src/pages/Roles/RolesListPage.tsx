// src/pages/Roles/RolesListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getRoles, deleteRole } from '../../services/rolService'; // Asegúrate que deleteRole maneje solo la "desactivación"

// Importa el tipo IRolInDB (que representa un rol tal como viene de la base de datos)
import { IRolInDB } from '../../types/rol';
import { EstadoEnum } from '../../types/enums';

// Importa componentes comunes
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select'; // Agregamos Select para el filtro de estado

const RolesListPage: React.FC = () => {
    // Usa IRolInDB para el estado de los roles
    const [roles, setRoles] = useState<IRolInDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para filtros y búsqueda
    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>('');

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    // const [totalItems, setTotalItems] = useState(0); // Descomentar si tu API retorna el total de ítems

    // Función para obtener la lista de roles con los parámetros actuales
    const fetchRoles = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                 ...(search && { search }),
                 ...(estadoFilter && { estado: estadoFilter }),
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };

             const data = await getRoles(params); // Llama a tu servicio getRoles
             setRoles(data);
            // setTotalItems(response.data.total); // Descomentar si tu API retorna el total
        } catch (err: any) {
            console.error("Error fetching roles:", err);
            setError(err.response?.data?.detail || "Error al cargar los roles.");
            setRoles([]);
            // setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    // Efecto para cargar roles cuando cambian Filtros, Búsqueda o Paginación
    useEffect(() => {
        fetchRoles();
    }, [search, estadoFilter, currentPage, itemsPerPage]);

    // Handler genérico para cambios en filtros (resetea la página a 1)
     const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
         setter(value);
         setCurrentPage(1); // Resetear página al cambiar cualquier filtro o búsqueda
     };

    // Handler para "eliminar" (desactivar) un Rol
    const handleDelete = async (id: number, nombreRol: string) => {
        if (window.confirm(`¿Estás seguro de desactivar el rol "${nombreRol}"?`)) {
            try {
                // Asume que deleteRole cambia el estado del rol a Inactivo en el backend
                await deleteRole(id);
                // Opción 1: Actualizar el estado localmente a Inactivo
                setRoles(prevRoles => prevRoles.map(rol => rol.rol_id === id ? { ...rol, estado: EstadoEnum.Inactivo } : rol));
                alert(`Rol "${nombreRol}" desactivado con éxito!`);

                // Opción 2: Volver a cargar la lista completa (menos eficiente si la lista es grande):
                // fetchRoles();

            } catch (err: any) {
                 console.error(`Error deactivating role ${id}:`, err.response?.data || err);
                 alert(`Error al desactivar el rol "${nombreRol}": ${err.response?.data?.detail || err.message}`);
            }
        }
    };

    // Definición de las columnas de la tabla de Roles
    const columns = useMemo(() => {
        // Usa IRolInDB para el tipo de datos de la fila
        type RowData = IRolInDB;

        type TableCellProps = {
            row: {
                original: RowData;
            };
        };

        return [
            { Header: 'ID', accessor: 'rol_id' },
            { Header: 'Nombre del Rol', accessor: 'nombre_rol' },
            { Header: 'Descripción', accessor: 'descripcion' },
            { Header: 'Estado', accessor: 'estado' },
            // Puedes añadir más columnas si tu IRolInDB tiene otros campos como 'creado_por', 'fecha_creacion', etc.

            {
                Header: 'Acciones',
                accessor: 'acciones', // Un accessor ficticio para la columna de acciones
                Cell: ({ row }: TableCellProps): React.ReactNode => (
                    <div className="flex space-x-2">
                        {/* Enlace al formulario de edición de Rol */}
                        <Link to={`/roles/edit/${row.original.rol_id}`}>
                            <Button className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded">
                                Editar
                            </Button>
                        </Link>

                        {/* Botón Desactivar (solo si el rol está Activo) */}
                        {row.original.estado === EstadoEnum.Activo ? (
                             <Button
                                // Pasa rol_id y nombre_rol a handleDelete
                                onClick={() => handleDelete(row.original.rol_id, row.original.nombre_rol)}
                                className="bg-red-500 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
                                disabled={loading} // Deshabilita si se está cargando
                             >
                                Desactivar
                             </Button>
                        ) : (
                             // Si el rol NO es Activo, muestra un botón deshabilitado con su estado actual
                             <Button className="bg-gray-400 text-white text-xs py-1 px-2 rounded cursor-not-allowed" disabled>
                                {row.original.estado} {/* Muestra el estado actual (ej: Inactivo) */}
                             </Button>
                        )}
                        {/* Si tuvieras una función para 'Activar Rol', la colocarías aquí */}
                    </div>
                ),
            },
        ];
    }, [handleDelete, loading]); // Dependencias: handleDelete y loading (para deshabilitar botones)

    // --- Renderizado Condicional (Carga Inicial, Error, Lista Vacía) ---

    // Si está cargando Y la lista de roles está vacía inicialmente
    if (loading && roles.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner /> Cargando roles...
            </div>
        );
    }

    // Si hay un error (y no está cargando activamente sobre datos viejos)
    if (error && !loading) {
        return <div className="text-red-500 text-center mt-4">Error: {error}</div>;
    }

    // --- JSX Principal ---
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Gestión de Roles</h1>

            {/* Sección de Búsqueda y Filtros */}
            <div className="mb-4 bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                 {/* Input de Búsqueda */}
                 <div className="flex-grow min-w-[150px]">
                    <label htmlFor="search" className="sr-only">Buscar Rol</label>
                    <Input
                        id="search"
                        type="text"
                        placeholder="Buscar por nombre o descripción"
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterValueChange(setSearch)(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                 </div>

                {/* Select de Filtro por Estado */}
                 <div>
                    <label htmlFor="estadoFilter" className="sr-only">Filtrar por Estado</label>
                     <Select
                        id="estadoFilter"
                        value={estadoFilter}
                         onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterValueChange(setEstadoFilter)(e.target.value as EstadoEnum | '')}
                        options={[
                            { value: '', label: 'Todos los estados' },
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                            // Añade otros estados si Rol tiene más (ej: EstadoEnum.Eliminado)
                        ]}
                    />
                 </div>

                {/* Botón "Crear Nuevo Rol" */}
                 <div className="flex-grow md:flex-none flex justify-end">
                     <Link to="/roles/new">
                         <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow">
                             Crear Nuevo Rol
                         </Button>
                     </Link>
                 </div>
            </div>

            {/* Contenedor de la Tabla y Mensajes Condicionales */}
            {/* Mostrar spinner si está cargando ROLES Y ya hay roles en la lista (superpuesto) */}
            {loading && roles.length > 0 && (
                 <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-10">
                     <LoadingSpinner />
                 </div>
            )}

            {/* Si la lista de ROLES está vacía, no está cargando, y no hay error, muestra un mensaje */}
            {roles.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500">No hay roles registrados que coincidan con los filtros.</p>
            ) : (
                 /* Si hay roles en la lista, muestra la tabla */
                 roles.length > 0 && (
                     <div className="relative"> {/* relative es necesario para posicionar el spinner absoluto */}
                        {/* Pasa las columnas y los datos */}
                        <Table columns={columns} data={roles} />
                     </div>
                 )
            )}

            {/* Sección de Paginación */}
             <div className="mt-4 flex justify-center items-center space-x-4">
                 <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">Anterior</Button>
                 <span className="text-gray-700">Página {currentPage}</span>
                 {/* El botón Siguiente necesitaría 'totalItems' del backend para saber cuándo deshabilitarse */}
                 <Button onClick={() => setCurrentPage(prev => prev + 1)} disabled={loading /* || currentPage >= totalPages */} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</Button>
             </div>
        </div>
    );
};

export default RolesListPage;