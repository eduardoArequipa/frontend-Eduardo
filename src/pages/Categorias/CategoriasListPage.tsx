// src/pages/Categorias/CategoriasListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCategorias, deleteCategoria, activateCategoria } from '../../services/categoriaService'; // *** Importa activateCategoria ***
import { Categoria } from '../../types/categoria';
import { EstadoEnum } from '../../types/enums';
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';


const CategoriasListPage: React.FC = () => {

    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);


    const fetchCategorias = async () => { 
        setLoading(true);
        setError(null);
        try {
            const params = {
                 ...(search && { search }),
                 ...(estadoFilter && { estado: estadoFilter }),
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };
             const data = await getCategorias(params);
             setCategorias(data);
        } catch (err: any) {
            console.error("Error fetching categorias:", err);
            setError(err.response?.data?.detail || "Error al cargar las categorías.");
            setCategorias([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategorias();
    }, [search, estadoFilter, currentPage, itemsPerPage]);

     const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
         setter(value);
         setCurrentPage(1);
     };


    // Función para manejar la eliminación (desactivación) de una Categoría
    const handleDelete = async (id: number, nombreCategoria: string) => { /* ... función igual que antes ... */
        if (window.confirm(`¿Estás seguro de desactivar la categoría "${nombreCategoria}"?`)) {
            try {
                await deleteCategoria(id); // Llama al servicio deleteCategoria (DELETE)
                setCategorias(categorias.map(c => c.categoria_id === id ? { ...c, estado: EstadoEnum.Inactivo } : c));
                alert(`Categoría "${nombreCategoria}" desactivada con éxito!`);

            } catch (err: any) {
                 console.error(`Error deactivating categoria ${id}:`, err.response?.data || err);
                 alert(`Error al desactivar la categoría "${nombreCategoria}": ${err.response?.data?.detail || err.message}`);
            }
        }
    };

     // *** NUEVA FUNCIÓN: Handler para activar una Categoría ***
     const handleActivateCategoria = async (id: number, nombreCategoria: string) => {
         if (window.confirm(`¿Estás seguro de activar la categoría "${nombreCategoria}"?`)) {
             try {
                 await activateCategoria(id); 
                 setCategorias(categorias.map(c => c.categoria_id === id ? { ...c, estado: EstadoEnum.Activo } : c));
                 alert(`Categoría "${nombreCategoria}" activada con éxito!`);
             } catch (err: any) {
                 console.error(`Error activating categoria ${id}:`, err.response?.data || err);
                 alert(`Error al activar la categoría "${nombreCategoria}": ${err.response?.data?.detail || err.message}`);
             }
         }
     };


    // Definición de las columnas de la tabla de Categorías
    const columns = useMemo(() => {
        type RowData = Categoria;
        type TableCellProps = { row: { original: RowData; }; };

        return [
            { Header: 'ID', accessor: 'categoria_id' },
            { Header: 'Nombre de Categoría', accessor: 'nombre_categoria' },
            { Header: 'Estado', accessor: 'estado' },

            {
                Header: 'Acciones',
                accessor: 'acciones',
                Cell: ({ row }: TableCellProps): React.ReactNode => (
                    <div className="flex space-x-2">
                        {/* Enlace al formulario de edición */}
                        <Link to={`/categorias/edit/${row.original.categoria_id}`}>
                            <Button className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded">
                                Editar
                            </Button>
                        </Link>

                        {/* *** Botón Desactivar o Activar *** */}
                         {row.original.estado === EstadoEnum.Activo ? (
                             <Button
                                onClick={() => handleDelete(row.original.categoria_id, row.original.nombre_categoria)} // Llama a DELETE handler
                                className="bg-red-500 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
                                disabled={loading}
                             >
                                Desactivar
                             </Button>
                         ) : (
                              row.original.estado === EstadoEnum.Inactivo ? ( 
                                 <Button
                                    onClick={() => handleActivateCategoria(row.original.categoria_id, row.original.nombre_categoria)} // *** Llama a PATCH handler ***
                                    className="bg-green-500 hover:bg-green-700 text-white text-xs py-1 px-2 rounded"
                                    disabled={loading}
                                 >
                                    Activar
                                 </Button>
                             ) : (
                                 <Button className="bg-gray-400 text-white text-xs py-1 px-2 rounded cursor-not-allowed" disabled>
                                    {row.original.estado} 
                                 </Button>
                             )
                         )}
                    </div>
                ),
            },
        ];
    }, [categorias, handleDelete, handleActivateCategoria, loading]); 


    if (loading && categorias.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner /> Cargando categorías...
            </div>
        );
    }

    if (error && !loading) {
        return <div className="text-red-500 text-center mt-4">Error: {error}</div>;
    }


    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Gestión de Categorías</h1>

            {/* Sección de Búsqueda y Filtros */}
            <div className="mb-4 bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                {/* Búsqueda por texto */}
                 <div className="flex-grow min-w-[150px]">
                    <label htmlFor="search" className="sr-only">Buscar Categoría</label>
                    <Input
                        id="search"
                        type="text"
                        placeholder="Buscar por nombre"
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
                    </select>
                 </div>

                {/* Botón "Crear Nueva Categoría" */}
                 <div className="flex-grow md:flex-none flex justify-end">
                     <Link to="/categorias/new">
                         <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow">
                             Crear Nueva Categoría
                         </Button>
                     </Link>
                 </div>
            </div>

            {loading && categorias.length > 0 && (
                 <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-10">
                     <LoadingSpinner />
                 </div>
            )}
            {/* Mensaje si la lista está vacía y no está cargando ni hay error */}
            {categorias.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500">No hay categorías registradas que coincidan con los filtros.</p>
            ) : (
                 /* Si hay categorías, muestra la tabla */
                 categorias.length > 0 && (
                     <div className="relative">
                        <Table columns={columns} data={categorias} />
                     </div>
                 )
            )}

            {/* Sección de Paginación */}
             <div className="mt-4 flex justify-center items-center space-x-4">
                 <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">Anterior</Button>
                 <span className="text-gray-700">Página {currentPage}</span>
                 <Button onClick={() => setCurrentPage(prev => prev + 1)} disabled={loading /* || currentPage >= totalPages */} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</Button>
             </div>
        </div>
    );
};

export default CategoriasListPage;