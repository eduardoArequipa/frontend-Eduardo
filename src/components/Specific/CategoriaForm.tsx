import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getCategoriaById, createCategoria, updateCategoria } from '../../services/categoriaService';
import { CategoriaCreate, CategoriaUpdate } from '../../types/categoria';
import { useCatalogs } from '../../context/CatalogContext';
import Input from '../Common/Input';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';

interface CategoriaFormProps {
    categoriaId?: number;
    onSuccess: () => void;
    onCancel: () => void;
}

const CategoriaForm: React.FC<CategoriaFormProps> = ({ categoriaId, onSuccess, onCancel }) => {
    const isEditing = Boolean(categoriaId);
    const { register, handleSubmit, setValue, formState: { errors } } = useForm<CategoriaCreate>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { refetchCatalogs } = useCatalogs();

    useEffect(() => {
        if (isEditing && categoriaId) {
            setLoading(true);
            getCategoriaById(categoriaId)
                .then(data => {
                    setValue('nombre_categoria', data.nombre_categoria);
                })
                .catch(err => setError(err.response?.data?.detail || 'Error al cargar la categoría'))
                .finally(() => setLoading(false));
        }
    }, [categoriaId, isEditing, setValue]);

    const onSubmit = async (data: CategoriaCreate) => {
        setLoading(true);
        setError(null);
        try {
            if (isEditing && categoriaId) {
                await updateCategoria(categoriaId, data as CategoriaUpdate);
                alert('Categoría actualizada con éxito');
            } else {
                await createCategoria(data);
                alert('Categoría creada con éxito');
            }
            await refetchCatalogs();
            onSuccess(); // Llamar al callback de éxito
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al guardar la categoría');
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditing) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="mb-6">
                <label htmlFor="nombre_categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                <Input 
                    id="nombre_categoria" 
                    type="text" 
                    {...register('nombre_categoria', { required: 'El nombre es requerido' })} 
                    className={errors.nombre_categoria ? 'border-red-500' : ''}
                />
                {errors.nombre_categoria && <span className="text-red-500 text-xs">{errors.nombre_categoria.message}</span>}
            </div>
            <div className="flex justify-end space-x-4">
                <Button type="button" onClick={onCancel} variant="secondary">Cancelar</Button>
                <Button type="submit" disabled={loading} variant="primary">
                    {loading ? <LoadingSpinner /> : (isEditing ? 'Actualizar' : 'Crear')}
                </Button>
            </div>
        </form>
    );
};

export default CategoriaForm;
