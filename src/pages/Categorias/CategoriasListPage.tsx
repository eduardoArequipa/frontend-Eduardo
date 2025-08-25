// src/pages/Categorias/CategoriasListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCategorias, deleteCategoria, activateCategoria } from '../../services/categoriaService';
import { Categoria, CategoriaPagination } from '../../types/categoria';
import { EstadoEnum } from '../../types/enums';
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select';

const CategoriasListPage: React.FC = () => {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [totalCategorias, setTotalCategorias] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>(EstadoEnum.Activo);

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
             const fetchedData: CategoriaPagination = await getCategorias(params);
             setCategorias(fetchedData.items);
             setTotalCategorias(fetchedData.total);
        } catch (err: any) {
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

    const handleDelete = async (id: number, nombreCategoria: string) => {
        if (window.confirm(`¿Estás seguro de desactivar la categoría "${nombreCategoria}"?`)) {
            try {
                await deleteCategoria(id);
                fetchCategorias();
                alert(`Categoría "${nombreCategoria}" desactivada con éxito!`);
            } catch (err: any) {
                 alert(`Error al desactivar la categoría: ${err.response?.data?.detail || err.message}`);
            }
        }
    };

     const handleActivateCategoria = async (id: number, nombreCategoria: string) => {
         if (window.confirm(`¿Estás seguro de activar la categoría "${nombreCategoria}"?`)) {
             try {
                 await activateCategoria(id); 
                 fetchCategorias();
                 alert(`Categoría "${nombreCategoria}" activada con éxito!`);
             } catch (err: any) {
                 alert(`Error al activar la categoría: ${err.response?.data?.detail || err.message}`);
             }
         }
     };

    const totalPages = Math.ceil(totalCategorias / itemsPerPage);

    const columns = useMemo(() => {
        return [
            { Header: 'ID', accessor: 'categoria_id' },
            { Header: 'Nombre de Categoría', accessor: 'nombre_categoria' },
            { Header: 'Estado', accessor: 'estado' },
            {
                Header: 'Acciones',
                accessor: 'acciones',
                Cell: ({ row }: { row: { original: Categoria } }) => (
                    <div className="flex space-x-2">
                        <Link to={`/categorias/edit/${row.original.categoria_id}`}>
                            <Button variant="primary" size="sm">Editar</Button>
                        </Link>
                         {row.original.estado === EstadoEnum.Activo ? (
                             <Button onClick={() => handleDelete(row.original.categoria_id, row.original.nombre_categoria)} variant="danger" size="sm" disabled={loading}>Desactivar</Button>
                         ) : (
                             <Button onClick={() => handleActivateCategoria(row.original.categoria_id, row.original.nombre_categoria)} variant="success" size="sm" disabled={loading}>Activar</Button>
                         )}
                    </div>
                ),
            },
        ];
    }, [loading]);

    if (loading && categorias.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                 <LoadingSpinner /> Cargando categorías...
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center mt-4">Error: {error}</div>;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Gestión de Categorías</h1>

            <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                 <div className="flex-grow min-w-[150px]">
                    <Input
                        id="search"
                        type="text"
                        placeholder="Buscar por nombre"
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
                        ]}
                    />
                 </div>
                 <div className="flex-grow md:flex-none flex justify-end">
                     <Link to="/categorias/new">
                         <Button variant="success">Crear Nueva Categoría</Button>
                     </Link>
                 </div>
            </div>

            {loading && categorias.length > 0 && (
                 <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 z-10">
                     <LoadingSpinner />
                 </div>
            )}

            {categorias.length === 0 && !loading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No hay categorías que coincidan con los filtros.</p>
            ) : (
                 <div className="relative">
                    <Table columns={columns} data={categorias} />
                 </div>
            )}

             <div className="mt-4 flex justify-center items-center space-x-4">
                 <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} variant="secondary">Anterior</Button>
                 <span className="text-gray-700 dark:text-gray-300">Página {currentPage} de {totalPages} (Total: {totalCategorias} categorías)</span>
                 <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} variant="secondary">Siguiente</Button>
             </div>
        </div>
    );
};

export default CategoriasListPage;