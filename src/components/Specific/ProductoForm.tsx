import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  getProductoById,
  createProducto,
  updateProducto,
  createConversion,
  updateConversion, // Asegúrate de que updateConversion esté importado
  deleteConversion,
} from "../../services/productoService";
import { uploadImage } from "../../services/uploadService";
import { ProductoCreate, ProductoUpdate, ConversionCompra, ConversionCompraCreate, Producto } from "../../types/producto";
import { CategoriaNested } from "../../types/categoria";
import { UnidadMedidaNested } from "../../types/unidad_medida";
import { MarcaNested } from "../../types/marca";
import Input from "../Common/Input";
import Button from "../Common/Button";
import LoadingSpinner from "../Common/LoadingSpinner";
import Select from "../Common/Select";
import ErrorMessage from "../Common/ErrorMessage";
import { useTheme } from "../../context/ThemeContext";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface ProductoFormProps {
  productoId?: number;
  onSuccess: (producto: Producto) => void;
  onCancel: () => void;
  availableCategorias: CategoriaNested[];
  availableUnidadesMedida: UnidadMedidaNested[];
  availableMarcas: MarcaNested[];
}

type FormData = Omit<ProductoCreate, 'imagen_ruta'>;

// Usamos un tipo local para manejar conversiones antes de que el producto se cree
type LocalConversion = Omit<ConversionCompra, 'producto_id'> & { tempId?: number };

