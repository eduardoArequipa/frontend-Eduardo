// src/pages/Compras/CompraFormPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Input from "../../components/Common/Input";
import Button from "../../components/Common/Button";
import LoadingSpinner from "../../components/Common/LoadingSpinner";
import Select from "../../components/Common/Select";
import Modal from "../../components/Common/Modal";
import ProductoForm from "../../components/Specific/ProductoForm";
import { getCompraById, createCompra, updateCompra } from "../../services/compraService";
import { CompraCreate, CompraUpdate, DetalleCompraCreate } from "../../types/compra";
import { EstadoCompraEnum } from "../../types/enums";
import { Conversion, Producto } from "../../types/producto";
import useScannerWebSocket from '../../hooks/useScannerWebSocket';

// Contexts
import { useCompraContext } from "../../context/CompraContext";
import { useCatalogs } from "../../context/CatalogContext";
import { useNotification } from "../../context/NotificationContext";
import { useLowStock } from "../../context/LowStockContext";
import { formatStockDisplay } from "../../utils/formatUtils"; // ✅ Importado

export interface CarritoItemCompra {
  producto_id: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  stock_actual: number;
  selected_presentacion_nombre?: string;
  selected_presentacion_id?: number;
  conversiones?: Conversion[];
}

const toLocalISOString = (date: Date): string => {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 16);
};

const ComprasFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const compraId = id ? parseInt(id, 10) : null;

  // Get data from contexts
  const { proveedores, isLoading: isLoadingProveedores, refetchProveedores } = useCompraContext();
  const {
    productos,
    conversiones: allConversions,
    isLoading: isLoadingCatalogs,
    ensureProductos,
    ensureConversiones,
    invalidateConversiones,
    notifyProductoCreated
  } = useCatalogs();
  const { addNotification } = useNotification();
  const { lowStockProducts, loadingLowStock, fetchLowStockProducts } = useLowStock();

  // Form state
  const [proveedorId, setProveedorId] = useState<number | "">("");
  const [fechaCompra, setFechaCompra] = useState<string>(() => toLocalISOString(new Date()));
  const [estadoCompra, setEstadoCompra] = useState<EstadoCompraEnum>(EstadoCompraEnum.pendiente);
  const [detallesCompra, setDetallesCompra] = useState<DetalleCompraCreate[]>([]);
  const [productoSearchTerm, setProductoSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
  // ✅ NUEVO: Modal para agregar múltiples presentaciones del mismo producto
  const [isMultiPresentacionModalOpen, setIsMultiPresentacionModalOpen] = useState(false);
  const [selectedProductoForModal, setSelectedProductoForModal] = useState<Producto | null>(null);
  const [showLowStockView, setShowLowStockView] = useState(false);

  const { websocketStatus, lastScannedProduct, lastScannedType } = useScannerWebSocket();

  const productosMap = useMemo(() => {
    const map = new Map<number, Producto>();
    productos.forEach(p => map.set(p.producto_id, p));
    return map;
  }, [productos]);

  const filteredProducts = useMemo(() => {
    if (!productoSearchTerm) return productos;
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(productoSearchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(productoSearchTerm.toLowerCase())
    );
  }, [productos, productoSearchTerm]);

  const productsToList = useMemo(() => {
    if (showLowStockView) {
      return lowStockProducts
        .map(lowStockProd => productosMap.get(lowStockProd.producto_id))
        .filter((p): p is Producto => !!p);
    }
    return filteredProducts;
  }, [showLowStockView, lowStockProducts, filteredProducts, productosMap]);

  useEffect(() => {
    refetchProveedores();
    ensureProductos();
    ensureConversiones();
  }, [refetchProveedores, ensureProductos, ensureConversiones]);

  useEffect(() => {
    setDetallesCompra(prevDetalles => {
      return prevDetalles.map(detalle => {
        const producto = productosMap.get(Number(detalle.producto_id));
        if (!producto) {
          return detalle;
        }

        const conversionesValidas = allConversions.filter(
          c => c.producto_id === producto.producto_id && c.es_para_compra
        );

        if (detalle.presentacion_compra) {
          const presentacionValida = conversionesValidas.some(
            c => c.nombre_presentacion === detalle.presentacion_compra
          );

          if (!presentacionValida) {
            console.warn(`Presentación eliminada detectada: ${detalle.presentacion_compra} en producto ${producto.nombre}`);
            addNotification(
              `La presentación "${detalle.presentacion_compra}" de ${producto.nombre} fue eliminada. Se ha limpiado.`,
              'warning'
            );
            return { ...detalle, presentacion_compra: producto.unidad_inventario.nombre_unidad };
          }
        }

        return detalle;
      });
    });
  }, [allConversions, productosMap, addNotification]);

  useEffect(() => {
    if (isEditing && compraId) {
      const fetchEditData = async () => {
        setIsSubmitting(true);
        try {
          const compra = await getCompraById(compraId);
          setProveedorId(compra.proveedor_id);
          setFechaCompra(toLocalISOString(new Date(compra.fecha_compra)));
          setEstadoCompra(compra.estado);
          const loadedDetalles: DetalleCompraCreate[] = compra.detalles.map(d => ({
            producto_id: d.producto.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            presentacion_compra: d.presentacion_compra || d.producto.unidad_inventario.nombre_unidad,
          }));
          setDetallesCompra(loadedDetalles);
        } catch (err: any) {
          setPageError("Error al cargar la compra para editar.");
          addNotification(err.response?.data?.detail || err.message, 'error');
        } finally {
          setIsSubmitting(false);
        }
      };
      fetchEditData();
    }
  }, [isEditing, compraId, addNotification]);

  // ✅ CAMBIO: Nueva función que SIEMPRE abre modal para múltiples presentaciones
  const handleAgregarProductoClick = (producto: Producto) => {
    setSelectedProductoForModal(producto);
    setIsMultiPresentacionModalOpen(true);
  };

  // ✅ CAMBIO: Callback cuando se confirma agregar en el modal
  const handleConfirmAgregarPresentaciones = (detallesNuevos: DetalleCompraCreate[]) => {
    setDetallesCompra(prev => [...prev, ...detallesNuevos]);
    setIsMultiPresentacionModalOpen(false);
    setSelectedProductoForModal(null);
  };

  // ✅ Para cuando viene del scanner (se abre modal directamente)
  useEffect(() => {
    if (lastScannedProduct && lastScannedType === 'purchase_scan') {
      const producto = productosMap.get(lastScannedProduct.producto_id);
      if (producto) {
        handleAgregarProductoClick(producto);
      }
    }
  }, [lastScannedProduct, lastScannedType, productosMap]);

  const removeDetalle = (indexToRemove: number) => {
    setDetallesCompra(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDetalleChange = useCallback((index: number, field: keyof DetalleCompraCreate, value: string | number) => {
    setDetallesCompra(prevDetalles => {
      const newDetalles = [...prevDetalles];
      const currentDetalle = newDetalles[index];
      
      if (field === "presentacion_compra") {
        const producto = productosMap.get(Number(currentDetalle.producto_id));
        const purchaseConversions = allConversions.filter(
          (c: Conversion) => c.producto_id === producto?.producto_id && c.es_para_compra
        );
        const selectedValue = value as string; // Convertir a string para comparación
        const selectedConversion = purchaseConversions.find(c => c.nombre_presentacion === selectedValue);
        let newPrecioUnitario = currentDetalle.precio_unitario;
        
        if (producto) { // Asegurarse de que el producto existe
          const precioBase = parseFloat(String(producto.precio_compra)) || 0;
          if (selectedConversion) {
            // Es una presentación de conversión
            newPrecioUnitario = precioBase * Number(selectedConversion.unidades_por_presentacion);
          } else if (selectedValue === producto.unidad_inventario.nombre_unidad) {
            // Es la unidad base
            newPrecioUnitario = precioBase;
          }
        }
        
        newDetalles[index] = {
          ...currentDetalle,
          presentacion_compra: selectedValue,
          precio_unitario: newPrecioUnitario
        };
      } else {
        newDetalles[index] = { ...currentDetalle, [field]: value };
      }
      return newDetalles;
    });
  }, [productosMap, allConversions]);

  const totalCompra = useMemo(() => {
    return detallesCompra.reduce((sum, detalle) => {
      const cantidad = Number(detalle.cantidad) || 0;
      const precio = Number(detalle.precio_unitario) || 0;
      return sum + (cantidad * precio);
    }, 0).toFixed(2);
  }, [detallesCompra]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!proveedorId) {
      addNotification("Debe seleccionar un proveedor.", 'warning');
      setIsSubmitting(false);
      return;
    }
    if (!fechaCompra) {
      addNotification("Debe seleccionar una fecha para la compra.", 'warning');
      setIsSubmitting(false);
      return;
    }

    const validDetalles: DetalleCompraCreate[] = [];
    for (const [index, detalle] of detallesCompra.entries()) {
      const prodId = Number(detalle.producto_id);
      const cant = Number(detalle.cantidad);
      const precio = Number(detalle.precio_unitario);
      const presentacion = detalle.presentacion_compra;
      const producto = productosMap.get(prodId);

      if (!producto) {
        addNotification(`El producto en la línea ${index + 1} no es válido.`, 'error');
        setIsSubmitting(false);
        return;
      }

      if (isNaN(cant) || cant <= 0) {
        addNotification(`La cantidad para ${producto.nombre} debe ser un número positivo.`, 'warning');
        setIsSubmitting(false);
        return;
      }
      if (isNaN(precio) || precio <= 0) {
        addNotification(`El precio para ${producto.nombre} debe ser un número positivo.`, 'warning');
        setIsSubmitting(false);
        return;
      }
      validDetalles.push({ producto_id: prodId, cantidad: cant, precio_unitario: precio, presentacion_compra: presentacion });
    }

    if (validDetalles.length === 0) {
      addNotification("La compra debe tener al menos un producto.", 'warning');
      setIsSubmitting(false);
      return;
    }

    const purchaseData: CompraCreate | CompraUpdate = {
      proveedor_id: Number(proveedorId),
      fecha_compra: fechaCompra,
      estado: estadoCompra,
      detalles: validDetalles
    };

    try {
      if (isEditing && compraId) {
        await updateCompra(compraId, purchaseData);
        addNotification("Compra actualizada exitosamente!", 'success');
      } else {
        await createCompra(purchaseData as CompraCreate);
        addNotification("Compra creada exitosamente!", 'success');
      }
      // ✅ Actualizar la lista de productos con bajo stock
      await fetchLowStockProducts();
      
      setTimeout(() => navigate("/compras"), 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Ocurrió un error al guardar la compra.";
      addNotification(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAddProductModal = () => setIsAddProductModalOpen(true);
  const handleCloseAddProductModal = () => setIsAddProductModalOpen(false);

  const handleProductFormSuccess = async (newProduct: Producto) => {
    try {
      notifyProductoCreated(newProduct);
      await invalidateConversiones();
      handleAgregarProductoClick(newProduct);
      addNotification("Producto creado exitosamente!", "success");
    } catch (error) {
      addNotification('Error al actualizar los datos del catálogo.', 'error');
    } finally {
      handleCloseAddProductModal();
    }
  };

  const isLoading = isLoadingProveedores || isLoadingCatalogs || isSubmitting;

  if (isLoading && !isEditing) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner /> Cargando datos...</div>;
  }

  if (pageError) {
    return <div className="text-red-500 text-center mt-4 p-4">{pageError}</div>;
  }

  if (!isEditing && proveedores.length === 0) {
    return <div className="text-yellow-600 dark:text-yellow-400 text-center mt-4 p-4">
      No hay proveedores activos. Por favor, añada uno antes de crear una compra.
    </div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        {isEditing ? `Editar Compra #${compraId}` : "Registrar Nueva Orden Compra"}
      </h1>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center justify-end">
        Estado del escáner:
        <span className={`ml-2 font-semibold ${websocketStatus.includes('Conectado') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {websocketStatus}
        </span>
        {websocketStatus.includes('Conectando') && <LoadingSpinner className="ml-2 w-4 h-4" />}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                1. Detalles de la Compra
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="proveedor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor</label>
                  <Select
                    id="proveedor"
                    value={proveedorId}
                    onChange={(e) => setProveedorId(Number(e.target.value))}
                    required
                    className="mt-1 block w-full"
                    disabled={isLoading}
                  >
                    <option value="">Seleccione un proveedor</option>
                    {proveedores.map((prov) => (
                      <option key={prov.proveedor_id} value={prov.proveedor_id}>
                        {prov.persona
                          ? `${prov.persona.nombre} ${prov.persona.apellido_paterno || ""}`.trim()
                          : prov.empresa?.razon_social || `ID: ${prov.proveedor_id}`}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label htmlFor="fechaCompra" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha y Hora</label>
                  <Input
                    id="fechaCompra"
                    type="datetime-local"
                    value={fechaCompra}
                    readOnly
                    className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 dark:text-gray-200"
                  />
                </div>
                {isEditing && (
                  <div className="md:col-span-2">
                    <label htmlFor="estadoCompra" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                    <Select
                      id="estadoCompra"
                      value={estadoCompra}
                      onChange={(e) => setEstadoCompra(e.target.value as EstadoCompraEnum)}
                      required
                      className="mt-1 block w-full"
                      disabled={isLoading}
                    >
                      {Object.values(EstadoCompraEnum).map((estado) => (
                        <option key={estado} value={estado}>
                          {estado.charAt(0).toUpperCase() + estado.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                2. Añadir Productos
              </h2>
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <label htmlFor="search-product" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex-grow">
                    {showLowStockView ? "Mostrando productos con bajo stock" : "Buscar en Lista"}
                  </label>
                  {lowStockProducts.length > 0 && (
                    <Button
                      type="button"
                      onClick={() => setShowLowStockView(!showLowStockView)}
                      variant={showLowStockView ? "primary" : "warning"}
                      size="sm"
                      disabled={loadingLowStock}
                    >
                      {loadingLowStock ? 'Cargando...' : 
                          showLowStockView ? 'Ver Todos los Productos' : 
                          `Ver ${lowStockProducts.length} Productos con Bajo Stock ⚠️`
                      }
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleOpenAddProductModal}
                    variant="success"
                    size="sm"
                    disabled={isLoadingCatalogs}
                  >
                    {isLoadingCatalogs ? 'Cargando...' : '+ Nuevo Producto'}
                  </Button>
                </div>
                {!showLowStockView && (
                  <Input
                    id="search-product"
                    type="text"
                    placeholder="Filtrar por nombre o código..."
                    value={productoSearchTerm}
                    onChange={(e) => setProductoSearchTerm(e.target.value)}
                  />
                )}
                <div className="mt-2 max-h-[300px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                  {productsToList.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {productsToList.map(producto => (
                        <li key={producto.producto_id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{producto.nombre}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Cód: {producto.codigo}</p>
                            {showLowStockView && (
                                <p className="text-xs mt-1">
                                    Stock: <span className="font-bold text-red-600">{formatStockDisplay(Number(producto.stock), producto.conversiones || [], producto.unidad_inventario?.nombre_unidad || 'Unidad')}</span> / Mín: <span className="font-bold">{formatStockDisplay(Number(producto.stock_minimo), producto.conversiones || [], producto.unidad_inventario?.nombre_unidad || 'Unidad')}</span>
                                </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleAgregarProductoClick(producto)}
                            variant="success"
                            size="sm"
                          >
                            + Añadir
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 p-4">
                      {showLowStockView ? "No hay productos con bajo stock." : "No se encontraron productos."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
              3. Productos en la Compra ({detallesCompra.length})
            </h2>
            <div className="flex-grow min-h-[300px] max-h-[60vh] overflow-y-auto pr-2 -mr-4 space-y-3">
              {detallesCompra.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <p>El carrito de compras está vacío.</p>
                </div>
              ) : (
                detallesCompra.map((detalle, index) => {
                  const producto = productosMap.get(Number(detalle.producto_id));
                  const subtotal = (Number(detalle.cantidad) || 0) * (Number(detalle.precio_unitario) || 0);
                  const productoConversiones = allConversions.filter(
                    (c: Conversion) => c.producto_id === producto?.producto_id && c.es_para_compra
                  );

                  const selectedConversion = productoConversiones.find(c => c.nombre_presentacion === detalle.presentacion_compra);
                  const unidadDisplay = selectedConversion
                    ? selectedConversion.nombre_presentacion
                    : (producto?.unidad_inventario?.nombre_unidad || "Unidad");
                  
                  // ✅ Determinar si es fraccionable
                  const esFraccionable = selectedConversion 
                    ? false // Las presentaciones (cajas, etc.) se asumen enteras
                    : (producto?.unidad_inventario?.es_fraccionable ?? true); // La unidad base depende de su configuración

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 shadow-sm"
                    >
                      <div className="flex-grow">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {producto?.nombre || `ID: ${detalle.producto_id}`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Subtotal: <span className="font-bold">{subtotal.toFixed(2)} Bs.</span>
                        </p>
                      </div>

                      {producto && (
                        <div className="w-32">
                          <label className="text-xs text-gray-600 dark:text-gray-400 block text-center mb-1">Presentación</label>
                          <Select
                            value={detalle.presentacion_compra || ''}
                            onChange={(e) => handleDetalleChange(index, "presentacion_compra", e.target.value)}
                            options={[
                              { value: producto.unidad_inventario.nombre_unidad, label: `${producto.unidad_inventario.nombre_unidad} (Base)` }, // ✅ Añadida la unidad base
                              ...allConversions
                                .filter(c => c.producto_id === producto.producto_id && c.es_para_compra)
                                .map(conv => ({
                                  value: conv.nombre_presentacion,
                                  label: conv.nombre_presentacion
                                }))
                            ]}
                          />
                        </div>
                      )}

                      <div className="w-24">
                        <label className="text-xs text-gray-600 dark:text-gray-400 block text-center mb-1">
                          Cantidad ({unidadDisplay})
                        </label>
                        <Input
                          type="number"
                          value={detalle.cantidad}
                          onChange={(e) => handleDetalleChange(index, "cantidad", e.target.value)}
                          min={esFraccionable ? "0.01" : "1"}
                          step={esFraccionable ? "0.01" : "1"}
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-xs text-gray-600 dark:text-gray-400 block text-center mb-1">Precio (Bs.)</label>
                        <Input
                          type="number"
                          value={detalle.precio_unitario}
                          onChange={(e) => handleDetalleChange(index, "precio_unitario", e.target.value)}
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeDetalle(index)}
                        variant="danger"
                        className="p-2 self-center mt-4"
                      >
                        X
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            {detallesCompra.length > 0 && (
              <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-right p-4 bg-indigo-50 dark:bg-indigo-900 rounded-md">
                  <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">Total: Bs. {totalCompra}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
          <Button type="button" onClick={() => navigate(-1)} variant="secondary">Cancelar</Button>
          <Button type="submit" variant="primary" disabled={isLoading || detallesCompra.length === 0}>
            {isLoading ? <LoadingSpinner /> : isEditing ? "Actualizar Compra" : "Registrar Compra"}
          </Button>
        </div>
      </form>

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
        />
      </Modal>

      {/* ✅ NUEVO: Modal para agregar múltiples presentaciones del mismo producto */}
      <MultiPresentacionModal
        isOpen={isMultiPresentacionModalOpen}
        onClose={() => {
          setIsMultiPresentacionModalOpen(false);
          setSelectedProductoForModal(null);
        }}
        producto={selectedProductoForModal}
        allConversions={allConversions}
        onConfirm={handleConfirmAgregarPresentaciones}
      />
    </div>
  );
};

// ✅ NUEVO COMPONENTE: Modal para agregar múltiples presentaciones
interface MultiPresentacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
  allConversions: Conversion[];
  onConfirm: (detalles: DetalleCompraCreate[]) => void;
}

const MultiPresentacionModal: React.FC<MultiPresentacionModalProps> = ({
  isOpen,
  onClose,
  producto,
  allConversions,
  onConfirm
}) => {
  const [presentaciones, setPresentaciones] = useState<Array<{
    presentacion: string;
    cantidad: number;
    precio: number;
  }>>([]);

  useEffect(() => {
    if (isOpen && producto) {
      // Inicializar con una presentación vacía
      setPresentaciones([{
        presentacion: producto.unidad_inventario.nombre_unidad,
        cantidad: 1,
        precio: parseFloat(String(producto.precio_compra)) || 0
      }]);
    }
  }, [isOpen, producto]);

  // ✅ MODIFICADO: Crear una lista de opciones que incluye la unidad base
  const presentacionOptions = useMemo(() => {
    if (!producto) return [];
    
    const productConversions = allConversions.filter(c => c.producto_id === producto.producto_id && c.es_para_compra);
    
    // La unidad base siempre es una opción
    const unidadBaseOption = {
      value: producto.unidad_inventario.nombre_unidad,
      label: `${producto.unidad_inventario.nombre_unidad} (Base)`
    };

    const conversionOptions = productConversions.map(conv => ({
      value: conv.nombre_presentacion,
      label: conv.nombre_presentacion
    }));

    return [unidadBaseOption, ...conversionOptions];
  }, [producto, allConversions]);


  const addPresentacion = () => {
    setPresentaciones([...presentaciones, {
      presentacion: producto?.unidad_inventario.nombre_unidad || '',
      cantidad: 1,
      precio: parseFloat(String(producto?.precio_compra)) || 0
    }]);
  };

  const removePresentacion = (index: number) => {
    setPresentaciones(presentaciones.filter((_, i) => i !== index));
  };

  // ✅ MODIFICADO: La lógica de actualización de precio ahora considera la unidad base
  const updatePresentacion = (index: number, field: string, value: string | number) => {
    const updated = [...presentaciones];
    if (field === 'presentacion') {
      const selectedValue = value as string;
      const productConversions = allConversions.filter(c => c.producto_id === producto?.producto_id && c.es_para_compra);
      const selectedConversion = productConversions.find(c => c.nombre_presentacion === selectedValue);
      
      let newPrice = updated[index].precio;
      const basePrice = parseFloat(String(producto?.precio_compra)) || 0;

      if (selectedConversion) {
        // Es una presentación de conversión
        newPrice = basePrice * selectedConversion.unidades_por_presentacion;
      } else if (selectedValue === producto?.unidad_inventario.nombre_unidad) {
        // Es la unidad base
        newPrice = basePrice;
      }

      updated[index] = {
        ...updated[index],
        presentacion: selectedValue,
        precio: newPrice
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setPresentaciones(updated);
  };

  const handleConfirm = () => {
    const validPresentaciones = presentaciones.filter(p => p.presentacion && p.cantidad > 0 && p.precio > 0);
    
    if (validPresentaciones.length === 0) {
      alert('Por favor, agrega al menos una presentación con cantidad y precio válidos.');
      return;
    }

    const detalles: DetalleCompraCreate[] = validPresentaciones.map(p => ({
      producto_id: producto!.producto_id,
      cantidad: p.cantidad,
      precio_unitario: p.precio,
      // Si la presentación es la unidad base, guardamos un string vacío, si no, el nombre de la presentación
      presentacion_compra: p.presentacion
    }));

    onConfirm(detalles);
  };

  if (!isOpen || !producto) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Agregar Presentaciones - ${producto.nombre}`}
      widthClass="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-100">
            📌 Puedes agregar múltiples presentaciones del mismo producto en una sola compra.
          </p>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {presentaciones.map((pres, index) => (
            <div key={index} className="flex gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
              <div className="flex-1">
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Presentación</label>
                <Select
                  value={pres.presentacion}
                  onChange={(e) => updatePresentacion(index, 'presentacion', e.target.value)}
                  options={[
                    { value: '', label: 'Seleccionar presentación...' },
                    ...presentacionOptions
                  ]}
                  required
                />
              </div>

              <div className="w-24">
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Cantidad</label>
                <Input
                  type="number"
                  value={pres.cantidad}
                  onChange={(e) => updatePresentacion(index, 'cantidad', Number(e.target.value))}
                  min={
                    // Determinar si es fraccionable en el modal
                    (() => {
                      const isBase = pres.presentacion === producto.unidad_inventario.nombre_unidad;
                      return isBase && producto.unidad_inventario.es_fraccionable ? "0.01" : "1";
                    })() === "0.01" ? "0.01" : "1"
                  }
                  step={
                    (() => {
                      const isBase = pres.presentacion === producto.unidad_inventario.nombre_unidad;
                      return isBase && producto.unidad_inventario.es_fraccionable ? "0.01" : "1";
                    })()
                  }
                  required
                />
              </div>

              <div className="w-28">
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Precio (Bs.)</label>
                <Input
                  type="number"
                  value={pres.precio}
                  onChange={(e) => updatePresentacion(index, 'precio', Number(e.target.value))}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <Button
                type="button"
                onClick={() => removePresentacion(index)}
                variant="danger"
                className="p-2 self-end"
              >
                X
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          onClick={addPresentacion}
          variant="success"
          className="w-full"
        >
          + Agregar otra presentación
        </Button>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            variant="primary"
          >
            Confirmar y Agregar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ComprasFormPage;