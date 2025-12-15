// src/components/Specific/ProductoForm.tsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getProductoById, createProducto, updateProducto, createConversion, updateConversion, deleteConversion, checkFieldUniqueness } from "../../services/productoService";
import { uploadImage } from "../../services/uploadService";
import { ProductoCreate, ProductoUpdate, Conversion, ConversionCreate, Producto } from "../../types/producto";
import { TipoMargenEnum } from "../../types/enums";
import { useCatalogs } from "../../context/CatalogContext";
import Input from "../Common/Input";
import Button from "../Common/Button";
import LoadingSpinner from "../Common/LoadingSpinner";
import Select from "../Common/Select";
import ErrorMessage from "../Common/ErrorMessage";
import MargenConfigForm from "./MargenConfigForm";
import ConversionesManager from "./ConversionesManager";
import { useTheme } from "../../context/ThemeContext";
import { useNotification } from "../../context/NotificationContext";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface ProductoFormProps {
  productoId?: number;
  onSuccess: (producto: Producto) => Promise<void>;
  onCancel: () => void;
}

type FormData = Omit<ProductoCreate, 'imagen_ruta'> & {
  tipo_margen: TipoMargenEnum;
  margen_valor: string; // String para precisión decimal
  precio_manual_activo: boolean;
  stock: string; // String para precisión decimal
};

type LocalConversion = Omit<Conversion, 'producto_id'> & { tempId?: number };

// --- Esquema de Validación con Zod (Función Fábrica) ---
const createProductoSchema = (currentProductoId?: number) => {
  return z.object({
    codigo: z.string()
      .trim()
      .min(12, "Debe contenr  13 caracteres numericos sin espacios.")
      .regex(/^\S+$/, "El código no puede contener espacios."),

    nombre: z.string()
      .trim()
      .min(1, "El nombre es requerido."),

    precio_compra: z.string()
      .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "El precio de compra debe ser un número positivo."),
    precio_venta: z.string()
      .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "El precio de venta debe ser un número positivo."),
    stock: z.string()
      .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "El stock debe ser un número positivo."),
    stock_minimo: z.coerce.number()
      .min(0, "El stock mínimo no puede ser negativo."),
    categoria_id: z.coerce.number()
      .min(1, "Debe seleccionar una categoría."),
    unidad_inventario_id: z.coerce.number()
      .min(1, "Debe seleccionar una unidad de inventario."),
    marca_id: z.coerce.number()
      .min(1, "Debe seleccionar una marca."),
    tipo_margen: z.nativeEnum(TipoMargenEnum),
    margen_valor: z.string()
      .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "El valor del margen debe ser un número positivo."),
    precio_manual_activo: z.boolean(),
  }).superRefine(async (data, ctx) => {
    // Validaciones asíncronas de unicidad

    // Validar unicidad de código
    if (data.codigo) {
      const isUnique = await checkFieldUniqueness('codigo', data.codigo, currentProductoId);
      if (!isUnique) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Este código ya está en uso.",
          path: ['codigo']
        });
      }
    }

    // Validar unicidad de nombre
    if (data.nombre) {
      const isUnique = await checkFieldUniqueness('nombre', data.nombre, currentProductoId);
      if (!isUnique) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Este nombre ya está en uso.",
          path: ['nombre']
        });
      }
    }
  });
};