const ProductoForm: React.FC<ProductoFormProps> = ({
  productoId,
  onSuccess,
  onCancel,
  availableCategorias,
  availableUnidadesMedida,
  availableMarcas
}) => {
  const { theme } = useTheme();
  const isEditing = !!productoId;
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ mode: "onBlur" });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  
  // El estado ahora maneja tanto conversiones guardadas como locales
  const [conversions, setConversions] = useState<LocalConversion[]>([]);
  const [newConversion, setNewConversion] = useState({ nombre_presentacion: '', unidad_inventario_por_presentacion: '' });
  const [editingConversionId, setEditingConversionId] = useState<number | null | undefined>(null);
  const [editingTempId, setEditingTempId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);

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
    setNewConversion({ nombre_presentacion: '', unidad_inventario_por_presentacion: '' });
    setEditingConversionId(null);
    setEditingTempId(null);
  };

  const handleAddOrUpdateConversion = async () => {
    if (!newConversion.nombre_presentacion || !newConversion.unidad_inventario_por_presentacion) {
      alert("Por favor, complete los campos de la presentación.");
      return;
    }

    const conversionData: ConversionCompraCreate = {
        nombre_presentacion: newConversion.nombre_presentacion,
        unidad_inventario_por_presentacion: parseFloat(newConversion.unidad_inventario_por_presentacion)
    };

    if (isEditing && productoId) { // --- MODO EDICIÓN (con API) ---
      try {
        let resultConversion: ConversionCompra;
        if (editingConversionId) {
          resultConversion = await updateConversion(editingConversionId, conversionData);
          setConversions(conversions.map(c => c.conversion_id === editingConversionId ? resultConversion : c));
          alert("Presentación actualizada con éxito!");
        } else {
          resultConversion = await createConversion(productoId, conversionData);
          setConversions([...conversions, resultConversion]);
          alert("Presentación añadida con éxito!");
        }
        resetConversionForm();
      } catch (err: any) {
        alert(`Error al guardar presentación: ${err.response?.data?.detail || err.message}`);
      }
    } else { // --- MODO CREACIÓN (local) ---
        if (editingTempId) {
            // Editar en la lista local
            setConversions(conversions.map(c => c.tempId === editingTempId ? { ...c, ...conversionData } : c));
        } else {
            // Añadir a la lista local con un ID temporal
            const newLocalConversion: LocalConversion = {
                ...conversionData,
                conversion_id: 0, // Placeholder
                tempId: Date.now() // ID temporal único
            };
            setConversions([...conversions, newLocalConversion]);
        }
        resetConversionForm();
    }
  };

  const handleEditConversion = (conversion: LocalConversion) => {
    setNewConversion({ 
      nombre_presentacion: conversion.nombre_presentacion,
      unidad_inventario_por_presentacion: conversion.unidad_inventario_por_presentacion.toString()
    });
    if (isEditing) {
        setEditingConversionId(conversion.conversion_id);
    } else {
        setEditingTempId(conversion.tempId || null);
    }
  };

  const handleCancelEditConversion = () => {
    resetConversionForm();
  };

  const handleDeleteConversion = async (conversion: LocalConversion) => {
    if (window.confirm("¿Está seguro de que desea eliminar esta presentación?")) {
        if (isEditing && conversion.conversion_id) {
            try {
                await deleteConversion(conversion.conversion_id);
                setConversions(conversions.filter(c => c.conversion_id !== conversion.conversion_id));
                alert("Presentación eliminada con éxito!");
            } catch (err: any) {
                alert(`Error al eliminar presentación: ${err.response?.data?.detail || err.message}`);
            }
        } else {
            // Eliminar de la lista local
            setConversions(conversions.filter(c => c.tempId !== conversion.tempId));
        }
    }
  };

  const onSubmit = async (formData: FormData) => {
    setLoading(true);
    setFormSubmitError(null);

    let finalImagenRuta: string | null = null;
    if (selectedImageFile) {
      try {
        const uploadResponse = await uploadImage(selectedImageFile);
        finalImagenRuta = uploadResponse;
      } catch (uploadError: any) {
        setFormSubmitError(`Error al subir la imagen: ${uploadError.response?.data?.detail || uploadError.message}`);
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
        const result = await updateProducto(productoId, dataToSend as ProductoUpdate);
        alert("Producto actualizado con éxito!");
        onSuccess(result);
      } else {
        // --- Lógica para CREAR producto y LUEGO sus conversiones ---
        const newProduct = await createProducto(dataToSend as ProductoCreate);
        
        // Después de crear el producto, crear cada conversión
        for (const conv of conversions) {
            const conversionData: ConversionCompraCreate = {
                nombre_presentacion: conv.nombre_presentacion,
                unidad_inventario_por_presentacion: conv.unidad_inventario_por_presentacion
            };
            await createConversion(newProduct.producto_id, conversionData);
        }

        alert("Producto y sus presentaciones creados con éxito!");
        const finalProduct = await getProductoById(newProduct.producto_id); // Obtener el producto final con todo
        onSuccess(finalProduct);
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
      setFormSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) { // Solo mostrar spinner a pantalla completa al editar
    return <div className="flex justify-center items-center min-h-[400px]"><LoadingSpinner /></div>;
  }

  if (error) {
    return <ErrorMessage message={`Error al cargar el producto: ${error}`} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}>
      {loading && <LoadingSpinner />} {/* Spinner para cargas en segundo plano */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campos existentes del formulario... */}
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

      {/* La sección de conversiones ahora es siempre visible */}
      <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Presentaciones de Compra/Venta</h3>
        <div className="space-y-4">
          {conversions.map(conv => (
            <div key={conv.conversion_id || conv.tempId} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
              <span className="text-gray-800 dark:text-gray-200">{conv.nombre_presentacion} = {conv.unidad_inventario_por_presentacion} Unidades</span>
              <div className="flex space-x-2">
                <Button type="button" onClick={() => handleEditConversion(conv)} variant="secondary" size="sm">Editar</Button>
                <Button type="button" onClick={() => handleDeleteConversion(conv)} variant="danger" size="sm">Eliminar</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-end gap-4">
          <div className="flex-grow">
            <label className="text-sm text-gray-700 dark:text-gray-300">Nombre Presentación</label>
            <Input type="text" value={newConversion.nombre_presentacion} onChange={e => setNewConversion({...newConversion, nombre_presentacion: e.target.value})} placeholder="Ej: Caja" />
          </div>
          <div className="flex-grow">
            <label className="text-sm text-gray-700 dark:text-gray-300">Unidades por Presentación</label>
            <Input type="number" value={newConversion.unidad_inventario_por_presentacion} onChange={e => setNewConversion({...newConversion, unidad_inventario_por_presentacion: e.target.value})} placeholder="Ej: 24" />
          </div>
          {(editingConversionId || editingTempId) ? (
            <div className="flex space-x-2">
              <Button type="button" onClick={handleAddOrUpdateConversion} variant="primary">Guardar Cambios</Button>
              <Button type="button" onClick={handleCancelEditConversion} variant="secondary">Cancelar</Button>
            </div>
          ) : (
            <Button type="button" onClick={handleAddOrUpdateConversion} variant="secondary">Añadir</Button>
          )}
        </div>
      </div>

      {formSubmitError && (
        <div className="md:col-span-2 mt-4">
          <ErrorMessage message={formSubmitError} />
        </div>
      )}

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