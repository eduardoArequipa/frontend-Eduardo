import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AsyncSelect from 'react-select/async';
import { createMovimiento } from '../../services/movimientoService';
import { searchProductSuggestions } from '../../services/productService';
import { TipoMovimientoEnum } from '../../types/movimiento';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import Input from '../Common/Input';
import Button from '../Common/Button';
import Select from '../Common/Select';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner';

// 1. Zod Schema Correction
const movimientoValues = ['merma', 'ajuste_positivo', 'ajuste_negativo', 'uso_interno'] as const;

const movimientoSchema = z.object({
  producto_id: z.coerce.number({ required_error: 'Debe seleccionar un producto.' })
    .min(1, { message: 'Debe seleccionar un producto.' }),
  tipo_movimiento: z.enum(movimientoValues, {
    required_error: "Debe seleccionar un tipo de movimiento.",
  }),
  cantidad: z.coerce.number({ required_error: 'La cantidad es obligatoria.', invalid_type_error: 'La cantidad debe ser un número.' })
    .positive({ message: 'La cantidad debe ser mayor a 0.' }),
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
    const { handleSubmit, control, reset, formState: { errors } } = useForm<MovimientoFormData>({
        resolver: zodResolver(movimientoSchema),
        defaultValues: {
            motivo: '',
        }
    });
    
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const tipoMovimientoOptions: Array<{ value: TipoMovimientoEnum; label: string }> = [
        { value: 'merma', label: 'Merma (Producto Roto/Dañado)' },
        { value: 'ajuste_positivo', label: 'Ajuste Positivo (Corrección)' },
        { value: 'ajuste_negativo', label: 'Ajuste Negativo (Corrección)' },
        { value: 'uso_interno', label: 'Uso Interno (Consumo Propio)' },
    ];

    const loadProductOptions = (inputValue: string, callback: (options: any) => void) => {
        setTimeout(async () => {
            const options = await searchProductSuggestions(inputValue);
            callback(options);
        }, 500); // Debounce para no hacer peticiones en cada tecleo
    };

    const onSubmit = async (data: MovimientoFormData) => {
        setLoading(true);
        setServerError(null);
        try {
            await createMovimiento(data);
            addNotification("Movimiento registrado con éxito!", 'success');
            reset();
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
                            cacheOptions
                            defaultOptions
                            loadOptions={loadProductOptions}
                            placeholder="Buscar y seleccionar un producto..."
                            onChange={(option: any) => field.onChange(option?.value)}
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
                <label htmlFor="cantidad" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Cantidad *</label>
                <Controller
                    name="cantidad"
                    control={control}
                    render={({ field }) => (
                        <Input
                            id="cantidad"
                            type="number"
                            step="any"
                            {...field}
                            className={errors.cantidad ? 'border-red-500' : ''}
                        />
                    )}
                />
                {errors.cantidad && <p className="mt-1 text-sm text-red-600">{errors.cantidad.message}</p>}
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
                            value={field.value || ''} // Ensure value is not null
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
