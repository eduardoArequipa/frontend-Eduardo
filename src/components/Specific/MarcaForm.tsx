import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createMarca, getMarcaById, updateMarca } from '../../services/marcaService';
import { useCatalogs } from '../../context/CatalogContext';
import { useNotification } from '../../context/NotificationContext';
import { EstadoEnum } from '../../types/enums';
import Input from '../Common/Input';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import Select from '../Common/Select';

// 1. Definir el esquema de validación con Zod
const marcaSchema = z.object({
  nombre_marca: z.string()
    .trim()
    .min(1, { message: 'El nombre de la marca es requerido.' })
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
    .max(50, { message: 'El nombre no puede exceder 50 caracteres.' }),
  descripcion: z.string()
    .max(500, { message: 'La descripción no puede exceder 500 caracteres.' })
    .optional()
    .or(z.literal('')),
  pais_origen: z.string()
    .max(50, { message: 'El país de origen no puede exceder 50 caracteres.' })
    .optional()
    .or(z.literal('')),
  estado: z.nativeEnum(EstadoEnum).optional(),
});

type MarcaFormData = z.infer<typeof marcaSchema>;

interface MarcaFormProps {
    marcaId?: number;
    onSuccess: (marca?: any) => void;
    onCancel: () => void;
}

const MarcaForm: React.FC<MarcaFormProps> = ({ marcaId, onSuccess, onCancel }) => {
    const isEditing = Boolean(marcaId);
    const { notifyMarcaCreated } = useCatalogs();
    const { addNotification } = useNotification();

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<MarcaFormData>({
        resolver: zodResolver(marcaSchema),
        defaultValues: {
            nombre_marca: '',
            descripcion: '',
            pais_origen: '',
            estado: EstadoEnum.Activo,
        }
    });

    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing && marcaId) {
            setLoading(true);
            getMarcaById(marcaId)
                .then(data => {
                    // Poblar el formulario con los datos de la marca
                    setValue('nombre_marca', data.nombre_marca);
                    setValue('descripcion', data.descripcion || '');
                    setValue('pais_origen', data.pais_origen || '');
                    setValue('estado', data.estado);
                })
                .catch(err => {
                    const errorMsg = err.response?.data?.detail || "Error al cargar la marca.";
                    setServerError(errorMsg);
                    addNotification(errorMsg, 'error');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [marcaId, isEditing, setValue, addNotification]);

    const onSubmit = async (data: MarcaFormData) => {
        setLoading(true);
        setServerError(null);
        try {
            if (isEditing && marcaId) {
                const marcaActualizada = await updateMarca(marcaId, data);
                addNotification('Marca actualizada con éxito', 'success');
                onSuccess(marcaActualizada);
            } else {
                const nuevaMarca = await createMarca(data);
                addNotification('Marca creada con éxito', 'success');
                notifyMarcaCreated(nuevaMarca);
                onSuccess(nuevaMarca);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || "Error al guardar la marca.";
            setServerError(errorMessage);
            addNotification(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditing) {
        return <div className="flex justify-center items-center h-40"><LoadingSpinner /> Cargando marca...</div>;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
            {serverError && <ErrorMessage message={serverError} />}
            
            <div>
                <label htmlFor="nombre_marca" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre de la Marca *
                </label>
                <Input
                    id="nombre_marca"
                    type="text"
                    {...register('nombre_marca')}
                    className={`mt-1 block w-full ${errors.nombre_marca ? 'border-red-500' : ''}`}
                    placeholder="Ingrese el nombre de la marca"
                />
                {errors.nombre_marca && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre_marca.message}</p>
                )}
            </div>
            <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción
                </label>
                <Input
                    id="descripcion"
                    type="text"
                    {...register('descripcion')}
                    className={`mt-1 block w-full ${errors.descripcion ? 'border-red-500' : ''}`}
                    placeholder="Descripción opcional de la marca"
                />
                {errors.descripcion && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.descripcion.message}</p>
                )}
            </div>
            <div>
                <label htmlFor="pais_origen" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    País de Origen
                </label>
                <Input
                    id="pais_origen"
                    type="text"
                    {...register('pais_origen')}
                    className={`mt-1 block w-full ${errors.pais_origen ? 'border-red-500' : ''}`}
                    placeholder="País de origen de la marca"
                />
                {errors.pais_origen && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pais_origen.message}</p>
                )}
            </div>
            {isEditing && (
                <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                    <Select
                        id="estado"
                        {...register('estado')}
                        options={[
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                        ]}
                        className="mt-1 block w-full"
                    />
                </div>
            )}
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" /> : (isEditing ? 'Actualizar Marca' : 'Crear Marca')}
                </Button>
            </div>
        </form>
    );
};

export default MarcaForm;