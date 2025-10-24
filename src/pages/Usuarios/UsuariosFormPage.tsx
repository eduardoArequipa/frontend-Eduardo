// src/pages/Usuarios/UsuariosFormPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
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

// --- Esquema de Validación con Zod ---
const usuarioSchema = z.object({
  nombre_usuario: z.string()
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres.')
    .regex(/^\S+$/, 'El nombre de usuario no puede contener espacios.')
    .refine(val => !val || !val.includes(' '), "el nombre  no debe contener espacios internos"),

  contraseña: z.string().regex(/^\S+$/, 'Formato inválido de contraseña.')
,

  estado: z.nativeEnum(EstadoEnum),

  persona_id: z.number().optional(),
})
.superRefine(({ contraseña }, ctx) => {
  // Si se proporciona contraseña, validar que cumpla con los requisitos
  if (contraseña && contraseña.trim().length > 0) {
    if (contraseña.trim().length < 8) {
      ctx.addIssue({
        path: ['contraseña'],
        code: z.ZodIssueCode.custom,
        message: 'La contraseña debe tener al menos 8 caracteres.'
      });
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(contraseña)) {
      ctx.addIssue({
        path: ['contraseña'],
        code: z.ZodIssueCode.custom,
        message: 'La contraseña debe contener al menos un carácter especial.'
      });
    }    if (contraseña.includes(' ') ) {
      ctx.addIssue({
        path: ['contraseña'],
        code: z.ZodIssueCode.custom,
        message: 'La contraseña no debe tener espacios.'
      });
    }
  }
});

