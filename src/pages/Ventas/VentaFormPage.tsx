// src/pages/Ventas/VentasFormPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import useScannerWebSocket from '../../hooks/useScannerWebSocket';
import PersonaForm from '../../components/Common/PersonaForm';
import {
    createVenta,
    descargarFacturaPdf,
} from '../../services/ventasService';
import { getProductoById } from '../../services/productoService';
import { useVentaContext } from '../../context/VentaContext';
import { useCatalogs } from '../../context/CatalogContext';

import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Modal from '../../components/Common/Modal';
import Table from '../../components/Common/Table';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ProductoForm from "../../components/Specific/ProductoForm";
import PersonaAutocomplete from '../../components/Common/PersonaAutocomplete';
import ErrorMessage from '../../components/Common/ErrorMessage';
import ProductSaleAutocomplete from '../../components/Common/ProductSaleAutocomplete';

import { Venta, VentaCreate, DetalleVentaCreate } from '../../types/venta';
import { IPersonaNested } from '../../types/persona';
import { Producto, Conversion, ProductoSchemaBase } from '../../types/producto';
import { EstadoVentaEnum } from '../../types/enums';
import Select from '../../components/Common/Select';

export interface CarritoItem {
    producto_id: number;
    codigo: string;
    nombre: string;
    cantidad: number;
    precio_unitario_presentacion: number;
    stock_disponible_base: number;
    unidad_base: string;
    presentacion_seleccionada: string;
    conversiones: Conversion[];
}

