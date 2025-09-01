import React, { useEffect, useState, useRef } from 'react';
import { getProductos, deleteProducto, activateProducto, GetProductosParams } from '../../services/productoService';
import { Producto, ProductoPagination } from '../../types/producto';
import { EstadoEnum } from '../../types/enums';
import { useCatalogs } from '../../context/CatalogContext';
import { useNotification } from '../../context/NotificationContext'; // 1. Importar hook de notificación
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
    const pageRef = useRef<HTMLDivElement>(null);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>(EstadoEnum.Activo);
    const [categoriaFilter, setCategoriaFilter] = useState<number | ''>( '');
    const [unidadMedidaFilter, setUnidadMedidaFilter] = useState<number | ''>( '');
    const [marcaFilter, setMarcaFilter] = useState<number | ''>( '');              

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const { 
        categorias,
        marcas,
        unidadesMedida,
        isLoading: isLoadingCatalogs,
        error: catalogError 
    } = useCatalogs();
    const { addNotification } = useNotification(); // 2. Instanciar hook

    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingProduct, setEditingProduct] = useState<Producto | null>(null);

    // State for confirmation modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
    const [productToConfirm, setProductToConfirm] = useState<Producto | null>(null);
    const [actionToConfirm, setActionToConfirm] = useState<'activate' | 'deactivate' | null>(null);

    const fetchProductos = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: GetProductosParams = {
                 ...(search && { search }),
                 ...(estadoFilter && { estado: estadoFilter }),
                 ...(categoriaFilter !== '' && { categoria: categoriaFilter }),
                 ...(unidadMedidaFilter !== '' && { unidad_medida: unidadMedidaFilter }),
                 ...(marcaFilter !== '' && { marca: marcaFilter }),
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };
            const fetchedData: ProductoPagination = await getProductos(params);
            setProductos(fetchedData.items);
            setTotalProductos(fetchedData.total);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || "Error al cargar los productos.";
            setError(errorMessage);
            addNotification(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoadingCatalogs) {
             fetchProductos();
        }
    }, [search, estadoFilter, categoriaFilter, unidadMedidaFilter, marcaFilter, currentPage, itemsPerPage, isLoadingCatalogs]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdownId !== null && pageRef.current && !pageRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openDropdownId]);

     const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
         setter(value);
         setCurrentPage(1);
     };

    const openConfirmationModal = (producto: Producto, action: 'activate' | 'deactivate') => {
        setProductToConfirm(producto);
        setActionToConfirm(action);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!productToConfirm || !actionToConfirm) return;

        const { producto_id, nombre } = productToConfirm;

        try {
            if (actionToConfirm === 'deactivate') {
                await deleteProducto(producto_id);
                addNotification(`Producto "${nombre}" desactivado con éxito!`, 'success');
            } else if (actionToConfirm === 'activate') {
                await activateProducto(producto_id);
                addNotification(`Producto "${nombre}" activado con éxito!`, 'success');
            }
            fetchProductos();
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message;
            addNotification(`Error al ${actionToConfirm === 'activate' ? 'activar' : 'desactivar'}: ${errorMessage}`, 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setProductToConfirm(null);
            setActionToConfirm(null);
        }
    };

    const handleOpenAddModal = () => setIsAddModalOpen(true);
    const handleCloseAddModal = () => setIsAddModalOpen(false);
    const handleAddSuccess = async () => {
        handleCloseAddModal();
        addNotification('Producto creado con éxito.', 'success'); // 4. Añadir notificación
        await fetchProductos();
    };

    const handleOpenEditModal = (producto: Producto) => {
        setEditingProduct(producto);
        setIsEditModalOpen(true);
    };
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingProduct(null);
    };
    const handleEditSuccess = async () => {
        handleCloseEditModal();
        addNotification('Producto actualizado con éxito.', 'success'); // 4. Añadir notificación
        await fetchProductos();
    };

    const totalPages = Math.ceil(totalProductos / itemsPerPage);

    if ((loading || isLoadingCatalogs) && productos.length === 0) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200"><LoadingSpinner /> Cargando...</div>;
    }

    if (error || catalogError) {
        return <ErrorMessage message={error || catalogError || "Ocurrió un error"} />;
    }

    return (
         <div ref={pageRef} className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-lg min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gestión de Productos</h1>
                <Button onClick={handleOpenAddModal} variant="success" className="mt-4 md:mt-0">
                    Registrar Producto
                </Button>
            </div>

            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <Input 
                        id="search" 
                        type="text" 
                        placeholder="Buscar por código o nombre..." 
                        value={search} 
                        onChange={(e) => handleFilterValueChange(setSearch)(e.target.value)} 
                        className="xl:col-span-1"
                    />
                    <Select 
                        id="estadoFilter" 
                        value={estadoFilter} 
                        onChange={(e) => handleFilterValueChange(setEstadoFilter)(e.target.value as EstadoEnum | '')} 
                        options={[{ value: '', label: 'Todos los estados' }, { value: EstadoEnum.Activo, label: 'Activo' }, { value: EstadoEnum.Inactivo, label: 'Inactivo' }]} 
                    />
                    {/* 4. Usar datos del contexto para los filtros */}
                    {!isLoadingCatalogs && categorias.length > 0 && (
                        <Select 
                            id="categoriaFilter" 
                            value={categoriaFilter || ''} 
                            onChange={(e) => handleFilterValueChange(setCategoriaFilter)(e.target.value === '' ? '' : parseInt(e.target.value, 10))} 
                            options={[{ value: '', label: 'Todas las categorías' }, ...categorias.map(c => ({ value: c.categoria_id, label: c.nombre_categoria }))]} 
                        />
                    )}
                    {!isLoadingCatalogs && marcas.length > 0 && (
                        <Select 
                            id="marcaFilter" 
                            value={marcaFilter || ''} 
                            onChange={(e) => handleFilterValueChange(setMarcaFilter)(e.target.value === '' ? '' : parseInt(e.target.value, 10))} 
                            options={[{ value: '', label: 'Todas las marcas' }, ...marcas.map(m => ({ value: m.marca_id, label: m.nombre_marca }))]} 
                        />
                    )}
                    {!isLoadingCatalogs && unidadesMedida.length > 0 && (
                        <Select 
                            id="unidadMedidaFilter" 
                            value={unidadMedidaFilter || ''} 
                            onChange={(e) => handleFilterValueChange(setUnidadMedidaFilter)(e.target.value === '' ? '' : parseInt(e.target.value, 10))} 
                            options={[{ value: '', label: 'Todas las unidades' }, ...unidadesMedida.map(u => ({ value: u.unidad_id, label: `${u.nombre_unidad} (${u.abreviatura})` }))]} 
                        />
                    )}
                </div>
            </div>

            {loading && productos.length === 0 && (
                 <div className="flex justify-center items-center min-h-[calc(100vh-400px)] text-gray-800 dark:text-gray-200">
                    <LoadingSpinner /> <span className="ml-2">Cargando productos...</span>
                </div>
            )}

            {!loading && productos.length === 0 && !error && (
                <div className="text-center py-10">
                    <p className="text-lg text-gray-500 dark:text-gray-400">No se encontraron productos que coincidan con los filtros.</p>
                </div>
            )}

            <div className="relative">
                {loading && productos.length > 0 && <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 z-10 rounded-lg"><LoadingSpinner /></div>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {productos.map(producto => {
                        const isDropdownOpen = openDropdownId === producto.producto_id;
                        const stock = Number(producto.stock);
                        const stockMinimo = Number(producto.stock_minimo);
                        let stockTextColor = stock <= stockMinimo ? 'text-red-600 dark:text-red-400' : stock > stockMinimo * 2 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400';
                        let stockBgColor = stock <= stockMinimo ? 'bg-red-100 dark:bg-red-900/50' : stock > stockMinimo * 2 ? 'bg-green-100 dark:bg-green-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50';

                        const productActions: ActionConfig[] = [
                            { label: 'Editar', onClick: () => handleOpenEditModal(producto), isVisible: true },
                            { label: 'Desactivar', onClick: () => openConfirmationModal(producto, 'deactivate'), isVisible: producto.estado === EstadoEnum.Activo, colorClass: 'text-red-700 dark:text-red-400' },
                            { label: 'Activar', onClick: () => openConfirmationModal(producto, 'activate'), isVisible: producto.estado === EstadoEnum.Inactivo, colorClass: 'text-green-700 dark:text-green-400' },
                        ];

                        return (
                            <div key={producto.producto_id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out flex flex-col ${isDropdownOpen ? 'z-20' : 'z-10'}`}>
                                <div className="relative">
                                    <img 
                                        src={producto.imagen_ruta ? `${BACKEND_BASE_URL}${producto.imagen_ruta}` : '/src/assets/default-product-image.png'} 
                                        alt={`Imagen de ${producto.nombre}`} 
                                        className="h-48 w-full object-cover"
                                        onError={(e) => { e.currentTarget.src = '/src/assets/image-error.png'; }}
                                    />
                                    <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white rounded-full ${producto.estado === EstadoEnum.Activo ? 'bg-green-500' : 'bg-red-500'}`}>
                                        {producto.estado}
                                    </div>
                                    <div className="absolute top-2 left-2">
                                        <ActionsDropdown 
                                            actions={productActions} 
                                            isLoading={loading} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="p-4 flex-grow flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate" title={producto.nombre}>{producto.nombre}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{producto.marca?.nombre_marca || 'Sin Marca'}</p>
                                    
                                    <div className="mt-4 flex justify-between items-center">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            <p>Compra: <span className="font-semibold text-blue-600 dark:text-blue-400">{Number(producto.precio_compra).toFixed(2)} Bs.</span></p>
                                            <p>Venta: <span className="font-semibold text-green-600 dark:text-green-400">{Number(producto.precio_venta).toFixed(2)} Bs.</span></p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-center ${stockBgColor}`}>
                                            <p className={`font-bold text-sm ${stockTextColor}`}>{stock}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Stock</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4">
                                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Código: {producto.codigo}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {productos.length > 0 && (
                    <div className="mt-8 flex justify-center items-center space-x-4">
                        <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} variant="secondary">Anterior</Button>
                        <span className="text-gray-700 dark:text-gray-300">
                            Página {currentPage} de {totalPages} (Total: {totalProductos} productos)
                        </span>
                        <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} variant="secondary">Siguiente</Button>
                    </div>
                )}
            </div>

            <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title="Registrar Nuevo Producto" widthClass="max-w-3xl" showCancelButton={false}>
                <ProductoForm onSuccess={handleAddSuccess} onCancel={handleCloseAddModal} />
            </Modal>

            {editingProduct && (
                <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`Editar Producto: ${editingProduct.nombre}`} widthClass="max-w-3xl" showCancelButton={false}>
                    <ProductoForm productoId={editingProduct.producto_id} onSuccess={handleEditSuccess} onCancel={handleCloseEditModal} />
                </Modal>
            )}

            {/* Confirmation Modal */}
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmAction}
                title={`Confirmar ${actionToConfirm === 'activate' ? 'Activación' : 'Desactivación'}`}
                confirmButtonText={actionToConfirm === 'activate' ? 'Sí, Activar' : 'Sí, Desactivar'}
                confirmButtonVariant={actionToConfirm === 'activate' ? 'success' : 'danger'}
            >
                {productToConfirm && (
                    <p>
                        ¿Estás seguro de que quieres {actionToConfirm === 'activate' ? 'activar' : 'desactivar'} el producto 
                        <strong className="mx-1">{productToConfirm.nombre}</strong>?
                    </p>
                )}
            </Modal>
        </div>
    );
};

export default ProductosListPage;