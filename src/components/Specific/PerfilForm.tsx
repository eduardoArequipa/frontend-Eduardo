// src/components/Specific/PerfilForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { updateUser } from '../../services/userService';
import { uploadImage } from '../../services/uploadService';
import { IUsuarioReadAudit, IUsuarioUpdate } from '../../types/usuario';
import { useNotification } from '../../context/NotificationContext';
import Input from '../Common/Input';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import UserAvatar from '../Specific/UserAvatar';
import ErrorMessage from '../Common/ErrorMessage';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface PerfilFormProps {
    usuario: IUsuarioReadAudit;
    onSuccess: (updatedUser: IUsuarioReadAudit) => Promise<void>;
    onCancel: () => void;
}

interface FormData {
    nombre_usuario: string;
    contraseña: string;
    confirmar_contraseña: string;
    // Datos de persona
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    ci: string;
    email: string;
    telefono: string;
    direccion: string;
}

const PerfilForm: React.FC<PerfilFormProps> = ({ usuario, onSuccess, onCancel }) => {
    const { addNotification } = useNotification();
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
    const [removeExistingImage, setRemoveExistingImage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset
    } = useForm<FormData>({ mode: "onBlur" });

    const watchPassword = watch('contraseña');

    useEffect(() => {
        // Inicializar formulario con datos del usuario
        reset({
            nombre_usuario: usuario.nombre_usuario,
            contraseña: '',
            confirmar_contraseña: '',
            nombre: usuario.persona?.nombre || '',
            apellido_paterno: usuario.persona?.apellido_paterno || '',
            apellido_materno: usuario.persona?.apellido_materno || '',
            ci: usuario.persona?.ci || '',
            email: usuario.persona?.email || '',
            telefono: usuario.persona?.telefono || '',
            direccion: usuario.persona?.direccion || ''
        });

        // Configurar imagen existente
        if (usuario.foto_ruta) {
            setExistingImageUrl(`${BACKEND_BASE_URL}${usuario.foto_ruta}`);
        }
    }, [usuario, reset]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        setSelectedImageFile(file);
        setRemoveExistingImage(false);
    };

    const handleRemoveExistingImage = () => {
        setRemoveExistingImage(true);
        setSelectedImageFile(null);
        const fileInput = document.getElementById("profile_image") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };

    const onSubmit = async (formData: FormData) => {
        setLoading(true);
        setError(null);

        try {
            // Validar contraseñas si se están cambiando
            if (formData.contraseña && formData.contraseña !== formData.confirmar_contraseña) {
                setError('Las contraseñas no coinciden');
                setLoading(false);
                return;
            }

            // Subir imagen si hay una nueva
            let finalImagenRuta: string | null = null;
            if (selectedImageFile) {
                try {
                    finalImagenRuta = await uploadImage(selectedImageFile);
                } catch (uploadError: any) {
                    addNotification(`Error al subir la imagen: ${uploadError.response?.data?.detail || uploadError.message}`, 'error');
                    setLoading(false);
                    return;
                }
            } else if (removeExistingImage) {
                finalImagenRuta = null;
            } else if (existingImageUrl) {
                // Mantener imagen existente
                const existingRelativePath = existingImageUrl.replace(BACKEND_BASE_URL, "");
                finalImagenRuta = existingRelativePath.startsWith("/") ? existingRelativePath : "/" + existingRelativePath;
            }

            // Preparar datos para actualizar
            const updateData: IUsuarioUpdate = {
                nombre_usuario: formData.nombre_usuario,
                foto_ruta: finalImagenRuta,
            };

            // Solo incluir contraseña si se está cambiando
            if (formData.contraseña && formData.contraseña.trim() !== '') {
                updateData.contraseña = formData.contraseña;
            }

            // Actualizar usuario
            const updatedUser = await updateUser(usuario.usuario_id, updateData);

            addNotification('Perfil actualizado con éxito', 'success');
            await onSuccess(updatedUser);

        } catch (err: any) {
            let errorMessage = "Ocurrió un error al actualizar el perfil.";
            if (err.response && err.response.data) {
                if (typeof err.response.data.detail === "string") {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail
                        .map((errorDetail: any) => `${errorDetail.loc[1]}: ${errorDetail.msg}`)
                        .join("; ");
                }
            }
            setError(errorMessage);
            addNotification(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && <ErrorMessage message={error} />}

            {/* Información de Usuario */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Datos de Usuario
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nombre_usuario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre de Usuario
                        </label>
                        <Input
                            id="nombre_usuario"
                            type="text"
                            {...register("nombre_usuario", {
                                required: "El nombre de usuario es requerido",
                                minLength: { value: 3, message: "Mínimo 3 caracteres" }
                            })}
                            className={errors.nombre_usuario ? 'border-red-500' : ''}
                        />
                        {errors.nombre_usuario && <span className="text-red-500 text-xs">{errors.nombre_usuario.message}</span>}
                    </div>

                    <div className="md:col-span-2">
                        <label htmlFor="profile_image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Foto de Perfil
                        </label>
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                                <UserAvatar
                                    src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : (existingImageUrl && !removeExistingImage ? existingImageUrl : undefined)}
                                    alt="Vista previa"
                                    size="lg"
                                    className="ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-indigo-500"
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    id="profile_image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                                />
                                {existingImageUrl && !removeExistingImage && !selectedImageFile && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveExistingImage}
                                        className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        Eliminar imagen actual
                                    </button>
                                )}
                                {selectedImageFile && (
                                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                        Nueva imagen: {selectedImageFile.name}
                                    </p>
                                )}
                                {removeExistingImage && (
                                    <p className="mt-1 text-sm text-red-500">
                                        La imagen actual será eliminada
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cambiar Contraseña */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Cambiar Contraseña (Opcional)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="contraseña" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nueva Contraseña
                        </label>
                        <Input
                            id="contraseña"
                            type="password"
                            {...register("contraseña", {
                                minLength: watchPassword ? { value: 6, message: "Mínimo 6 caracteres" } : undefined
                            })}
                            placeholder="Dejar vacío para no cambiar"
                            className={errors.contraseña ? 'border-red-500' : ''}
                        />
                        {errors.contraseña && <span className="text-red-500 text-xs">{errors.contraseña.message}</span>}
                    </div>

                    <div>
                        <label htmlFor="confirmar_contraseña" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirmar Contraseña
                        </label>
                        <Input
                            id="confirmar_contraseña"
                            type="password"
                            {...register("confirmar_contraseña", {
                                validate: watchPassword ? (value) => value === watchPassword || "Las contraseñas no coinciden" : undefined
                            })}
                            placeholder="Confirmar nueva contraseña"
                            className={errors.confirmar_contraseña ? 'border-red-500' : ''}
                        />
                        {errors.confirmar_contraseña && <span className="text-red-500 text-xs">{errors.confirmar_contraseña.message}</span>}
                    </div>
                </div>
            </div>

            {/* Información Personal - Solo lectura para mostrar */}
            {usuario.persona && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-2">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                Información Personal
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Los datos personales (nombre, email, teléfono, etc.) solo pueden ser modificados por un administrador.
                                Si necesitas actualizar esta información, contacta al administrador del sistema.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                    {loading ? <LoadingSpinner /> : 'Guardar Cambios'}
                </Button>
            </div>
        </form>
    );
};

export default PerfilForm;