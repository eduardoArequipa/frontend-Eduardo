// src/pages/Ventas/VentasFormPage.tsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from "react-router-dom";
// Asumo que useScannerWebSocket ya está bien definido para escuchar el socket
import useScannerWebSocket from '../../hooks/useScannerWebSocket';
import PersonaForm from '../../components/Common/PersonaForm'; // <-- Asegúrate de importar 
// --- Servicios API ---
import {
    createVenta,
    getProductoByCodigo, // Usado para búsqueda por código manual
    getMetodosPago,
    getProductosParaVenta // Usado para cargar productos para la lista de selección
} from '../../services/ventasService';
import { getCategorias } from "../../services/categoriaService";
import { getUnidadesMedida } from "../../services/unidadMedidaService";
import { getMarcas } from "../../services/marcaService";

// --- Componentes Comunes y Específicos ---
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Modal from '../../components/Common/Modal';
import Table from '../../components/Common/Table'; // Para mostrar el carrito
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ProductoForm from "../../components/Specific/ProductoForm"; // Para añadir nuevos productos
import PersonaAutocomplete from '../../components/Common/PersonaAutocomplete'; // Para seleccionar cliente por autocompletado

// --- Tipos de Datos ---
import { VentaCreate, DetalleVentaCreate } from '../../types/venta';
import { MetodoPagoNested } from '../../types/metodoPago';
import { IPersonaNested } from '../../types/persona'; // <-- ¡CORRECCIÓN: USANDO IPersonaNested!
import { ProductoSchemaBase } from '../../types/producto';
import { EstadoVentaEnum, EstadoEnum } from '../../types/enums';
import { CategoriaNested } from "../../types/categoria";
import { UnidadMedidaNested } from "../../types/unidad_medida";
import { MarcaNested } from "../../types/marca";

// Define la estructura para los ítems del carrito
export interface CarritoItem {
    producto_id: number;
    codigo: string;
    nombre: string;
    cantidad_entrada: number; // Cantidad en la unidad de medida que el usuario está "viendo" (unidades, rollos, metros)
    precio_unitario: number; // Precio por unidad base (ej: Bs/metro o Bs/unidad)
    stock_disponible_base_unit: number; // Stock total en la unidad base (ej: metros totales o unidades totales)
    metros_por_rollo: number | null; // Solo para productos por metro
    is_meter_product: boolean; // Si el producto se vende por metro/rollo
    sale_mode: 'rollo' | 'metro' | 'unidad'; // Modo de venta actual en el carrito
}

