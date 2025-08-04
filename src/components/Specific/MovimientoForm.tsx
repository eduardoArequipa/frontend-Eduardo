import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { createMovimiento } from '../../services/movimientoService';
import { MovimientoCreate } from '../../types/movimiento';
import { Producto } from '../../types/producto';
import Input from '../Common/Input';
import Button from '../Common/Button';
import Select from '../Common/Select';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';

interface MovimientoFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    availableProductos: Producto[];
}

const MovimientoForm: React.FC<MovimientoFormProps> = ({ onSuccess, onCancel, availableProductos }) => {
    const { theme } = useTheme();
    const { handleSubmit, control, reset, formState: { errors } } = useForm<MovimientoCreate>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const tipoMovimientoOptions = [
        { value: 'merma', label: 'Merma (Producto Roto/Dañado)' },
        { value: 'ajuste_positivo', label: 'Ajuste Positivo (Corrección de Inventario)' },
        { value: 'ajuste_negativo', label: 'Ajuste Negativo (Corrección de Inventario)' },
        { value: 'uso_interno', label: 'Uso Interno (Consumo Propio)' },
    ];

    const onSubmit = async (data: MovimientoCreate) => {
        setLoading(true);
        setError(null);
        try {
            await createMovimiento(data);
            alert("Movimiento registrado con éxito!");
            reset();
            onSuccess();
        } catch (err: any) {
            console.error("Error al registrar movimiento:", err);
            setError(err.response?.data?.detail || "Error al registrar el movimiento.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md space-y-4`}>
            {loading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}

            <div>
                <label htmlFor="producto_id" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Producto</label>
                <Controller
                    name="producto_id"
                    control={control}
                    rules={{ required: "El producto es obligatorio." }}
                    render={({ field }) => (
                        <Select
                            id="producto_id"
                            {...field}
                            options={[
                                { value: '', label: 'Seleccione un producto' },
                                ...availableProductos.map(p => ({ value: p.producto_id, label: `${p.nombre} (${p.codigo}) - Stock: ${p.stock}` }))
                            ]}
                            onChange={(e) => field.onChange(parseInt(e.target.value, 10) || '')}
                            value={field.value || ''}
                        />
                    )}
                />
                {errors.producto_id && <p className="mt-1 text-sm text-red-600">{errors.producto_id.message}</p>}
            </div>

            <div>
                <label htmlFor="tipo_movimiento" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Tipo de Movimiento</label>
                <Controller
                    name="tipo_movimiento"
                    control={control}
                    rules={{ required: "El tipo de movimiento es obligatorio." }}
                    render={({ field }) => (
                        <Select
                            id="tipo_movimiento"
                            {...field}
                            options={tipoMovimientoOptions}
                            value={field.value || ''}
                        />
                    )}
                />
                {errors.tipo_movimiento && <p className="mt-1 text-sm text-red-600">{errors.tipo_movimiento.message}</p>}
            </div>

            <div>
                <label htmlFor="cantidad" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Cantidad</label>
                <Controller
                    name="cantidad"
                    control={control}
                    rules={{
                        required: "La cantidad es obligatoria.",
                        min: { value: 0, message: "La cantidad debe ser mayor a 0." },
                        validate: value => !isNaN(value) || "La cantidad debe ser un número."
                    }}
                    render={({ field }) => (
                        <Input
                            id="cantidad"
                            type="number"
                            step="0" // Permite decimales para productos que se miden por peso/longitud
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                    )}
                />
                {errors.cantidad && <p className="mt-1 text-sm text-red-600">{errors.cantidad.message}</p>}
            </div>

            <div>
                <label htmlFor="motivo" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>Motivo (Opcional)</label>
                <Controller
                    name="motivo"
                    control={control}
                    render={({ field }) => (
                        <Input
                            id="motivo"
                            type="text"
                            {...field}
                        />
                    )}
                />
                {errors.motivo && <p className="mt-1 text-sm text-red-600">{errors.motivo.message}</p>}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
                <Button type="button" onClick={onCancel} variant="secondary">Cancelar</Button>
                <Button type="submit" variant="primary" disabled={loading}>Registrar Movimiento</Button>
            </div>
        </form>
    );
};

export default MovimientoForm;
