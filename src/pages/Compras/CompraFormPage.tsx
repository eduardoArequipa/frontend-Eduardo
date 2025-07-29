import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Input from "../../components/Common/Input";
import Button from "../../components/Common/Button";
import LoadingSpinner from "../../components/Common/LoadingSpinner";
import Select from "../../components/Common/Select";
import Modal from "../../components/Common/Modal";
import ProductoForm from "../../components/Specific/ProductoForm";
import {
  getCompraById,
  createCompra,
  updateCompra,
} from "../../services/compraService";
import { getProveedores } from "../../services/proveedorService";
import { getProductos, getProductoByCode} from "../../services/productoService"; // Asegúrate de importar getProductoByCodigo
import { getCategorias } from "../../services/categoriaService";
import { getUnidadesMedida } from "../../services/unidadMedidaService";
import { getMarcas } from "../../services/marcaService";
import {
  Compra,
  CompraCreate,
  CompraUpdate,
  DetalleCompraCreate,
} from "../../types/compra";
import { EstadoEnum, EstadoCompraEnum } from "../../types/enums";
import { Proveedor } from "../../types/proveedor";
import { Producto, ProductoSchemaBase } from "../../types/producto"; // Importa ProductoSchemaBase si es necesario para el tipo de producto recibido por el WS
import { CategoriaNested } from "../../types/categoria";
import { UnidadMedidaNested } from "../../types/unidad_medida";
import { MarcaNested } from "../../types/marca";
import useScannerWebSocket from '../../hooks/useScannerWebSocket';

export interface CarritoItemCompra {
  producto_id: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  stock_actual: number;
}

const initialDetalle: DetalleCompraCreate = {
  producto_id: "",
  cantidad: 1,
  precio_unitario: 0,
};

const ComprasFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const compraId = id ? parseInt(id, 10) : null;

  const [proveedorId, setProveedorId] = useState<number | "">("");
  const [fechaCompra, setFechaCompra] = useState<string>(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  });
  const [estadoCompra, setEstadoCompra] = useState<EstadoCompraEnum>(
    EstadoCompraEnum.pendiente
  );
  const [detallesCompra, setDetallesCompra] = useState<DetalleCompraCreate[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosMap, setProductosMap] = useState<Map<number, Producto>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [productoSearchTerm, setProductoSearchTerm] = useState('');

  // --- Estados para el Modal de Crear Producto ---
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
  const [availableCategorias, setAvailableCategorias] = useState<CategoriaNested[]>([]);
  const [availableUnidadesMedida, setAvailableUnidadesMedida] = useState<UnidadMedidaNested[]>([]);
  const [availableMarcas, setAvailableMarcas] = useState<MarcaNested[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // --- Estados y Refs para el WebSocket ---

    const { websocketStatus, scannerError, lastScannedProduct, lastScannedType } = useScannerWebSocket();

  const filteredProducts = useMemo(() => {
    if (!productoSearchTerm) {
      return productos;
    }
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(productoSearchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(productoSearchTerm.toLowerCase())
    );
  }, [productos, productoSearchTerm]);

  const addOrUpdateProductInCart = useCallback((producto: Producto) => {
    setDetallesCompra(prevDetalles => {
      const existingItemIndex = prevDetalles.findIndex(item => Number(item.producto_id) === producto.producto_id);
      if (existingItemIndex > -1) {
        const updatedDetalles = [...prevDetalles];
        const existingItem = updatedDetalles[existingItemIndex];
        updatedDetalles[existingItemIndex] = {
          ...existingItem,
          cantidad: (Number(existingItem.cantidad) || 0) + 1,
        };
        return updatedDetalles;
      } else {
        return [
          ...prevDetalles,
          {
            producto_id: producto.producto_id,
            cantidad: 1,
            // Usa el precio de compra del producto si está disponible, sino 0
            precio_unitario: producto.precio_compra || 0,
          },
        ];
      }
    });
    setProductosMap(prevMap => {
      // Solo añade el producto al mapa si no existe
      if (!prevMap.has(producto.producto_id)) {
        const newMap = new Map(prevMap);
        newMap.set(producto.producto_id, producto);
        return newMap;
      }
      return prevMap;
    });
    setError(null);
  }, []);

  const fetchProducts = async () => {
    try {
      const fetchedProductos = await getProductos({
        estado: EstadoEnum.Activo,
        limit: 1000,
      });
      setProductos(fetchedProductos);
      const pMap = new Map<number, Producto>();
      fetchedProductos.forEach((p) => pMap.set(p.producto_id, p));
      setProductosMap(pMap);
    } catch (err) {
      console.error("Error fetching productos:", err);
      setError("No se pudieron cargar los productos.");
    }
  };

    useEffect(() => {
        if (lastScannedProduct && lastScannedType === 'purchase_scan') {
            addOrUpdateProductInCart(lastScannedProduct);
            // Opcional: limpiar lastScannedProduct y lastScannedType si el hook no lo hace
            // para evitar procesarlo múltiples veces si el componente se re-renderiza
        }
    }, [lastScannedProduct, lastScannedType, addOrUpdateProductInCart]);// Asegúrate de que addOrUpdateProductInCart sea estable (usa useCallback)

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      setFormSubmitError(null);
      try {
        const fetchedProveedores = await getProveedores({
          estado: EstadoEnum.Activo,
          limit: 1000,
        });
        setProveedores(fetchedProveedores);

        await fetchProducts();

        if (isEditing && compraId) {
          const compra = await getCompraById(compraId);
          setProveedorId(compra.proveedor_id);
          setFechaCompra(
            new Date(compra.fecha_compra).toISOString().slice(0, 16)
          );
          setEstadoCompra(compra.estado);
          const loadedDetalles: DetalleCompraCreate[] = compra.detalles.map(
            (d) => ({
              producto_id: d.producto.producto_id,
              cantidad: d.cantidad,
              precio_unitario: d.precio_unitario,
            })
          );
          setDetallesCompra(loadedDetalles);
        }
      } catch (err: any) {
        console.error("Error cargando datos iniciales o compra:", err);
        setError(
          "Error al cargar datos: " +
          (err.response?.data?.detail || err.message)
        );
      } finally {
        setLoading(false);
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
        console.error("Error loading catalogs:", err);
        setError("Error al cargar catálogos para el formulario de productos.");
      } finally {
        setLoadingCatalogs(false);
      }
    };

    fetchInitialData();
    loadCatalogs();
  }, [isEditing, compraId]);

  const removeDetalle = (indexToRemove: number) => {
    setDetallesCompra((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleDetalleChange = useCallback(
    (
      index: number,
      field: keyof DetalleCompraCreate,
      value: string | number
    ) => {
      setDetallesCompra((prevDetalles) => {
        const newDetalles = [...prevDetalles];
        newDetalles[index] = { ...newDetalles[index], [field]: value };
        return newDetalles;
      });
    },
    []
  );

  const totalCompra = useMemo(() => {
    return detallesCompra
      .reduce((sum, detalle) => {
        const cantidad = Number(detalle.cantidad) || 0;
        const precio = Number(detalle.precio_unitario) || 0;
        if (cantidad > 0 && precio >= 0) {
          return sum + cantidad * precio;
        }
        return sum;
      }, 0)
      .toFixed(2);
  }, [detallesCompra]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormSubmitError(null);
    setFormMessage(null);

    if (!proveedorId) {
      setFormSubmitError("Debe seleccionar un proveedor.");
      setLoading(false);
      return;
    }
    if (!fechaCompra) {
      setFormSubmitError("Debe seleccionar una fecha para la compra.");
      setLoading(false);
      return;
    }

    const validDetalles: DetalleCompraCreate[] = [];
    for (const [index, detalle] of detallesCompra.entries()) {
      const prodId = Number(detalle.producto_id);
      const cant = Number(detalle.cantidad);
      const precio = Number(detalle.precio_unitario);

      if (!prodId || isNaN(prodId) || !productosMap.has(prodId)) {
        setFormSubmitError(`El producto es requerido o no válido en la línea ${index + 1}.`);
        setLoading(false);
        return;
      }
      if (isNaN(cant) || cant <= 0) {
        setFormSubmitError(`La cantidad para el producto ${productosMap.get(prodId)?.nombre || "desconocido"} en la línea ${index + 1} debe ser un número positivo.`);
        setLoading(false);
        return;
      }
      if (isNaN(precio) || precio < 0) {
        setFormSubmitError(`El precio unitario para el producto ${productosMap.get(prodId)?.nombre || "desconocido"} en la línea ${index + 1} debe ser un número no negativo.`);
        setLoading(false);
        return;
      }
      validDetalles.push({ producto_id: prodId, cantidad: cant, precio_unitario: precio });
    }

    if (validDetalles.length === 0) {
      setFormSubmitError("La compra debe tener al menos un producto válido.");
      setLoading(false);
      return;
    }

    const purchaseData: CompraCreate | CompraUpdate = {
      proveedor_id: Number(proveedorId),
      fecha_compra: fechaCompra,
      estado: estadoCompra,
      detalles: validDetalles,
    };

    try {
      if (isEditing && compraId) {
        await updateCompra(compraId, purchaseData);
        setFormMessage("Compra actualizada exitosamente! ✅");
      } else {
        await createCompra(purchaseData as CompraCreate);
        setFormMessage("Compra creada exitosamente! 🎉");
      }
      setTimeout(() => navigate("/compras"), 1500);
    } catch (err: any) {
      console.error("Error al guardar la compra:", err.response?.data || err);
      const errorMessage = err.response?.data?.detail || err.message || "Ocurrió un error al guardar la compra.";
      setFormSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddProductModal = () => setIsAddProductModalOpen(true);
  const handleCloseAddProductModal = () => setIsAddProductModalOpen(false);
  const handleProductFormSuccess = () => {
    handleCloseAddProductModal();
    fetchProducts(); // Recargar la lista de productos
  };

  if (loading && !isEditing && productos.length === 0 && proveedores.length === 0) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner /> Cargando datos iniciales...</div>;
  }
  if (loading && isEditing) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner /> Cargando compra para editar...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center mt-4 p-4">{error}</div>;
  }
  if (!loading && (proveedores.length === 0)) {
    return <div className="text-yellow-600 text-center mt-4 p-4">No hay proveedores activos disponibles para crear una compra.</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {isEditing ? `Editar Compra #${compraId}` : "Registrar Nueva Compra"}
      </h1>
      {formSubmitError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">{formSubmitError}</div>}
      {formMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4" role="alert">{formMessage}</div>}
      {/* Estado del WebSocket */}
      <div className="text-sm text-gray-600 mb-4 flex items-center justify-end">
        Estado del escáner: <span className={`ml-2 font-semibold ${websocketStatus.includes('Conectado') ? 'text-green-600' : websocketStatus.includes('Desconectado') || websocketStatus.includes('Error') || websocketStatus.includes('Fallo') ? 'text-red-600' : 'text-yellow-600'}`}>{websocketStatus}</span>
        {websocketStatus.includes('Conectando') && <LoadingSpinner className="ml-2 w-4 h-4" />}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-4">1. Detalles de la Compra</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="proveedor" className="block text-sm font-medium text-gray-700">Proveedor</label>
                  <Select id="proveedor" value={proveedorId} onChange={(e) => setProveedorId(Number(e.target.value))} required className="mt-1 block w-full" disabled={loading}>
                    <option value="">Seleccione un proveedor</option>
                    {proveedores.map((prov) => (
                      <option key={prov.proveedor_id} value={prov.proveedor_id}>
                        {prov.persona ? `${prov.persona.nombre} ${prov.persona.apellido_paterno || ""}`.trim() : prov.empresa?.razon_social || `ID: ${prov.proveedor_id}`}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label htmlFor="fechaCompra" className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                  <Input id="fechaCompra" type="datetime-local" value={fechaCompra} readOnly className="mt-1 block w-full bg-gray-100" />
                </div>
                {isEditing && (
                  <div className="md:col-span-2">
                    <label htmlFor="estadoCompra" className="block text-sm font-medium text-gray-700">Estado</label>
                    <Select id="estadoCompra" value={estadoCompra} onChange={(e) => setEstadoCompra(e.target.value as EstadoCompraEnum)} required className="mt-1 block w-full" disabled={loading}>
                      {Object.values(EstadoCompraEnum).map((estado) => (
                        <option key={estado} value={estado}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-4">2. Añadir Productos</h2>
              <div>
                <div className="flex items-center gap-4 mb-2">
                    <label htmlFor="search-product" className="block text-sm font-medium text-gray-700 flex-grow">Buscar en Lista</label>
                    <Button type="button" onClick={handleOpenAddProductModal} variant="success" className="px-3 py-1 text-sm" disabled={loadingCatalogs}>
                        {loadingCatalogs ? 'Cargando...' : '+ Nuevo Producto'}
                    </Button>
                </div> 
                <Input id="search-product" type="text" placeholder="Filtrar por nombre o código..." value={productoSearchTerm} onChange={(e) => setProductoSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                <div className="mt-2 max-h-[300px] overflow-y-auto border rounded-md">
                  {filteredProducts.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {filteredProducts.map(producto => (
                        <li key={producto.producto_id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                          <div>
                            <p className="font-semibold text-gray-900">{producto.nombre}</p>
                            <p className="text-sm text-gray-500">Cód: {producto.codigo}</p>
                          </div>
                          <Button type="button" onClick={() => addOrUpdateProductInCart(producto)} variant="success" className="px-3 py-1 text-sm">+ Añadir</Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-gray-500 p-4">No se encontraron productos. Puede crear uno nuevo.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-4">3. Productos en la Compra ({detallesCompra.length})</h2>
            <div className="flex-grow min-h-[300px] max-h-[60vh] overflow-y-auto pr-2 -mr-4 space-y-3">
              {detallesCompra.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500"><p>El carrito de compras está vacío.</p></div>
              ) : (
                detallesCompra.map((detalle, index) => {
                  const subtotal = (Number(detalle.cantidad) || 0) * (Number(detalle.precio_unitario) || 0);
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-md bg-gray-50 shadow-sm">
                      <div className="flex-grow">
                        <p className="font-semibold text-gray-800 text-base">{productosMap.get(Number(detalle.producto_id))?.nombre || `ID: ${detalle.producto_id}`}</p>
                        <p className="text-sm text-gray-500">Subtotal: <span className="font-bold">{subtotal.toFixed(2)} Bs.</span></p>
                      </div>
                      <div className="w-24">
                        <label className="text-xs text-gray-600 block text-center mb-1">Cant.</label>
                        <Input type="number" value={detalle.cantidad} onChange={(e) => handleDetalleChange(index, "cantidad", e.target.value)} min="1" className="w-full p-2" />
                      </div>
                      <div className="w-28">
                        <label className="text-xs text-gray-600 block text-center mb-1">Precio (Bs.)</label>
                        <Input type="number" value={detalle.precio_unitario} onChange={(e) => handleDetalleChange(index, "precio_unitario", e.target.value)} min="0" step="0.01" className="w-full p-2" />
                      </div>
                      <Button type="button" onClick={() => removeDetalle(index)} variant="danger" className="p-2 self-center mt-4">X</Button>
                    </div>
                  )
                })
              )}
            </div>
            {detallesCompra.length > 0 && (
                <div className="mt-auto pt-4 border-t">
                    <div className="text-right p-4 bg-indigo-50 rounded-md">
                        <p className="text-2xl font-bold text-indigo-800">Total: Bs. {totalCompra}</p>
                    </div>
                </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
          <Button type="button" onClick={() => navigate(-1)} variant="secondary" disabled={loading} className="px-6 py-2">Cancelar</Button>
          <Button type="submit" variant="primary" disabled={loading || detallesCompra.length === 0} className="px-6 py-2 text-base">
            {loading ? <LoadingSpinner /> : isEditing ? "Actualizar Compra" : "Registrar Compra"}
          </Button>
        </div>
      </form>

      {/* --- Modal para Crear Nuevo Producto --- */}
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
    </div>
  );
};

export default ComprasFormPage;