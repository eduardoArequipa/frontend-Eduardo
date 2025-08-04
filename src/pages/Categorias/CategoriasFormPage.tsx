
// src/pages/Categorias/CategoriasFormPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategoriaById, createCategoria, updateCategoria } from '../../services/categoriaService';
import { CategoriaCreate, CategoriaUpdate } from '../../types/categoria';
import { EstadoEnum } from '../../types/enums'; 
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select';
import ErrorMessage from '../../components/Common/ErrorMessage';

interface CategoriaFormState {
    nombre_categoria: string;
    estado: EstadoEnum; 
}

const CategoriasFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>(); 
    const navigate = useNavigate(); 
    const isEditing = !!id;
    const categoriaId = id ? parseInt(id, 10) : null; 

    const [categoriaFormData, setCategoriaFormData] = useState<CategoriaFormState>({
        nombre_categoria: '',
        estado: EstadoEnum.Activo, 
    });

    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState<string | null>(null); 
    const [formSubmitError, setFormSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing && categoriaId) { 
            setLoading(true); 
            getCategoriaById(categoriaId)
                .then(data => {
                    setCategoriaFormData({
                       nombre_categoria: data.nombre_categoria,
                       estado: data.estado,
                    });
                    setLoading(false); 
                })
                .catch(() => {
                    setError("No se pudo cargar la categoría para editar.");
                    setLoading(false); 
                });
        }
    }, [isEditing, categoriaId]); 

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCategoriaFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); 
        setLoading(true); 
        setFormSubmitError(null); 

        try {
            if (isEditing && categoriaId) {
                const dataToSend: CategoriaUpdate = { ...categoriaFormData };
                 if (!dataToSend.nombre_categoria) {
                     setFormSubmitError("El nombre de la categoría es requerido.");
                     setLoading(false);
                     return;
                 }
                await updateCategoria(categoriaId, dataToSend); 
                alert("Categoría actualizada con éxito!"); 
            } else {
                 const dataToSend: CategoriaCreate = { nombre_categoria: categoriaFormData.nombre_categoria };
                 if (!dataToSend.nombre_categoria) {
                     setFormSubmitError("El nombre de la categoría es requerido.");
                     setLoading(false);
                     return;
                 }
                await createCategoria(dataToSend); 
                alert("Categoría creada con éxito!"); 
            }
            navigate('/categorias'); 
        } catch (err: any) {
            setFormSubmitError(err.response?.data?.detail || "Ocurrió un error al guardar la categoría.");
        } finally {
            setLoading(false);
        }
    };

    if (isEditing && loading) {
         return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                 <LoadingSpinner /> Cargando datos...
            </div>
         );
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{isEditing ? 'Editar Categoría' : 'Crear Nueva Categoría'}</h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="md:col-span-2">
                    <label htmlFor="nombre_categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de Categoría</label>
                    <Input id="nombre_categoria" name="nombre_categoria" type="text" required value={categoriaFormData.nombre_categoria} onChange={handleInputChange} />
                 </div>

                 {isEditing && (
                     <div>
                        <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                        <Select id="estado" name="estado" value={categoriaFormData.estado} onChange={handleInputChange} options={[
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                        ]} />
                     </div>
                 )}

                {formSubmitError && <div className="md:col-span-2"><ErrorMessage message={formSubmitError} /></div>}

                <div className="md:col-span-2 flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={() => navigate('/categorias')}>Cancelar</Button>
                    <Button type="submit" disabled={loading} variant="primary">
                        {loading ? <LoadingSpinner /> : (isEditing ? 'Actualizar Categoría' : 'Crear Categoría')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CategoriasFormPage;
