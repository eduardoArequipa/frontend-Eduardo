// src/pages/Ventas/VentasFormPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import useScannerWebSocket from '../../hooks/useScannerWebSocket';
import PersonaForm from '../../components/Common/PersonaForm';
import {
    createVenta,
    getMetodosPago,
    getProductoByCodigo
} from '../../services/ventasService';
import { getProductos, getProductoById } from '../../services/productoService';
import { getCategorias } from "../../services/categoriaService";
import { getUnidadesMedida } from "../../services/unidadMedidaService";
import { getMarcas } from "../../services/marcaService";

import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Modal from '../../components/Common/Modal';
import Table from '../../components/Common/Table';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ProductoForm from "../../components/Specific/ProductoForm";
import PersonaAutocomplete from '../../components/Common/PersonaAutocomplete';
import ErrorMessage from '../../components/Common/ErrorMessage';

import { VentaCreate, DetalleVentaCreate } from '../../types/venta';
import { MetodoPagoNested } from '../../types/metodoPago';
import { IPersonaNested } from '../../types/persona';
import { Producto, ConversionCompra } from '../../types/producto';
import { EstadoVentaEnum, EstadoEnum } from '../../types/enums';
import { CategoriaNested } from "../../types/categoria";
import { UnidadMedidaNested } from "../../types/unidad_medida";
import { MarcaNested } from "../../types/marca";
import Select from '../../components/Common/Select';

// Interfaz unificada para el carrito
export interface CarritoItem {
    producto_id: number;
    codigo: string;
    nombre: string;
    cantidad: number;
    precio_unitario_presentacion: number; // Precio de la presentación seleccionada
    stock_disponible_base: number;
    unidad_base: string;
    presentacion_seleccionada: string; // Ej: "Unidad", "Caja"
    conversiones: ConversionCompra[];
}

