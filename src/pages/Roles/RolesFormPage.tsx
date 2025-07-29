// src/pages/Roles/RolesFormPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRoleById, createRole, updateRole } from '../../services/rolService';

// Importa los tipos con el prefijo 'I'
import { IRolInDB, IRolCreate, IRolUpdate } from '../../types/rol'; // IRolInDB para cargar, IRolCreate/Update para enviar
import { EstadoEnum } from '../../types/enums';

// Importa componentes comunes
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select'; // Agregamos Select para el filtro de estado

// Define la interfaz para el estado del formulario, combinando campos de creación y actualización
interface IRoleFormState {
    nombre_rol: string;
    descripcion?: string | null; // Puede ser string, null o undefined
    estado: EstadoEnum;
}

const RolesFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();

    const isEditing = !!id;
    const rolId = id ? parseInt(id, 10) : null;

    // Estado del formulario, usando la interfaz IRoleFormState
    const [roleFormData, setRoleFormData] = useState<IRoleFormState>({
        nombre_rol: '',
        descripcion: undefined, // Inicializar como undefined para campos opcionales
        estado: EstadoEnum.Activo, // Default para creación
    });

    // Estados de carga y error
    const [loading, setLoading] = useState(false); // Para carga inicial (edición) y envío del formulario
    const [error, setError] = useState<string | null>(null); // Error al cargar datos iniciales (edición)
    const [formSubmitError, setFormSubmitError] = useState<string | null>(null); // Error específico del envío del formulario

    // Efecto para Cargar Datos de Rol Existente al Editar
    useEffect(() => {
        if (isEditing && rolId) {
            setLoading(true);
            setError(null);
            getRoleById(rolId)
                .then((data: IRolInDB) => { // Especificar el tipo de 'data' como IRolInDB
                    setRoleFormData({
                       nombre_rol: data.nombre_rol,
                       descripcion: data.descripcion,
                       estado: data.estado,
                    });
                    setLoading(false);
                })
                .catch((err: any) => {
                    console.error("Error loading role for edit:", err);
                    setError("No se pudo cargar el rol para editar.");
                    setLoading(false);
                });
        } else {
            setLoading(false); // No hay carga inicial si es modo creación
        }
    }, [isEditing, rolId]);

    // Manejar cambios en los inputs del formulario
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        let processedValue: string | undefined | EstadoEnum = value;
        // Si el campo es 'descripcion' y el valor es una cadena vacía, lo convertimos a undefined
        if (name === 'descripcion' && value === '') {
            processedValue = undefined;
        }
        // Para el campo 'estado', el valor ya viene como string del select y coincide con EstadoEnum

        setRoleFormData(prev => ({
            ...prev,
            [name]: processedValue,
        }));
    };

    // Manejar Envío del Formulario (Crear o Actualizar)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormSubmitError(null);

        try {
            if (isEditing && rolId) {
                // Lógica de Actualización de Rol (PATCH/PUT /roles/{id})
                const dataToSend: IRolUpdate = {
                    nombre_rol: roleFormData.nombre_rol,
                    // Si descripcion es undefined o null, se envía como tal. Si es '', se envía ''.
                    descripcion: roleFormData.descripcion === null ? undefined : roleFormData.descripcion,
                    estado: roleFormData.estado,
                };

                 // Validaciones básicas frontend para actualización
                 if (!dataToSend.nombre_rol || dataToSend.nombre_rol.trim() === '') {
                     setFormSubmitError("El nombre del rol es requerido.");
                     setLoading(false);
                     return;
                 }

                console.log("Sending update payload:", dataToSend);
                await updateRole(rolId, dataToSend); // Llama al servicio de actualización
                alert("Rol actualizado con éxito!");
                navigate('/roles');

            } else {
                // Lógica de Creación de Rol (POST /roles/)
                const dataToSend: IRolCreate = {
                    nombre_rol: roleFormData.nombre_rol,
                    descripcion: roleFormData.descripcion ?? '', // siempre string
                };

                 // Validaciones básicas frontend para creación
                 if (!dataToSend.nombre_rol || dataToSend.nombre_rol.trim() === '') {
                     setFormSubmitError("El nombre del rol es requerido.");
                     setLoading(false);
                     return;
                 }

                console.log("Sending create payload:", dataToSend);
                await createRole(dataToSend); // Llama al servicio de creación
                alert("Rol creado con éxito!");
                navigate('/roles');
            }

        } catch (err: any) {
            // Manejo de errores (similar a otros formularios)
            console.error("Error submitting role form:", err.response?.data || err);

            let errorMessage = "Ocurrió un error al guardar el rol.";

            if (err.response && err.response.data) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    try {
                        errorMessage = err.response.data.detail
                            .map((errorDetail: any) => {
                                const loc = Array.isArray(errorDetail.loc) ? errorDetail.loc.join(' -> ') : 'Desconocido';
                                const msg = errorDetail.msg;
                                return `${loc}: ${msg}`;
                            })
                            .join('; ');
                    } catch (parseError) {
                        console.error("Failed to parse 422 error detail:", parseError);
                        errorMessage = "Error de validación desconocido.";
                    }
                } else {
                     if (err.response.data.detail) {
                         errorMessage = `Error del servidor: ${JSON.stringify(err.response.data.detail)}`;
                     } else {
                          errorMessage = `Error del servidor con formato inesperado: ${JSON.stringify(err.response.data)}`;
                     }
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            setFormSubmitError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- Renderizado Condicional (Carga Inicial, Error) ---

    // Mostrar spinner si está cargando datos iniciales del rol (solo en edición)
    if (isEditing && loading) {
         return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner /> Cargando datos del rol...
            </div>
         );
    }

    // Mostrar error si falló la carga inicial (solo en edición)
    if (error) {
        return <div className="text-red-500 text-center mt-4">Error al cargar el rol: {error}</div>;
    }

    // --- JSX del Formulario Principal ---
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">{isEditing ? 'Editar Rol' : 'Crear Nuevo Rol'}</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Campo Nombre del Rol */}
                <div>
                    <label htmlFor="nombre_rol" className="block text-sm font-medium text-gray-700">Nombre del Rol</label>
                    <Input
                        id="nombre_rol"
                        name="nombre_rol"
                        type="text"
                        required
                        value={roleFormData.nombre_rol || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                 </div>

                {/* Campo Descripción (Área de texto) */}
                 <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
                     <textarea
                        id="descripcion"
                        name="descripcion"
                        rows={3}
                        value={roleFormData.descripcion || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                     ></textarea>
                 </div>

                 {/* Campo Estado (solo en edición, o si se permite cambiar en creación) */}
                 {/* Si tu backend NO permite establecer el estado en la creación, este campo debería ser solo para isEditing */}
                 <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                    <Select // Usar el componente Select para consistencia
                        id="estado"
                        name="estado"
                        value={roleFormData.estado}
                        onChange={handleInputChange}
                        options={[
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                        ]}
                    />
                 </div>

                {/* --- Botones de Acción y Mensajes de Error --- */}
                {formSubmitError && (
                    <div className="md:col-span-2 text-red-500 text-center mb-4">{formSubmitError}</div>
                )}

                <div className="md:col-span-2 flex justify-end space-x-4">
                    <Link to="/roles">
                        <Button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded shadow">
                            Cancelar
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <LoadingSpinner /> : (isEditing ? 'Actualizar Rol' : 'Crear Rol')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default RolesFormPage;