const VentasFormPage: React.FC = () => {
    const navigate = useNavigate();

    // Contexts
    const { metodosPago, isLoading: isLoadingVenta, error: errorVenta, refetchData: refetchVentaData } = useVentaContext();
    const { productos, conversiones: allConversions, isLoading: isLoadingCatalogs, error: errorCatalogs, refetchCatalogs } = useCatalogs();

    // Estados locales
    const [carrito, setCarrito] = useState<CarritoItem[]>([]);
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<number | null>(null);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<number | null>(null);
    const [solicitarFactura, setSolicitarFactura] = useState<boolean>(true);
    
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [ventaExitosa, setVentaExitosa] = useState<Venta | null>(null);

    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
    const [isClienteModalOpen, setIsClienteModalOpen] = useState<boolean>(false);

    const { websocketStatus, scannerError, lastScannedProduct } = useScannerWebSocket();
    useEffect(() => {
        refetchCatalogs();
    }, [refetchCatalogs]);
    useEffect(() => {
        if (metodosPago.length > 0 && !metodoPagoSeleccionado) {
            setMetodoPagoSeleccionado(metodosPago[0].metodo_pago_id);
        }
    }, [metodosPago, metodoPagoSeleccionado]);


    const addProductToCart = useCallback((producto: Producto) => {
        setLocalError(null);
        setCarrito(prev => {
            const existingItem = prev.find(item => item.producto_id === producto.producto_id);
            if (existingItem) {
                setLocalError(`El producto "${producto.nombre}" ya está en el carrito.`);
                return prev;
            }

            if (producto.stock <= 0) {
                setLocalError(`Stock insuficiente para "${producto.nombre}".`);
                return prev;
            }

            const salesConversions = allConversions.filter((c: Conversion) => c.producto_id === producto.producto_id && c.es_para_venta);

            const newItem: CarritoItem = {
                producto_id: producto.producto_id,
                codigo: producto.codigo,
                nombre: producto.nombre,
                cantidad: 1,
                precio_unitario_presentacion: producto.precio_venta,
                stock_disponible_base: producto.stock,
                unidad_base: producto.unidad_inventario.nombre_unidad,
                presentacion_seleccionada: 'Unidad',
                conversiones: salesConversions,
            };
            return [...prev, newItem];
        });
    }, [allConversions]);

    const handleSelectAndAddToCart = async (productoBase: ProductoSchemaBase) => {
        setIsSubmitting(true);
        setLocalError(null);
        try {
            const productoCompleto = await getProductoById(productoBase.producto_id);
            addProductToCart(productoCompleto);
        } catch (err) {
            setLocalError('No se pudieron obtener los detalles del producto.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (lastScannedProduct) {
            addProductToCart(lastScannedProduct);
        }
        if (scannerError) {
            setLocalError(`Error del escáner: ${scannerError}`);
        }
    }, [lastScannedProduct, scannerError, addProductToCart]);

    const handleOpenAddProductModal = () => setIsAddProductModalOpen(true);
    const handleCloseAddProductModal = () => setIsAddProductModalOpen(false);
const [isUpdatingAfterProductCreate, setIsUpdatingAfterProductCreate] = useState(false);

const handleProductFormSuccess = async (producto: Producto): Promise<void> => {
    console.log('🔄 Iniciando actualización después de crear producto:', producto.nombre);
    
    setIsUpdatingAfterProductCreate(true);
    
    try {
        // 1. Actualizar catálogos primero
        console.log('📡 Actualizando catálogos...');
        await refetchCatalogs();
        
        // 2. Actualizar datos específicos de venta
        console.log('📊 Actualizando datos de venta...');
        await refetchVentaData();
        
        // 3. Esperar un momento para asegurar propagación
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('✅ Actualización completada');
        
    } catch (error) {
        console.error('❌ Error durante actualización:', error);
        setLocalError('Error al actualizar los datos después de crear el producto.');
    } finally {
        setIsUpdatingAfterProductCreate(false);
        handleCloseAddProductModal(); // ✅ Cerrar modal DESPUÉS de actualizar
    }
};

    const handleClienteFormSuccess = (newPersona: IPersonaNested) => {
        setIsClienteModalOpen(false);
        setClienteSeleccionado(newPersona.persona_id);
    };

    const updateCartItem = useCallback((producto_id: number, updates: Partial<Omit<CarritoItem, 'conversiones' | 'stock_disponible_base'>>) => {
        setLocalError(null);
        setCarrito(prevCart => {
            const newCart = prevCart.map(item => {
                if (item.producto_id === producto_id) {
                    const originalProduct = productos.find(p => p.producto_id === producto_id);
                    if (!originalProduct) return item; 

                    const updatedItem = { ...item, ...updates };

                    const salesConversions = allConversions.filter((c: Conversion) => c.producto_id === originalProduct.producto_id && c.es_para_venta);

                    if (updates.presentacion_seleccionada) {
                        if (updates.presentacion_seleccionada === 'Unidad') {
                            updatedItem.precio_unitario_presentacion = originalProduct.precio_venta;
                        } else {
                            const conversion = salesConversions.find(c => c.nombre_presentacion === updates.presentacion_seleccionada);
                            updatedItem.precio_unitario_presentacion = conversion
                                ? originalProduct.precio_venta * Number(conversion.unidades_por_presentacion)
                                : originalProduct.precio_venta;
                        }
                    }

                    const conversionFactor = updatedItem.presentacion_seleccionada === 'Unidad'
                        ? 1
                        : salesConversions.find(c => c.nombre_presentacion === updatedItem.presentacion_seleccionada)?.unidades_por_presentacion || 1;
                    
                    const cantidadEnUnidadBase = updatedItem.cantidad * Number(conversionFactor);

                    if (cantidadEnUnidadBase > updatedItem.stock_disponible_base) {
                        setLocalError(`Stock insuficiente para "${updatedItem.nombre}". Disponible: ${updatedItem.stock_disponible_base} ${updatedItem.unidad_base}(s).`);
                        return item; 
                    }

                    return updatedItem; 
                }
                return item;
            });
            return newCart.filter(item => item.cantidad > 0); 
        });
    }, [productos, allConversions]);


    const totalVenta = useMemo(() => {
        return carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario_presentacion), 0);
    }, [carrito]);

    const handleFinalizarVenta = async () => {
        if (carrito.length === 0 || !metodoPagoSeleccionado) {
            setLocalError('El carrito está vacío o falta el método de pago.');
            return;
        }
        setIsSubmitting(true);
        const detallesVenta: DetalleVentaCreate[] = carrito.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario_presentacion,
            presentacion_venta: item.presentacion_seleccionada,
        }));
        const ventaData: VentaCreate = { persona_id: clienteSeleccionado, metodo_pago_id: metodoPagoSeleccionado, estado: EstadoVentaEnum.activa, detalles: detallesVenta, total: totalVenta, solicitar_factura: solicitarFactura };
        try {
            const nuevaVenta = await createVenta(ventaData);
            console.log("Respuesta de createVenta:", JSON.stringify(nuevaVenta, null, 2));
            setVentaExitosa(nuevaVenta);
            setShowSuccessModal(true);
            setCarrito([]);
            refetchVentaData();
            refetchCatalogs();
        } catch (err: any) {
            setLocalError(err.response?.data?.detail || 'Error al finalizar la venta.');
        } finally {
            setIsSubmitting(false);
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
                    {row.original.conversiones.filter((c: Conversion) => c.es_para_venta).map(c => <option key={c.id} value={c.nombre_presentacion}>{c.nombre_presentacion}</option>)}
                </Select>
            ),
        },
        { Header: 'Precio Unit.', Cell: ({ row }: { row: { original: CarritoItem } }) => <span>{`${ (row.original.precio_unitario_presentacion)} Bs.`}</span> },
        { Header: 'Subtotal', Cell: ({ row }: { row: { original: CarritoItem } }) => <strong>{`${(row.original.cantidad * row.original.precio_unitario_presentacion).toFixed(2)} Bs.`}</strong> },
        { Header: 'Acciones', Cell: ({ row }: { row: { original: CarritoItem } }) => <Button onClick={() => setCarrito(prev => prev.filter(item => item.producto_id !== row.original.producto_id))} variant="danger" size="sm">X</Button> },
    ], [updateCartItem]);

