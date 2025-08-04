
import React, { useEffect, useState, useMemo } from 'react';
import { getProductos, deleteProducto, activateProducto, GetProductosParams } from '../../services/productoService';
import { getCategorias } from '../../services/categoriaService';
import { getUnidadesMedida } from '../../services/unidadMedidaService'; 
import { getMarcas } from '../../services/marcaService';            
import { Producto, ProductoPagination } from '../../types/producto';
import { EstadoEnum } from '../../types/enums';
import { CategoriaNested } from '../../types/categoria';
import { UnidadMedidaNested } from '../../types/unidad_medida'; 
import { MarcaNested } from '../../types/marca';                 
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select';
import ErrorMessage from '../../components/Common/ErrorMessage';
import ActionsDropdown, { ActionConfig } from '../../components/Common/ActionsDropdown';
import Modal from '../../components/Common/Modal';
import ProductoForm from '../../components/Specific/ProductoForm';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const ProductosListPage: React.FC = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [totalProductos, setTotalProductos] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>(EstadoEnum.Activo);
    const [categoriaFilter, setCategoriaFilter] = useState<number | ''>( '');
    const [unidadMedidaFilter, setUnidadMedidaFilter] = useState<number | ''>( '');
    const [marcaFilter, setMarcaFilter] = useState<number | ''>( '');              

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [availableCategoriasFilter, setAvailableCategoriasFilter] = useState<CategoriaNested[]>([]);
    const [availableUnidadesMedidaFilter, setAvailableUnidadesMedidaFilter] = useState<UnidadMedidaNested[]>([]);
    const [availableMarcasFilter, setAvailableMarcasFilter] = useState<MarcaNested[]>([]);
    const [loadingFilterData, setLoadingFilterData] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingProduct, setEditingProduct] = useState<Producto | null>(null);

    const fetchProductos = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: GetProductosParams = {
                 ...(search && { search }),
                 ...(estadoFilter && { estado: estadoFilter }),
                 ...(categoriaFilter !== '' && { categoria_id: categoriaFilter }),
                 ...(unidadMedidaFilter !== '' && { unidad_medida_id: unidadMedidaFilter }),
                 ...(marcaFilter !== '' && { marca_id: marcaFilter }),
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };
            const fetchedData: ProductoPagination = await getProductos(params);
            setProductos(fetchedData.items);
            setTotalProductos(fetchedData.total);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Error al cargar los productos.");
            setProductos([]);
        } finally {
            setLoading(false);
        }
    };

     useEffect(() => {
          const loadFilterData = async () => {
               setLoadingFilterData(true);
               try {
                    const [categoriasData, unidadesMedidaData, marcasData] = await Promise.all([
                        getCategorias({ limit: 100 }),
                        getUnidadesMedida({ limit: 100 }),
                        getMarcas({ limit: 100 })
                    ]);
                    setAvailableCategoriasFilter(categoriasData.items || []);
                    setAvailableUnidadesMedidaFilter(unidadesMedidaData);
                    setAvailableMarcasFilter(marcasData);
               } catch (err) {
                    setError("Error al cargar datos de filtro.");
               } finally {
                    setLoadingFilterData(false);
               }
          };
          loadFilterData();
     }, []);

    useEffect(() => {
        if (!loadingFilterData) {
             fetchProductos();
        }
    }, [search, estadoFilter, categoriaFilter, unidadMedidaFilter, marcaFilter, currentPage, itemsPerPage, loadingFilterData]);

     const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
         setter(value);
         setCurrentPage(1);
     };

    const handleDelete = async (id: number, nombreProducto: string) => {
        if (window.confirm(`¿Estás seguro de desactivar el producto "${nombreProducto}"?`)) {
            try {
                await deleteProducto(id);
                fetchProductos();
                alert(`Producto "${nombreProducto}" desactivado con éxito!`);
            } catch (err: any) {
                 alert(`Error al desactivar: ${err.response?.data?.detail || err.message}`);
            }
        }
    };

     const handleActivate = async (id: number, nombreProducto: string) => {
         if (window.confirm(`¿Estás seguro de activar el producto "${nombreProducto}"?`)) {
             try {
                 await activateProducto(id);
                 fetchProductos();
                 alert(`Producto "${nombreProducto}" activado con éxito!`);
             } catch (err: any) {
                 alert(`Error al activar: ${err.response?.data?.detail || err.message}`);
             }
         }
     };

    const handleOpenAddModal = () => setIsAddModalOpen(true);
    const handleCloseAddModal = () => setIsAddModalOpen(false);
    const handleAddSuccess = () => {
        handleCloseAddModal();
        fetchProductos();
    };

    const handleOpenEditModal = (producto: Producto) => {
        setEditingProduct(producto);
        setIsEditModalOpen(true);
    };
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingProduct(null);
    };
    const handleEditSuccess = () => {
        handleCloseEditModal();
        fetchProductos();
    };

    const totalPages = Math.ceil(totalProductos / itemsPerPage);

    const columns = useMemo(() => {
                type TableCellProps = { row: { original: RowData; }; };
        type RowData = Producto;
        return [
            {
                Header: 'Imagen',
                accessor: 'imagen_ruta',
                Cell: ({ row }: { row: { original: Producto } }) => (
                    <img src={row.original.imagen_ruta ? `${BACKEND_BASE_URL}${row.original.imagen_ruta}` : '/src/assets/default-product-image.png'} alt={`Imagen de ${row.original.nombre}`} className="h-10 w-10 object-cover rounded-md" onError={(e) => { e.currentTarget.src = '/src/assets/image-error.png'; }} />
                ),
            },
            { Header: 'Código', accessor: 'codigo' },
            { Header: 'Nombre', accessor: 'nombre' },
            { Header: 'Precio Compra', accessor: 'precio_compra', Cell: ({ row }: { row: { original: Producto } }) => <span className="text-blue-600 dark:text-blue-400 font-semibold">{Number(row.original.precio_compra).toFixed(2)} Bs.</span> },
            { Header: 'Precio Venta', accessor: 'precio_venta', Cell: ({ row }: { row: { original: Producto } }) => <span className="text-green-600 dark:text-green-400 font-semibold">{Number(row.original.precio_venta).toFixed(2)} Bs.</span> },
            { Header: 'Stock Minimo', accessor: 'stock_minimo' },

            {
                Header: 'Stock',
                accessor: 'stock',
                Cell: ({ row }: { row: { original: Producto } }) => {
                    const stock = Number(row.original.stock);
                    const stockMinimo = Number(row.original.stock_minimo);
                    let textColorClass = stock <= stockMinimo ? 'text-red-900 dark:text-red-200' : stock > stockMinimo * 2 ? 'text-green-900 dark:text-green-200' : 'text-orange-900 dark:text-orange-200';
                    let bgColorClass = stock <= stockMinimo ? 'bg-red-200 dark:bg-red-800' : stock > stockMinimo * 2 ? 'bg-green-200 dark:bg-green-800' : 'bg-orange-200 dark:bg-orange-800';
                    return <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${textColorClass}`}><span aria-hidden className={`absolute inset-0 opacity-50 rounded-full ${bgColorClass}`}></span><span className="relative">{stock}</span></span>;
                },
            },
            {
                Header: 'Categoría',
                accessor: 'categoria',
                Cell: ({ row }: TableCellProps) => <span>{row.original.categoria?.nombre_categoria || 'N/A'}</span>
            },
            {
                Header: 'Marca',
                accessor: 'marca',
                Cell: ({ row }: TableCellProps) => <span>{row.original.marca?.nombre_marca || 'N/A'}</span>
            },
            {
                Header: 'Estado',
                accessor: 'estado',
                Cell: ({ row }: { row: { original: Producto } }) => (
                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${row.original.estado === EstadoEnum.Activo ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'}`}>
                        <span aria-hidden className={`absolute inset-0 opacity-50 rounded-full ${row.original.estado === EstadoEnum.Activo ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800'}`}></span>
                        <span className="relative">{row.original.estado.charAt(0).toUpperCase() + row.original.estado.slice(1)}</span>
                    </span>
                ),
            },
            {
                Header: 'Acciones',
                accessor: 'acciones',
                Cell: ({ row }: { row: { original: Producto } }) => {
                    const producto = row.original;
                    const productActions: ActionConfig[] = [
                        { label: 'Editar', onClick: () => handleOpenEditModal(producto), isVisible: true, buttonVariant: 'menuItem' },
                        { label: 'Desactivar', onClick: () => handleDelete(producto.producto_id, producto.nombre), isVisible: producto.estado === EstadoEnum.Activo, buttonVariant: 'menuItem', colorClass: 'text-red-700 dark:text-red-400' },
                        { label: 'Activar', onClick: () => handleActivate(producto.producto_id, producto.nombre), isVisible: producto.estado === EstadoEnum.Inactivo, buttonVariant: 'menuItem', colorClass: 'text-green-700 dark:text-green-400' },
                    ];
                    return <ActionsDropdown actions={productActions} isLoading={loading} />;
                },
            },
        ];
    }, [loading]);

    if ((loading || loadingFilterData) && productos.length === 0) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200"><LoadingSpinner /> Cargando productos...</div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Gestión de Productos</h1>

            <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-grow min-w-[150px]">
                    <Input id="search" type="text" placeholder="Buscar por código o nombre" value={search} onChange={(e) => handleFilterValueChange(setSearch)(e.target.value)} />
                 </div>
                <div>
                     <Select id="estadoFilter" value={estadoFilter} onChange={(e) => handleFilterValueChange(setEstadoFilter)(e.target.value as EstadoEnum | '')} options={[{ value: '', label: 'Todos los estados' }, { value: EstadoEnum.Activo, label: 'Activo' }, { value: EstadoEnum.Inactivo, label: 'Inactivo' }]} />
                 </div>
                 {availableCategoriasFilter.length > 0 && !loadingFilterData && (
                      <div>
                          <Select id="categoriaFilter" value={categoriaFilter || ''} onChange={(e) => handleFilterValueChange(setCategoriaFilter)(e.target.value === '' ? '' : parseInt(e.target.value, 10))} options={[{ value: '', label: 'Todas las categorías' }, ...availableCategoriasFilter.map(c => ({ value: c.categoria_id, label: c.nombre_categoria }))]} />
                      </div>
                 )}
                 {availableUnidadesMedidaFilter.length > 0 && !loadingFilterData && (
                    <div>
                        <Select id="unidadMedidaFilter" value={unidadMedidaFilter || ''} onChange={(e) => handleFilterValueChange(setUnidadMedidaFilter)(e.target.value === '' ? '' : parseInt(e.target.value, 10))} options={[{ value: '', label: 'Todas las unidades' }, ...availableUnidadesMedidaFilter.map(u => ({ value: u.unidad_id, label: `${u.nombre_unidad} (${u.abreviatura})` }))]} />
                    </div>
                 )}
                 {availableMarcasFilter.length > 0 && !loadingFilterData && (
                    <div>
                        <Select id="marcaFilter" value={marcaFilter || ''} onChange={(e) => handleFilterValueChange(setMarcaFilter)(e.target.value === '' ? '' : parseInt(e.target.value, 10))} options={[{ value: '', label: 'Todas las marcas' }, ...availableMarcasFilter.map(m => ({ value: m.marca_id, label: m.nombre_marca }))]} />
                    </div>
                 )}
                 <div className="flex-grow md:flex-none flex justify-end">
                     <Button onClick={handleOpenAddModal} variant="success">Crear Nuevo Producto</Button>
                 </div>
            </div>

            {loading && productos.length > 0 && <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 z-10"><LoadingSpinner /></div>}
            
            {productos.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No hay productos que coincidan con los filtros.</p>
            ) : (
                 <div className="relative overflow-x-auto">
                    <Table columns={columns} data={productos} />
                    <div className="mt-4 flex justify-center items-center space-x-4">
                        <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} variant="secondary">Anterior</Button>
                        <span className="text-gray-700 dark:text-gray-300">
                            Página {currentPage} de {totalPages} (Total: {totalProductos} productos)
                        </span>
                        <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} variant="secondary">Siguiente</Button>
                    </div>
                 </div>
            )}

            <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title="Crear Nuevo Producto" widthClass="max-w-3xl">
                <ProductoForm onSuccess={handleAddSuccess} onCancel={handleCloseAddModal} availableCategorias={availableCategoriasFilter} availableUnidadesMedida={availableUnidadesMedidaFilter} availableMarcas={availableMarcasFilter} />
            </Modal>

            {editingProduct && (
                <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`Editar Producto: ${editingProduct.nombre}`} widthClass="max-w-3xl">
                    <ProductoForm productoId={editingProduct.producto_id} onSuccess={handleEditSuccess} onCancel={handleCloseEditModal} availableCategorias={availableCategoriasFilter} availableUnidadesMedida={availableUnidadesMedidaFilter} availableMarcas={availableMarcasFilter} />
                </Modal>
            )}
        </div>
    );
};

export default ProductosListPage;
