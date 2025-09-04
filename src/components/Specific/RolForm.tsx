// src/components/Specific/RolForm.tsx
import React, { useState, useEffect } from 'react';
import { createRol, updateRol, getRoleById } from '../../services/rolService';
import { IRolCreate, IRolUpdate, IRolInDB } from '../../types/rol';
import { EstadoEnum } from '../../types/enums';

import Input from '../Common/Input';
import Button from '../Common/Button';
import Select from '../Common/Select';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';

interface RolFormProps {
    rolId?: number; // Si existe, es edición; si no, es creación
    onSuccess: (rol: IRolInDB) => void;
    onCancel: () => void;
}

const RolForm: React.FC<RolFormProps> = ({ rolId, onSuccess, onCancel }) => {
    const isEditing = !!rolId;

    const [formData, setFormData] = useState({
        nombre_rol: '',
        descripcion: '',
        estado: EstadoEnum.Activo as EstadoEnum
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing && rolId) {
            const fetchRol = async () => {
                setInitialLoading(true);
                try {
                    const rol: IRolInDB = await getRoleById(rolId);
                    setFormData({
                        nombre_rol: rol.nombre_rol,
                        descripcion: rol.descripcion || '',
                        estado: rol.estado
                    });
                } catch (err: any) {
                    setError(err.response?.data?.detail || 'Error al cargar el rol.');
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchRol();
        }
    }, [isEditing, rolId]);

    const handleInputChange = (field: string, value: string | EstadoEnum) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Limpiar error cuando el usuario empiece a escribir
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validaciones básicas
        if (!formData.nombre_rol.trim()) {
            setError('El nombre del rol es obligatorio.');
            setLoading(false);
            return;
        }

        if (formData.nombre_rol.trim().length < 3) {
            setError('El nombre del rol debe tener al menos 3 caracteres.');
            setLoading(false);
            return;
        }

        try {
            let result: IRolInDB;

            if (isEditing && rolId) {
                const updateData: IRolUpdate = {
                    nombre_rol: formData.nombre_rol.trim(),
                    descripcion: formData.descripcion.trim() || undefined,
                    estado: formData.estado
                };
                result = await updateRol(rolId, updateData);
            } else {
                const createData: IRolCreate = {
                    nombre_rol: formData.nombre_rol.trim(),
                    descripcion: formData.descripcion.trim() || undefined,
                    estado: formData.estado
                };
                result = await createRol(createData);
            }

            onSuccess(result);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 
                (isEditing ? 'Error al actualizar el rol.' : 'Error al crear el rol.');
            setError(errorMessage);
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
            {error && <ErrorMessage message={error} />}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="nombre_rol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Rol *
                    </label>
                    <Input
                        id="nombre_rol"
                        type="text"
                        value={formData.nombre_rol}
                        onChange={(e) => handleInputChange('nombre_rol', e.target.value)}
                        placeholder="Ej: Administrador, Empleado, etc."
                        required
                        maxLength={50}
                        disabled={loading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Mínimo 3 caracteres, máximo 50. Debe ser único.
                    </p>
                </div>

                <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción
                    </label>
                    <textarea
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => handleInputChange('descripcion', e.target.value)}
                        placeholder="Describe las responsabilidades y funciones de este rol..."
                        rows={3}
                        maxLength={500}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Máximo 500 caracteres. ({formData.descripcion.length}/500)
                    </p>
                </div>

                <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado
                    </label>
                    <Select
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => handleInputChange('estado', e.target.value as EstadoEnum)}
                        disabled={loading}
                        options={[
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' }
                        ]}
                    />
                </div>

                {/* Botones del formulario - los manejamos aquí para tener control total */}
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
                        disabled={loading || !formData.nombre_rol.trim()}
                    >
                        {loading ? (
                            <><LoadingSpinner className="w-4 h-4 mr-2" /> Guardando...</>
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