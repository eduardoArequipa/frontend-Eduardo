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
    stock_disponible_base: number;
    unidad_base: string;
    unidad_base_fraccionable: boolean; // Para saber si permite decimales
    conversiones: Conversion[];
    precio_venta_unitario: number; // Precio base en unidad mínima
    cantidades_por_presentacion: {
        [presentacion: string]: number; // Incluye 'Unidad' y otras presentaciones
    };
}

const VentasFormPage: React.FC = () => {
    const navigate = useNavigate();

    // Contexts
    const { metodosPago, isLoading: isLoadingVenta, error: errorVenta, refetchData: refetchVentaData } = useVentaContext();
    const { 
        conversiones: allConversions, 
        isLoading: isLoadingCatalogs, 
        error: errorCatalogs,
        ensureProductos,
        ensureConversiones,
        notifyProductoCreated
    } = useCatalogs();

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

    const { websocketStatus, scannerError, lastScannedProduct, isLoadingProduct } = useScannerWebSocket();
    
    // ⚡ CARGA OPTIMIZADA - Solo cargar lo que necesitamos cuando lo necesitamos
    useEffect(() => {
        ensureProductos();
        ensureConversiones();
    }, [ensureProductos, ensureConversiones]);
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

            if (parseFloat(producto.stock) <= 0) {
                setLocalError(`Stock insuficiente para "${producto.nombre}".`);
                return prev;
            }

            const salesConversions = allConversions.filter((c: Conversion) => c.producto_id === producto.producto_id && c.es_para_venta);

            // Inicializar cantidades en 0 para todas las presentaciones
            const cantidadesPorPresentacion: { [key: string]: number } = {
                'Unidad': 1 // Por defecto, agregar 1 unidad
            };
            
            // Agregar las demás presentaciones en 0
            salesConversions.forEach(conversion => {
                cantidadesPorPresentacion[conversion.nombre_presentacion] = 0;
            });

            const newItem: CarritoItem = {
                producto_id: producto.producto_id,
                codigo: producto.codigo,
                nombre: producto.nombre,
                precio_venta_unitario: parseFloat(String(producto.precio_venta)) || 0,
                stock_disponible_base: parseFloat(producto.stock),
                unidad_base: producto.unidad_inventario.nombre_unidad,
                unidad_base_fraccionable: producto.unidad_inventario.es_fraccionable,
                conversiones: salesConversions,
                cantidades_por_presentacion: cantidadesPorPresentacion,
            };
            return [...prev, newItem];
        });
    }, [allConversions]);

    // Función helper para parsear cantidades según el tipo de unidad
    const parsearCantidad = (valor: string, esFraccionable: boolean): number => {
        if (esFraccionable) {
            return parseFloat(valor) || 0;
        } else {
            return parseInt(valor, 10) || 0;
        }
    };

    const handleSelectAndAddToCart = async (productoBase: ProductoSchemaBase) => {
        setIsSubmitting(true);
        setLocalError(null);
        try {
            const productoCompleto = await getProductoById(productoBase.producto_id);
            addProductToCart(productoCompleto);
        } catch (err) {
            setLocalError('No se pudieron obtener los detalles del producto.');
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
    
    setIsUpdatingAfterProductCreate(true);
    
    try {
        notifyProductoCreated(producto);
        
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
    } catch (error) {
        setLocalError('Error al actualizar la lista de productos.');
    } finally {
        setIsUpdatingAfterProductCreate(false);
        handleCloseAddProductModal();
    }
};

    const handleClienteFormSuccess = (newPersona: IPersonaNested) => {
        setIsClienteModalOpen(false);
        setClienteSeleccionado(newPersona.persona_id);
    };

    const updateCartItemQuantity = useCallback((producto_id: number, presentacion: string, nuevaCantidad: number) => {
        setLocalError(null);
        setCarrito(prevCart => {
            return prevCart.map(item => {
                if (item.producto_id === producto_id) {
                    const updatedCantidades = {
                        ...item.cantidades_por_presentacion,
                        [presentacion]: Math.max(0, nuevaCantidad)
                    };

                    // Calcular total en unidad base para validar stock
                    let totalEnUnidadBase = updatedCantidades['Unidad'];
                    item.conversiones.forEach(conversion => {
                        const cantidadPresentacion = updatedCantidades[conversion.nombre_presentacion] || 0;
                        totalEnUnidadBase += cantidadPresentacion * Number(conversion.unidades_por_presentacion);
                    });

                    if (totalEnUnidadBase > item.stock_disponible_base) {
                        setLocalError(`Stock insuficiente para "${item.nombre}". Disponible: ${item.stock_disponible_base} ${item.unidad_base}(s).`);
                        return item;
                    }

                    return {
                        ...item,
                        cantidades_por_presentacion: updatedCantidades
                    };
                }
                return item;
            }).filter(item => {
                // Mantener el item solo si tiene al menos una cantidad > 0
                return Object.values(item.cantidades_por_presentacion).some(cantidad => cantidad > 0);
            });
        });
    }, []);


    const totalVenta = useMemo(() => {
        return carrito.reduce((acc, item) => {
            let totalItem = 0;
            
            // Sumar precio de unidades
            const cantidadUnidades = item.cantidades_por_presentacion['Unidad'] || 0;
            totalItem += cantidadUnidades * item.precio_venta_unitario;
            
            // Sumar precio de otras presentaciones
            item.conversiones.forEach(conversion => {
                const cantidadPresentacion = item.cantidades_por_presentacion[conversion.nombre_presentacion] || 0;
                const precioUnitarioPresentacion = item.precio_venta_unitario * Number(conversion.unidades_por_presentacion);
                totalItem += cantidadPresentacion * precioUnitarioPresentacion;
            });
            
            return acc + totalItem;
        }, 0);
    }, [carrito]);

    const handleFinalizarVenta = async () => {
        if (carrito.length === 0 || !metodoPagoSeleccionado) {
            setLocalError('El carrito está vacío o falta el método de pago.');
            return;
        }
        setIsSubmitting(true);
        const detallesVenta: DetalleVentaCreate[] = [];
        
        carrito.forEach(item => {
            // Agregar detalle por cada presentación con cantidad > 0
            Object.entries(item.cantidades_por_presentacion).forEach(([presentacion, cantidad]) => {
                if (cantidad > 0) {
                    let precioUnitario = item.precio_venta_unitario;
                    
                    // Si no es 'Unidad', calcular precio según conversión
                    if (presentacion !== 'Unidad') {
                        const conversion = item.conversiones.find(c => c.nombre_presentacion === presentacion);
                        if (conversion) {
                            precioUnitario = item.precio_venta_unitario * Number(conversion.unidades_por_presentacion);
                        }
                    }
                    
                    detallesVenta.push({
                        producto_id: item.producto_id,
                        cantidad: cantidad,
                        precio_unitario: precioUnitario,
                        presentacion_venta: presentacion,
                    });
                }
            });
        });
        const ventaData: VentaCreate = { persona_id: clienteSeleccionado, metodo_pago_id: metodoPagoSeleccionado, estado: EstadoVentaEnum.activa, detalles: detallesVenta, total: totalVenta, solicitar_factura: solicitarFactura };
        try {
            const nuevaVenta = await createVenta(ventaData);
            setVentaExitosa(nuevaVenta);
            setShowSuccessModal(true);
            setCarrito([]);
            refetchVentaData();
            // No necesitamos recargar catálogos después de una venta
        } catch (err: any) {
            setLocalError(err.response?.data?.detail || 'Error al finalizar la venta.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const calcularSubtotalItem = useCallback((item: CarritoItem) => {
        let subtotal = 0;
        
        // Sumar precio de unidades
        const cantidadUnidades = item.cantidades_por_presentacion['Unidad'] || 0;
        subtotal += cantidadUnidades * item.precio_venta_unitario;
        
        // Sumar precio de otras presentaciones
        item.conversiones.forEach(conversion => {
            const cantidadPresentacion = item.cantidades_por_presentacion[conversion.nombre_presentacion] || 0;
            const precioUnitarioPresentacion = item.precio_venta_unitario * Number(conversion.unidades_por_presentacion);
            subtotal += cantidadPresentacion * precioUnitarioPresentacion;
        });
        
        return subtotal;
    }, []);

    const carritoColumns = useMemo(() => [
        { Header: 'Producto', accessor: 'nombre' },
        {
            Header: 'Cantidades por Presentación',
            Cell: ({ row }: { row: { original: CarritoItem } }) => (
                <div className="space-y-3">
                    {/* Unidad base con mejor estilo */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-3">
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 min-w-[80px]">
                                {row.original.unidad_base}:
                            </span>
                            <Input
                                type="number"
                                value={row.original.cantidades_por_presentacion['Unidad'] || 0}
                                onChange={(e) => updateCartItemQuantity(row.original.producto_id, 'Unidad', parsearCantidad(e.target.value, row.original.unidad_base_fraccionable))}
                                className="w-20 text-right"
                                min="0"
                                step={row.original.unidad_base_fraccionable ? "0.01" : "1"}
                                placeholder={row.original.unidad_base_fraccionable ? "1.5" : "1"}
                            />
                        </div>
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                            {row.original.precio_venta_unitario.toFixed(2)} Bs/u
                        </span>
                    </div>
                    
                    {/* Otras presentaciones con mejor estilo */}
                    {row.original.conversiones.filter((c: Conversion) => c.es_para_venta).map(conversion => (
                        <div key={conversion.id} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center space-x-3">
                                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 min-w-[80px]">
                                    {conversion.nombre_presentacion}:
                                </span>
                                <Input
                                    type="number"
                                    value={row.original.cantidades_por_presentacion[conversion.nombre_presentacion] || 0}
                                    onChange={(e) => updateCartItemQuantity(row.original.producto_id, conversion.nombre_presentacion, parseInt(e.target.value, 10) || 0)}
                                    className="w-20 text-right"
                                    min="0"
                                    step="1"
                                    placeholder="1"
                                />
                            </div>
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">
                                {(row.original.precio_venta_unitario * Number(conversion.unidades_por_presentacion)).toFixed(2)} Bs/u
                            </span>
                        </div>
                    ))}
                </div>
            ),
        },
        { 
            Header: 'Subtotal', 
            Cell: ({ row }: { row: { original: CarritoItem } }) => (
                <strong className="text-emerald-600">
                    {calcularSubtotalItem(row.original).toFixed(2)} Bs.
                </strong>
            )
        },
        { 
            Header: 'Acciones', 
            Cell: ({ row }: { row: { original: CarritoItem } }) => (
                <Button 
                    onClick={() => setCarrito(prev => prev.filter(item => item.producto_id !== row.original.producto_id))} 
                    variant="danger" 
                    size="sm"
                >
                    Eliminar
                </Button>
            )
        },
    ], [updateCartItemQuantity, calcularSubtotalItem]);

const globalIsLoading = isLoadingVenta || isLoadingCatalogs || isSubmitting || isUpdatingAfterProductCreate || isLoadingProduct;
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
                    {isLoadingProduct && <span className="ml-2 text-yellow-500">Cargando producto...</span>}
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
            <Modal  showCancelButton={false}  isOpen={isClienteModalOpen}  onClose={() => setIsClienteModalOpen(false)} title="Añadir Nuevo Cliente">
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
