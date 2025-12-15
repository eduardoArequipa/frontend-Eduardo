import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AsyncSelect from 'react-select/async';
import { createMovimiento } from '../../services/movimientoService';
import { searchProductSuggestions, getProductoById } from '../../services/productService';
import { TipoMovimientoEnum } from '../../types/movimiento';
import { Producto } from '../../types/producto';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import Input from '../Common/Input';
import Button from '../Common/Button';
import Select from '../Common/Select';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner';

const movimientoValues = ['merma', 'ajuste_positivo', 'ajuste_negativo', 'uso_interno','devolucion'] as const;

const movimientoSchema = z.object({
  producto_id: z.coerce.number({ required_error: 'Debe seleccionar un producto.' })
    .min(1, { message: 'Debe seleccionar un producto.' }),

  tipo_movimiento: z.string({ required_error: "Debe seleccionar un tipo de movimiento." })
    .min(1, { message: "Debe seleccionar un tipo de movimiento." })
    .refine(val => movimientoValues.includes(val as any), {
      message: "Debe seleccionar un tipo de movimiento.",
    }),
  
  motivo: z.string().max(255, { message: 'El motivo no puede exceder los 255 caracteres.' }).optional().or(z.literal('')),
});

type MovimientoFormData = z.infer<typeof movimientoSchema>;

interface MovimientoFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const MovimientoForm: React.FC<MovimientoFormProps> = ({ onSuccess, onCancel }) => {
    const { theme } = useTheme();
    const { addNotification } = useNotification();
    const { handleSubmit, control, reset, setValue, formState: { errors } } = useForm<MovimientoFormData>({
        resolver: zodResolver(movimientoSchema),
        defaultValues: {
            motivo: '',
        }
    });
    
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [selectedProductOption, setSelectedProductOption] = useState<any | null>(null);
    const [quantities, setQuantities] = useState<{ [key: string]: string }>({});

    const tipoMovimientoOptions: Array<{ value: TipoMovimientoEnum; label: string }> = [
        { value: 'merma', label: 'Merma (Producto Roto/Dañado)' },
        { value: 'ajuste_positivo', label: 'Ajuste Positivo (Corrección)' },
        { value: 'ajuste_negativo', label: 'Ajuste Negativo (Corrección)' },
        { value: 'uso_interno', label: 'Uso Interno (Consumo Propio)' },
        { value: 'devolucion', label: 'Devolución (Cliente)' },
    ];

    const loadProductOptions = (inputValue: string, callback: (options: any) => void) => {
        setTimeout(async () => {
            const options = await searchProductSuggestions(inputValue);
            callback(options);
        }, 300);
    };

    const handleProductChange = async (option: any) => {
        setSelectedProductOption(option);
        const productId = option?.value;
        setValue('producto_id', productId, { shouldValidate: true });

        if (productId) {
            try {
                const productDetails = await getProductoById(productId);
                setSelectedProduct(productDetails);
                setQuantities({});
            } catch (error) {
                addNotification('Error al cargar los detalles del producto.', 'error');
                setSelectedProduct(null);
            }
        } else {
            setSelectedProduct(null);
            setQuantities({});
        }
    };

    const handleQuantityChange = (key: string, value: string) => {
        setQuantities(prev => ({ ...prev, [key]: value }));
    };

