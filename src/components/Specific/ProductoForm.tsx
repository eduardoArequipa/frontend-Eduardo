import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  getProductoById,
  createProducto,
  updateProducto,
} from "../../services/productoService";
import { uploadImage } from "../../services/uploadService";
import { ProductoCreate, ProductoUpdate } from "../../types/producto";
import { CategoriaNested } from "../../types/categoria";
import { UnidadMedidaNested } from "../../types/unidad_medida";
import { MarcaNested } from "../../types/marca";
import Input from "../Common/Input";
import Button from "../Common/Button";
import LoadingSpinner from "../Common/LoadingSpinner";
import Select from "../Common/Select";
import ErrorMessage from "../Common/ErrorMessage";
import { Producto } from "../../types/producto";
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface ProductoFormProps {
  productoId?: number;
  onSuccess: (producto: Producto) => void;
  onCancel: () => void;
  availableCategorias: CategoriaNested[];
  availableUnidadesMedida: UnidadMedidaNested[];
  availableMarcas: MarcaNested[];
}

type FormData = {
  codigo: string;
  nombre: string;
  precio_compra: number;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
  categoria_id: number;
  unidad_medida_id: number;
  marca_id: number;
  metros_por_rollo?: number | null;
};

const ProductoForm: React.FC<ProductoFormProps> = ({ 
  productoId, 
  onSuccess, 
  onCancel, 
  availableCategorias,
  availableUnidadesMedida,
  availableMarcas 
}) => {
  const isEditing = !!productoId;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ mode: "onBlur" });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);

  const watchedUnidadMedidaId = watch("unidad_medida_id");

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
          setValue("unidad_medida_id", data.unidad_medida?.unidad_id);
          setValue("marca_id", data.marca?.marca_id);
          setValue("metros_por_rollo", data.metros_por_rollo ? parseFloat(data.metros_por_rollo.toString()) : null);

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
      let result: Producto;
      if (isEditing) {
        result = await updateProducto(productoId!, dataToSend as ProductoUpdate);
        alert("Producto actualizado con éxito!");
      } else {
        result = await createProducto(dataToSend as ProductoCreate);
        alert("Producto creado con éxito!");
      }
      onSuccess(result);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner /> {isEditing ? "Cargando datos del producto..." : ""}
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={`Error al cargar el producto: ${error}`} />;
  }

  const showNoOptionsMessage =
    !isEditing &&
    (availableCategorias.length === 0 || availableUnidadesMedida.length === 0 || availableMarcas.length === 0);

  if (showNoOptionsMessage) {
    return (
      <div className="text-yellow-600 text-center mt-4">
        No hay opciones activas disponibles para categorías, unidades de medida o marcas. Crea las entidades necesarias primero.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código</label>
        <Input
          id="codigo"
          type="text"
          {...register("codigo", { required: "El código es requerido" })}
          className={`mt-1 block w-full ${errors.codigo ? 'border-red-500' : 'border-gray-400'}`}
        />
        {errors.codigo && <span className="text-red-500 text-xs">{errors.codigo.message}</span>}
      </div>

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
        <Input
          id="nombre"
          type="text"
          {...register("nombre", { required: "El nombre es requerido" })}
          className={`mt-1 block w-full ${errors.nombre ? 'border-red-500' : 'border-gray-400'}`}
        />
        {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
      </div>

      <div>
        <label htmlFor="precio_compra" className="block text-sm font-medium text-gray-700">Precio de Compra</label>
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
        <label htmlFor="precio_venta" className="block text-sm font-medium text-gray-700">Precio de Venta</label>
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
        <label htmlFor="stock_minimo" className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
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
        <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock Actual</label>
        <Input
          id="stock"
          type="number"
          step="1"
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
        <label htmlFor="categoria_id" className="block text-sm font-medium text-gray-700">Categoría</label>
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
        <label htmlFor="unidad_medida_id" className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
        <Select
          id="unidad_medida_id"
          {...register("unidad_medida_id", { required: "Debe seleccionar una unidad", valueAsNumber: true })}
          className={`mt-1 block w-full ${errors.unidad_medida_id ? 'border-red-500' : 'border-gray-400'}`}
        >
          <option value="">-- Seleccionar Unidad --</option>
          {availableUnidadesMedida.map((unidad) => (
            <option key={unidad.unidad_id} value={unidad.unidad_id}>
              {unidad.nombre_unidad} ({unidad.abreviatura})
            </option>
          ))}
        </Select>
        {errors.unidad_medida_id && <span className="text-red-500 text-xs">{errors.unidad_medida_id.message}</span>}
      </div>

      <div>
        <label htmlFor="marca_id" className="block text-sm font-medium text-gray-700">Marca</label>
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

      {availableUnidadesMedida.find((u) => u.unidad_id === watchedUnidadMedidaId)?.nombre_unidad.toLowerCase().trim() === "metro" && (
        <div>
          <label htmlFor="metros_por_rollo" className="block text-sm font-medium text-gray-700">Metros por Rollo</label>
          <Input
            id="metros_por_rollo"
            type="number"
            step="0.01"
            {...register("metros_por_rollo", {
              required: "Este campo es requerido para la unidad 'metro'",
              valueAsNumber: true,
              min: { value: 0.01, message: "Debe ser un número positivo" }
            })}
            className={`mt-1 block w-full ${errors.metros_por_rollo ? 'border-red-500' : 'border-gray-400'}`}
          />
          {errors.metros_por_rollo && <span className="text-red-500 text-xs">{errors.metros_por_rollo.message}</span>}
        </div>
      )}

      <div className="md:col-span-2">
        <label htmlFor="product_image" className="block text-sm font-medium text-gray-700">Imagen del Producto</label>
        <Input
          id="product_image"
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="mt-1 block w-full"
        />
        {selectedImageFile && <p className="mt-1 text-sm text-gray-500">Archivo: {selectedImageFile.name}</p>}
        {isEditing && existingImageUrl && !selectedImageFile && !removeExistingImage && (
          <div className="mt-2">
            <img src={existingImageUrl} alt="Imagen actual" className="h-32 w-auto rounded-md" />
            <Button type="button" onClick={handleRemoveExistingImage} className="mt-2 bg-red-500 text-white text-xs py-1 px-2 rounded">
              Eliminar Imagen
            </Button>
          </div>
        )}
      </div>

      {formSubmitError && (
        <div className="md:col-span-2">
          <ErrorMessage message={formSubmitError} />
        </div>
      )}

      <div className="md:col-span-2 flex justify-end space-x-4">
        <Button 
          type="button" 
          onClick={onCancel} 
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded shadow"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow disabled:opacity-50"
        >
          {loading ? <LoadingSpinner /> : isEditing ? "ActualizaR Producto" : "Crear Producto"}
        </Button>
      </div>
    </form>
  );
};


export default ProductoForm;


