
// src/pages/Usuarios/UsuariosFormPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserById, updateUser, createUser } from '../../services/userService';
import { getPersonasWithoutUser } from '../../services/personaService';
import { uploadImage } from '../../services/uploadService';

// Tipos
import { IUsuarioCreate, IUsuarioUpdate } from '../../types/usuario';
import { IPersonaNested } from '../../types/persona';
import { EstadoEnum } from '../../types/enums';

// Componentes
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import UserAvatar from '../../components/Specific/UserAvatar';
import Select from '../../components/Common/Select';
import ErrorMessage from '../../components/Common/ErrorMessage';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const UsuariosFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;
    const usuarioId = id ? parseInt(id, 10) : null;

    const [usuarioFormData, setUsuarioFormData] = useState<Partial<IUsuarioCreate & IUsuarioUpdate>>({
        nombre_usuario: '',
        contraseña: '',
        estado: EstadoEnum.Activo,
        foto_ruta: undefined,
        persona_id: undefined,
    });

    const [availablePersonas, setAvailablePersonas] = useState<IPersonaNested[]>([]);
    const [loadingPersonas, setLoadingPersonas] = useState(true);
    const [personasLoaded, setPersonasLoaded] = useState(false);

    const activeAvailablePersonas = useMemo(() => {
        return availablePersonas.filter(persona => persona.estado === EstadoEnum.Activo);
    }, [availablePersonas]);

    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | undefined>(undefined);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formSubmitError, setFormSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing && usuarioId) {
            setLoading(true);
            getUserById(usuarioId)
                .then(data => {
                    setUsuarioFormData({
                       nombre_usuario: data.nombre_usuario,
                       estado: data.estado,
                       foto_ruta: data.foto_ruta,
                       contraseña: '',
                    });
                     if (data.foto_ruta) {
                         setExistingPhotoUrl(`${BACKEND_BASE_URL}${data.foto_ruta}`);
                     }
                    setLoading(false);
                })
                .catch(err => {
                    setError("No se pudo cargar el usuario para editar.");
                    setLoading(false);
                });
        }
    }, [isEditing, usuarioId]);

    useEffect(() => {
        if (!isEditing) {
            setLoadingPersonas(true);
            getPersonasWithoutUser()
                .then(data => {
                    setAvailablePersonas(data);
                    setPersonasLoaded(true);
                })
                .catch(err => {
                    setError("Error al cargar la lista de personas disponibles.");
                })
                .finally(() => setLoadingPersonas(false));
        }
    }, [isEditing]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUsuarioFormData(prev => ({
            ...prev,
            [name]: name === 'persona_id' && value !== '' ? parseInt(value, 10) : value === '' ? undefined : value,
        }));
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
         if (e.target.files && e.target.files[0]) {
             setSelectedPhoto(e.target.files[0]);
         }
     };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormSubmitError(null);

        try {
            let photoPath: string | undefined = undefined;
            if (selectedPhoto) {
                photoPath = await uploadImage(selectedPhoto);
            }

            if (isEditing && usuarioId) {
                const dataToSend: IUsuarioUpdate = {
                    nombre_usuario: usuarioFormData.nombre_usuario,
                    estado: usuarioFormData.estado,
                    foto_ruta: photoPath ?? undefined,
                    contraseña: usuarioFormData.contraseña || undefined,
                };
                await updateUser(usuarioId, dataToSend);
                alert("Usuario actualizado con éxito!");
            } else {
                if (!usuarioFormData.persona_id || !usuarioFormData.nombre_usuario || !usuarioFormData.contraseña) {
                    setFormSubmitError("Nombre de usuario, contraseña y persona asociada son requeridos.");
                    setLoading(false);
                    return;
                }
                const dataToSend: IUsuarioCreate = {
                    persona_id: usuarioFormData.persona_id,
                    nombre_usuario: usuarioFormData.nombre_usuario,
                    contraseña: usuarioFormData.contraseña,
                    estado: usuarioFormData.estado || EstadoEnum.Activo,
                    foto_ruta: photoPath ?? undefined,
                };
                await createUser(dataToSend);
                alert("Usuario creado con éxito!");
            }
            navigate('/usuarios');
        } catch (err: any) {
            setFormSubmitError(err.response?.data?.detail || "Ocurrió un error al guardar el usuario.");
        } finally {
            setLoading(false);
        }
    };

    if (loading || (!isEditing && loadingPersonas)) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                 <LoadingSpinner /> Cargando...
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!isEditing && personasLoaded && activeAvailablePersonas.length === 0) {
        alert("No hay Personas activas sin Usuario asociado. Debes crear una Persona primero.");
        navigate('/personas/new', { replace: true });
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="md:col-span-2 text-lg font-semibold border-b pb-2 mb-4 text-gray-800 dark:text-gray-200">Datos de Usuario</div>

                 <div>
                    <label htmlFor="nombre_usuario" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de Usuario</label>
                    <Input id="nombre_usuario" name="nombre_usuario" type="text" required value={usuarioFormData.nombre_usuario || ''} onChange={handleInputChange} />
                 </div>

                 <div>
                    <label htmlFor="contraseña" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{isEditing ? 'Cambiar Contraseña (Opcional)' : 'Contraseña'}</label>
                    <Input id="contraseña" name="contraseña" type="password" required={!isEditing} value={usuarioFormData.contraseña || ''} onChange={handleInputChange} placeholder={isEditing ? "Dejar vacío para no cambiar" : ""} />
                 </div>

                 <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                    <Select id="estado" name="estado" value={usuarioFormData.estado} onChange={handleInputChange} options={[
                        { value: EstadoEnum.Activo, label: 'Activo' },
                        { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                        { value: EstadoEnum.Bloqueado, label: 'Bloqueado' },
                    ]} />
                 </div>

                 <div>
                     <label htmlFor="user_photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto Usuario</label>
                     <Input id="user_photo" name="user_photo" type="file" accept="image/*" onChange={handlePhotoSelect} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800" />
                      {selectedPhoto && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Archivo seleccionado: {selectedPhoto.name}</p>}
                       {isEditing && existingPhotoUrl && !selectedPhoto && (
                           <div>
                               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Foto Actual:</label>
                               <UserAvatar src={existingPhotoUrl} alt="Foto actual" className="mt-1 h-20 w-20 rounded-full object-cover" />
                           </div>
                       )}
                 </div>

                 {/* Sección para asociar una Persona existente al crear un nuevo usuario */}
                 {!isEditing && (
                     <div>
                         <label htmlFor="persona_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Persona Asociada</label>
                         <Select id="persona_id" name="persona_id" value={usuarioFormData.persona_id || ''} onChange={handleInputChange} required options={[
                             { value: '', label: 'Seleccionar Persona...' },
                             ...activeAvailablePersonas.map(persona => ({ value: persona.persona_id, label: `${persona.nombre} ${persona.apellido_paterno || ''}`.trim() })),
                         ]} />
                      </div>
                 )}

                {formSubmitError && <div className="md:col-span-2"><ErrorMessage message={formSubmitError} /></div>}
                
                <div className="md:col-span-2 flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={() => navigate('/usuarios')}>Cancelar</Button>
                    <Button type="submit" disabled={loading} variant="primary">
                        {loading ? <LoadingSpinner /> : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UsuariosFormPage;
