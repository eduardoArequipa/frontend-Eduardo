// src/pages/Ventas/VentasFormPage.tsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import useScannerWebSocket from '../../hooks/useScannerWebSocket';
import PersonaForm from '../../components/Common/PersonaForm';
import {
    createVenta,
    getProductoByCodigo,
    getMetodosPago,
    getProductosParaVenta
} from '../../services/ventasService';
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
import { ProductoSchemaBase } from '../../types/producto';
import { EstadoVentaEnum, EstadoEnum } from '../../types/enums';
import { CategoriaNested } from "../../types/categoria";
import { UnidadMedidaNested } from "../../types/unidad_medida";
import { MarcaNested } from "../../types/marca";

export interface CarritoItem {
    producto_id: number;
    codigo: string;
    nombre: string;
    cantidad_entrada: number;
    precio_unitario: number;
    stock_disponible_base_unit: number;
    metros_por_rollo: number | null;
    is_meter_product: boolean;
    sale_mode: 'rollo' | 'metro' | 'unidad';
}

const VentasFormPage: React.FC = () => {
    const navigate = useNavigate();

    const [codigoProducto, setCodigoProducto] = useState<string>('');
    const [productosDisponibles, setProductosDisponibles] = useState<ProductoSchemaBase[]>([]);
    const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<number | null>(null);
    const [carrito, setCarrito] = useState<CarritoItem[]>([]);
    const [metodosPago, setMetodosPago] = useState<MetodoPagoNested[]>([]);
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<number | null>(null);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<number | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
    const [formMessage, setFormMessage] = useState<string | null>(null);
    const [productoSearchTerm, setProductoSearchTerm] = useState('');

        const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [ventaExitosaId, setVentaExitosaId] = useState<number | null>(null);


    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
    const [availableCategorias, setAvailableCategorias] = useState<CategoriaNested[]>([]);
    const [availableUnidadesMedida, setAvailableUnidadesMedida] = useState<UnidadMedidaNested[]>([]);
    const [availableMarcas, setAvailableMarcas] = useState<MarcaNested[]>([]);
    const [loadingCatalogs, setLoadingCatalogs] = useState(true);
    const [isClienteModalOpen, setIsClienteModalOpen] = useState<boolean>(false);

    const { websocketStatus, scannerError, lastScannedProduct, lastScannedType } = useScannerWebSocket();

    const filteredProducts = useMemo(() => {
        if (!productoSearchTerm) {
            return productosDisponibles;
        }
        return productosDisponibles.filter(p =>
            p.nombre.toLowerCase().includes(productoSearchTerm.toLowerCase()) ||
            p.codigo.toLowerCase().includes(productoSearchTerm.toLowerCase())
        );
    }, [productosDisponibles, productoSearchTerm]);

    const addOrUpdateProductInCart = useCallback((producto: ProductoSchemaBase) => {
        setCarrito(prevCarrito => {
            const isMeterProduct = producto.metros_por_rollo !== undefined && producto.metros_por_rollo !== null && producto.metros_por_rollo > 0;
            const existingItem = prevCarrito.find(item => Number(item.producto_id) === producto.producto_id);

            const quantityToAdd = 1;
            let initialSaleMode: 'rollo' | 'metro' | 'unidad' = 'unidad';
            let quantityInBaseUnitForCheck = quantityToAdd;

            if (isMeterProduct) {
                initialSaleMode = producto.metros_por_rollo && producto.metros_por_rollo > 0 ? 'rollo' : 'metro';
                quantityInBaseUnitForCheck = initialSaleMode === 'rollo'
                    ? quantityToAdd * (producto.metros_por_rollo || 0)
                    : quantityToAdd;
            }

            if (existingItem) {
                let newQuantityEntry = existingItem.cantidad_entrada + quantityToAdd;
                let newQuantityInBaseUnit: number;

                if (existingItem.is_meter_product) {
                    newQuantityInBaseUnit = (existingItem.sale_mode === 'rollo')
                        ? newQuantityEntry * (existingItem.metros_por_rollo || 0)
                        : newQuantityEntry;
                } else {
                    newQuantityInBaseUnit = newQuantityEntry;
                }

                if (newQuantityInBaseUnit > producto.stock) {
                    setError(`¡Stock insuficiente para "${producto.nombre}"! Disponible: ${producto.stock.toFixed(2)} ${isMeterProduct ? 'metros' : 'unidades'}.`);
                    return prevCarrito;
                }

                setError(null);
                return prevCarrito.map(item =>
                    item.producto_id === producto.producto_id
                        ? { ...item, cantidad_entrada: newQuantityEntry }
                        : item
                );
            } else {
                if (quantityInBaseUnitForCheck > producto.stock) {
                    setError(`¡Stock insuficiente para "${producto.nombre}"! Disponible: ${producto.stock.toFixed(2)} ${isMeterProduct ? 'metros' : 'unidades'}.`);
                    return prevCarrito;
                }

                setError(null);
                return [
                    ...prevCarrito,
                    {
                        producto_id: producto.producto_id,
                        codigo: producto.codigo,
                        nombre: producto.nombre,
                        cantidad_entrada: quantityToAdd,
                        precio_unitario: producto.precio_venta,
                        stock_disponible_base_unit: producto.stock,
                        metros_por_rollo: producto.metros_por_rollo !== undefined ? producto.metros_por_rollo : null,
                        is_meter_product: isMeterProduct,
                        sale_mode: initialSaleMode
                    }
                ];
            }
        });
    }, []);

    const fetchProductsForSale = async () => {
        try {
            const productosData = await getProductosParaVenta({ limit: 1000, estado: EstadoEnum.Activo });
            setProductosDisponibles(productosData.items.filter(p => p.estado === EstadoEnum.Activo && p.stock > 0));
        } catch (err) {
            setError('Error al recargar los productos disponibles.');
        }
    };

    useEffect(() => {
        if (lastScannedProduct && lastScannedType === 'sales_scan') {
            addOrUpdateProductInCart(lastScannedProduct);
        }
        if (scannerError) {
            setError(`Error del escáner: ${scannerError}`);
        }
    }, [lastScannedProduct, lastScannedType, addOrUpdateProductInCart, scannerError]);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const metodos = await getMetodosPago();
                setMetodosPago(metodos);
                await fetchProductsForSale();

                if (metodos.length > 0) {
                    setMetodoPagoSeleccionado(metodos[0].metodo_pago_id);
                }
            } catch (err) {
                setError('Error al cargar datos iniciales (métodos de pago/productos).');
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
                setError("Error al cargar catálogos para el formulario de productos.");
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

    const handleClienteFormSuccess = async (newPersona: IPersonaNested) => {
        setIsClienteModalOpen(false);
        setClienteSeleccionado(newPersona.persona_id);
    };

    const handleClienteSelect = (persona: IPersonaNested | null) => {
        setClienteSeleccionado(persona ? persona.persona_id : null);
    };

    const handleScanOrEnterProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!codigoProducto.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const producto: ProductoSchemaBase = await getProductoByCodigo(codigoProducto.trim());
            addOrUpdateProductInCart(producto);
            setCodigoProducto('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Producto no encontrado o error en la búsqueda.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSelectedProduct = async () => {
        if (!productoSeleccionadoId) {
            setError('Por favor, selecciona un producto de la lista.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const productoToAdd = productosDisponibles.find(p => p.producto_id === productoSeleccionadoId);

            if (!productoToAdd) {
                setError('Producto seleccionado no encontrado.');
                setIsLoading(false);
                return;
            }
            addOrUpdateProductInCart(productoToAdd);
            setProductoSeleccionadoId(null);
        } catch (err: any) {
            setError('Error al añadir producto seleccionado.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnitQuantityChange = (producto_id: number, delta: number) => {
        setCarrito(prevCarrito => {
            setError(null);
            return prevCarrito.map(item => {
                if (item.producto_id === producto_id && !item.is_meter_product) {
                    const newQuantity = item.cantidad_entrada + delta;
                    if (newQuantity <= 0) {
                        return null;
                    }
                    if (newQuantity > item.stock_disponible_base_unit) {
                        setError(`¡Stock insuficiente para "${item.nombre}"! Disponible: ${item.stock_disponible_base_unit} unidades.`);
                        return item;
                    }
                    return { ...item, cantidad_entrada: newQuantity };
                }
                return item;
            }).filter(Boolean) as CarritoItem[];
        });
    };

    const handleMeterQuantityInputChange = (producto_id: number, newQuantityString: string) => {
        setCarrito(prevCarrito => {
            setError(null);
            return prevCarrito.map(item => {
                if (item.producto_id === producto_id && item.is_meter_product) {
                    const parsedQuantity = parseFloat(newQuantityString);

                    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
                        setError('La cantidad debe ser un número positivo.');
                        return item;
                    }

                    if (parsedQuantity === 0) {
                        return null;
                    }

                    let quantityInBaseUnit: number;
                    if (item.sale_mode === 'rollo') {
                        quantityInBaseUnit = parsedQuantity * (item.metros_por_rollo || 0);
                    } else {
                        quantityInBaseUnit = parsedQuantity;
                    }

                    if (quantityInBaseUnit > item.stock_disponible_base_unit) {
                        setError(`No puedes añadir más de ${item.stock_disponible_base_unit.toFixed(2)} metros de "${item.nombre}".`);
                        return item;
                    }

                    return { ...item, cantidad_entrada: parsedQuantity };
                }
                return item;
            }).filter(Boolean) as CarritoItem[];
        });
    };

    const handleSaleModeChange = (producto_id: number, newMode: 'rollo' | 'metro') => {
        setCarrito(prevCarrito => {
            setError(null);
            return prevCarrito.map(item => {
                if (item.producto_id === producto_id && item.is_meter_product) {
                    if (item.sale_mode === newMode) {
                        return item;
                    }

                    let convertedQuantity = item.cantidad_entrada;

                    if (item.sale_mode === 'rollo' && newMode === 'metro') {
                        convertedQuantity = item.cantidad_entrada * (item.metros_por_rollo || 0);
                    } else if (item.sale_mode === 'metro' && newMode === 'rollo') {
                        convertedQuantity = item.metros_por_rollo && item.metros_por_rollo > 0
                            ? item.cantidad_entrada / item.metros_por_rollo
                            : 0;
                    }

                    if (convertedQuantity <= 0 || isNaN(convertedQuantity)) {
                        convertedQuantity = 1;
                        setError(`La cantidad de "${item.nombre}" se ha restablecido a 1 debido al cambio de unidad de venta. Por favor, ajusta la cantidad si es necesario.`);
                    }

                    let quantityInBaseUnitAfterConversion: number;
                    if (newMode === 'rollo') {
                        quantityInBaseUnitAfterConversion = convertedQuantity * (item.metros_por_rollo || 0);
                    } else {
                        quantityInBaseUnitAfterConversion = convertedQuantity;
                    }

                    if (quantityInBaseUnitAfterConversion > item.stock_disponible_base_unit) {
                        setError(`La cantidad convertida excede el stock disponible (${item.stock_disponible_base_unit.toFixed(2)} metros). Se ajustó a la cantidad máxima permitida.`);
                        if (newMode === 'rollo') {
                            convertedQuantity = Math.floor(item.stock_disponible_base_unit / (item.metros_por_rollo || 1));
                        } else {
                            convertedQuantity = item.stock_disponible_base_unit;
                        }
                        if (convertedQuantity <= 0) convertedQuantity = 1;
                    }

                    return { ...item, sale_mode: newMode, cantidad_entrada: convertedQuantity };
                }
                return item;
            });
        });
    };

    const handleRemoveItem = (producto_id: number) => {
        setCarrito(prevCarrito => prevCarrito.filter(item => item.producto_id !== producto_id));
        setError(null);
    };

    const totalVenta = useMemo(() => {
        return carrito.reduce((acc, item) => {
            let itemPriceInBaseUnit: number;
            let itemQuantityInBaseUnit: number;

            if (item.is_meter_product) {
                if (item.sale_mode === 'rollo') {
                    itemQuantityInBaseUnit = item.cantidad_entrada * (item.metros_por_rollo || 0);
                } else {
                    itemQuantityInBaseUnit = item.cantidad_entrada;
                }
                itemPriceInBaseUnit = item.precio_unitario;
            } else {
                itemQuantityInBaseUnit = item.cantidad_entrada;
                itemPriceInBaseUnit = item.precio_unitario;
            }
            return acc + (itemQuantityInBaseUnit * itemPriceInBaseUnit);
        }, 0);
    }, [carrito]);

    const handleFinalizarVenta = async () => {
        if (carrito.length === 0) {
            setError('El carrito está vacío. Añade productos para finalizar la venta.');
            return;
        }
        if (!metodoPagoSeleccionado) {
            setError('Por favor, selecciona un método de pago.');
            return;
        }

        setIsLoading(true);
        setError(null);

        const detallesVenta: DetalleVentaCreate[] = carrito.map(item => {
            let quantityToSend: number;

            if (item.is_meter_product) {
                quantityToSend = (item.sale_mode === 'rollo')
                    ? item.cantidad_entrada * (item.metros_por_rollo || 0)
                    : item.cantidad_entrada;
            } else {
                quantityToSend = item.cantidad_entrada;
            }

            return {
                producto_id: item.producto_id,
                cantidad: quantityToSend,
                precio_unitario: item.precio_unitario,
            };
        });

        const ventaData: VentaCreate = {
            persona_id: clienteSeleccionado,
            metodo_pago_id: metodoPagoSeleccionado,
            estado: EstadoVentaEnum.activa,
            detalles: detallesVenta,
            total: totalVenta
        };

        try {
            const nuevaVenta = await createVenta(ventaData);
            setVentaExitosaId(nuevaVenta.venta_id);
            setShowSuccessModal(true);

            setCarrito([]);
            setCodigoProducto('');
            setClienteSeleccionado(null);
            setProductoSeleccionadoId(null);
            await fetchProductsForSale();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al finalizar la venta. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        setVentaExitosaId(null);
    };

    const getQuantityDisplayUnitText = useCallback((item: CarritoItem) => {
        if (item.is_meter_product) {
            return item.sale_mode === 'rollo' ? 'Rollos' : 'Metros';
        }
        return 'Unidades';
    }, []);

    const getPriceDisplayUnitText = useCallback((item: CarritoItem) => {
        return item.is_meter_product ? 'Bs/m' : 'Bs/u';
    }, []);

    const carritoColumns = useMemo(() => [
        { Header: 'Producto', accessor: 'nombre' },
        {
            Header: 'Cantidad',
            accessor: 'cantidad_entrada',
            Cell: ({ row }: { row: { original: CarritoItem } }) => {
                const item = row.original;
                if (item.is_meter_product) {
                    return (
                        <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                <label className="flex items-center">
                                    <input type="radio" name={`saleMode-${item.producto_id}`} value="rollo" checked={item.sale_mode === 'rollo'} onChange={() => handleSaleModeChange(item.producto_id, 'rollo')} className="mr-1 accent-indigo-600 dark:accent-indigo-400" />
                                    <span className="text-gray-700 dark:text-gray-300">Por Rollo</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name={`saleMode-${item.producto_id}`} value="metro" checked={item.sale_mode === 'metro'} onChange={() => handleSaleModeChange(item.producto_id, 'metro')} className="mr-1 accent-indigo-600 dark:accent-indigo-400" />
                                    <span className="text-gray-700 dark:text-gray-300">Por Metro</span>
                                </label>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Input
                                    type="number"
                                    step={item.sale_mode === 'metro' ? "0.01" : "1"}
                                    value={item.cantidad_entrada.toFixed(item.sale_mode === 'metro' ? 2 : 0)}
                                    onChange={(e) => handleMeterQuantityInputChange(item.producto_id, e.target.value)}
                                    className="w-24 p-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md text-right"
                                    min="0"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">{getQuantityDisplayUnitText(item)}</span>
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div className="flex items-center space-x-2">
                            <Button onClick={() => handleUnitQuantityChange(item.producto_id, 1)} className="px-2 py-1 bg-green-500 text-white rounded-md" variant="success">+</Button>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 w-10 text-center">{item.cantidad_entrada}</span>
                            <Button onClick={() => handleUnitQuantityChange(item.producto_id, -1)} className="px-2 py-1 bg-yellow-500 text-white rounded-md" variant="warning" disabled={item.cantidad_entrada <= 1}>-</Button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Unidades</span>
                        </div>
                    );
                }
            },
        },
        {
            Header: 'Precio Unit.',
            accessor: 'precio_unitario',
            Cell: ({ row }: { row: { original: CarritoItem } }) => {
                const item = row.original;
                if (item.is_meter_product) {
                    if (item.sale_mode === 'rollo') {
                        return <span className="text-gray-900 dark:text-gray-100">{`${Number(item.precio_unitario * (item.metros_por_rollo || 0)).toFixed(2)} Bs/rollo`}</span>;
                    } else if (item.sale_mode === 'metro') {
                        return <span className="text-gray-900 dark:text-gray-100">{`${Number(item.precio_unitario).toFixed(2)} Bs/metro`}</span>;
                    }
                }
                return <span className="text-gray-900 dark:text-gray-100">{`${Number(item.precio_unitario).toFixed(2)} Bs/unidad`}</span>;
            }
        },
        {
            Header: 'Subtotal',
            accessor: 'subtotal',
            Cell: ({ row }: { row: { original: CarritoItem } }) => {
                const item = row.original;
                let subtotal = 0;
                if (item.is_meter_product) {
                    subtotal = (item.sale_mode === 'rollo')
                        ? item.cantidad_entrada * (item.metros_por_rollo || 0) * item.precio_unitario
                        : item.cantidad_entrada * item.precio_unitario;
                } else {
                    subtotal = item.cantidad_entrada * item.precio_unitario;
                }
                return <span className="font-semibold text-gray-900 dark:text-gray-100">{`${subtotal.toFixed(2)} Bs.`}</span>;
            },
        },
        {
            Header: 'Acciones',
            accessor: 'acciones',
            Cell: ({ row }: { row: { original: CarritoItem } }) => (
                <Button onClick={() => handleRemoveItem(row.original.producto_id)} variant="danger" size="sm">X</Button>
            ),
        },
    ], [handleUnitQuantityChange, handleMeterQuantityInputChange, handleSaleModeChange, handleRemoveItem, getQuantityDisplayUnitText, getPriceDisplayUnitText]);

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Nueva Venta</h1>

            {isLoading && <LoadingSpinner />}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 dark:bg-red-900 dark:border-red-700 dark:text-red-200" role="alert">
                    {error}
                </div>
            )}
            {formSubmitError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 dark:bg-red-900 dark:border-red-700 dark:text-red-200" role="alert">
                    {formSubmitError}
                </div>
            )}
            {formMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4 dark:bg-green-900 dark:border-green-700 dark:text-green-200" role="alert">
                    {formMessage}
                </div>
            )}

            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center justify-end">
                Estado del escáner: <span className={`ml-2 font-semibold ${websocketStatus.includes('Conectado') ? 'text-green-600 dark:text-green-400' : websocketStatus.includes('Desconectado') || websocketStatus.includes('Error') || websocketStatus.includes('Fallo') ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{websocketStatus}</span>
                {websocketStatus.includes('Conectando') && <LoadingSpinner className="ml-2 w-4 h-4" />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">1. Detalles de la Venta</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="cliente_autocomplete" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente (Opcional)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <PersonaAutocomplete
                                        onPersonaSelect={handleClienteSelect}
                                        initialPersonaId={clienteSeleccionado}
                                        rolFilterName="Cliente"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => setIsClienteModalOpen(true)}
                                        variant="success"
                                        size="sm"
                                        title="Añadir Nuevo Cliente"
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Método de Pago</label>
                                <select
                                    id="metodo_pago_venta"
                                    value={metodoPagoSeleccionado || ''}
                                    onChange={(e) => setMetodoPagoSeleccionado(Number(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                    disabled={isLoading}
                                >
                                    <option value="">Seleccione un método</option>
                                    {metodosPago.map(metodo => (
                                        <option key={metodo.metodo_pago_id} value={metodo.metodo_pago_id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                            {metodo.nombre_metodo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">2. Añadir Productos</h2>

                        <form onSubmit={handleScanOrEnterProduct} className="mb-4 flex gap-2">
                            <Input
                                type="text"
                                placeholder="Escanear o introducir código de producto"
                                value={codigoProducto}
                                onChange={(e) => setCodigoProducto(e.target.value)}
                                className="flex-grow"
                                disabled={isLoading}
                            />
                            <Button type="submit" variant="primary" className="px-4 py-2" disabled={isLoading}>
                                Añadir
                            </Button>
                        </form>

                        <div className="flex items-center gap-4 mb-2">
                            <label htmlFor="search-product-list" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex-grow">Buscar en Lista</label>
                            <Button type="button" onClick={handleOpenAddProductModal} variant="success" size="sm" disabled={loadingCatalogs}>
                                {loadingCatalogs ? 'Cargando...' : '+ Nuevo Producto'}
                            </Button>
                        </div>

                        <Input
                            id="search-product-list"
                            type="text"
                            placeholder="Filtrar por nombre o código..."
                            value={productoSearchTerm}
                            onChange={(e) => setProductoSearchTerm(e.target.value)}
                        />
                        <div className="mt-2 max-h-[250px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                            {filteredProducts.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredProducts.map(producto => (
                                        <li key={producto.producto_id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">Producto: {producto.nombre}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Stock: {producto.stock}</p>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => addOrUpdateProductInCart(producto)}
                                                variant="success"
                                                size="sm"
                                            >
                                                + Añadir
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 p-4">No se encontraron productos disponibles.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">3. Carrito de Ventas ({carrito.length})</h2>
                    <div className="flex-grow min-h-[300px] max-h-[60vh] overflow-y-auto pr-2 -mr-4 space-y-3">
                        {carrito.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                <p>El carrito está vacío. Escanea o añade productos.</p>
                            </div>
                        ) : (
                            <Table columns={carritoColumns} data={carrito} />
                        )}
                    </div>
                    {carrito.length > 0 && (
                        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-right p-4 bg-indigo-50 dark:bg-indigo-900 rounded-md">
                                <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">Total: {totalVenta.toFixed(2)} Bs.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
                <Button type="button" onClick={() => navigate("/ventas")} variant="secondary" disabled={isLoading}>
                    Cancelar
                </Button>
                <Button
                    type="button"
                    onClick={handleFinalizarVenta}
                    variant="primary"
                    disabled={isLoading || carrito.length === 0 || !metodoPagoSeleccionado}
                >
                    {isLoading ? <LoadingSpinner /> : "Finalizar Venta"}
                </Button>
            </div>

            <Modal
                isOpen={isAddProductModalOpen}
                onClose={handleCloseAddProductModal}
                title="Crear Nuevo Producto"
                widthClass="max-w-3xl"
                showCancelButton={false}
                showConfirmButton={false}
            >
                <ProductoForm
                    onSuccess={handleProductFormSuccess}
                    onCancel={handleCloseAddProductModal}
                    availableCategorias={availableCategorias}
                    availableUnidadesMedida={availableUnidadesMedida}
                    availableMarcas={availableMarcas}
                />
            </Modal>

            <Modal
                isOpen={isClienteModalOpen}
                onClose={() => setIsClienteModalOpen(false)}
                title="Añadir Nuevo Cliente"
                widthClass="max-w-xl"
                showConfirmButton={false}
                showCancelButton={false}
            >
            <PersonaForm
              mode="assign-role"
              roleToAssign="Cliente"
              onSuccess={(persona) => {
                setClienteSeleccionado(persona.persona_id);
                setIsClienteModalOpen(false);
              }}
              onCancel={() => {
                setIsClienteModalOpen(false);
              }}
              showTitle={true}
              showCancelButton={true}
            />
            </Modal>

            <Modal
                isOpen={showSuccessModal}
                onClose={handleCloseSuccessModal}
                title="Venta Realizada con Éxito"
                showCancelButton={false}
                onConfirm={handleCloseSuccessModal}
            >
                <p className="text-center text-lg text-gray-700 dark:text-gray-300">La venta #{ventaExitosaId} ha sido registrada correctamente. 🎉</p>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">Puedes cerrar esta ventana o continuar con nuevas ventas.</p>
            </Modal>
        </div>
    );
};

export default VentasFormPage;