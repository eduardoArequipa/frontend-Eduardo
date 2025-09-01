// src/components/Specific/ProductoForm.tsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { getProductoById, createProducto, updateProducto, createConversion, updateConversion, deleteConversion } from "../../services/productoService";
import { uploadImage } from "../../services/uploadService";
import { ProductoCreate, ProductoUpdate, Conversion, ConversionCreate, Producto } from "../../types/producto";
import { useCatalogs } from "../../context/CatalogContext";
import Input from "../Common/Input";
import Button from "../Common/Button";
import LoadingSpinner from "../Common/LoadingSpinner";
import Select from "../Common/Select";
import ErrorMessage from "../Common/ErrorMessage";
import { useTheme } from "../../context/ThemeContext";
import { useNotification } from "../../context/NotificationContext";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface ProductoFormProps {
  productoId?: number;
  onSuccess: (producto: Producto) => Promise<void>;
  onCancel: () => void;
}

type FormData = Omit<ProductoCreate, 'imagen_ruta'>;

type LocalConversion = Omit<Conversion, 'producto_id'> & { tempId?: number };

const ProductoForm: React.FC<ProductoFormProps> = ({ productoId, onSuccess, onCancel }) => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const {
    categorias: availableCategorias,
    unidadesMedida: availableUnidadesMedida,
    marcas: availableMarcas,
  } = useCatalogs();

  const isEditing = !!productoId;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ mode: "onBlur" });

  const unidadInventarioId = watch('unidad_inventario_id');
  const selectedUnidadInventario = availableUnidadesMedida.find(u => u.unidad_id === unidadInventarioId);
  const unidadInventarioNombre = selectedUnidadInventario?.nombre_unidad;

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const [conversions, setConversions] = useState<LocalConversion[]>([]);
  const [newConversion, setNewConversion] = useState({ nombre_presentacion: '', unidades_por_presentacion: '', es_para_compra: false, es_para_venta: false, rollsPerBox: '', metersPerRoll: '' });
  const [editingConversionId, setEditingConversionId] = useState<number | null | undefined>(null);
  const [editingTempId, setEditingTempId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateUnits = () => {
      const rolls = parseFloat(newConversion.rollsPerBox);
      const meters = parseFloat(newConversion.metersPerRoll);

      if (!isNaN(rolls) && !isNaN(meters) && rolls > 0 && meters > 0) {
        setNewConversion(prev => ({
          ...prev,
          unidades_por_presentacion: (rolls * meters).toString()
        }));
      } else if (!isNaN(parseFloat(newConversion.unidades_por_presentacion))) {
        setNewConversion(prev => ({
          ...prev,
          rollsPerBox: '',
          metersPerRoll: ''
        }));
      }
    };

    calculateUnits();
  }, [newConversion.rollsPerBox, newConversion.metersPerRoll]);

  useEffect(() => {
    const loadEditData = async () => {
      if (isEditing && productoId) {
        setLoading(true);
        try {
          const data = await getProductoById(productoId);
          setValue("codigo", data.codigo);
          setValue("nombre", data.nombre);
          setValue("precio_compra", parseFloat(data.precio_compra.toString()));
          setValue("precio_venta", parseFloat(data.precio_venta.toString()));
          setValue("stock", parseFloat(data.stock.toString()));
          setValue("stock_minimo", parseFloat(data.stock_minimo.toString()));
          setValue("categoria_id", data.categoria.categoria_id);
          setValue("unidad_inventario_id", data.unidad_inventario?.unidad_id);
          setValue("marca_id", data.marca?.marca_id);
          setValue("unidad_compra_predeterminada", data.unidad_compra_predeterminada || '');
          setConversions(data.conversiones || []);

          setExistingImageUrl(
            data.imagen_ruta
              ? `${BACKEND_BASE_URL}${data.imagen_ruta.startsWith("/") ? data.imagen_ruta : "/" + data.imagen_ruta}`
              : null
          );
        } catch (err) {
          console.error("Error loading producto for edit:", err);
          setError("No se pudo cargar el producto para editar.");
        } finally {
          setLoading(false);
        }
      }
    };

    loadEditData();
  }, [isEditing, productoId, setValue]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setSelectedImageFile(file);
    setRemoveExistingImage(false);
  };

  const handleRemoveExistingImage = () => {
    setRemoveExistingImage(true);
    setSelectedImageFile(null);
    const fileInput = document.getElementById("product_image") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const resetConversionForm = () => {
    setNewConversion({ nombre_presentacion: '', unidades_por_presentacion: '', es_para_compra: false, es_para_venta: false, rollsPerBox: '', metersPerRoll: '' });
    setEditingConversionId(null);
    setEditingTempId(null);
  };

  const handleAddOrUpdateConversion = async () => {
    if (!newConversion.nombre_presentacion || !newConversion.unidades_por_presentacion) {
      addNotification("Por favor, complete los campos de la presentación.", 'warning');
      return;
    }

    const conversionData: ConversionCreate = {
      nombre_presentacion: newConversion.nombre_presentacion,
      unidades_por_presentacion: parseFloat(newConversion.unidades_por_presentacion),
      es_para_compra: newConversion.es_para_compra,
      es_para_venta: newConversion.es_para_venta,
    };

    if (isEditing && productoId) {
      try {
        let resultConversion: Conversion;
        if (editingConversionId) {
          resultConversion = await updateConversion(editingConversionId, conversionData);
          setConversions(conversions.map(c => c.id === editingConversionId ? resultConversion : c));
          addNotification("Presentación actualizada con éxito!", 'success');
        } else {
          resultConversion = await createConversion(productoId, conversionData);
          setConversions([...conversions, resultConversion]);
          addNotification("Presentación añadida con éxito!", 'success');
        }
        resetConversionForm();
      } catch (err: any) {
        addNotification(`Error al guardar presentación: ${err.response?.data?.detail || err.message}`, 'error');
      }
    } else {
      if (editingTempId) {
        setConversions(conversions.map(c => c.tempId === editingTempId ? { ...c, ...conversionData } : c));
      } else {
        const newLocalConversion: LocalConversion = {
          ...conversionData,
          id: 0,
          tempId: Date.now()
        };
        setConversions([...conversions, newLocalConversion]);
      }
      resetConversionForm();
    }
  };

  const handleEditConversion = (conversion: LocalConversion) => {
    setNewConversion({
      nombre_presentacion: conversion.nombre_presentacion,
      unidades_por_presentacion: conversion.unidades_por_presentacion.toString(),
      es_para_compra: conversion.es_para_compra,
      es_para_venta: conversion.es_para_venta,
      rollsPerBox: '',
      metersPerRoll: '',
    });
    if (isEditing) {
      setEditingConversionId(conversion.id);
    } else {
      setEditingTempId(conversion.tempId || null);
    }
  };

  const handleCancelEditConversion = () => {
    resetConversionForm();
  };
  const handleDeleteConversion = async (conversion: LocalConversion) => {
    if (window.confirm("¿Está seguro de que desea eliminar esta presentación?")) {
      if (isEditing && conversion.id) {
        try {
          await deleteConversion(conversion.id);
          setConversions(conversions.filter(c => c.id !== conversion.id));
          addNotification("Presentación eliminada con éxito!", 'success');
        } catch (err: any) {
          addNotification(`Error al eliminar presentación: ${err.response?.data?.detail || err.message}`, 'error');
        }
      } else {
        setConversions(conversions.filter(c => c.tempId !== conversion.tempId));
      }
    }
  };

  const onSubmit = async (formData: FormData) => {
    setLoading(true);

    let finalImagenRuta: string | null = null;
    if (selectedImageFile) {
      try {
        const uploadResponse = await uploadImage(selectedImageFile);
        finalImagenRuta = uploadResponse;
      } catch (uploadError: any) {
        addNotification(`Error al subir la imagen: ${uploadError.response?.data?.detail || uploadError.message}`, 'error');
        setLoading(false);
        return;
      }
    } else if (removeExistingImage) {
      finalImagenRuta = null;
    } else if (isEditing && existingImageUrl) {
      const existingRelativePath = existingImageUrl.replace(BACKEND_BASE_URL, "");
      finalImagenRuta = existingRelativePath.startsWith("/") ? existingRelativePath : "/" + existingRelativePath;
    }

    const dataToSend: ProductoCreate | ProductoUpdate = {
      ...formData,
      imagen_ruta: finalImagenRuta,
    };

    try {
      if (isEditing && productoId) {
        await updateProducto(productoId, dataToSend as ProductoUpdate);
        const productoActualizado = await getProductoById(productoId);
        addNotification("Producto actualizado con éxito!", 'success');
        await onSuccess(productoActualizado);
      } else {
        const newProduct = await createProducto(dataToSend as ProductoCreate);
        for (const conv of conversions) {
          const conversionData: ConversionCreate = {
            nombre_presentacion: conv.nombre_presentacion,
            unidades_por_presentacion: conv.unidades_por_presentacion,
            es_para_compra: conv.es_para_compra,
            es_para_venta: conv.es_para_venta,
          };
          await createConversion(newProduct.producto_id, conversionData);
        }
        addNotification("Producto y sus presentaciones creados con éxito!", 'success');
        const finalProduct = await getProductoById(newProduct.producto_id);
        await onSuccess(finalProduct);
      }
    } catch (err: any) {
      let errorMessage = "Ocurrió un error al guardar el producto.";
      if (err.response && err.response.data) {
        if (typeof err.response.data.detail === "string") {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail
            .map((errorDetail: any) => `${errorDetail.loc[1]}: ${errorDetail.msg}`)
            .join("; ");
        }
      }
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return <div className="flex justify-center items-center min-h-[400px]"><LoadingSpinner /></div>;
  }

  if (error) {
    return <ErrorMessage message={`Error al cargar el producto: ${error}`} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}>
      {loading && <LoadingSpinner />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="codigo" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Código</label>
          <Input
            id="codigo"
            type="text"
            {...register("codigo", { required: "El código es requerido" })}
            className={`mt-1 block w-full ${errors.codigo ? 'border-red-500' : 'border-gray-400'}`}
          />
          {errors.codigo && <span className="text-red-500 text-xs">{errors.codigo.message}</span>}
        </div>

        <div>
          <label htmlFor="nombre" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Nombre</label>
          <Input
            id="nombre"
            type="text"
            {...register("nombre", { required: "El nombre es requerido" })}
            className={`mt-1 block w-full ${errors.nombre ? 'border-red-500' : 'border-gray-400'}`}
          />
          {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
        </div>

        <div>
          <label htmlFor="precio_compra" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Precio de Compra</label>
          <Input
            id="precio_compra"
            type="number"
            step="0.01"
            {...register("precio_compra", {
              required: "El precio de compra es requerido",
              valueAsNumber: true,
              min: { value: 0, message: "El precio no puede ser negativo" }
            })}
            className={`mt-1 block w-full ${errors.precio_compra ? 'border-red-500' : 'border-gray-400'}`}
          />
          {errors.precio_compra && <span className="text-red-500 text-xs">{errors.precio_compra.message}</span>}
        </div>

        <div>
          <label htmlFor="precio_venta" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Precio de Venta</label>
          <Input
            id="precio_venta"
            type="number"
            step="0.01"
            {...register("precio_venta", {
              required: "El precio de venta es requerido",
              valueAsNumber: true,
              min: { value: 0, message: "El precio no puede ser negativo" }
            })}
            className={`mt-1 block w-full ${errors.precio_venta ? 'border-red-500' : 'border-gray-400'}`}
          />
          {errors.precio_venta && <span className="text-red-500 text-xs">{errors.precio_venta.message}</span>}
        </div>

        <div>
          <label htmlFor="stock_minimo" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Stock Mínimo</label>
          <Input
            id="stock_minimo"
            type="number"
            step="1"
            {...register("stock_minimo", {
              required: "El stock mínimo es requerido",
              valueAsNumber: true,
              min: { value: 0, message: "El stock no puede ser negativo" }
            })}
            className={`mt-1 block w-full ${errors.stock_minimo ? 'border-red-500' : 'border-gray-400'}`}
          />
          {errors.stock_minimo && <span className="text-red-500 text-xs">{errors.stock_minimo.message}</span>}
        </div>

        <div>
          <label htmlFor="stock" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Stock Actual</label>
          <Input
            id="stock"
            type="number"
            step="0.01"
            {...register("stock", {
              required: "El stock actual es requerido",
              valueAsNumber: true,
              min: { value: 0, message: "El stock no puede ser negativo" }
            })}
            className={`mt-1 block w-full ${errors.stock ? 'border-red-500' : 'border-gray-400'}`}
          />
          {errors.stock && <span className="text-red-500 text-xs">{errors.stock.message}</span>}
        </div>

        <div>
          <label htmlFor="categoria_id" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Categoría</label>
          <Select
            id="categoria_id"
            {...register("categoria_id", { required: "Debe seleccionar una categoría", valueAsNumber: true })}
            className={`mt-1 block w-full ${errors.categoria_id ? 'border-red-500' : 'border-gray-400'}`}
          >
            <option value="">-- Seleccionar Categoría --</option>
            {availableCategorias.map((categoria) => (
              <option key={categoria.categoria_id} value={categoria.categoria_id}>
                {categoria.nombre_categoria}
              </option>
            ))}
          </Select>
          {errors.categoria_id && <span className="text-red-500 text-xs">{errors.categoria_id.message}</span>}
        </div>

        <div>
          <label htmlFor="unidad_inventario_id" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Unidad de Inventario</label>
          <Select
            id="unidad_inventario_id"
            {...register("unidad_inventario_id", { required: "Debe seleccionar una unidad", valueAsNumber: true })}
            className={`mt-1 block w-full ${errors.unidad_inventario_id ? 'border-red-500' : 'border-gray-400'}`}
          >
            <option value="">-- Seleccionar Unidad --</option>
            {availableUnidadesMedida.map((unidad) => (
              <option key={unidad.unidad_id} value={unidad.unidad_id}>
                {unidad.nombre_unidad} ({unidad.abreviatura})
              </option>
            ))}
          </Select>
          {errors.unidad_inventario_id && <span className="text-red-500 text-xs">{errors.unidad_inventario_id.message}</span>}
        </div>

        <div>
          <label htmlFor="marca_id" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Marca</label>
          <Select
            id="marca_id"
            {...register("marca_id", { required: "Debe seleccionar una marca", valueAsNumber: true })}
            className={`mt-1 block w-full ${errors.marca_id ? 'border-red-500' : 'border-gray-400'}`}
          >
            <option value="">-- Seleccionar Marca --</option>
            {availableMarcas.map((marca) => (
              <option key={marca.marca_id} value={marca.marca_id}>
                {marca.nombre_marca}
              </option>
            ))}
          </Select>
          {errors.marca_id && <span className="text-red-500 text-xs">{errors.marca_id.message}</span>}
        </div>

        <div>
          <label htmlFor="unidad_compra_predeterminada" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Unidad de Compra Predeterminada</label>
          <Input
            id="unidad_compra_predeterminada"
            type="text"
            {...register("unidad_compra_predeterminada")}
            className={`mt-1 block w-full border-gray-400'}`}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="product_image" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium mb-2`}>Imagen del Producto</label>
          <input
            id="product_image"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className={`block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 ${selectedImageFile || existingImageUrl ? '' : ''}`}
          />
          {existingImageUrl && !removeExistingImage && (
            <div className="mt-4 relative w-32 h-32 group">
              <img src={existingImageUrl} alt="Imagen actual" className="w-full h-full object-cover rounded-lg border border-gray-300 dark:border-gray-600" />
              <button
                type="button"
                onClick={handleRemoveExistingImage}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar imagen actual"
              >
                X
              </button>
            </div>
          )}
          {selectedImageFile && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Nueva imagen seleccionada: {selectedImageFile.name}</p>
            </div>
          )}
          {removeExistingImage && (
            <p className="mt-4 text-sm text-red-500">La imagen actual será eliminada.</p>
          )}
        </div>
      </div>

      <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Presentaciones de Compra/Venta</h3>
        <div className="space-y-4">
          {conversions.map(conv => (
            <div key={conv.id || conv.tempId} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
              <span className="text-gray-800 dark:text-gray-200">{conv.nombre_presentacion} = {conv.unidades_por_presentacion} Unidades</span>
              <div className="flex text-xs space-x-2">
                {conv.es_para_compra && <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full">Compra</span>}
                {conv.es_para_venta && <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full">Venta</span>}
              </div>
              <div className="flex space-x-2">
                <Button type="button" onClick={() => handleEditConversion(conv)} variant="secondary" size="sm">Editar</Button>
                <Button type="button" onClick={() => handleDeleteConversion(conv)} variant="danger" size="sm">Eliminar</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">Nombre Presentación</label>
            <Select
              value={newConversion.nombre_presentacion}
              onChange={e => setNewConversion({ ...newConversion, nombre_presentacion: e.target.value })}
              options={[
                { value: '', label: '-- Seleccionar --' },
                { value: 'Caja', label: 'Caja' },
                { value: 'Rollo', label: 'Rollo' },
                { value: 'Blíster', label: 'Blíster' },
              ]}

            />
          </div>
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">Unidades por Presentación (Total)</label>
            <Input type="number" value={newConversion.unidades_por_presentacion} onChange={e => setNewConversion({ ...newConversion, unidades_por_presentacion: e.target.value })} placeholder="Ej: 24" />
          </div>
          {(unidadInventarioNombre === 'Metro' && (newConversion.nombre_presentacion.toLowerCase().includes('caja') || newConversion.nombre_presentacion.toLowerCase().includes('rollo'))) && (
            <>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Rollos por Caja</label>
                <Input type="number" value={newConversion.rollsPerBox} onChange={e => setNewConversion({ ...newConversion, rollsPerBox: e.target.value })} placeholder="Ej: 50" />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Metros por Rollo</label>
                <Input type="number" value={newConversion.metersPerRoll} onChange={e => setNewConversion({ ...newConversion, metersPerRoll: e.target.value })} placeholder="Ej: 10" />
              </div>
            </>
          )}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                id="es_para_compra"
                type="checkbox"
                checked={newConversion.es_para_compra}
                onChange={e => setNewConversion({ ...newConversion, es_para_compra: e.target.checked })}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <label htmlFor="es_para_compra" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Para Compra</label>
            </div>
            <div className="flex items-center">
              <input
                id="es_para_venta"
                type="checkbox"
                checked={newConversion.es_para_venta}
                onChange={e => setNewConversion({ ...newConversion, es_para_venta: e.target.checked })}
                className="form-checkbox h-5 w-5 text-green-600"
              />
              <label htmlFor="es_para_venta" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Para Venta</label>
            </div>
          </div>
          <div className="md:col-span-3 flex justify-end space-x-2">
            {(editingConversionId || editingTempId) ? (
              <>
                <Button type="button" onClick={handleAddOrUpdateConversion} variant="primary">Guardar Cambios</Button>
                <Button type="button" onClick={handleCancelEditConversion} variant="secondary">Cancelar</Button>
              </>
            ) : (
              <Button type="button" onClick={handleAddOrUpdateConversion} variant="secondary">Añadir</Button>
            )}
          </div>
        </div>
      </div>

      <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
        <Button type="button" onClick={onCancel} variant="secondary">Cancelar</Button>
        <Button type="submit" disabled={loading} variant="primary">
          {loading ? <LoadingSpinner /> : isEditing ? "Actualizar Producto" : "Crear Producto"}
        </Button>
      </div>
    </form>
  );
};

export default ProductoForm;