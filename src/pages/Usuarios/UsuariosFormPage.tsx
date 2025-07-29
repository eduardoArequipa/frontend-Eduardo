// src/pages/Usuarios/UsuariosFormPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserById, createUser, updateUser } from '../../services/userService';
import { getPersonasWithoutUser } from '../../services/personaService';
import { getRoles } from '../../services/rolService'; // Todavía importamos roles si los usamos en la vista de roles del usuario, pero no para este form
import { uploadImage } from '../../services/uploadService';

// Importa los tipos necesarios
import { IUsuarioCreate, IUsuarioUpdate } from '../../types/usuario'; // Ya no IUsuarioInDB para cargar, solo para tipos de envío
import { IPersonaNested } from '../../types/persona';
import { EstadoEnum } from '../../types/enums';

// Importa componentes comunes
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import UserAvatar from '../../components/Specific/UserAvatar';
import Select from '../../components/Common/Select';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const UsuariosFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();

    const isEditing = !!id;
    const usuarioId = id ? parseInt(id, 10) : null;

    // *** Estado para el formulario de Usuario ***
    // 'rol_ids' y 'roles' han sido eliminados de aquí.
    const [usuarioFormData, setUsuarioFormData] = useState<Partial<IUsuarioCreate & IUsuarioUpdate>>({
        nombre_usuario: '',
        contraseña: '',
        estado: EstadoEnum.Activo,
        foto_ruta: undefined,
        persona_id: undefined,
        // rol_ids ya no va aquí, ya que no se envían en la creación/actualización del usuario
    });

    // *** Estado para la lista de Personas disponibles SIN Usuario asociado (activas e inactivas) ***
    const [availablePersonas, setAvailablePersonas] = useState<IPersonaNested[]>([]);
    const [loadingPersonas, setLoadingPersonas] = useState(true);
    const [personasLoaded, setPersonasLoaded] = useState(false);

    // *** useMemo para obtener la lista de Personas ACTIVAS disponibles (derivada) ***
    const activeAvailablePersonas = useMemo(() => {
        return availablePersonas.filter(persona => persona.estado === EstadoEnum.Activo);
    }, [availablePersonas]);

    // *** Estado para el archivo de foto seleccionado por el usuario ***
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    // *** Estado para la URL de la foto existente (solo en edición) ***
    const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | undefined>(undefined);

    // Estados de carga general y error de carga inicial/envío
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formSubmitError, setFormSubmitError] = useState<string | null>(null);

    // *** Efecto para Cargar Datos de Usuario Existente al Editar ***
    useEffect(() => {
        if (isEditing && usuarioId) {
            setLoading(true);
            setError(null);
            getUserById(usuarioId)
                .then(data => {
                    // Solo cargamos los campos que este formulario gestiona
                    setUsuarioFormData({
                       nombre_usuario: data.nombre_usuario,
                       estado: data.estado,
                       foto_ruta: data.foto_ruta,
                       contraseña: '', // La contraseña siempre se deja vacía al cargar un usuario existente
                       // NOTA: 'data.roles' ya no se usa aquí porque este formulario no los gestiona
                    });
                     if (data.foto_ruta) {
                         setExistingPhotoUrl(`${BACKEND_BASE_URL}${data.foto_ruta}`);
                     } else {
                          setExistingPhotoUrl(undefined);
                     }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error al cargar el usuario para editar:", err);
                    setError("No se pudo cargar el usuario para editar.");
                    setLoading(false);
                });
        } else {
             setLoading(false);
        }
    }, [isEditing, usuarioId]);

    // *** Efecto para Cargar la Lista de Personas SIN Usuario Asociado (solo en Creación) ***
    useEffect(() => {
        if (!isEditing) {
            setLoadingPersonas(true);
            getPersonasWithoutUser()
                .then(data => {
                    setAvailablePersonas(data);
                    setLoadingPersonas(false);
                    setPersonasLoaded(true);
                })
                .catch(err => {
                    console.error("Error al obtener personas sin usuario:", err);
                    setLoadingPersonas(false);
                    setPersonasLoaded(true);
                    setError("Error al cargar la lista de personas disponibles.");
                });
        } else {
            setAvailablePersonas([]);
            setLoadingPersonas(false);
            setPersonasLoaded(true);
        }
    }, [isEditing]);

    // *** Efecto para Cargar la Lista de Roles (Si todavía la necesitas para otras cosas, ej. validación, si no, puedes eliminarla) ***
    // Si la lista de roles solo se usaba para el selector de roles que hemos quitado, este useEffect puede eliminarse.
    // Lo dejo por ahora en caso de que lo uses para otra validación o para la `UserRolesPage`.
    const [loadingRoles, setLoadingRoles] = useState(true); // Se mantiene el estado
    useEffect(() => {
        // Solo carga roles si es absolutamente necesario para este formulario.
        // Si no se usa el select de roles aquí, puedes eliminar toda esta sección.
        // Aquí no estamos usando los roles directamente, así que esta carga podría ser redundante.
        // Para UserRolesPage sí se necesitan.
        getRoles()
            .then(() => setLoadingRoles(false)) // No necesitamos 'data' aquí ya que no la usamos
            .catch(err => {
                console.error("Error fetching roles:", err);
                setLoadingRoles(false);
                // setError("Error al cargar la lista de roles."); // Ya hay un error general
            });
    }, []);

    // *** Manejar cambios en los inputs del formulario ***
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setUsuarioFormData(prev => ({
            ...prev,
            [name]: name === 'persona_id' && value !== '' ? parseInt(value, 10) : value === '' ? undefined : value,
        }));
    };

    // *** handleRoleSelectChange fue eliminado, ya que los roles no se gestionan aquí. ***

    // *** Manejar selección de archivo de foto ***
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
         if (e.target.files && e.target.files[0]) {
             setSelectedPhoto(e.target.files[0]);
         } else {
             setSelectedPhoto(null);
         }
     };

    // *** Manejar Envío del Formulario ***
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormSubmitError(null);

        let photoPath: string | undefined | null = undefined;

        try {
            if (selectedPhoto) {
                console.log("Subiendo foto...");
                photoPath = await uploadImage(selectedPhoto);
                console.log("Foto subida con éxito. Ruta:", photoPath);
            }

            if (isEditing && usuarioId) {
                // --- Lógica de Actualización de Usuario (PATCH/PUT /usuarios/{id}) ---
                const dataToSend: IUsuarioUpdate = {
                    nombre_usuario: usuarioFormData.nombre_usuario,
                    estado: usuarioFormData.estado,
                    foto_ruta: selectedPhoto ? photoPath : undefined,
                    contraseña: (usuarioFormData.contraseña !== undefined && usuarioFormData.contraseña !== '') ? usuarioFormData.contraseña : undefined,
                    // 'rol_ids' fue eliminado de aquí, ya que el schema UsuarioUpdate no lo incluye.
                };

                 if (dataToSend.nombre_usuario === '') {
                      setFormSubmitError("El nombre de usuario no puede estar vacío.");
                      setLoading(false);
                      return;
                 }

                console.log("Enviando payload de actualización:", dataToSend);
                await updateUser(usuarioId, dataToSend);
                alert("Usuario actualizado con éxito!");
                navigate('/usuarios');

            } else {
                // --- Lógica de Creación de Usuario (POST /usuarios/) ---
                 // Validar campos requeridos para CREACIÓN
                 if (usuarioFormData.persona_id === undefined) {
                     setFormSubmitError("Debe seleccionar una Persona para asociar.");
                     setLoading(false);
                     return;
                 }
                 if (!usuarioFormData.nombre_usuario) {
                      setFormSubmitError("El nombre de usuario es requerido.");
                     setLoading(false);
                     return;
                 }
                 if (!usuarioFormData.contraseña) {
                      setFormSubmitError("La contraseña es requerida.");
                     setLoading(false);
                     return;
                 }

                const dataToSend: IUsuarioCreate = {
                    persona_id: usuarioFormData.persona_id,
                    nombre_usuario: usuarioFormData.nombre_usuario,
                    contraseña: usuarioFormData.contraseña,
                    estado: usuarioFormData.estado || EstadoEnum.Activo,
                    foto_ruta: photoPath,
                    // 'rol_ids' fue eliminado de aquí, ya que el schema UsuarioCreate no lo incluye.
                };

                console.log("Enviando payload de creación:", dataToSend);
                await createUser(dataToSend);
                alert("Usuario creado con éxito!");
                navigate('/usuarios');
            }

        } catch (err: any) {
            console.error("Error al enviar el formulario de usuario:", err.response?.data || err);
            let errorMessage = "Ocurrió un error al guardar el usuario.";
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
                        console.error("Fallo al parsear el error 422:", parseError);
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

    // --- Renderizado Condicional ---
    if (isEditing && loading) {
         return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner /> Cargando datos del usuario...
            </div>
         );
    }

    if (error && (!loading || !loadingPersonas || !loadingRoles)) {
        return <div className="text-red-500 text-center mt-4">Error al cargar datos: {error}</div>;
    }

    // *** Lógica Específica para el Modo CREACIÓN (!isEditing) ***
    if (!isEditing) {
        if (loadingPersonas || loadingRoles) { // loadingRoles se mantiene por si el useEffect de roles no se elimina
            return (
                <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                    <LoadingSpinner /> Cargando lista de Personas y Roles disponibles...
                </div>
            );
        }

        // Redirección si no hay personas activas sin Usuario asociado
        if (personasLoaded && activeAvailablePersonas.length === 0) {
            alert("No hay Personas activas sin Usuario asociado. Debes crear una Persona primero.");
            navigate('/personas/new', { replace: true });
            return null;
        }
    }

    // --- JSX del Formulario Principal ---
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* --- Sección: Datos de Usuario --- */}
                <div className="md:col-span-2 text-lg font-semibold border-b pb-2 mb-4">Datos de Usuario</div>

                 {/* Campo Nombre de Usuario */}
                 <div>
                    <label htmlFor="nombre_usuario" className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
                    <Input
                        id="nombre_usuario"
                        name="nombre_usuario"
                        type="text"
                        required
                        value={usuarioFormData.nombre_usuario || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                 </div>

                {/* Campo Contraseña (solo se muestra y es requerido en creación, opcional en edición) */}
                 {!isEditing ? (
                      <div>
                          <label htmlFor="contraseña" className="block text-sm font-medium text-gray-700">Contraseña</label>
                           <Input
                              id="contraseña"
                              name="contraseña"
                              type="password"
                              required
                              value={usuarioFormData.contraseña || ''}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                           />
                       </div>
                 ) : (
                       <div>
                           <label htmlFor="contraseña" className="block text-sm font-medium text-gray-700">Cambiar Contraseña (Opcional)</label>
                            <Input
                               id="contraseña"
                               name="contraseña"
                               type="password"
                               value={usuarioFormData.contraseña || ''}
                               onChange={handleInputChange}
                               placeholder="Dejar vacío para no cambiar"
                               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                       </div>
                 )}

                 {/* Campo Estado */}
                 <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                    <Select
                        id="estado"
                        name="estado"
                        value={usuarioFormData.estado}
                        onChange={handleInputChange}
                        options={[
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                            { value: EstadoEnum.Bloqueado, label: 'Bloqueado' },
                        ]}
                    />
                 </div>

                 {/* Campo para Subir Foto */}
                 <div>
                     <label htmlFor="user_photo" className="block text-sm font-medium text-gray-700">Foto Usuario</label>
                     <Input
                         id="user_photo"
                         name="user_photo"
                         type="file"
                         accept="image/*"
                         onChange={handlePhotoSelect}
                         className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                     />
                      {selectedPhoto && (
                          <p className="mt-1 text-sm text-gray-500">Archivo seleccionado: {selectedPhoto.name}</p>
                      )}
                       {isEditing && existingPhotoUrl && !selectedPhoto && (
                           <div>
                               <label className="block text-sm font-medium text-gray-700 mt-2">Foto Actual:</label>
                               <UserAvatar src={existingPhotoUrl} alt="Foto actual" className="mt-1 h-20 w-20 rounded-full object-cover" />
                           </div>
                       )}
                 </div>

                 {/* Campo para seleccionar Persona (solo en Creación) */}
                 {!isEditing && (
                     <div>
                         <label htmlFor="persona_id" className="block text-sm font-medium text-gray-700">Persona Asociada</label>
                         <Select
                             id="persona_id"
                             name="persona_id"
                             value={usuarioFormData.persona_id || ''}
                             onChange={handleInputChange}
                             required
                             options={[
                                 { value: '', label: 'Seleccionar Persona...' },
                                 ...activeAvailablePersonas.map(persona => ({
                                     value: persona.persona_id,
                                     label: `${persona.nombre} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim(),
                                 })),
                             ]}
                         />
                      </div>
                 )}

                 {/* Campo para seleccionar Roles (ELIMINADO) */}
                 {/* Esta sección ya no se necesita aquí porque los roles del usuario no se gestionan desde este formulario */}
                 {/* Si necesitas gestionar los roles del usuario, deberías hacerlo en una vista separada como UserRolesPage */}

                {/* --- Botones de Acción y Mensajes de Error --- */}
                {formSubmitError && (
                    <div className="md:col-span-2 text-red-500 text-center mb-4">{formSubmitError}</div>
                )}
                <div className="md:col-span-2 flex justify-end space-x-4">
                    <Link to="/usuarios">
                        <Button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded shadow">
                            Cancelar
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={loading || (!isEditing && (loadingPersonas || loadingRoles))} // loadingRoles ya no es tan crítico aquí
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <LoadingSpinner /> : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UsuariosFormPage;