    const onSubmit = async (data: MovimientoFormData) => {
        setServerError(null);

        const items = Object.entries(quantities)
            .map(([key, value]) => {
                const cantidad = parseFloat(value);
                if (!value || isNaN(cantidad) || cantidad <= 0) return null;

                const conversion_id = key.startsWith('conv_') ? parseInt(key.split('_')[1], 10) : null;
                return { cantidad, conversion_id };
            })
            .filter(Boolean);

        if (items.length === 0) {
            setServerError("Debe ingresar al menos una cantidad válida mayor a cero.");
            return;
        }

        setLoading(true);
        try {
            const payload = { ...data, items };
            await createMovimiento(payload as any);
            addNotification("Movimiento registrado con éxito!", 'success');
            reset();
            setSelectedProduct(null);
            setSelectedProductOption(null);
            setQuantities({});
            onSuccess();
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || "Error al registrar el movimiento.";
            setServerError(errorMsg);
            addNotification(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md space-y-4`}>
            {serverError && <ErrorMessage message={serverError} />}

            <div>
                <label htmlFor="producto_id" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Producto *</label>
                <Controller
                    name="producto_id"
                    control={control}
                    render={({ field }) => (
                        <AsyncSelect
                            id="producto_id"
                            value={selectedProductOption}
                            cacheOptions
                            loadOptions={loadProductOptions}
                            placeholder="Buscar y seleccionar un producto..."
                            onChange={handleProductChange}
                            onBlur={field.onBlur}
                            noOptionsMessage={({ inputValue }) => inputValue ? 'No se encontraron productos' : 'Escribe para buscar'}
                            loadingMessage={() => 'Buscando...'}
                            styles={{
                                control: (base) => ({ ...base, backgroundColor: theme === 'dark' ? '#374151' : 'white', borderColor: errors.producto_id ? '#EF4444' : '#6B7280' }),
                                input: (base) => ({ ...base, color: theme === 'dark' ? 'white' : 'black' }),
                                singleValue: (base) => ({ ...base, color: theme === 'dark' ? 'white' : 'black' }),
                                menu: (base) => ({ ...base, backgroundColor: theme === 'dark' ? '#374151' : 'white' }),
                                option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? (theme === 'dark' ? '#4B5563' : '#E5E7EB') : (theme === 'dark' ? '#374151' : 'white'), color: theme === 'dark' ? 'white' : 'black' }),
                            }}
                        />
                    )}
                />
                {errors.producto_id && <p className="mt-1 text-sm text-red-600">{errors.producto_id.message}</p>}
            </div>

            {selectedProduct && (
                <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg space-y-3`}>
                    <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Cantidades por Presentación</h3>
                    
                    <div>
                        <label htmlFor="qty-base" className="text-sm font-medium">{selectedProduct.unidad_inventario.nombre_unidad} ({selectedProduct.unidad_inventario.abreviatura})</label>
                        <Input 
                            id="qty-base"
                            type="number"
                            step={selectedProduct.unidad_inventario.nombre_unidad.toLowerCase() === 'unidad' ? '1' : 'any'}
                            value={quantities['base'] || ''}
                            onChange={(e) => handleQuantityChange('base', e.target.value)}
                            placeholder={`Cantidad en ${selectedProduct.unidad_inventario.nombre_unidad}`}
                        />
                    </div>

                    {selectedProduct.conversiones.map(conv => (
                        <div key={conv.id}>
                            <label htmlFor={`qty-conv-${conv.id}`} className="text-sm font-medium">{conv.nombre_presentacion} ({conv.unidades_por_presentacion} {selectedProduct.unidad_inventario.abreviatura})</label>
                            <Input 
                                id={`qty-conv-${conv.id}`}
                                type="number"
                                step="1"
                                value={quantities[`conv_${conv.id}`] || ''}
                                onChange={(e) => handleQuantityChange(`conv_${conv.id}`, e.target.value)}
                                placeholder={`Cantidad en ${conv.nombre_presentacion}`}
                            />
                        </div>
                    ))}
                </div>
            )}

            <div>
                <label htmlFor="tipo_movimiento" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Tipo de Movimiento *</label>
                <Controller
                    name="tipo_movimiento"
                    control={control}
                    render={({ field }) => (
                        <Select
                            id="tipo_movimiento"
                            {...field}
                            options={[
                                { value: '', label: 'Seleccione un tipo' },
                                ...tipoMovimientoOptions
                            ]}
                            className={errors.tipo_movimiento ? 'border-red-500' : ''}
                        />
                    )}
                />
                {errors.tipo_movimiento && <p className="mt-1 text-sm text-red-600">{errors.tipo_movimiento.message}</p>}
            </div>

            <div>
                <label htmlFor="motivo" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Motivo</label>
                <Controller
                    name="motivo"
                    control={control}
                    render={({ field }) => (
                        <Input
                            id="motivo"
                            type="text"
                            {...field}
                            value={field.value || ''}
                            placeholder="Ej: Corrección de conteo anual"
                            className={errors.motivo ? 'border-red-500' : ''}
                        />
                    )}
                />
                {errors.motivo && <p className="mt-1 text-sm text-red-600">{errors.motivo.message}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" onClick={onCancel} variant="secondary" disabled={loading}>Cancelar</Button>
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" /> : 'Registrar Movimiento'}
                </Button>
            </div>
        </form>
    );
};

export default MovimientoForm;
