import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCategoriaById, createCategoria, updateCategoria } from '../../services/categoriaService';
import { CategoriaUpdate } from '../../types/categoria';
import { useCatalogs } from '../../context/CatalogContext';
import { useNotification } from '../../context/NotificationContext'; // Importar hook
import Input from '../Common/Input';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';

// 1. Definir el esquema de validación con Zod
const categoriaSchema = z.object({
  nombre_categoria: z.string()
    .trim()
    .min(1, { message: 'El nombre de la categoría es requerido.' })
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
    .max(20, { message: 'El nombre no puede tener más de 20 caracteres.' }),
});

// Extraer el tipo del esquema para usarlo en el formulario
type CategoriaFormData = z.infer<typeof categoriaSchema>;

interface CategoriaFormProps {
    categoriaId?: number;
    onSuccess: (categoria?: any) => void;
    onCancel: () => void;
}

const CategoriaForm: React.FC<CategoriaFormProps> = ({ categoriaId, onSuccess, onCancel }) => {
    const isEditing = Boolean(categoriaId);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<CategoriaFormData>({
        resolver: zodResolver(categoriaSchema),
        defaultValues: {
            nombre_categoria: ''
        }
    });

    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null); // Renombrado para claridad
    const { notifyCategoriaCreated } = useCatalogs();
    const { addNotification } = useNotification(); // <-- Usar el hook de notificación

    useEffect(() => {
        if (isEditing && categoriaId) {
            setLoading(true);
            getCategoriaById(categoriaId)
                .then(data => {
                    setValue('nombre_categoria', data.nombre_categoria);
                })
                .catch(err => setServerError(err.response?.data?.detail || 'Error al cargar la categoría'))
                .finally(() => setLoading(false));
        }
    }, [categoriaId, isEditing, setValue]);

    const onSubmit = async (data: CategoriaFormData) => {
        setLoading(true);
        setServerError(null);
        try {
            if (isEditing && categoriaId) {
                const categoriaActualizada = await updateCategoria(categoriaId, data as CategoriaUpdate);
                addNotification('Categoría actualizada con éxito', 'success'); // <-- Notificación de éxito
                onSuccess(categoriaActualizada);
            } else {
                const nuevaCategoria = await createCategoria(data);
                addNotification('Categoría creada con éxito', 'success'); // <-- Notificación de éxito
                
                console.log('📋 Nueva categoría creada, notificando a cache:', nuevaCategoria.nombre_categoria);
                notifyCategoriaCreated(nuevaCategoria);
                
                onSuccess(nuevaCategoria);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Error al guardar la categoría';
            addNotification(errorMessage, 'error'); // <-- Notificación de error
            setServerError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditing) return <LoadingSpinner />;
    
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            {/* Mostrar error general del servidor */}
            {serverError && <ErrorMessage message={serverError} />}

            <div className="mb-2">
                <label htmlFor="nombre_categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la Categoría</label>
                <Input 
                    id="nombre_categoria" 
                    type="text" 
                    {...register('nombre_categoria')} 
                    className={errors.nombre_categoria ? 'border-red-500' : ''}
                    placeholder="Ej: Gaseosas"
                />
                {errors.nombre_categoria && <span className="text-red-500 text-xs mt-1">{errors.nombre_categoria.message}</span>}
            </div>
            <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" onClick={onCancel} variant="secondary">Cancelar</Button>
                <Button type="submit" disabled={loading} variant="primary">
                    {loading ? <LoadingSpinner size="sm" /> : (isEditing ? 'Actualizar' : 'Registrar Categoría')}
                </Button>
            </div>
        </form>
    );
};

export default CategoriaForm;
