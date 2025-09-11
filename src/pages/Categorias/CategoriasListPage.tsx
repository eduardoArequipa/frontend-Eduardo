import React, { useEffect, useState, useMemo } from 'react';
import { getCategorias, deleteCategoria, activateCategoria } from '../../services/categoriaService';
import { Categoria, CategoriaPagination } from '../../types/categoria';
import { EstadoEnum } from '../../types/enums';
// Ya no necesitamos useCatalogs aquí
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select';
import Modal from '../../components/Common/Modal';
import CategoriaForm from '../../components/Specific/CategoriaForm';
import ActionsDropdown, { ActionConfig } from '../../components/Common/ActionsDropdown';

const CategoriasListPage: React.FC = () => {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [totalCategorias, setTotalCategorias] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>(EstadoEnum.Activo);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);

    // Ya no necesitamos invalidateCategorias porque CategoriaForm notifica directamente

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

    const handleOpenModal = (categoria: Categoria | null = null) => {
        setEditingCategoria(categoria);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategoria(null);
    };

    const handleSuccess = () => {
        fetchCategorias(); // Solo recargar la lista local para paginación
        handleCloseModal();
        // No necesitamos invalidar porque CategoriaForm ya notifica al cache global
    };

    const handleDelete = async (id: number, nombreCategoria: string) => {
        if (window.confirm(`¿Estás seguro de desactivar la categoría "${nombreCategoria}"?`)) {
            try {
                await deleteCategoria(id);
                fetchCategorias(); // Solo recargar la lista local
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
                 fetchCategorias(); // Solo recargar la lista local
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
            {
                Header: 'Estado',
                accessor: 'estado',
                Cell: ({ row }: { row: { original: Categoria } }) => (
                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${row.original.estado === EstadoEnum.Activo ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'}`}>
                        <span aria-hidden className={`absolute inset-0 opacity-50 rounded-full ${row.original.estado === EstadoEnum.Activo ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800'}`}></span>
                        <span className="relative">{row.original.estado.charAt(0).toUpperCase() + row.original.estado.slice(1)}</span>
                    </span>
                ),
            },
            {
                Header: 'Acciones',
                accessor: 'acciones',
                Cell: ({ row }: { row: { original: Categoria } }) => {
                    const categoria = row.original;
                    const actions: ActionConfig[] = [
                        { label: 'Editar', onClick: () => handleOpenModal(categoria), isVisible: true, buttonVariant: 'menuItem' },
                        { label: 'Desactivar', onClick: () => handleDelete(categoria.categoria_id, categoria.nombre_categoria), isVisible: categoria.estado === EstadoEnum.Activo, buttonVariant: 'menuItem', colorClass: 'text-red-700 dark:text-red-400' },
                        { label: 'Activar', onClick: () => handleActivateCategoria(categoria.categoria_id, categoria.nombre_categoria), isVisible: categoria.estado === EstadoEnum.Inactivo, buttonVariant: 'menuItem', colorClass: 'text-green-700 dark:text-green-400' },
                    ];
                    return <ActionsDropdown actions={actions} isLoading={loading} />;
                },
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
                     <Button onClick={() => handleOpenModal()} variant="success">Crear Nueva Categoría</Button>
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

            <Modal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                title={editingCategoria ? 'Editar Categoría' : 'Crear Nueva Categoría'}
                showCancelButton={false} // <-- AÑADIDO
            >
                <CategoriaForm 
                    onSuccess={handleSuccess}
                    onCancel={handleCloseModal}
                    categoriaId={editingCategoria?.categoria_id}
                />
            </Modal>
        </div>
    );
};

export default CategoriasListPage;