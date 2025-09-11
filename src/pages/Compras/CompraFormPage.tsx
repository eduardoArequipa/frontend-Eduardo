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

const ComprasFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const compraId = id ? parseInt(id, 10) : null;

  // Get data from contexts
  const { proveedores, isLoading: isLoadingProveedores ,refetchProveedores} = useCompraContext();
  const { 
    productos, 
    conversiones: allConversions, 
    isLoading: isLoadingCatalogs, 
    ensureProductos, 
    ensureConversiones,
    notifyProductoCreated
  } = useCatalogs();
  const { addNotification } = useNotification();

  // Form state
  const [proveedorId, setProveedorId] = useState<number | "">("");
  const [fechaCompra, setFechaCompra] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [estadoCompra, setEstadoCompra] = useState<EstadoCompraEnum>(EstadoCompraEnum.pendiente);
  const [detallesCompra, setDetallesCompra] = useState<DetalleCompraCreate[]>([]);
  const [productoSearchTerm, setProductoSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);

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
          // El producto no está en el catálogo actualizado, se mantiene el detalle existente
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
            return { ...detalle, presentacion_compra: "" };
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
          setFechaCompra(new Date(compra.fecha_compra).toISOString().slice(0, 16));
          setEstadoCompra(compra.estado);
          const loadedDetalles: DetalleCompraCreate[] = compra.detalles.map(d => ({
            producto_id: d.producto.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            presentacion_compra: d.presentacion_compra || "",
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

  const addOrUpdateProductInCart = useCallback((productoId: number) => {
    setDetallesCompra(prevDetalles => {
      const producto = productosMap.get(productoId);
      if (!producto) {
        addNotification("Producto no encontrado en catálogo actualizado.", "error");
        return prevDetalles;
      }

      const existingItemIndex = prevDetalles.findIndex(item => item.producto_id === productoId);
      if (existingItemIndex > -1) {
        const updatedDetalles = [...prevDetalles];
        const existingItem = updatedDetalles[existingItemIndex];
        updatedDetalles[existingItemIndex] = {
          ...existingItem,
          cantidad: (Number(existingItem.cantidad) || 0) + 1
        };
        return updatedDetalles;
      } else {
        const purchaseConversions = allConversions.filter(
          c => c.producto_id === productoId && c.es_para_compra
        );

        let defaultPresentationName: string | undefined;
        let initialPricePerPresentation = parseFloat(String(producto.precio_compra)) || 0;

        if (producto.unidad_compra_predeterminada) {
          defaultPresentationName = producto.unidad_compra_predeterminada;
        } else if (purchaseConversions.length > 0) {
          defaultPresentationName = purchaseConversions[0].nombre_presentacion;
        }

        if (defaultPresentationName) {
          const selectedConversion = purchaseConversions.find(
            c => c.nombre_presentacion === defaultPresentationName
          );
          if (selectedConversion) {
            const precioBase = parseFloat(String(producto.precio_compra)) || 0;
            initialPricePerPresentation = precioBase * selectedConversion.unidades_por_presentacion;
          }
        }

        return [
          ...prevDetalles,
          {
            producto_id: productoId,
            cantidad: 1,
            precio_unitario: initialPricePerPresentation,
            presentacion_compra: defaultPresentationName || ""
          }
        ];
      }
    });
  }, [productosMap, allConversions, addNotification]);
  useEffect(() => {
    if (lastScannedProduct && lastScannedType === 'purchase_scan') {
      addOrUpdateProductInCart(lastScannedProduct.producto_id);
    }
  }, [lastScannedProduct, lastScannedType, addOrUpdateProductInCart]);

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
        const selectedConversion = purchaseConversions.find(c => c.nombre_presentacion === value);
        let newPrecioUnitario = currentDetalle.precio_unitario;
        if (selectedConversion && producto) {
          const precioBase = parseFloat(String(producto.precio_compra)) || 0;
          newPrecioUnitario = precioBase * Number(selectedConversion.unidades_por_presentacion);
        }
        newDetalles[index] = {
          ...currentDetalle,
          presentacion_compra: value as string,
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
      const productoConversiones = allConversions.filter((c: Conversion) => c.producto_id === prodId && c.es_para_compra);
      if (productoConversiones.length > 0 && !presentacion) {
        addNotification(`Debe seleccionar una presentación para ${producto.nombre}.`, 'warning');
        setIsSubmitting(false);
        return;
      }
      if (isNaN(cant) || cant <= 0) {
        addNotification(`La cantidad para ${producto.nombre} debe ser un número positivo.`, 'warning');
        setIsSubmitting(false);
        return;
      }
      if (isNaN(precio) || precio < 0) {
        addNotification(`El precio para ${producto.nombre} debe ser un número no negativo.`, 'warning');
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
      // Los productos ya se actualizaron automáticamente con el stock
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
      // 🚀 OPTIMIZACIÓN: Notificar producto creado sin recargar todo
      notifyProductoCreated(newProduct);
      // Agregar el producto recién creado al carrito
      addOrUpdateProductInCart(newProduct.producto_id);
      addNotification("Producto creado y añadido al carrito exitosamente!", "success");
    } catch (error) {
      console.error('❌ Error al actualizar catálogos:', error);
      addNotification('Error al actualizar los datos del catálogo.', 'error');
    } finally {
      // 3. Cierra el modal solo después de que todo el proceso ha finalizado.
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
                    Buscar en Lista
                  </label>
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
                <Input
                  id="search-product"
                  type="text"
                  placeholder="Filtrar por nombre o código..."
                  value={productoSearchTerm}
                  onChange={(e) => setProductoSearchTerm(e.target.value)}
                />
                <div className="mt-2 max-h-[300px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                  {filteredProducts.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredProducts.map(producto => (
                        <li key={producto.producto_id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{producto.nombre}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Cód: {producto.codigo}</p>
                          </div>
                          <Button
                            type="button"
                            onClick={() => addOrUpdateProductInCart(producto.producto_id)}
                            variant="success"
                            size="sm"
                          >
                            + Añadir
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 p-4">No se encontraron productos.</p>
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

                      {producto && productoConversiones.length > 0 && (
                        <div className="w-32">
                          <label className="text-xs text-gray-600 dark:text-gray-400 block text-center mb-1">Presentación</label>
                          <Select
                            value={detalle.presentacion_compra || ''}
                            onChange={(e) => handleDetalleChange(index, "presentacion_compra", e.target.value)}
                            options={[
                              { value: '', label: 'Seleccione' },
                              ...productoConversiones.map(conv => ({
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
                          min="1"
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-xs text-gray-600 dark:text-gray-400 block text-center mb-1">Precio (Bs.)</label>
                        <Input
                          type="number"
                          value={detalle.precio_unitario}
                          onChange={(e) => handleDetalleChange(index, "precio_unitario", e.target.value)}
                          min="0"
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
    </div>
  );
};

export default ComprasFormPage;