const VentasFormPage: React.FC = () => {
    const navigate = useNavigate();

    // Estados restaurados y nuevos
    const [codigoProducto, setCodigoProducto] = useState<string>('');
    const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
    const [carrito, setCarrito] = useState<CarritoItem[]>([]);
    const [metodosPago, setMetodosPago] = useState<MetodoPagoNested[]>([]);
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<number | null>(null);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<number | null>(null);
    const [productoSearchTerm, setProductoSearchTerm] = useState('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [ventaExitosaId, setVentaExitosaId] = useState<number | null>(null);

    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
    const [availableCategorias, setAvailableCategorias] = useState<CategoriaNested[]>([]);
    const [availableUnidadesMedida, setAvailableUnidadesMedida] = useState<UnidadMedidaNested[]>([]);
    const [availableMarcas, setAvailableMarcas] = useState<MarcaNested[]>([]);
    const [loadingCatalogs, setLoadingCatalogs] = useState(true);
    const [isClienteModalOpen, setIsClienteModalOpen] = useState<boolean>(false);

    const { websocketStatus, scannerError, lastScannedProduct } = useScannerWebSocket();

    const filteredProducts = useMemo(() => {
        if (!productoSearchTerm) return [];
        return productosDisponibles.filter(p =>
            p.nombre.toLowerCase().includes(productoSearchTerm.toLowerCase()) ||
            p.codigo.toLowerCase().includes(productoSearchTerm.toLowerCase())
        );
    }, [productosDisponibles, productoSearchTerm]);

    const addProductToCart = useCallback((producto: Producto) => {
        setError(null);
        setCarrito(prev => {
            const existingItem = prev.find(item => item.producto_id === producto.producto_id);
            if (existingItem) {
                setError(`El producto "${producto.nombre}" ya está en el carrito.`);
                return prev;
            }

            if (producto.stock <= 0) {
                setError(`Stock insuficiente para "${producto.nombre}".`);
                return prev;
            }

            const newItem: CarritoItem = {
                producto_id: producto.producto_id,
                codigo: producto.codigo,
                nombre: producto.nombre,
                cantidad: 1,
                precio_unitario_presentacion: producto.precio_venta, // Precio base inicial
                stock_disponible_base: producto.stock,
                unidad_base: producto.unidad_inventario.nombre_unidad,
                presentacion_seleccionada: 'Unidad', // Default
                conversiones: producto.conversiones,
            };
            return [...prev, newItem];
        });
        setProductoSearchTerm('');
    }, []);

    useEffect(() => {
        if (lastScannedProduct) {
            addProductToCart(lastScannedProduct);
        }
        if (scannerError) {
            setError(`Error del escáner: ${scannerError}`);
        }
    }, [lastScannedProduct, scannerError, addProductToCart]);

    const fetchProductsForSale = async () => {
        try {
            const productosData = await getProductos({ limit: 1000, estado: EstadoEnum.Activo });
            setProductosDisponibles(productosData.items.filter(p => p.estado === EstadoEnum.Activo));
        } catch (err) {
            setError('Error al recargar los productos disponibles.');
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [metodosData] = await Promise.all([
                    getMetodosPago({ estado: EstadoEnum.Activo }),
                ]);
                setMetodosPago(metodosData);
                if (metodosData.length > 0) {
                    setMetodoPagoSeleccionado(metodosData[0].metodo_pago_id);
                }
                await fetchProductsForSale();
            } catch (err) {
                setError('Error al cargar datos iniciales.');
            } finally {
                setIsLoading(false);
            }
        };

        const loadCatalogs = async () => {
            setLoadingCatalogs(true);
            try {
                const [categoriasData, unidadesMedidaData, marcasData] = await Promise.all([
                    getCategorias({ limit: 100 }),
                    getUnidadesMedida({ limit: 100 }),
                    getMarcas({ limit: 100 }),
                ]);
                setAvailableCategorias(categoriasData.items);
                setAvailableUnidadesMedida(unidadesMedidaData);
                setAvailableMarcas(marcasData);
            } catch (err) {
                setError("Error al cargar catálogos.");
            } finally {
                setLoadingCatalogs(false);
            }
        };

        loadInitialData();
        loadCatalogs();
    }, []);

    const handleOpenAddProductModal = () => setIsAddProductModalOpen(true);
    const handleCloseAddProductModal = () => setIsAddProductModalOpen(false);
    const handleProductFormSuccess = () => {
        handleCloseAddProductModal();
        fetchProductsForSale();
    };

    const handleClienteFormSuccess = (newPersona: IPersonaNested) => {
        setIsClienteModalOpen(false);
        setClienteSeleccionado(newPersona.persona_id);
    };

    const handleScanOrEnterProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!codigoProducto.trim()) return;
        try {
            const producto = await getProductoByCodigo(codigoProducto.trim());
            addProductToCart(producto);
            setCodigoProducto('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Producto no encontrado.');
        }
    };

    const updateCartItem = useCallback((producto_id: number, updates: Partial<Omit<CarritoItem, 'conversiones' | 'stock_disponible_base'>>) => {
        setError(null);
        setCarrito(prevCart => {
            const newCart = prevCart.map(item => {
                if (item.producto_id === producto_id) {
                    const originalProduct = productosDisponibles.find(p => p.producto_id === producto_id);
                    if (!originalProduct) return item; // No debería pasar si el item está en el carrito

                    const updatedItem = { ...item, ...updates };

                    // Si la presentación cambió, recalcular el precio unitario de la presentación
                    if (updates.presentacion_seleccionada) {
                        if (updates.presentacion_seleccionada === 'Unidad') {
                            updatedItem.precio_unitario_presentacion = originalProduct.precio_venta;
                        } else {
                            const conversion = originalProduct.conversiones.find(c => c.nombre_presentacion === updates.presentacion_seleccionada);
                            updatedItem.precio_unitario_presentacion = conversion
                                ? originalProduct.precio_venta * conversion.unidad_inventario_por_presentacion
                                : originalProduct.precio_venta; // Fallback
                        }
                    }

                    // Validar stock con los datos actualizados
                    const conversionFactor = updatedItem.presentacion_seleccionada === 'Unidad'
                        ? 1
                        : originalProduct.conversiones.find(c => c.nombre_presentacion === updatedItem.presentacion_seleccionada)?.unidad_inventario_por_presentacion || 1;
                    
                    const cantidadEnUnidadBase = updatedItem.cantidad * conversionFactor;

                    if (cantidadEnUnidadBase > updatedItem.stock_disponible_base) {
                        setError(`Stock insuficiente para "${updatedItem.nombre}". Disponible: ${updatedItem.stock_disponible_base} ${updatedItem.unidad_base}(s).`);
                        return item; // Devolver el item original sin cambios si no hay stock
                    }

                    return updatedItem; // Devolver el item con los cambios aplicados
                }
                return item;
            });
            return newCart.filter(item => item.cantidad > 0); // Limpiar items con cantidad 0
        });
    }, [productosDisponibles]);


    const totalVenta = useMemo(() => {
        return carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario_presentacion), 0);
    }, [carrito]);

    const handleFinalizarVenta = async () => {
        if (carrito.length === 0 || !metodoPagoSeleccionado) {
            setError('El carrito está vacío o falta el método de pago.');
            return;
        }
        setIsLoading(true);
        const detallesVenta: DetalleVentaCreate[] = carrito.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario_presentacion,
            presentacion_venta: item.presentacion_seleccionada,
        }));
        const ventaData: VentaCreate = { persona_id: clienteSeleccionado, metodo_pago_id: metodoPagoSeleccionado, estado: EstadoVentaEnum.activa, detalles: detallesVenta, total: totalVenta };
        try {
            const nuevaVenta = await createVenta(ventaData);
            setVentaExitosaId(nuevaVenta.venta_id);
            setShowSuccessModal(true);
            setCarrito([]);
            fetchProductsForSale();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al finalizar la venta.');
        } finally {
            setIsLoading(false);
        }
    };

    const carritoColumns = useMemo(() => [
        { Header: 'Producto', accessor: 'nombre' },
        {
            Header: 'Cantidad',
            Cell: ({ row }: { row: { original: CarritoItem } }) => (
                <Input type="number" value={row.original.cantidad} onChange={(e) => updateCartItem(row.original.producto_id, { cantidad: parseInt(e.target.value, 10) || 1 })} className="w-24 text-right" min="1" />
            ),
        },
        {
            Header: 'Presentación',
            Cell: ({ row }: { row: { original: CarritoItem } }) => (
                <Select value={row.original.presentacion_seleccionada} onChange={(e) => updateCartItem(row.original.producto_id, { presentacion_seleccionada: e.target.value })}>
                    <option value="Unidad">Unidad ({row.original.unidad_base})</option>
                    {row.original.conversiones.map(c => <option key={c.conversion_id} value={c.nombre_presentacion}>{c.nombre_presentacion}</option>)}
                </Select>
            ),
        },
        { Header: 'Precio Unit.', Cell: ({ row }: { row: { original: CarritoItem } }) => <span>{`${ (row.original.precio_unitario_presentacion)} Bs.`}</span> },
        { Header: 'Subtotal', Cell: ({ row }: { row: { original: CarritoItem } }) => <strong>{`${(row.original.cantidad * row.original.precio_unitario_presentacion).toFixed(2)} Bs.`}</strong> },
        { Header: 'Acciones', Cell: ({ row }: { row: { original: CarritoItem } }) => <Button onClick={() => setCarrito(prev => prev.filter(item => item.producto_id !== row.original.producto_id))} variant="danger" size="sm">X</Button> },
    ], [updateCartItem]);

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Nueva Orden de Venta</h1>
            {isLoading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center justify-end">
                Estado del escáner: <span className={`ml-2 font-semibold ${websocketStatus.includes('Conectado') ? 'text-green-600' : 'text-red-600'}`}>{websocketStatus}</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">1. Detalles de la Venta</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <PersonaAutocomplete onPersonaSelect={(p) => setClienteSeleccionado(p ? p.persona_id : null)} rolFilterName="Cliente" />
                                <Button type="button" onClick={() => setIsClienteModalOpen(true)} variant="success" size="sm">+</Button>
                            </div>
                            <Select value={metodoPagoSeleccionado || ''} onChange={(e) => setMetodoPagoSeleccionado(Number(e.target.value))}>
                                {metodosPago.map(m => <option key={m.metodo_pago_id} value={m.metodo_pago_id}>{m.nombre_metodo}</option>)}
                            </Select>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">2. Añadir Productos</h2>
                        <form onSubmit={handleScanOrEnterProduct} className="mb-4 flex gap-2">
                            <Input type="text" placeholder="Escanear o introducir código" value={codigoProducto} onChange={(e) => setCodigoProducto(e.target.value)} className="flex-grow" />
                            <Button type="submit" variant="primary">Añadir</Button>
                        </form>
                        <Input type="text" placeholder="O buscar por nombre..." value={productoSearchTerm} onChange={(e) => setProductoSearchTerm(e.target.value)} />
                        <div className="mt-2 max-h-60 overflow-y-auto border rounded-md">
                            {filteredProducts.map(p => (
                                <li key={p.producto_id} className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between" onClick={() => addProductToCart(p)}>
                                    <span>{p.nombre} ({p.codigo})</span> <span className='text-sm text-gray-500'>Stock: {p.stock}</span>
                                </li>
                            ))}
                        </div>
                        <Button type="button" onClick={handleOpenAddProductModal} variant="secondary" size="sm" disabled={loadingCatalogs} className="mt-4">+ Nuevo Producto</Button>
                    </div>
                </div>
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">3. Carrito ({carrito.length})</h2>
                    <div className="flex-grow min-h-[300px]">
                        {carrito.length === 0 ? <p className="text-center text-gray-500">El carrito está vacío.</p> : <Table columns={carritoColumns} data={carrito} />}
                    </div>
                    {carrito.length > 0 && (
                        <div className="mt-auto pt-4 border-t">
                            <div className="text-right p-4 bg-indigo-50 rounded-md">
                                <p className="text-2xl font-bold text-indigo-800">Total: {totalVenta.toFixed(2)} Bs.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
                <Button onClick={() => navigate("/ventas")} variant="secondary">Cancelar</Button>
                <Button onClick={handleFinalizarVenta} variant="primary" disabled={isLoading || carrito.length === 0}>Finalizar Venta</Button>
            </div>
            <Modal isOpen={isAddProductModalOpen} onClose={handleCloseAddProductModal} title="Crear Nuevo Producto">
                <ProductoForm onSuccess={handleProductFormSuccess} onCancel={handleCloseAddProductModal} availableCategorias={availableCategorias} availableUnidadesMedida={availableUnidadesMedida} availableMarcas={availableMarcas} />
            </Modal>
            <Modal isOpen={isClienteModalOpen} onClose={() => setIsClienteModalOpen(false)} title="Añadir Nuevo Cliente">
                <PersonaForm mode="assign-role" roleToAssign="Cliente" onSuccess={handleClienteFormSuccess} onCancel={() => setIsClienteModalOpen(false)} />
            </Modal>
            <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Venta Realizada con Éxito">
                <p>La venta #{ventaExitosaId} ha sido registrada correctamente.</p>
            </Modal>
        </div>
    );
};

export default VentasFormPage;
