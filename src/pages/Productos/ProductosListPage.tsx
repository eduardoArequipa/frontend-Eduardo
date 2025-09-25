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
import StockDisplay from '../../components/Common/StockDisplay';
import ProductoForm from '../../components/Specific/ProductoForm';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const ProductosListPage: React.FC = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [totalProductos, setTotalProductos] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pageRef = useRef<HTMLDivElement>(null);

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
        error: catalogError,
        notifyProductoCreated,
        notifyProductoUpdated,
        ensureCategorias,
        ensureMarcas
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
                 ...(unidadMedidaFilter !== '' && { unidad_inventario: unidadMedidaFilter }),
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

    // ⚡ CARGA OPTIMIZADA - Asegurar que categorías y marcas estén cargadas para el módulo productos
    useEffect(() => {
        console.log("📦 ProductosListPage: Asegurando que categorías y marcas estén cargadas");
        ensureCategorias();
        ensureMarcas();
    }, [ensureCategorias, ensureMarcas]);

    useEffect(() => {
        if (!isLoadingCatalogs) {
             fetchProductos();
        }
    }, [search, estadoFilter, categoriaFilter, unidadMedidaFilter, marcaFilter, currentPage, itemsPerPage, isLoadingCatalogs]);


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
    const handleAddSuccess = async (producto: Producto) => {
        handleCloseAddModal();
        addNotification('Producto creado con éxito.', 'success');
        
        // 🚀 OPTIMIZACIÓN: Notificar a otros módulos Y actualizar lista local
        notifyProductoCreated(producto);
        await fetchProductos(); // Solo recarga la lista local para paginación
    };

    const handleOpenEditModal = (producto: Producto) => {
        setEditingProduct(producto);
        setIsEditModalOpen(true);
    };
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingProduct(null);
    };
    const handleEditSuccess = async (producto: Producto) => {
        handleCloseEditModal();
        addNotification('Producto actualizado con éxito.', 'success');
        
        // 🚀 OPTIMIZACIÓN: Notificar a otros módulos Y actualizar lista local
        notifyProductoUpdated(producto);
        await fetchProductos(); // Solo recarga la lista local para paginación
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                    {productos.map(producto => {
                        const stock = parseFloat(producto.stock);
                        const stockMinimo = Number(producto.stock_minimo);
                        const precioCompra = parseFloat(producto.precio_compra);
                        const isNewProduct = precioCompra === 0; // Producto sin compras

                        const productActions: ActionConfig[] = [
                            { label: 'Editar', onClick: () => handleOpenEditModal(producto), isVisible: true },
                            { label: 'Desactivar', onClick: () => openConfirmationModal(producto, 'deactivate'), isVisible: producto.estado === EstadoEnum.Activo, colorClass: 'text-red-700 dark:text-red-400' },
                            { label: 'Activar', onClick: () => openConfirmationModal(producto, 'activate'), isVisible: producto.estado === EstadoEnum.Inactivo, colorClass: 'text-green-700 dark:text-green-400' },
                        ];

                        return (
                            <div key={producto.producto_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col relative group"
                                 style={{ zIndex: 1 }}
                                 onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.zIndex = '50'; }}
                                 onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.zIndex = '1'; }}
                            >
                                <div className="relative">
                                    <img 
                                        src={producto.imagen_ruta ? `${BACKEND_BASE_URL}${producto.imagen_ruta}` : '/src/assets/default-product-image.png'} 
                                        alt={`Imagen de ${producto.nombre}`} 
                                        className="h-32 sm:h-36 w-full object-cover rounded-t-lg"
                                        onError={(e) => { e.currentTarget.src = '/src/assets/image-error.png'; }}
                                    />
                                    
                                    {/* Status Badges - Reorganizados */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                                        <div className={`px-3 py-1 text-xs font-bold text-white rounded-full shadow-sm ${producto.estado === EstadoEnum.Activo ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {producto.estado}
                                        </div>
                                        {isNewProduct && (
                                            <div className="px-3 py-1 text-xs font-bold text-white bg-orange-500 rounded-full shadow-sm animate-pulse">
                                                NUEVO
                                            </div>
                                        )}
                                        {/* Alerta de Stock Bajo */}
                                        {!isNewProduct && stock <= stockMinimo && stock > 0 && (
                                            <div className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-full shadow-sm animate-pulse">
                                                STOCK BAJO
                                            </div>
                                        )}
                                        {/* Sin Stock */}
                                        {!isNewProduct && stock === 0 && (
                                            <div className="px-3 py-1 text-xs font-bold text-white bg-gray-800 rounded-full shadow-sm">
                                                SIN STOCK
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Categoría Badge - Mejorado */}
                                    {producto.categoria && (
                                        <div className="absolute bottom-3 left-3">
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 shadow-lg backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
                                                <svg className="w-3 h-3 mr-1 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                {producto.categoria.nombre_categoria}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-3 flex-grow flex flex-col">
                                    {/* Header del producto */}
                                    <div className="mb-2">
                                        <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 truncate" title={producto.nombre}>
                                            {producto.nombre}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {producto.marca?.nombre_marca || 'Sin Marca'}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                                #{producto.codigo}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Información de precios y stock */}
                                    <div className="flex-grow">
                                        {isNewProduct ? (
                                            <div className="text-center py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                                <div className="text-orange-600 dark:text-orange-400 font-medium text-sm">
                                                    ⚠️ Producto nuevo
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Necesita primera compra</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {/* Precios - Más compacto */}
                                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Precios</span>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                                            Margen: {precioCompra > 0 ? (((parseFloat(producto.precio_venta) - precioCompra) / precioCompra) * 100).toFixed(1) : '0'}%
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Compra</p>
                                                            <p className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                                                                {precioCompra.toFixed(2)} Bs.
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Venta</p>
                                                            <p className="font-semibold text-green-600 dark:text-green-400 text-sm">
                                                                {parseFloat(producto.precio_venta).toFixed(2)} Bs.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Stock - Con botón de acciones integrado */}
                                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock</span>
                                                        <div className="flex items-center space-x-2">
                                                            {stock <= stockMinimo && stock > 0 && (
                                                                <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                                                                    ⚠️ Bajo mínimo
                                                                </span>
                                                            )}
                                                            {/* Actions Dropdown integrado */}
                                                            <ActionsDropdown 
                                                                actions={productActions} 
                                                                isLoading={loading} 
                                                            />
                                                        </div>
                                                    </div>
                                                    <StockDisplay
                                                        stock={stock}
                                                        stockMinimo={stockMinimo}
                                                        stockConvertido={producto.stock_convertido}
                                                        stockDesglosado={producto.stock_desglosado}
                                                        unidadBase={producto.unidad_inventario}
                                                        isNewProduct={isNewProduct}
                                                    />
                                                </div>
                                            </div>
                                        )}
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
                showConfirmButton={true}

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