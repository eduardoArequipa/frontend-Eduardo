
import React, { useState, useEffect } from 'react';
import { MarcaCreate } from '../../types/marca';
import { createMarca, getMarcaById, updateMarca } from '../../services/marcaService';
import Input from '../Common/Input';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import { EstadoEnum } from '../../types/enums';
import Select from '../Common/Select';

interface MarcaFormProps {
    marcaId?: number; // Opcional, si estamos editando una marca existente
    onSuccess: () => void;
    onCancel: () => void;
}

const MarcaForm: React.FC<MarcaFormProps> = ({ marcaId, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState<MarcaCreate>({
        nombre_marca: '',
        descripcion: '',
        pais_origen: '',
    });
    const [estado, setEstado] = useState<EstadoEnum>(EstadoEnum.Activo);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setEstado(e.target.value as EstadoEnum);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (marcaId) {
                await updateMarca(marcaId, {...formData, estado});
            } else {
                await createMarca(formData);
            }
            onSuccess();
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
                <label htmlFor="nombre_marca" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la Marca</label>
                <Input
                    id="nombre_marca"
                    type="text"
                    value={formData.nombre_marca}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full"
                />
            </div>
            <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                <Input
                    id="descripcion"
                    type="text"
                    value={formData.descripcion || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full"
                />
            </div>
            <div>
                <label htmlFor="pais_origen" className="block text-sm font-medium text-gray-700 dark:text-gray-300">País de Origen</label>
                <Input
                    id="pais_origen"
                    type="text"
                    value={formData.pais_origen || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full"
                />
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
                    {loading ? <LoadingSpinner size="sm" /> : (marcaId ? 'Actualizar Marca' : 'Crear Marca')}
                </Button>
            </div>
        </form>
    );
};

export default MarcaForm;