const VentasFormPage: React.FC = () => {
    const navigate = useNavigate();

    // --- Estados de la Venta y Carrito ---
    const [codigoProducto, setCodigoProducto] = useState<string>(''); // Para búsqueda por código manual
    const [productosDisponibles, setProductosDisponibles] = useState<ProductoSchemaBase[]>([]); // Para el listado de búsqueda
    // productoSeleccionadoId no se usa directamente al añadir, ya que addOrUpdateProductInCart usa el objeto completo
    // Mantenido por si hay lógica de selección manual en UI que no veo.
    const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<number | null>(null);
    const [carrito, setCarrito] = useState<CarritoItem[]>([]); // El estado principal del carrito
    const [metodosPago, setMetodosPago] = useState<MetodoPagoNested[]>([]);
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<number | null>(null);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<number | null>(null); // ¡Ahora es persona_id!

    // --- Estados de UI y Mensajes ---
    const [isLoading, setIsLoading] = useState<boolean>(false); // Para spinners generales de carga/envío
    const [error, setError] = useState<string | null>(null); // Mensajes de error (validación de stock, API, etc.)
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [ventaExitosaId, setVentaExitosaId] = useState<number | null>(null);

    const [productoSearchTerm, setProductoSearchTerm] = useState(''); // Para el input de búsqueda en lista

    // --- Estados para Modales (Producto y Cliente) ---
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
    const [availableCategorias, setAvailableCategorias] = useState<CategoriaNested[]>([]);
    const [availableUnidadesMedida, setAvailableUnidadesMedida] = useState<UnidadMedidaNested[]>([]);
    const [availableMarcas, setAvailableMarcas] = useState<MarcaNested[]>([]);
    const [loadingCatalogs, setLoadingCatalogs] = useState(true); // Para cargar los catálogos del modal de producto
    const [isClienteModalOpen, setIsClienteModalOpen] = useState<boolean>(false);

    // --- Hook para el WebSocket ---
    // Este hook maneja la conexión y nos da el último producto escaneado
    const { websocketStatus, scannerError, lastScannedProduct, lastScannedType } = useScannerWebSocket();

    // --- Productos filtrados para la búsqueda manual ---
    const filteredProducts = useMemo(() => {
        if (!productoSearchTerm) {
            return productosDisponibles;
        }
        return productosDisponibles.filter(p =>
            p.nombre.toLowerCase().includes(productoSearchTerm.toLowerCase()) ||
            p.codigo.toLowerCase().includes(productoSearchTerm.toLowerCase())
        );
    }, [productosDisponibles, productoSearchTerm]);

    // --- Función para añadir o actualizar producto en el carrito ---
    // Esta función es crucial y se envuelve en useCallback para estabilidad,
    // ya que se usa como dependencia en el useEffect del escáner.
    const addOrUpdateProductInCart = useCallback((producto: ProductoSchemaBase) => {
        setCarrito(prevCarrito => {
            const isMeterProduct = producto.metros_por_rollo !== undefined && producto.metros_por_rollo !== null && producto.metros_por_rollo > 0;
            const existingItem = prevCarrito.find(item => item.producto_id === producto.producto_id);

            // La cantidad inicial para un escaneo es SIEMPRE 1 (unidad, rollo o metro según el tipo de producto)
            const quantityToAdd = 1;
            let initialSaleMode: 'rollo' | 'metro' | 'unidad' = 'unidad';
            // Convertimos la cantidad a la unidad base para la validación de stock
            let quantityInBaseUnitForCheck = quantityToAdd;

            if (isMeterProduct) {
                // Por defecto, si es un producto por metro, se añade 1 rollo si existe o 1 metro si no tiene metros_por_rollo
                initialSaleMode = producto.metros_por_rollo && producto.metros_por_rollo > 0 ? 'rollo' : 'metro';
                quantityInBaseUnitForCheck = initialSaleMode === 'rollo'
                    ? quantityToAdd * (producto.metros_por_rollo || 0)
                    : quantityToAdd;
            }

            if (existingItem) {
                // Si el producto ya está en el carrito, incrementamos su cantidad
                let newQuantityEntry = existingItem.cantidad_entrada + quantityToAdd;
                let newQuantityInBaseUnit: number;

                if (existingItem.is_meter_product) {
                    newQuantityInBaseUnit = (existingItem.sale_mode === 'rollo')
                        ? newQuantityEntry * (existingItem.metros_por_rollo || 0)
                        : newQuantityEntry;
                } else {
                    newQuantityInBaseUnit = newQuantityEntry;
                }

                // Validar contra el stock disponible
                if (newQuantityInBaseUnit > producto.stock) {
                    setError(`¡Stock insuficiente para "${producto.nombre}"! Disponible: ${producto.stock.toFixed(2)} ${isMeterProduct ? 'metros' : 'unidades'}.`);
                    return prevCarrito; // No actualiza el carrito
                }

                setError(null); // Limpiar error si se añade correctamente
                return prevCarrito.map(item =>
                    item.producto_id === producto.producto_id
                        ? { ...item, cantidad_entrada: newQuantityEntry }
                        : item
                );
            } else {
                // Si el producto no está en el carrito, lo añadimos como un nuevo ítem
                // Validar stock antes de añadir por primera vez
                if (quantityInBaseUnitForCheck > producto.stock) {
                    setError(`¡Stock insuficiente para "${producto.nombre}"! Disponible: ${producto.stock.toFixed(2)} ${isMeterProduct ? 'metros' : 'unidades'}.`);
                    return prevCarrito; // No añade el producto
                }

                setError(null); // Limpiar error
                return [
                    ...prevCarrito,
                    {
                        producto_id: producto.producto_id,
                        codigo: producto.codigo,
                        nombre: producto.nombre,
                        cantidad_entrada: quantityToAdd, // Siempre 1 al escanear/añadir por primera vez
                        precio_unitario: producto.precio_venta,
                        stock_disponible_base_unit: producto.stock,
                        metros_por_rollo: producto.metros_por_rollo !== undefined ? producto.metros_por_rollo : null,
                        is_meter_product: isMeterProduct,
                        sale_mode: initialSaleMode // Modo inicial basado en si es producto por metro/rollo
                    }
                ];
            }
        });
    }, []); // No hay dependencias externas que cambien

    // --- Carga de productos para la venta (inicial y al actualizar) ---
    const fetchProductsForSale = async () => {
        try {
            // Asegúrate de filtrar por estado activo y stock > 0 si eso es lo que deseas mostrar
            const productosData = await getProductosParaVenta({ limit: 1000, estado: EstadoEnum.Activo });
            setProductosDisponibles(productosData.filter(p => p.estado === EstadoEnum.Activo && p.stock > 0));
        } catch (err) {
            setError('Error al recargar los productos disponibles.');
            console.error(err);
        }
    };

    // --- Efecto para procesar productos escaneados por WebSocket ---
    useEffect(() => {
        // Asegúrate de que addOrUpdateProductInCart sea estable (usa useCallback)
        if (lastScannedProduct && lastScannedType === 'sales_scan') {
            addOrUpdateProductInCart(lastScannedProduct);
            // El hook useScannerWebSocket ya debería limpiar lastScannedProduct después de pasarlo
            // Si no lo hace, necesitarías un mecanismo aquí para evitar re-procesamiento.
        }
        // Manejar errores del escáner que vienen del hook
        if (scannerError) {
            setError(`Error del escáner: ${scannerError}`);
        }
    }, [lastScannedProduct, lastScannedType, addOrUpdateProductInCart, scannerError]);

    // --- Carga inicial de datos (métodos de pago, productos, catálogos) ---
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const metodos = await getMetodosPago();
                setMetodosPago(metodos);
                await fetchProductsForSale(); // Carga los productos disponibles

                if (metodos.length > 0) {
                    setMetodoPagoSeleccionado(metodos[0].metodo_pago_id);
                }
            } catch (err) {
                setError('Error al cargar datos iniciales (métodos de pago/productos).');
                console.error(err);
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
                setAvailableCategorias(categoriasData);
                setAvailableUnidadesMedida(unidadesMedidaData);
                setAvailableMarcas(marcasData);
            } catch (err) {
                console.error("Error cargando catálogos:", err);
                setError("Error al cargar catálogos para el formulario de productos.");
            } finally {
                setLoadingCatalogs(false);
            }
        };

        loadInitialData();
        loadCatalogs();
    }, []); // Se ejecuta solo una vez al montar el componente

    // --- Manejo de modales ---
    const handleOpenAddProductModal = () => setIsAddProductModalOpen(true);
    const handleCloseAddProductModal = () => setIsAddProductModalOpen(false);
    const handleProductFormSuccess = () => {
        handleCloseAddProductModal();
        fetchProductsForSale(); // Recargar productos después de añadir uno nuevo
    };

    const handleClienteFormSuccess = async (newPersona: IPersonaNested) => {
        setIsClienteModalOpen(false);
        setClienteSeleccionado(newPersona.persona_id); // Establecer el ID de la nueva persona como cliente
    };

    const handleClienteSelect = (persona: IPersonaNested | null) => {
        setClienteSeleccionado(persona ? persona.persona_id : null);
    };

    // --- Funciones para añadir productos al carrito (manual y por escaneo) ---
    const handleScanOrEnterProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!codigoProducto.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const producto: ProductoSchemaBase = await getProductoByCodigo(codigoProducto.trim());
            addOrUpdateProductInCart(producto); // Usa la lógica unificada
            setCodigoProducto(''); // Limpia el input después de añadir
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Producto no encontrado o error en la búsqueda.');
            console.error('Error al buscar producto:', err);
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
            addOrUpdateProductInCart(productoToAdd); // Usa la lógica unificada
            setProductoSeleccionadoId(null); // Limpia la selección
        } catch (err: any) {
            setError('Error al añadir producto seleccionado.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Manejo de la cantidad en el carrito (incrementar/disminuir para unidades) ---
    const handleUnitQuantityChange = (producto_id: number, delta: number) => {
        setCarrito(prevCarrito => {
            setError(null); // Limpia errores previos al intentar cambiar la cantidad
            return prevCarrito.map(item => {
                if (item.producto_id === producto_id && !item.is_meter_product) {
                    const newQuantity = item.cantidad_entrada + delta;
                    if (newQuantity <= 0) {
                        return null; // Elimina el ítem si la cantidad llega a 0 o menos
                    }
                    if (newQuantity > item.stock_disponible_base_unit) {
                        setError(`¡Stock insuficiente para "${item.nombre}"! Disponible: ${item.stock_disponible_base_unit} unidades.`);
                        return item; // No permite exceder el stock
                    }
                    return { ...item, cantidad_entrada: newQuantity };
                }
                return item;
            }).filter(Boolean) as CarritoItem[]; // Filtra los items nulos (eliminados)
        });
    };

    // --- Manejo de la cantidad en el carrito (input numérico para metros/rollos) ---
    const handleMeterQuantityInputChange = (producto_id: number, newQuantityString: string) => {
        setCarrito(prevCarrito => {
            setError(null);
            return prevCarrito.map(item => {
                if (item.producto_id === producto_id && item.is_meter_product) {
                    const parsedQuantity = parseFloat(newQuantityString);

                    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
                        setError('La cantidad debe ser un número positivo.');
                        return item; // No actualiza si es un valor inválido
                    }

                    if (parsedQuantity === 0) {
                        return null; // Elimina si la cantidad llega a 0
                    }

                    let quantityInBaseUnit: number;
                    if (item.sale_mode === 'rollo') {
                        quantityInBaseUnit = parsedQuantity * (item.metros_por_rollo || 0);
                    } else {
                        quantityInBaseUnit = parsedQuantity;
                    }

                    if (quantityInBaseUnit > item.stock_disponible_base_unit) {
                        setError(`No puedes añadir más de ${item.stock_disponible_base_unit.toFixed(2)} metros de "${item.nombre}".`);
                        return item; // No permite exceder el stock
                    }

                    return { ...item, cantidad_entrada: parsedQuantity };
                }
                return item;
            }).filter(Boolean) as CarritoItem[]; // Filtra nulos
        });
    };

    // --- Cambio de modo de venta (rollo/metro) para productos por metro ---
    const handleSaleModeChange = (producto_id: number, newMode: 'rollo' | 'metro') => {
        setCarrito(prevCarrito => {
            setError(null);
            return prevCarrito.map(item => {
                if (item.producto_id === producto_id && item.is_meter_product) {
                    if (item.sale_mode === newMode) {
                        return item; // No hacer nada si el modo no cambia
                    }

                    let convertedQuantity = item.cantidad_entrada; // Cantidad actual en su unidad de entrada

                    // Lógica de conversión de cantidad al cambiar el modo
                    if (item.sale_mode === 'rollo' && newMode === 'metro') {
                        convertedQuantity = item.cantidad_entrada * (item.metros_por_rollo || 0);
                    } else if (item.sale_mode === 'metro' && newMode === 'rollo') {
                        convertedQuantity = item.metros_por_rollo && item.metros_por_rollo > 0
                            ? item.cantidad_entrada / item.metros_por_rollo
                            : 0;
                    }

                    // Asegurarse de que la cantidad convertida sea válida y al menos 1
                    if (convertedQuantity <= 0 || isNaN(convertedQuantity)) {
                        convertedQuantity = 1; // Restablecer a 1 si la conversión resulta en 0 o NaN
                        setError(`La cantidad de "${item.nombre}" se ha restablecido a 1 debido al cambio de unidad de venta. Por favor, ajusta la cantidad si es necesario.`);
                    }

                    // Re-validar stock después de la conversión
                    let quantityInBaseUnitAfterConversion: number;
                    if (newMode === 'rollo') {
                        quantityInBaseUnitAfterConversion = convertedQuantity * (item.metros_por_rollo || 0);
                    } else {
                        quantityInBaseUnitAfterConversion = convertedQuantity;
                    }

                    if (quantityInBaseUnitAfterConversion > item.stock_disponible_base_unit) {
                        setError(`La cantidad convertida excede el stock disponible (${item.stock_disponible_base_unit.toFixed(2)} metros). Se ajustó a la cantidad máxima permitida.`);
                        if (newMode === 'rollo') {
                            // Calcula cuántos rollos completos caben en el stock disponible
                            convertedQuantity = Math.floor(item.stock_disponible_base_unit / (item.metros_por_rollo || 1));
                        } else {
                            convertedQuantity = item.stock_disponible_base_unit; // Si es por metro, la cantidad es el stock disponible
                        }
                        if (convertedQuantity <= 0) convertedQuantity = 1; // Asegura que no sea 0
                    }

                    return { ...item, sale_mode: newMode, cantidad_entrada: convertedQuantity };
                }
                return item;
            });
        });
    };

    // --- Remover un ítem del carrito ---
    const handleRemoveItem = (producto_id: number) => {
        setCarrito(prevCarrito => prevCarrito.filter(item => item.producto_id !== producto_id));
        setError(null); // Limpiar errores cuando se remueve un ítem
    };

    // --- Cálculo del total de la venta (memorizado para rendimiento) ---
    const totalVenta = useMemo(() => {
        return carrito.reduce((acc, item) => {
            let itemPriceInBaseUnit: number; // Precio en la unidad base (ej: Bs/metro o Bs/unidad)
            let itemQuantityInBaseUnit: number; // Cantidad total en la unidad base

            if (item.is_meter_product) {
                // Para productos por metro/rollo, el precio_unitario ya es Bs/metro.
                // Convertimos la cantidad_entrada a metros totales para el cálculo.
                if (item.sale_mode === 'rollo') {
                    itemQuantityInBaseUnit = item.cantidad_entrada * (item.metros_por_rollo || 0);
                } else { // sale_mode === 'metro'
                    itemQuantityInBaseUnit = item.cantidad_entrada;
                }
                itemPriceInBaseUnit = item.precio_unitario; // Ya es Bs/metro
            } else {
                // Para productos por unidad, la cantidad_entrada es la cantidad de unidades
                itemQuantityInBaseUnit = item.cantidad_entrada;
                itemPriceInBaseUnit = item.precio_unitario; // Ya es Bs/unidad
            }
            return acc + (itemQuantityInBaseUnit * itemPriceInBaseUnit);
        }, 0);
    }, [carrito]);

    // --- Función para finalizar la venta (enviar a la API) ---
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

        // Mapear los ítems del carrito a la estructura DetalleVentaCreate
        const detallesVenta: DetalleVentaCreate[] = carrito.map(item => {
            let quantityToSend: number; // Cantidad que se enviará al backend (siempre en la unidad base)

            if (item.is_meter_product) {
                quantityToSend = (item.sale_mode === 'rollo')
                    ? item.cantidad_entrada * (item.metros_por_rollo || 0) // Si se vende por rollo, convertir a metros
                    : item.cantidad_entrada; // Si se vende por metro, ya está en metros
            } else {
                quantityToSend = item.cantidad_entrada; // Si es por unidad, ya está en unidades
            }

            return {
                producto_id: item.producto_id,
                cantidad: quantityToSend, // Siempre la cantidad en la unidad base para el backend
                precio_unitario: item.precio_unitario, // Precio por unidad base
            };
        });

        // Construir el objeto de datos de la venta
        const ventaData: VentaCreate = {
            persona_id: clienteSeleccionado, // Ahora es persona_id
            metodo_pago_id: metodoPagoSeleccionado,
            estado: EstadoVentaEnum.activa, // Estado de la venta por defecto
            detalles: detallesVenta,
            total: totalVenta // Total calculado en el frontend
        };

        try {
            const nuevaVenta = await createVenta(ventaData);
            setVentaExitosaId(nuevaVenta.venta_id);
            setShowSuccessModal(true);

            // Limpiar el estado después de una venta exitosa
            setCarrito([]);
            setCodigoProducto('');
            setClienteSeleccionado(null);
            setProductoSeleccionadoId(null);
            await fetchProductsForSale(); // Recargar productos para actualizar stock disponible
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al finalizar la venta. Intenta de nuevo.');
            console.error('Error al finalizar la venta:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        setVentaExitosaId(null);
    };

    // Funciones auxiliares para texto en la UI del carrito
    const getQuantityDisplayUnitText = useCallback((item: CarritoItem) => {
        if (item.is_meter_product) {
            return item.sale_mode === 'rollo' ? 'Rollos' : 'Metros';
        }
        return 'Unidades';
    }, []);

    const getPriceDisplayUnitText = useCallback((item: CarritoItem) => {
        return item.is_meter_product ? 'Bs/m' : 'Bs/u';
    }, []);


    // --- Definición de columnas para la tabla del carrito (memorizado) ---
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
                            {/* Opciones de venta por Rollo/Metro */}
                            <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <label className="flex items-center">
                                    <input type="radio" name={`saleMode-${item.producto_id}`} value="rollo" checked={item.sale_mode === 'rollo'} onChange={() => handleSaleModeChange(item.producto_id, 'rollo')} className="mr-1 accent-indigo-600" />
                                    Por Rollo
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name={`saleMode-${item.producto_id}`} value="metro" checked={item.sale_mode === 'metro'} onChange={() => handleSaleModeChange(item.producto_id, 'metro')} className="mr-1 accent-indigo-600" />
                                    Por Metro
                                </label>
                            </div>
                            {/* Input para cantidad de metros/rollos */}
                            <div className="flex items-center space-x-1">
                                <Input
                                    type="number"
                                    step={item.sale_mode === 'metro' ? "0.01" : "1"} // Paso para decimales en metros, entero en rollos
                                    value={item.cantidad_entrada.toFixed(item.sale_mode === 'metro' ? 2 : 0)} // Mostrar 2 decimales para metros, 0 para rollos
                                    onChange={(e) => handleMeterQuantityInputChange(item.producto_id, e.target.value)}
                                    className="w-24 p-1 border border-gray-300 rounded-md text-right"
                                    min="0"
                                />
                                <span className="text-sm text-gray-600">{getQuantityDisplayUnitText(item)}</span>
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div className="flex items-center space-x-2">
                            <Button onClick={() => handleUnitQuantityChange(item.producto_id, 1)} className="px-2 py-1 bg-green-500 text-white rounded-md" variant="success">+</Button>
                            <span className="font-semibold text-gray-800 w-10 text-center">{item.cantidad_entrada}</span>
                            <Button onClick={() => handleUnitQuantityChange(item.producto_id, -1)} className="px-2 py-1 bg-yellow-500 text-white rounded-md" variant="warning" disabled={item.cantidad_entrada <= 1}>-</Button> {/* Deshabilita si es 1 */}
                            <span className="text-sm text-gray-600">Unidades</span>
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
                // Mostrar precio por rollo si es el modo activo, o precio por metro
                if (item.is_meter_product) {
                    if (item.sale_mode === 'rollo') {
                        return `${(item.precio_unitario * (item.metros_por_rollo || 0))} Bs/rollo`;
                    } else if (item.sale_mode === 'metro') {
                        return `${item.precio_unitario} Bs/metro`;
                    }
                }
                return `${item.precio_unitario} Bs/unidad`;
            }
        },
        {
            Header: 'Subtotal',
            accessor: 'subtotal',
            Cell: ({ row }: { row: { original: CarritoItem } }) => {
                const item = row.original;
                let subtotal = 0;
                if (item.is_meter_product) {
                    // Si es por rollo, subtotal es cantidad_entrada (rollos) * metros_por_rollo * precio_unitario (Bs/metro)
                    // Si es por metro, subtotal es cantidad_entrada (metros) * precio_unitario (Bs/metro)
                    subtotal = (item.sale_mode === 'rollo')
                        ? item.cantidad_entrada * (item.metros_por_rollo || 0) * item.precio_unitario
                        : item.cantidad_entrada * item.precio_unitario;
                } else {
                    subtotal = item.cantidad_entrada * item.precio_unitario;
                }
                return `${subtotal.toFixed(2)} Bs.`;
            },
        },
        {
            Header: 'Acciones',
            accessor: 'acciones',
            Cell: ({ row }: { row: { original: CarritoItem } }) => (
                <Button onClick={() => handleRemoveItem(row.original.producto_id)} variant="danger" className="px-2 py-1">X</Button>
            ),
        },
    ], [handleUnitQuantityChange, handleMeterQuantityInputChange, handleSaleModeChange, handleRemoveItem, getQuantityDisplayUnitText, getPriceDisplayUnitText]);

    // --- Renderizado del Componente ---
    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Nueva Venta</h1>

            {/* Indicadores de carga y errores */}
            {isLoading && <LoadingSpinner />}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
                    {error}
                </div>
            )}
            {/* Estado del WebSocket del Escáner */}
            <div className="text-sm text-gray-600 mb-4 flex items-center justify-end">
                Estado del escáner: <span className={`ml-2 font-semibold ${websocketStatus.includes('Conectado') ? 'text-green-600' : websocketStatus.includes('Desconectado') || websocketStatus.includes('Error') || websocketStatus.includes('Fallo') ? 'text-red-600' : 'text-yellow-600'}`}>{websocketStatus}</span>
                {websocketStatus.includes('Conectando') && <LoadingSpinner className="ml-2 w-4 h-4" />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Columna Izquierda: Detalles de Venta y Añadir Productos */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-4">1. Detalles de la Venta</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Selección de Cliente (Persona con rol de Cliente) */}
                            <div>
                                <label htmlFor="cliente_autocomplete" className="block text-sm font-medium text-gray-700">Cliente (Opcional)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <PersonaAutocomplete
                                        onPersonaSelect={handleClienteSelect}
                                        initialPersonaId={clienteSeleccionado}
                                        rolFilterName="Cliente" // Filtra personas con rol de 'Cliente'
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => setIsClienteModalOpen(true)}
                                        className="px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md flex-shrink-0"
                                        title="Añadir Nuevo Cliente"
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                            {/* Selección de Método de Pago */}
                            <div>
                                <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-700">Método de Pago</label>
                                <select
                                    id="metodo_pago_venta"
                                    value={metodoPagoSeleccionado || ''}
                                    onChange={(e) => setMetodoPagoSeleccionado(Number(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                    disabled={isLoading}
                                >
                                    <option value="">Seleccione un método</option>
                                    {metodosPago.map(metodo => (
                                        <option key={metodo.metodo_pago_id} value={metodo.metodo_pago_id}>
                                            {metodo.nombre_metodo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-4">2. Añadir Productos</h2>

                        {/* Formulario para escanear/introducir código de producto manualmente */}
                        <form onSubmit={handleScanOrEnterProduct} className="mb-4 flex gap-2">
                            <Input
                                type="text"
                                placeholder="Escanear o introducir código de producto"
                                value={codigoProducto}
                                onChange={(e) => setCodigoProducto(e.target.value)}
                                className="flex-grow p-2 border rounded-md"
                                disabled={isLoading}
                            />
                            <Button type="submit" variant="primary" className="px-4 py-2" disabled={isLoading}>
                                Añadir
                            </Button>
                        </form>

                        {/* Sección para buscar y añadir desde la lista de productos disponibles */}
                        <div className="flex items-center gap-4 mb-2">
                            <label htmlFor="search-product-list" className="block text-sm font-medium text-gray-700 flex-grow">Buscar en Lista</label>
                            <Button type="button" onClick={handleOpenAddProductModal} variant="success" className="px-3 py-1 text-sm" disabled={loadingCatalogs}>
                                {loadingCatalogs ? 'Cargando...' : '+ Nuevo Producto'}
                            </Button>
                        </div>

                        <Input
                            id="search-product-list"
                            type="text"
                            placeholder="Filtrar por nombre o código..."
                            value={productoSearchTerm}
                            onChange={(e) => setProductoSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                        <div className="mt-2 max-h-[250px] overflow-y-auto border rounded-md">
                            {filteredProducts.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {filteredProducts.map(producto => (
                                        <li key={producto.producto_id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                            <div>
                                                <p className="font-semibold text-gray-900">Producto: {producto.nombre}</p>
                                                <p className="text-sm text-gray-500">Stock: {producto.stock}</p>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => addOrUpdateProductInCart(producto)}
                                                variant="success"
                                                className="px-3 py-1 text-sm"
                                            >
                                                + Añadir
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 p-4">No se encontraron productos disponibles.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Carrito de Ventas */}
                <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-4">3. Carrito de Ventas ({carrito.length})</h2>
                    <div className="flex-grow min-h-[300px] max-h-[60vh] overflow-y-auto -mr-4 pr-4">
                        {carrito.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>El carrito está vacío. Escanea o añade productos.</p>
                            </div>
                        ) : (
                            <Table columns={carritoColumns} data={carrito} />
                        )}
                    </div>
                    {/* Sección del total de la venta */}
                    {carrito.length > 0 && (
                        <div className="mt-auto pt-4 border-t">
                            <div className="text-right p-4 bg-indigo-50 rounded-md">
                                <p className="text-2xl font-bold text-indigo-800">Total: {totalVenta.toFixed(2)} Bs.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Botones de acción al final del formulario */}
            <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
                <Button type="button" onClick={() => navigate("/ventas")} variant="secondary" disabled={isLoading} className="px-6 py-2">
                    Cancelar
                </Button>
                <Button
                    type="button"
                    onClick={handleFinalizarVenta}
                    variant="primary"
                    disabled={isLoading || carrito.length === 0 || !metodoPagoSeleccionado} // Deshabilitar si no hay productos o método de pago
                    className="px-6 py-2 text-base"
                >
                    {isLoading ? <LoadingSpinner /> : "Finalizar Venta"}
                </Button>
            </div>

            {/* --- Modales --- */}
            {/* Modal para añadir/editar productos */}
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

            {/* Modal para añadir/editar cliente (Persona con rol de Cliente) */}
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
                console.log('Cliente seleccionado o creado:', persona);
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

            {/* Modal de éxito de la venta */}
            <Modal
                isOpen={showSuccessModal}
                onClose={handleCloseSuccessModal}
                title="Venta Realizada con Éxito"
                showCancelButton={false}
                onConfirm={handleCloseSuccessModal}
            >
                <p className="text-center text-lg text-gray-700">La venta #{ventaExitosaId} ha sido registrada correctamente. 🎉</p>
                <p className="text-center text-gray-500 mt-2">Puedes cerrar esta ventana o continuar con nuevas ventas.</p>
            </Modal>
        </div>
    );
};

export default VentasFormPage;