const globalIsLoading = isLoadingVenta || isLoadingCatalogs || isSubmitting || isUpdatingAfterProductCreate;
    const globalError = errorVenta || errorCatalogs || localError;

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Nueva Venta</h1>
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    Estado del escáner: 
                    <span className={`ml-2 font-semibold ${websocketStatus.includes('Conectado') ? 'text-green-500' : 'text-red-500'}`}>
                        {websocketStatus}
                    </span>
                </div>
            </div>

            {globalIsLoading && <LoadingSpinner />}
            {globalError && <ErrorMessage message={globalError} onClose={() => setLocalError(null)} />}

            <div className="flex flex-col gap-8">
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2">Paso 1: Datos Generales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Cliente</label>
                            <div className="flex items-center">
                                <PersonaAutocomplete onPersonaSelect={(p) => setClienteSeleccionado(p ? p.persona_id : null)} rolFilterName="Cliente" />
                                <Button type="button" onClick={() => setIsClienteModalOpen(true)} variant="success" size="sm" className="ml-2">+</Button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Método de Pago</label>
                            <Select value={metodoPagoSeleccionado || ''} onChange={(e) => setMetodoPagoSeleccionado(Number(e.target.value))}>
                                {metodosPago.map(m => <option key={m.metodo_pago_id} value={m.metodo_pago_id}>{m.nombre_metodo}</option>)}
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2">Paso 2: Carrito de Compras ({carrito.length} items)</h2>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-grow">
                            <ProductSaleAutocomplete
                                onProductSelect={handleSelectAndAddToCart}
                            />
                        </div>
                        <Button type="button" onClick={handleOpenAddProductModal} variant="secondary" size="sm" disabled={isLoadingCatalogs}>
                            + Nuevo Producto
                        </Button>
                    </div>

                    <div className="flex-grow min-h-[250px]">
                        {carrito.length === 0 
                            ? <div className="flex items-center justify-center h-full text-gray-500">El carrito está vacío. Añade productos para empezar.</div> 
                            : <Table columns={carritoColumns} data={carrito} />
                        }
                    </div>

                    {carrito.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-end items-center">
                                <span className="text-lg text-gray-600 dark:text-gray-300 mr-4">Total a Pagar:</span>
                                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">
                                    {totalVenta.toFixed(2)} Bs.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-between items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <div>
                        <label htmlFor="solicitar-factura" className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="solicitar-factura"
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                checked={solicitarFactura}
                                onChange={(e) => setSolicitarFactura(e.target.checked)}
                            />
                            <span className="ml-3 text-md font-medium text-gray-700 dark:text-gray-200">
                                Solicitar Factura Electrónica
                            </span>
                        </label>
                    </div>
                    <div className="flex space-x-4">
                        <Button onClick={() => navigate("/ventas")} variant="secondary" size="lg">Cancelar Venta</Button>
                        <Button onClick={handleFinalizarVenta} variant="primary" size="lg" disabled={globalIsLoading || carrito.length === 0}>
                            Finalizar Venta
                        </Button>
                    </div>
                </div>
            </div>

            <Modal isOpen={isAddProductModalOpen} onClose={handleCloseAddProductModal} title="Crear Nuevo Producto">
                <ProductoForm onSuccess={handleProductFormSuccess} onCancel={handleCloseAddProductModal} />
            </Modal>
            <Modal isOpen={isClienteModalOpen} onClose={() => setIsClienteModalOpen(false)} title="Añadir Nuevo Cliente">
                <PersonaForm mode="assign-role" roleToAssign="Cliente" onSuccess={handleClienteFormSuccess} onCancel={() => setIsClienteModalOpen(false)} />
            </Modal>
            <Modal 
                isOpen={showSuccessModal} 
                onClose={() => {
                    setShowSuccessModal(false);
                    setVentaExitosa(null);
                }} 
                title="Venta Realizada con Éxito"
            >
                {ventaExitosa && (
                    <div>
                        <p className="text-lg">La venta <span className="font-bold">#{ventaExitosa.venta_id}</span> ha sido registrada correctamente.</p>
                        
                        {ventaExitosa.factura_electronica && ventaExitosa.factura_electronica.estado === 'VALIDADA' && (
                            <div className="mt-6 text-center">
                                <p className="text-md text-green-700 dark:text-green-400 mb-4">Factura electrónica generada exitosamente.</p>
                                <Button 
                                    variant="success" 
                                    onClick={() => {
                                        if (ventaExitosa.factura_electronica?.factura_id) {
                                            descargarFacturaPdf(ventaExitosa.factura_electronica.factura_id);
                                        }
                                    }}
                                >
                                    Descargar Factura (PDF)
                                </Button>
                            </div>
                        )}

                        {ventaExitosa.factura_electronica && ventaExitosa.factura_electronica.estado !== 'VALIDADA' && (
                             <div className="mt-6 text-center p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                <p className="text-md text-yellow-800 dark:text-yellow-200">
                                    El estado de la factura es: <span className="font-bold">{ventaExitosa.factura_electronica.estado}</span>. No se puede descargar el PDF en este momento.
                                </p>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <Button 
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setVentaExitosa(null);
                                }} 
                                variant="primary"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default VentasFormPage;
