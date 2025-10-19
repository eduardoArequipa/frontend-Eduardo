// src/components/Specific/RolForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createRol, updateRol, getRoleById } from '../../services/rolService';
import { IRolInDB, IRolUpdate, IRolCreate } from '../../types/rol';
import { EstadoEnum } from '../../types/enums';
import { useNotification } from '../../context/NotificationContext';

import Input from '../Common/Input';
import Button from '../Common/Button';
import Select from '../Common/Select';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';

// 1. Zod Schema
const rolSchema = z.object({
  nombre_rol: z.string()
    .trim()
    .min(1, { message: 'El nombre del rol es requerido.' })
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
    .max(50, { message: 'El nombre no puede exceder 50 caracteres.' }),
  descripcion: z.string()
    .max(500, { message: 'La descripción no puede exceder 500 caracteres.' })
    .optional()
    .or(z.literal('')),
  estado: z.nativeEnum(EstadoEnum),
});

type RolFormData = z.infer<typeof rolSchema>;

interface RolFormProps {
    rolId?: number;
    onSuccess: (rol: IRolInDB) => void;
    onCancel: () => void;
}

const RolForm: React.FC<RolFormProps> = ({ rolId, onSuccess, onCancel }) => {
    const isEditing = !!rolId;
    const { addNotification } = useNotification();

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RolFormData>({
        resolver: zodResolver(rolSchema),
        defaultValues: {
            nombre_rol: '',
            descripcion: '',
            estado: EstadoEnum.Activo,
        }
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);
    const [serverError, setServerError] = useState<string | null>(null);

    const watchedDescripcion = watch('descripcion', '');

    useEffect(() => {
        if (isEditing && rolId) {
            const fetchRol = async () => {
                setInitialLoading(true);
                try {
                    const rol: IRolInDB = await getRoleById(rolId);
                    setValue('nombre_rol', rol.nombre_rol);
                    setValue('descripcion', rol.descripcion || '');
                    setValue('estado', rol.estado);
                } catch (err: any) {
                    const errorMsg = err.response?.data?.detail || 'Error al cargar el rol.';
                    setServerError(errorMsg);
                    addNotification(errorMsg, 'error');
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchRol();
        }
    }, [isEditing, rolId, setValue, addNotification]);

    const onSubmit = async (data: RolFormData) => {
        setLoading(true);
        setServerError(null);

        try {
            let result: IRolInDB;

            if (isEditing && rolId) {
                const updateData: IRolUpdate = {
                    ...data,
                    nombre_rol: data.nombre_rol.trim(),
                    descripcion: data.descripcion?.trim(),
                };
                result = await updateRol(rolId, updateData);
                addNotification('Rol actualizado con éxito', 'success');
            } else {
                const createData: IRolCreate = {
                    ...data,
                    nombre_rol: data.nombre_rol.trim(),
                    descripcion: data.descripcion?.trim(),
                };
                result = await createRol(createData);
                addNotification('Rol creado con éxito', 'success');
            }

            onSuccess(result);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 
                (isEditing ? 'Error al actualizar el rol.' : 'Error al crear el rol.');
            setServerError(errorMessage);
            addNotification(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <LoadingSpinner /> Cargando datos del rol...
            </div>
        );
    }

    return (
        <div>
            {serverError && <ErrorMessage message={serverError} />}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label htmlFor="nombre_rol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Rol *
                    </label>
                    <Input
                        id="nombre_rol"
                        type="text"
                        {...register('nombre_rol')}
                        placeholder="Ej: Administrador, Empleado, etc."
                        maxLength={50}
                        disabled={loading}
                        className={errors.nombre_rol ? 'border-red-500' : ''}
                    />
                    {errors.nombre_rol ? (
                        <p className="text-xs text-red-500 mt-1">{errors.nombre_rol.message}</p>
                    ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Mínimo 3 caracteres, máximo 50. Debe ser único.
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción
                    </label>
                    <textarea
                        id="descripcion"
                        {...register('descripcion')}
                        placeholder="Describe las responsabilidades y funciones de este rol..."
                        rows={3}
                        maxLength={500}
                        disabled={loading}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 resize-none ${errors.descripcion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.descripcion ? (
                         <p className="text-xs text-red-500 mt-1">{errors.descripcion.message}</p>
                    ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Máximo 500 caracteres. ({watchedDescripcion?.length}/500)
                        </p>
                    )}
                </div>

                {isEditing && (
                    <div>
                        <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Estado
                        </label>
                        <Select
                            id="estado"
                            {...register('estado')}
                            disabled={loading}
                            options={[
                                { value: EstadoEnum.Activo, label: 'Activo' },
                                { value: EstadoEnum.Inactivo, label: 'Inactivo' }
                            ]}
                        />
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <><LoadingSpinner size="sm" className="mr-2" /> Guardando...</>
                        ) : (
                            isEditing ? 'Actualizar Rol' : 'Crear Rol'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default RolForm;
