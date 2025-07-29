// src/pages/Proveedores/ProveedoresListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getProveedores, deleteProveedor, activateProveedor } from '../../services/proveedorService';
import { Proveedor, GetProveedoresParams } from '../../types/proveedor'; 
import { EstadoEnum } from '../../types/enums';
import Table from '../../components/Common/Table'; 
import Button from '../../components/Common/Button'; 
import Input from '../../components/Common/Input'; 
import LoadingSpinner from '../../components/Common/LoadingSpinner'; 


const ProveedoresListPage: React.FC = () => {

    // Estados para la lista de proveedores
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para filtros y búsqueda (coinciden con tu router GET /proveedores/)
    const [search, setSearch] = useState(''); // Búsqueda combinada por nombre/razón social, CI/identificación
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>(''); // Filtro por estado
    const [tipoFilter, setTipoFilter] = useState<'persona' | 'empresa' | ''>(''); // *** NUEVO: Filtro por tipo ***


    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    // const [totalItems, setTotalItems] = useState(0);


    // Función para obtener la lista de proveedores con los parámetros actuales
    const fetchProveedores = async () => {
        setLoading(true);
        setError(null);

        try {
            // Construir el objeto de parámetros para la API (usa la interfaz GetProveedoresParams)
            const params: GetProveedoresParams = {
                 ...(search && { search }),
                 ...(estadoFilter && { estado: estadoFilter }),
                 ...(tipoFilter && { tipo: tipoFilter }), // *** Incluir filtro por tipo si tiene valor ***
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };
       // Llama al servicio getProveedores con los parámetros
             const data = await getProveedores(params); // Asume que getProveedores retorna Promise<Proveedor[]>
             setProveedores(data);

        } catch (err: any) {
            console.error("Error fetching proveedores:", err);
            setError(err.response?.data?.detail || "Error al cargar los proveedores.");
            setProveedores([]);
            // setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    // Efecto para cargar Proveedores cuando cambian Filtros, Búsqueda o Paginación
    useEffect(() => {
        fetchProveedores();
    }, [search, estadoFilter, tipoFilter, currentPage, itemsPerPage]); 


    // Handler genérico para cambios en filtros (resetea la página a 1)
     const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
         setter(value);
         setCurrentPage(1); // Resetear página al cambiar cualquier filtro o búsqueda
     };


    // Función para manejar la eliminación (desactivación) de un Proveedor (DELETE)
    const handleDelete = async (id: number, nombreProveedor: string) => {
        if (window.confirm(`¿Estás seguro de desactivar el proveedor "${nombreProveedor}"?`)) {
            try {
                await deleteProveedor(id); // Llama al servicio deleteProveedor
                // Opción 1: Actualizar el estado localmente a Inactivo
                setProveedores(proveedores.map(p => p.proveedor_id === id ? { ...p, estado: EstadoEnum.Inactivo } : p));
                alert(`Proveedor "${nombreProveedor}" desactivado con éxito!`);

            } catch (err: any) {
                 console.error(`Error deactivating proveedor ${id}:`, err.response?.data || err);
                 alert(`Error al desactivar el proveedor "${nombreProveedor}": ${err.response?.data?.detail || err.message}`);
            }
        }
    };

     // Función para manejar la activación de un Proveedor (PATCH)
     const handleActivate = async (id: number, nombreProveedor: string) => {
         if (window.confirm(`¿Estás seguro de activar el proveedor "${nombreProveedor}"?`)) {
             try {
                 await activateProveedor(id); // Llama a la función del servicio para activar (PATCH)
                 // Opción 1: Actualiza el estado localmente a Activo
                 setProveedores(proveedores.map(p => p.proveedor_id === id ? { ...p, estado: EstadoEnum.Activo } : p));
                 alert(`Proveedor "${nombreProveedor}" activado con éxito!`);

             } catch (err: any) {
                 console.error(`Error activating proveedor ${id}:`, err.response?.data || err);
                 alert(`Error al activar el proveedor "${nombreProveedor}": ${err.response?.data?.detail || err.message}`);
             }
         }
     };


    // Definición de las columnas de la tabla de Proveedores
    const columns = useMemo(() => {
        // Define el tipo para el objeto de datos de la fila
        type RowData = Proveedor; // Cada fila en 'data' es de tipo Proveedor

        // Define el tipo exacto de la prop Cell esperada por tu componente Table
        type TableCellProps = {
            row: {
                original: RowData; // El objeto de datos de la fila completa es de tipo Proveedor
            };
        };

        return [
            { Header: 'ID', accessor: 'proveedor_id' },
            {
                 Header: 'Tipo',
                 accessor: 'tipo', 
                 Cell: ({ row }: TableCellProps): React.ReactNode => {
                      // Determina el tipo basado en qué relación no es null
                      if (row.original.persona) {
                           return 'Persona';
                      } else if (row.original.empresa) {
                           return 'Empresa';
                      }
                      return 'Desconocido'; 
                 },
            },
            {
                 Header: 'Nombre / Razón Social',
                 accessor: 'nombre_completo', // Accessor ficticio
                 Cell: ({ row }: TableCellProps): React.ReactNode => {
                      // Muestra el nombre completo de la Persona o la Razón Social de la Empresa
                      if (row.original.persona) {
                           const p = row.original.persona;
                           return `${p.nombre} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim();
                      } else if (row.original.empresa) {
                           return row.original.empresa.razon_social;
                      }
                      return '-';
                 },
            },
             {
                 Header: 'CI / Identificación',
                 accessor: 'identificacion_proveedor', 
                 Cell: ({ row }: TableCellProps): React.ReactNode => {
                      if (row.original.persona) {
                           return row.original.persona.ci || '-';
                      } else if (row.original.empresa) {
                           return row.original.empresa.identificacion || '-';
                      }
                      return '-';
                 },
             },


            { Header: 'Estado', accessor: 'estado' },
            {
                Header: 'Acciones',
                accessor: 'acciones', // Un accessor ficticio
                Cell: ({ row }: TableCellProps): React.ReactNode => {
                    // Determina el nombre para el mensaje de confirmación
                    const nombreParaConfirmacion = row.original.persona
                        ? `${row.original.persona.nombre} ${row.original.persona.apellido_paterno || ''}`.trim()
                        : row.original.empresa
                            ? row.original.empresa.razon_social
                            : `ID ${row.original.proveedor_id}`;

                    return (
                        <div className="flex space-x-2">
                            {/* Enlace al formulario de edición de Proveedor */}
                            {/* Asume que tendrás una ruta /proveedores/edit/:id definida en App.tsx */}
                            <Link to={`/proveedores/edit/${row.original.proveedor_id}`}>
                                <Button className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded">
                                    Editar
                                </Button>
                            </Link>

                            {/* Botón Desactivar o Activar */}
                             {row.original.estado === EstadoEnum.Activo ? (
                                 <Button
                                    onClick={() => handleDelete(row.original.proveedor_id, nombreParaConfirmacion)} // Pasa ID y nombre combinado
                                    className="bg-red-500 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
                                    disabled={loading}
                                 >
                                    Desactivar
                                 </Button>
                             ) : ( // Si el estado NO es Activo (Inactivo)
                                  // Muestra Activar solo si el estado es Inactivo
                                  row.original.estado === EstadoEnum.Inactivo ? (
                                     <Button
                                        onClick={() => handleActivate(row.original.proveedor_id, nombreParaConfirmacion)} // Llama a PATCH handler
                                        className="bg-green-500 hover:bg-green-700 text-white text-xs py-1 px-2 rounded"
                                        disabled={loading}
                                     >
                                        Activar
                                     </Button>
                                 ) : (
                                     // Si tiene otro estado diferente de Activo o Inactivo
                                     <Button className="bg-gray-400 text-white text-xs py-1 px-2 rounded cursor-not-allowed" disabled>
                                        {row.original.estado} {/* Muestra el estado actual */}
                                     </Button>
                                 )
                             )}
                        </div>
                    );
                },
            },
        ];
    }, [proveedores, handleDelete, handleActivate, loading]); // Dependencias: proveedores, handlers, loading

    if (loading && proveedores.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner /> Cargando proveedores...
            </div>
        );
    }

    // Si hay un error (y no está cargando activamente sobre datos viejos)
    if (error && !loading) {
        return <div className="text-red-500 text-center mt-4">Error: {error}</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Gestión de Proveedores</h1>

            {/* Sección de Búsqueda y Filtros */}
            <div className="mb-4 bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                {/* Búsqueda por texto (nombre/razón social, CI/identificación) */}
                 <div className="flex-grow min-w-[150px]">
                    <label htmlFor="search" className="sr-only">Buscar Proveedor</label>
                    <Input
                        id="search"
                        type="text"
                        placeholder="Buscar por nombre, CI o identificación" // Ajusta el placeholder
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterValueChange(setSearch)(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                 </div>

                {/* Filtro por Estado */}
                 <div>
                    <label htmlFor="estadoFilter" className="sr-only">Filtrar por Estado</label>
                     <select
                        id="estadoFilter"
                        value={estadoFilter}
                         onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterValueChange(setEstadoFilter)(e.target.value as EstadoEnum | '')}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Todos los estados</option>
                        <option value={EstadoEnum.Activo}>Activo</option>
                        <option value={EstadoEnum.Inactivo}>Inactivo</option>
                         {/* <option value={EstadoEnum.Bloqueado}>Bloqueado</option> */} {/* Si aplica a Proveedores */}
                    </select>
                 </div>

                 {/* *** NUEVO: Filtro por Tipo de Proveedor *** */}
                 <div>
                    <label htmlFor="tipoFilter" className="sr-only">Filtrar por Tipo</label>
                     <select
                        id="tipoFilter"
                        value={tipoFilter}
                         onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterValueChange(setTipoFilter)(e.target.value as 'persona' | 'empresa' | '')}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Todos los tipos</option>
                        <option value="persona">Persona</option>
                        <option value="empresa">Empresa</option>
                    </select>
                 </div>


                {/* Botón "Crear Nuevo Proveedor" */}
                 <div className="flex-grow md:flex-none flex justify-end">
                     {/* Asume que tendrás una ruta /proveedores/new definida en App.tsx */}
                     <Link to="/proveedores/new">
                         <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow">
                             Crear Nuevo Proveedor
                         </Button>
                     </Link>
                 </div>
            </div>
            {loading && proveedores.length > 0 && (
                 <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-10">
                     <LoadingSpinner />
                 </div>
            )}
            {/* Mensaje si la lista está vacía y no está cargando ni hay error */}
            {proveedores.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500">No hay proveedores registrados que coincidan con los filtros.</p>
            ) : (
                 /* Si hay proveedores, muestra la tabla */
                 proveedores.length > 0 && (
                     <div className="relative overflow-x-auto"> {/* Añade overflow para tablas anchas */}
                        <Table columns={columns} data={proveedores} />
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

export default ProveedoresListPage;
