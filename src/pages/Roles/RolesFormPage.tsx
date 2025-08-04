
// src/pages/Roles/RolesFormPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoleById, createRole, updateRole } from '../../services/rolService';

// Tipos
import { IRolInDB, IRolCreate, IRolUpdate } from '../../types/rol';
import { EstadoEnum } from '../../types/enums';

// Componentes
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select';
import ErrorMessage from '../../components/Common/ErrorMessage';

interface IRoleFormState {
    nombre_rol: string;
    descripcion?: string | null;
    estado: EstadoEnum;
}

const RolesFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;
    const rolId = id ? parseInt(id, 10) : null;

    const [roleFormData, setRoleFormData] = useState<IRoleFormState>({
        nombre_rol: '',
        descripcion: '',
        estado: EstadoEnum.Activo,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formSubmitError, setFormSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing && rolId) {
            setLoading(true);
            getRoleById(rolId)
                .then((data: IRolInDB) => {
                    setRoleFormData({
                       nombre_rol: data.nombre_rol,
                       descripcion: data.descripcion,
                       estado: data.estado,
                    });
                    setLoading(false);
                })
                .catch(() => {
                    setError("No se pudo cargar el rol para editar.");
                    setLoading(false);
                });
        }
    }, [isEditing, rolId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setRoleFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormSubmitError(null);

        try {
            if (isEditing && rolId) {
                const dataToSend: IRolUpdate = { ...roleFormData };
                if (!dataToSend.nombre_rol) {
                     setFormSubmitError("El nombre del rol es requerido.");
                     setLoading(false);
                     return;
                 }
                await updateRole(rolId, dataToSend);
                alert("Rol actualizado con éxito!");
            } else {
                const dataToSend: IRolCreate = {
                    nombre_rol: roleFormData.nombre_rol,
                    descripcion: roleFormData.descripcion || '',
                };
                if (!dataToSend.nombre_rol) {
                     setFormSubmitError("El nombre del rol es requerido.");
                     setLoading(false);
                     return;
                 }
                await createRole(dataToSend);
                alert("Rol creado con éxito!");
            }
            navigate('/roles');
        } catch (err: any) {
            setFormSubmitError(err.response?.data?.detail || "Ocurrió un error al guardar el rol.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditing) {
         return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                 <LoadingSpinner /> Cargando datos del rol...
            </div>
         );
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{isEditing ? 'Editar Rol' : 'Crear Nuevo Rol'}</h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                    <label htmlFor="nombre_rol" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Rol</label>
                    <Input id="nombre_rol" name="nombre_rol" type="text" required value={roleFormData.nombre_rol} onChange={handleInputChange} />
                 </div>

                 <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción (Opcional)</label>
                     <textarea
                        id="descripcion"
                        name="descripcion"
                        rows={3}
                        value={roleFormData.descripcion || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                     ></textarea>
                 </div>

                 {isEditing && (
                     <div>
                        <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                        <Select id="estado" name="estado" value={roleFormData.estado} onChange={handleInputChange} options={[
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                        ]} />
                     </div>
                 )}

                {formSubmitError && <div className="md:col-span-2"><ErrorMessage message={formSubmitError} /></div>}

                <div className="md:col-span-2 flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={() => navigate('/roles')}>Cancelar</Button>
                    <Button type="submit" disabled={loading} variant="primary">
                        {loading ? <LoadingSpinner /> : (isEditing ? 'Actualizar Rol' : 'Crear Rol')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default RolesFormPage;