const ProductoForm: React.FC<ProductoFormProps> = ({ productoId, onSuccess, onCancel }) => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const {
    categorias: availableCategorias,
    unidadesMedida: availableUnidadesMedida,
    marcas: availableMarcas,
    ensureCategorias,
    ensureMarcas,
    invalidateConversiones
  } = useCatalogs();

  const isEditing = !!productoId;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createProductoSchema(productoId)),
    mode: "onBlur",
    defaultValues: {
      codigo: "",
      nombre: "",
      precio_compra: "0.00",
      precio_venta: "0.00",
      stock: "0.00",
      stock_minimo: 0,
      categoria_id: undefined,
      unidad_inventario_id: undefined,
      marca_id: undefined,
      tipo_margen: TipoMargenEnum.Porcentaje,
      margen_valor: "30.00",
      precio_manual_activo: false,
    },
  });

  const unidadInventarioId = watch('unidad_inventario_id');
  const selectedUnidadInventario = availableUnidadesMedida.find(u => u.unidad_id === Number(unidadInventarioId));

  // 🔍 DEBUG: Ver qué valor tiene
  console.log('🔍 DEBUG ConversionesManager:', {
    unidadInventarioId,
    selectedUnidadInventario,
    nombre_unidad: selectedUnidadInventario?.nombre_unidad,
    availableUnidadesMedida
  });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const [conversions, setConversions] = useState<LocalConversion[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Establecer valores por defecto para nuevos productos
  useEffect(() => {
    if (!isEditing) {
      setValue("tipo_margen", TipoMargenEnum.Porcentaje);
      setValue("margen_valor", "30.00");
      setValue("precio_manual_activo", false);
      setValue("precio_compra", "0.00");
      setValue("precio_venta", "0.00");
      setValue("stock", "0.00");
      setValue("stock_minimo", 0);
    }
  }, [isEditing, setValue]);

  // ⚡ CARGA OPTIMIZADA - Asegurar que categorías y marcas estén cargadas para el ProductoForm
  useEffect(() => {
    ensureCategorias();
    ensureMarcas();
  }, [ensureCategorias, ensureMarcas]);

  useEffect(() => {
    const loadEditData = async () => {
      if (isEditing && productoId) {
        setLoading(true);
        try {
          const data = await getProductoById(productoId);
          setValue("codigo", data.codigo);
          setValue("nombre", data.nombre);
          setValue("precio_compra", data.precio_compra.toString());
          setValue("precio_venta", data.precio_venta.toString());
          setValue("stock", data.stock.toString());
          setValue("stock_minimo", data.stock_minimo);
          setValue("categoria_id", data.categoria.categoria_id);
          setValue("unidad_inventario_id", data.unidad_inventario?.unidad_id);
          setValue("marca_id", data.marca?.marca_id);
          // Nuevos campos de margen
          setValue("tipo_margen", data.tipo_margen || TipoMargenEnum.Porcentaje);
          setValue("margen_valor", data.margen_valor?.toString() || '30.00');
          setValue("precio_manual_activo", data.precio_manual_activo || false);
          setConversions(data.conversiones || []);

          setExistingImageUrl(
            data.imagen_ruta
              ? `${BACKEND_BASE_URL}${data.imagen_ruta.startsWith("/") ? data.imagen_ruta : "/" + data.imagen_ruta}`
              : null
          );
        } catch (err) {
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
        
        // 🔄 INVALIDAR CONVERSIONES - Las presentaciones pueden haber cambiado
        await invalidateConversiones();
        
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
            descripcion_detallada: conv.descripcion_detallada,
          };
          try {
            const createdConversion = await createConversion(newProduct.producto_id, conversionData);
            console.log(`✅ Conversión creada exitosamente:`, createdConversion);
          } catch (convError: any) {
            console.error(`❌ Error creando conversión ${conv.nombre_presentacion}:`, convError);
            addNotification(`Error creando presentación ${conv.nombre_presentacion}: ${convError.response?.data?.detail || convError.message}`, 'error');
          }
        }
        
        await invalidateConversiones();
        
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
            {...register("codigo")}
            className={`mt-1 block w-full ${errors.codigo ? 'border-red-500' : 'border-gray-400'}`}
          />
          {errors.codigo && <span className="text-red-500 text-xs">{errors.codigo.message}</span>}
        </div>

        <div>
          <label htmlFor="nombre" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Nombre</label>
          <Input
            id="nombre"
            type="text"
            {...register("nombre")}
            className={`mt-1 block w-full ${errors.nombre ? 'border-red-500' : 'border-gray-400'}`}
          />
          {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
        </div>

      </div>

      {/* Configuración de márgenes y precios - Solo mostrar en modo edición */}
      {isEditing && (
        <div className="col-span-1 md:col-span-2 mt-6">
          <MargenConfigForm
            precio_compra={watch('precio_compra') || '0.00'}
            tipo_margen={watch('tipo_margen') || TipoMargenEnum.Porcentaje}
            margen_valor={watch('margen_valor') || '30.00'}
            precio_manual_activo={watch('precio_manual_activo') || false}
            precio_venta={watch('precio_venta') || '0.00'}
            onChange={(field, value) => setValue(field as keyof FormData, value)}
            onPrecioVentaChange={(precio) => setValue('precio_venta', precio)}
            disabled={loading}
          />
          
          {/* Campos ocultos para validación de react-hook-form */}
          <input
            type="hidden"
            {...register("precio_compra")}
          />
          <input
            type="hidden"
            {...register("precio_venta")}
          />
          <input
            type="hidden"
            {...register("tipo_margen")}
          />
          <input
            type="hidden"
            {...register("margen_valor")}
          />
          <input
            type="hidden"
            {...register("precio_manual_activo")}
          />
          
          {/* Mostrar errores de validación */}
          {errors.precio_compra && <div className="text-red-500 text-sm mt-2">{errors.precio_compra.message}</div>}
          {errors.precio_venta && <div className="text-red-500 text-sm mt-2">{errors.precio_venta.message}</div>}
          {errors.margen_valor && <div className="text-red-500 text-sm mt-2">{errors.margen_valor.message}</div>}
        </div>
      )}

      {/* Campos ocultos para modo creación */}
      {!isEditing && (
        <>
          <input type="hidden" {...register("precio_compra")} />
          <input type="hidden" {...register("precio_venta")} />
          <input type="hidden" {...register("stock")} />
          <input type="hidden" {...register("stock_minimo")} />
          <input type="hidden" {...register("tipo_margen")} />
          <input type="hidden" {...register("margen_valor")} />
          <input type="hidden" {...register("precio_manual_activo")} />
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Campos de stock - Solo mostrar en modo edición */}
        {isEditing && (
          <>
            <div>
              <label htmlFor="stock_minimo" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Stock Mínimo</label>
              <Input
                id="stock_minimo"
                type="number"
                step="1"
                {...register("stock_minimo")}
                className={`mt-1 block w-full ${errors.stock_minimo ? 'border-red-500' : 'border-gray-400'}`}
              />
              {errors.stock_minimo && <span className="text-red-500 text-xs">{errors.stock_minimo.message}</span>}
            </div>

            <div>
              <label htmlFor="stock" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
                Stock Actual
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Solo lectura - Se actualiza con compras/movimientos)</span>
              </label>
              <Input
                id="stock"
                type="text"
                placeholder="0.00"
                readOnly={true}
                {...register("stock")}
                className={`mt-1 block w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed ${errors.stock ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                💡 El stock se actualiza automáticamente con compras y movimientos de inventario
              </div>
              {errors.stock && <span className="text-red-500 text-xs">{errors.stock.message}</span>}
            </div>
          </>
        )}

        {/* Configuración básica de márgenes en modo creación */}
        {!isEditing && (
          <div className="md:col-span-2">
            <MargenConfigForm
              precio_compra={watch('precio_compra') || '0.00'}
              tipo_margen={watch('tipo_margen') || TipoMargenEnum.Porcentaje}
              margen_valor={watch('margen_valor') || '30.00'}
              precio_manual_activo={watch('precio_manual_activo') || false}
              precio_venta={watch('precio_venta') || '0.00'}
              onChange={(field, value) => setValue(field as keyof FormData, value)}
              onPrecioVentaChange={(precio) => setValue('precio_venta', precio)}
              disabled={loading}
              isCreationMode={true}
            />
          </div>
        )}

        <div>
          <label htmlFor="categoria_id" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Categoría</label>
          <Select
            id="categoria_id"
            {...register("categoria_id")}
            className={`mt-1 block w-full ${errors.categoria_id ? 'border-red-500' : 'border-gray-400'}`}
          >
            <option value="">-- Seleccionar Categoría --</option>
            {availableCategorias
              .filter(categoria => categoria.estado === 'activo')
              .map((categoria) => (
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
            {...register("unidad_inventario_id")}
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
            {...register("marca_id")}
            className={`mt-1 block w-full ${errors.marca_id ? 'border-red-500' : 'border-gray-400'}`}
          >
            <option value="">-- Seleccionar Marca --</option>
            {availableMarcas
              .filter(marca => marca.estado === 'activo')
              .map((marca) => (
                <option key={marca.marca_id} value={marca.marca_id}>
                  {marca.nombre_marca}
                </option>
              ))}
          </Select>
          {errors.marca_id && <span className="text-red-500 text-xs">{errors.marca_id.message}</span>}
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
        <ConversionesManager
          conversiones={conversions}
          unidadInventarioNombre={selectedUnidadInventario?.nombre_unidad}
          onAddConversion={isEditing ? 
            async (conversion) => {
              const result = await createConversion(productoId!, conversion);
              setConversions([...conversions, result]);
            } : 
            async (conversion) => {

              const newConversion = { ...conversion, id: 0, tempId: Date.now() };
              setConversions(prev => {
                const updated = [...prev, newConversion as LocalConversion];
                return updated;
              });
            }
          }
          onUpdateConversion={async (id, conversion) => {
            const result = await updateConversion(id, conversion);
            setConversions(conversions.map(c => c.id === id ? result : c));
          }}
          onDeleteConversion={async (id) => {
            await deleteConversion(id);
            setConversions(conversions.filter(c => c.id !== id));
          }}
          disabled={loading}
          isCreationMode={!isEditing}
        />
      </div>

      <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
        <Button type="button" onClick={onCancel} variant="secondary">Cancelar</Button>
        <Button type="submit" disabled={loading} variant="primary">
          {loading ? <LoadingSpinner /> : isEditing ? "Actualizar Producto" : "Registrar Producto"}
        </Button>
      </div>
    </form>
  );
};

export default ProductoForm;