// Esquema específico para creación (contraseña requerida)
const usuarioCreateSchema = usuarioSchema.superRefine(({ contraseña, persona_id }, ctx) => {
  if (!persona_id) {
    ctx.addIssue({
      path: ['persona_id'],
      code: z.ZodIssueCode.custom,
      message: 'Debe seleccionar una persona asociada.'
    });
  }
  if (!contraseña || contraseña.trim().length === 0) {
    ctx.addIssue({
      path: ['contraseña'],
      code: z.ZodIssueCode.custom,
      message: 'La contraseña es requerida.'
    });
  } else if (contraseña.trim().length < 8) {
    ctx.addIssue({
      path: ['contraseña'],
      code: z.ZodIssueCode.custom,
      message: 'La contraseña debe tener al menos 8 caracteres.'
    });
  } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(contraseña)) {
    ctx.addIssue({
      path: ['contraseña'],
      code: z.ZodIssueCode.custom,
      message: 'La contraseña debe contener al menos un carácter especial.'
    });
  }
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

const UsuariosFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;
    const usuarioId = id ? parseInt(id, 10) : null;

    const { register, handleSubmit, control, formState: { errors, isValid }, setValue } = useForm<UsuarioFormData>({
      resolver: zodResolver(isEditing ? usuarioSchema : usuarioCreateSchema),
      mode: 'onChange',
      defaultValues: {
        nombre_usuario: '',
        contraseña: '',
        estado: EstadoEnum.Activo,
        persona_id: undefined,
      }
    });

    const [availablePersonas, setAvailablePersonas] = useState<IPersonaNested[]>([]);
    const [loadingPersonas, setLoadingPersonas] = useState(true);
    const [personasLoaded, setPersonasLoaded] = useState(false);

    const activeAvailablePersonas = useMemo(() => {
        return availablePersonas.filter(persona => persona.estado === EstadoEnum.Activo);
    }, [availablePersonas]);

    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | undefined>(undefined);
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formSubmitError, setFormSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing && usuarioId) {
            setLoading(true);
            getUserById(usuarioId)
                .then(data => {
                    setValue('nombre_usuario', data.nombre_usuario);
                    setValue('estado', data.estado);
                    if (data.foto_ruta) {
                        setExistingPhotoUrl(`${BACKEND_BASE_URL}${data.foto_ruta}`);
                    }
                    setLoading(false);
                })
                .catch(_err => {
                    setError("No se pudo cargar el usuario para editar.");
                    setLoading(false);
                });
        }
    }, [isEditing, usuarioId, setValue]);

    useEffect(() => {
        if (!isEditing) {
            setLoadingPersonas(true);
            getPersonasWithoutUser()
                .then(data => {
                    setAvailablePersonas(data);
                    setPersonasLoaded(true);
                })
                .catch(_err => {
                    setError("Error al cargar la lista de personas disponibles.");
                })
                .finally(() => setLoadingPersonas(false));
        }
    }, [isEditing]);

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
         if (e.target.files && e.target.files[0]) {
             setSelectedPhoto(e.target.files[0]);
         }
     };

    const onSubmit = async (data: UsuarioFormData) => {
        setLoading(true);
        setFormSubmitError(null);

        try {
            let photoPath: string | undefined = undefined;
            if (selectedPhoto) {
                photoPath = await uploadImage(selectedPhoto);
            }

            if (isEditing && usuarioId) {
                const dataToSend: IUsuarioUpdate = {
                    nombre_usuario: data.nombre_usuario,
                    estado: data.estado,
                    foto_ruta: photoPath ?? undefined,
                    contraseña: data.contraseña || undefined,
                };
                await updateUser(usuarioId, dataToSend);
                alert("Usuario actualizado con éxito!");
            } else {
                const dataToSend: IUsuarioCreate = {
                    persona_id: data.persona_id!,
                    nombre_usuario: data.nombre_usuario,
                    contraseña: data.contraseña!,
                    estado: data.estado,
                    foto_ruta: photoPath ?? undefined,
                };
                await createUser(dataToSend);
                alert("Usuario creado con éxito!");
            }
            navigate('/usuarios');
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || "Ocurrió un error al guardar el usuario.";
            setFormSubmitError(Array.isArray(errorMsg) 
              ? errorMsg.map((e: any) => `${e.loc?.[e.loc.length - 1]}: ${e.msg}`).join('; ')
              : errorMsg
            );
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

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="md:col-span-2 text-lg font-semibold border-b pb-2 mb-4 text-gray-800 dark:text-gray-200">Datos de Usuario</div>

                 <div>
                    <Input 
                      id="nombre_usuario" 
                      label="Nombre de Usuario" 
                      {...register('nombre_usuario')} 
                      error={errors.nombre_usuario?.message} 
                      placeholder="Nombre de Usuario" 
                    />
                 </div>

                 <div>
                    <label htmlFor="contraseña" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {isEditing ? 'Cambiar Contraseña (Opcional)' : 'Contraseña'}
                    </label>
                    <div className="relative">
                      <Input 
                        id="contraseña" 
                        type={showPassword ? 'text' : 'password'} 
                        {...register('contraseña')} 
                        error={errors.contraseña?.message} 
                        placeholder={isEditing ? "Dejar vacío para no cambiar" : ""} 
                        autoComplete="new-password" 
                      />
                      <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                 </div>

                 <div>
                    <Controller 
                      name="estado" 
                      control={control} 
                      render={({ field }) => (
                        <Select 
                          id="estado" 
                          label="Estado"
                          {...field}
                          value={field.value}
                        >
                          <option value={EstadoEnum.Activo}>Activo</option>
                          <option value={EstadoEnum.Inactivo}>Inactivo</option>
                          <option value={EstadoEnum.Bloqueado}>Bloqueado</option>
                        </Select>
                      )} 
                    />
                 </div>

                 <div>
                     <label htmlFor="user_photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto Usuario</label>
                     <Input 
                       id="user_photo" 
                       type="file" 
                       accept="image/*" 
                       onChange={handlePhotoSelect} 
                       className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800" 
                     />
                      {selectedPhoto && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Archivo seleccionado: {selectedPhoto.name}</p>}
                       {isEditing && existingPhotoUrl && !selectedPhoto && (
                           <div>
                               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Foto Actual:</label>
                               <UserAvatar src={existingPhotoUrl} alt="Foto actual" className="mt-1 h-20 w-20 rounded-full object-cover" />
                           </div>
                       )}
                       
                 </div>

                 {!isEditing && (
                     <div>
                         <Controller 
                           name="persona_id" 
                           control={control} 
                           render={({ field }) => (
                             <>
                               <Select 
                                 id="persona_id" 
                                 label="Persona Asociada"
                                 {...field}
                                 value={field.value || ''}
                                 onChange={(e) => field.onChange(e.target.value !== '' ? Number(e.target.value) : undefined)}
                               >
                                 <option value="">Seleccionar Persona...</option>
                                 {activeAvailablePersonas.map(persona => (
                                   <option key={persona.persona_id} value={persona.persona_id}>
                                     {`${persona.nombre} ${persona.apellido_paterno || ''}`.trim()}
                                   </option>
                                 ))}
                               </Select>
                               {errors.persona_id?.message && (
                                 <div className="mt-1">
                                   <ErrorMessage message={errors.persona_id.message} />
                                 </div>
                               )}
                             </>
                           )} 
                         />
                      </div>
                 )}

                {formSubmitError && <div className="md:col-span-2"><ErrorMessage message={formSubmitError} /></div>}
                
                <div className="md:col-span-2 flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={() => navigate('/usuarios')}>Cancelar</Button>
                    <Button type="submit" disabled={loading || !isValid} variant="primary">
                        {loading ? <LoadingSpinner /> : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')}
                    </Button>
                    
                </div>
                
            </form>

        </div>
    );
};

export default UsuariosFormPage;