
import React, { useState, useEffect } from 'react';
import { MarcaCreate } from '../../types/marca';
import { createMarca, getMarcaById, updateMarca } from '../../services/marcaService';
import Input from '../Common/Input';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import { EstadoEnum } from '../../types/enums';
import Select from '../Common/Select';
import { useCatalogs } from '../../context/CatalogContext';

interface MarcaFormProps {
    marcaId?: number; // Opcional, si estamos editando una marca existente
    onSuccess: (marca?: any) => void; // Cambiar para recibir la marca creada/editada
    onCancel: () => void;
}

const MarcaForm: React.FC<MarcaFormProps> = ({ marcaId, onSuccess, onCancel }) => {
    const { notifyMarcaCreated } = useCatalogs();
    
    const [formData, setFormData] = useState<MarcaCreate>({
        nombre_marca: '',
        descripcion: '',
        pais_origen: '',
    });
    const [estado, setEstado] = useState<EstadoEnum>(EstadoEnum.Activo);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

    useEffect(() => {
        if (marcaId) {
            setLoading(true);
            getMarcaById(marcaId)
                .then(data => {
                    setFormData({
                        nombre_marca: data.nombre_marca,
                        descripcion: data.descripcion || '',
                        pais_origen: data.pais_origen || '',
                    });
                    setEstado(data.estado);
                })
                .catch(err => {
                    setError(err.response?.data?.detail || "Error al cargar la marca.");
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [marcaId]);

    const validateForm = (): boolean => {
        const errors: {[key: string]: string} = {};

        // Validar nombre de marca
        if (!formData.nombre_marca.trim()) {
            errors.nombre_marca = 'El nombre de la marca es obligatorio';
        } else if (formData.nombre_marca.length < 2) {
            errors.nombre_marca = 'El nombre debe tener al menos 2 caracteres';
        } else if (formData.nombre_marca.length > 50) {
            errors.nombre_marca = 'El nombre no puede exceder 50 caracteres';
        }

        // Validar descripción
        if (formData.descripcion && formData.descripcion.length > 500) {
            errors.descripcion = 'La descripción no puede exceder 500 caracteres';
        }

        // Validar país de origen
        if (formData.pais_origen && formData.pais_origen.length > 50) {
            errors.pais_origen = 'El país de origen no puede exceder 50 caracteres';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value,
        }));

        // Limpiar error de validación específico al cambiar el campo
        if (validationErrors[id]) {
            setValidationErrors(prev => ({
                ...prev,
                [id]: ''
            }));
        }
    };

    const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setEstado(e.target.value as EstadoEnum);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar formulario antes de enviar
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (marcaId) {
                const marcaActualizada = await updateMarca(marcaId, {...formData, estado});
                onSuccess(marcaActualizada); // Pasar la marca actualizada
            } else {
                const nuevaMarca = await createMarca(formData);

                // 🚀 OPTIMIZACIÓN: Notificar a otros módulos sin recargar todo
                console.log('🏷️ Nueva marca creada, notificando a cache:', nuevaMarca.nombre_marca);
                notifyMarcaCreated(nuevaMarca);

                onSuccess(nuevaMarca); // Pasar la nueva marca
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Error al guardar la marca.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && marcaId) {
        return <div className="flex justify-center items-center h-40"><LoadingSpinner /> Cargando marca...</div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div>
                <label htmlFor="nombre_marca" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre de la Marca *
                </label>
                <Input
                    id="nombre_marca"
                    type="text"
                    value={formData.nombre_marca}
                    onChange={handleChange}
                    required
                    maxLength={50}
                    className={`mt-1 block w-full ${validationErrors.nombre_marca ? 'border-red-500' : ''}`}
                    placeholder="Ingrese el nombre de la marca"
                />
                {validationErrors.nombre_marca && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.nombre_marca}</p>
                )}
            </div>
            <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción
                </label>
                <Input
                    id="descripcion"
                    type="text"
                    value={formData.descripcion || ''}
                    onChange={handleChange}
                    maxLength={500}
                    className={`mt-1 block w-full ${validationErrors.descripcion ? 'border-red-500' : ''}`}
                    placeholder="Descripción opcional de la marca"
                />
                {validationErrors.descripcion && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.descripcion}</p>
                )}
            </div>
            <div>
                <label htmlFor="pais_origen" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    País de Origen
                </label>
                <Input
                    id="pais_origen"
                    type="text"
                    value={formData.pais_origen || ''}
                    onChange={handleChange}
                    maxLength={50}
                    className={`mt-1 block w-full ${validationErrors.pais_origen ? 'border-red-500' : ''}`}
                    placeholder="País de origen de la marca"
                />
                {validationErrors.pais_origen && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.pais_origen}</p>
                )}
            </div>
            {marcaId && (
                <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                    <Select
                        id="estado"
                        value={estado}
                        onChange={handleEstadoChange}
                        options={[
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                        ]}
                        className="mt-1 block w-full"
                    />
                </div>
            )}
            <div className="flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? <LoadingSpinner size="small" /> : (marcaId ? 'Actualizar Marca' : 'Crear Marca')}
                </Button>
            </div>
        </form>
    );
};

export default MarcaForm;
