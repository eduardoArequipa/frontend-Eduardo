// src/components/Common/PersonaForm.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getPersonaById, createPersona, updatePersona, getPersonas, GetPersonasParams } from '../../services/personaService';
import { getRoles } from '../../services/rolService';
import { uploadImage } from '../../services/uploadService';
import { useNotification } from '../../context/NotificationContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// Tipos
import { IPersonaInDB, IPersonaCreate, IPersonaUpdate, IPersonaWithRoles } from '../../types/persona';
import { IRolInDB } from '../../types/rol';
import { EstadoEnum, GeneroEnum } from '../../types/enums';

// Componentes
import Input from './Input';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Select from './Select';

// --- Esquema de Validación con Zod ---
const personaSchema = z.object({
  nombre: z.string()
    .superRefine((val: string, ctx: z.RefinementCtx) => {
      if (val.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.too_small, minimum: 1, type: 'string', inclusive: true, message: 'El nombre es requerido.' });
        return;
      }
      if (val.trim().length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El nombre no puede contener solo espacios.' });
        return;
      }
      if (val.trim().length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.too_small, minimum: 3, type: 'string', inclusive: true, message: 'El nombre debe tener al menos 3 caracteres.' });
        return;
      }
    })
    .transform(val => val.trim()),

  apellido_paterno: z.string().optional()
    .transform((val: string | undefined) => val ? val.trim() : '')
    .refine((val: string) => val.length === 0 || val.length >= 3, { message: "Si se ingresa, el apellido paterno debe tener al menos 3 caracteres." })
    .transform((val: string) => val === '' ? undefined : val),

  apellido_materno: z.string().optional()
    .transform((val: string | undefined) => val ? val.trim() : '')
    .refine((val: string) => val.length === 0 || val.length >= 3, { message: "Si se ingresa, el apellido materno debe tener al menos 3 caracteres." })
    .transform((val: string) => val === '' ? undefined : val),

  ci: z.string({ required_error: "El CI es requerido." })
    .min(7, "El CI es requerido. minimo 7 caracteres.").max(20, "El CI no debe exceder los 20 caracteres.")
    .regex(/^\S+$/, 'El CI no debe contener espacios.')
    .transform((val: string) => val.trim()),

  email: z.string()
    .superRefine((val: string, ctx: z.RefinementCtx) => {
      if (val.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El email es requerido.' });
        return;
      }
      if (/\s/.test(val)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El email no puede contener espacios.' });
        return;
      }
      if (!val.includes('@')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El email debe contener un @.' });
        return;
      }
      try {
        z.string().email('El formato del email no es válido.').parse(val);
      } catch (err) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El formato del email no es válido.' });
      }
    })
    .transform((val: string) => val.trim()),

  telefono: z.string({ required_error: "El teléfono es requerido." })
    .min(1, "El teléfono es requerido.")
    .regex(/^\+?[0-9]+$/, 'Formato inválido. Use +59172973548.')
    .transform((val: string) => val.trim()),

  direccion: z.string().optional()
    .transform((val: string | undefined) => val ? val.trim() : '')
    .refine((val: string) => val.length === 0 || val.length >= 5, { message: "Si se ingresa, la dirección debe tener al menos 5 caracteres." })
    .transform((val: string) => val === '' ? undefined : val),

  genero: z.nativeEnum(GeneroEnum).optional().nullable(),
  estado: z.nativeEnum(EstadoEnum),
  rol_ids: z.array(z.number()).optional(),

  // Campos para el usuario asociado
  crear_usuario_asociado: z.boolean().optional(),
  nombre_usuario: z.string().trim().optional(),
  contraseña: z.string().trim().optional(),
})
.superRefine(({ crear_usuario_asociado, nombre_usuario, contraseña }, ctx) => {
  if (crear_usuario_asociado) {
    // Validar nombre_usuario
    if (!nombre_usuario || nombre_usuario.trim().length === 0) {
      ctx.addIssue({ 
        path: ['nombre_usuario'], 
        code: z.ZodIssueCode.custom, 
        message: 'El nombre de usuario es requerido.' 
      });
    } else if (nombre_usuario.trim().length < 5) {
      ctx.addIssue({ 
        path: ['nombre_usuario'], 
        code: z.ZodIssueCode.custom, 
        message: 'El nombre de usuario debe tener al menos 5 caracteres.' 
      });
    } else if (/\s/.test(nombre_usuario)) {
      ctx.addIssue({ 
        path: ['nombre_usuario'], 
        code: z.ZodIssueCode.custom, 
        message: 'El nombre de usuario no puede contener espacios.' 
      });
    }

    // Validar contraseña
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
    else if (/\s/.test(contraseña)) {
        ctx.addIssue({ 
          path: ['contraseña'], 
          code: z.ZodIssueCode.custom,
           message: 'La contraseña no puede contener espacios.' });
        return;
      }
  }
});

type PersonaFormData = z.infer<typeof personaSchema>;

// --- PROPS DEL COMPONENTE ---
interface PersonaFormProps {
  personaId?: number;
  mode: 'full' | 'assign-role';
  roleToAssign?: string;
  showTitle?: boolean;
  showCancelButton?: boolean;
  onSuccess: (persona: IPersonaInDB) => void;
  onCancel?: () => void;
}

// --- LÓGICA DE DEBOUNCE ---
const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function(this: any, ...args: Parameters<F>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    } as F;
};

// --- COMPONENTE PRINCIPAL ---
const PersonaForm: React.FC<PersonaFormProps> = ({
  personaId,
  mode,
  roleToAssign,
  showTitle = true,
  showCancelButton = true,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!personaId;
  const { addNotification } = useNotification();

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isValid } } = useForm<PersonaFormData>({
    resolver: zodResolver(personaSchema),
    mode: 'onChange', // Validar en tiempo real
    defaultValues: {
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      ci: '',
      genero: undefined,
      email: '',
      telefono: '',
      direccion: '',
      estado: EstadoEnum.Activo,
      rol_ids: [],
      crear_usuario_asociado: false,
      nombre_usuario: '',
      contraseña: '',
    }
  });

  // Observar cambios en los campos de usuario
  const showUserDataFields = watch('crear_usuario_asociado');

  // --- ESTADOS GENERALES ---
  const [loading, setLoading] = useState(false);
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

  // --- ESTADOS PARA MODO "full" ---
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [availableRoles, setAvailableRoles] = useState<IRolInDB[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // --- ESTADOS PARA MODO "assign-role" ---
  const [useExistingPerson, setUseExistingPerson] = useState<boolean>(true);
  const [searchPersonaTerm, setSearchPersonaTerm] = useState<string>('');
  const [foundPersonas, setFoundPersonas] = useState<IPersonaWithRoles[]>([]);
  const [searchingPersonas, setSearchingPersonas] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | ''>('');
  const [roleToAssignId, setRoleToAssignId] = useState<number | null>(null);

  useEffect(() => {
    const loadPersonaData = async () => {
      if (isEditing && personaId) {
        setLoading(true);
        try {
          const data = await getPersonaById(personaId);
          setValue('nombre', data.nombre || '');
          setValue('apellido_paterno', data.apellido_paterno || '');
          setValue('apellido_materno', data.apellido_materno || '');
          setValue('ci', data.ci || '');
          setValue('genero', data.genero || undefined);
          setValue('email', data.email || '');
          setValue('telefono', data.telefono || '');
          setValue('direccion', data.direccion || '');
          setValue('estado', data.estado || EstadoEnum.Activo);
          setValue('rol_ids', data.roles.map(r => r.rol_id));
        } catch (err) {
          setInitialLoadError("No se pudo cargar la persona para editar.");
        } finally {
          setLoading(false);
        }
      }
    };

    const loadAvailableRoles = async () => {
      if (mode === 'full') {
        setLoadingRoles(true);
        try {
          const rolesData = await getRoles();
          setAvailableRoles(rolesData);
        } catch (err) {
          setInitialLoadError(prev => prev ? prev + "; Error al cargar roles." : "Error al cargar roles.");
        } finally {
          setLoadingRoles(false);
        }
      }
    };

    loadPersonaData();
    loadAvailableRoles();
  }, [isEditing, personaId, mode, setValue]);

  useEffect(() => {
    if (mode === 'assign-role' && roleToAssign) {
      const fetchRoles = async () => {
        try {
          const roles = await getRoles();
          const role = roles.find((r: IRolInDB) => r.nombre_rol.toLowerCase() === roleToAssign.toLowerCase());
          if (role) {
            setRoleToAssignId(role.rol_id);
          } else {
            setInitialLoadError(`El rol '${roleToAssign}' no fue encontrado.`);
          }
        } catch (err) {
          setInitialLoadError("Error al cargar la información de roles.");
        }
      };
      fetchRoles();
    }
  }, [mode, roleToAssign]);

  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.length < 2) {
        setFoundPersonas([]);
        return;
      }
      setSearchingPersonas(true);
      try {
        const params: GetPersonasParams = {
            search: term,
            limit: 10,
            exclude_rol_nombre: roleToAssign || undefined
        };
        const personas = await getPersonas(params);
        setFoundPersonas(personas.items);
      } catch (err) {
        setFormSubmitError("Error al buscar personas.");
      } finally {
        setSearchingPersonas(false);
      }
    }, 300),
    [roleToAssign]
  );

  useEffect(() => {
    if (mode === 'assign-role' && searchPersonaTerm) {
      debouncedSearch(searchPersonaTerm);
    }
  }, [searchPersonaTerm, mode, debouncedSearch]);

  const handlePersonaSelectAndAssign = async (personaId: number) => {
    if (!roleToAssignId) {
        setFormSubmitError("El rol a asignar no está configurado correctamente.");
        return;
    }

    setLoading(true);
    setFormSubmitError(null);
    try {
        const personaToUpdate = await getPersonaById(personaId);
        const updatedRoles = [...new Set([...personaToUpdate.roles.map(r => r.rol_id), roleToAssignId])];
        const finalPersona = await updatePersona(personaId, { rol_ids: updatedRoles });
        addNotification('Rol asignado correctamente', 'success');
        onSuccess(finalPersona);
    } catch (err: any) {
        const errorMsg = err.response?.data?.detail || "Ocurrió un error al asignar el rol.";
        setFormSubmitError(errorMsg);
        addNotification(errorMsg, 'error');
    } finally {
        setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedPhoto(e.target.files[0]);
    }
  };

  const onSubmit = async (data: PersonaFormData) => {
    setLoading(true);
    setFormSubmitError(null);

    if (mode === 'assign-role') {
      if (!roleToAssignId) {
        setFormSubmitError("El rol a asignar no está configurado correctamente.");
        setLoading(false);
        return;
      }
      try {
        const createPayload: IPersonaCreate = {
          ...data,
          rol_ids: [roleToAssignId],
        };
        const finalPersona = await createPersona(createPayload);
        addNotification(`'${roleToAssign}' asignado a la nueva persona.`, 'success');
        onSuccess(finalPersona);
      } catch (err: any) {
        let errorMessage = "Ocurrió un error al crear y asignar rol.";
        if (err.response?.data?.detail) {
          if (Array.isArray(err.response.data.detail)) {
            errorMessage = err.response.data.detail.map((e: { loc: (string | number)[], msg: string }) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join('; ');
          } else {
            errorMessage = err.response.data.detail;
          }
        }
        setFormSubmitError(errorMessage);
        addNotification(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      let photoPath: string | undefined = undefined;
      if (!isEditing && showUserDataFields && selectedPhoto) {
        photoPath = await uploadImage(selectedPhoto);
      }

      if (isEditing && personaId) {
        // Desestructuramos para quitar los campos que no pertenecen a la actualización
        const { 
          crear_usuario_asociado,
          nombre_usuario,
          contraseña,
          ...rest
        } = data;

        // Transforma campos opcionales vacíos a null antes de enviar
        const updatePayload: IPersonaUpdate = {
          ...rest,
          apellido_paterno: rest.apellido_paterno || null,
          apellido_materno: rest.apellido_materno || null,
          direccion: rest.direccion || null,
        };

        const updatedPersona = await updatePersona(personaId, updatePayload);
        addNotification('Persona actualizada con éxito', 'success');
        onSuccess(updatedPersona);
      } else {
        const createPayload: IPersonaCreate = {
          ...data,
          usuario_data: showUserDataFields ? {
            nombre_usuario: data.nombre_usuario!,
            contraseña: data.contraseña!,
            foto_ruta: photoPath,
          } : undefined,
        };
        const newPersona = await createPersona(createPayload);
        addNotification('Persona creada con éxito', 'success');
        onSuccess(newPersona);
      }
    } catch (err: any) {
      let errorMessage = "Ocurrió un error al guardar la persona.";
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: { loc: (string | number)[], msg: string }) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join('; ');
        } else {
          errorMessage = err.response.data.detail;
        }
      }
      setFormSubmitError(errorMessage);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoadError) return <ErrorMessage message={initialLoadError} />;
  if (loading && !formSubmitError) return <div className="flex justify-center items-center p-8"><LoadingSpinner /> Cargando...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl space-y-6">
      {showTitle && <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{isEditing ? 'Editar Persona' : 'Crear Nueva Persona'}</h1>}

      {mode === 'assign-role' && !isEditing && (
        <div className="mb-4">
          <div className="flex space-x-4 text-gray-800 dark:text-gray-200">
            <label className="inline-flex items-center">
              <input type="radio" name="person_option" value="existing" checked={useExistingPerson} onChange={() => setUseExistingPerson(true)} className="form-radio" />
              <span className="ml-2">Asignar a Persona Existente</span>
            </label>
            <label className="inline-flex items-center">
              <input type="radio" name="person_option" value="new" checked={!useExistingPerson} onChange={() => setUseExistingPerson(false)} className="form-radio" />
              <span className="ml-2">Crear Nueva Persona</span>
            </label>
          </div>
        </div>
      )}

      {mode === 'assign-role' && !isEditing && useExistingPerson && (
        <div className="border p-4 rounded-md bg-blue-50 dark:bg-gray-700">
          <Input type="text" placeholder="Buscar por CI, nombre..." value={searchPersonaTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchPersonaTerm(e.target.value)} disabled={searchingPersonas} />
          {searchingPersonas && <LoadingSpinner />}
          {foundPersonas.length > 0 && (
            <Select value={selectedPersonaId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { const id = Number(e.target.value); setSelectedPersonaId(id); if (id) handlePersonaSelectAndAssign(id); }} required>
              <option value="">-- Seleccione una persona --</option>
              {foundPersonas.map(p => <option key={p.persona_id} value={p.persona_id}>{`${p.nombre} ${p.apellido_paterno || ''} (CI: ${p.ci || 'N/A'})`}</option>)}
            </Select>
          )}
        </div>
      )}

      {((mode === 'assign-role' && !useExistingPerson) || mode === 'full') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input id="nombre" label="Nombre *" {...register('nombre')} error={errors.nombre?.message} placeholder="Nombre" />
            <Input id="apellido_paterno" label="Apellido Paterno" {...register('apellido_paterno')} error={errors.apellido_paterno?.message} placeholder="Apellido Paterno" />
            <Input id="apellido_materno" label="Apellido Materno" {...register('apellido_materno')} error={errors.apellido_materno?.message} placeholder="Apellido Materno" />
            <Input id="ci" label="CI *" {...register('ci')} error={errors.ci?.message} placeholder="CI" />
            <Controller name="genero" control={control} render={({ field }) => (
                <Select {...field} label="Género" value={field.value ?? ''} onChange={field.onChange}>
                    <option value="">Seleccionar...</option>
                    <option value={GeneroEnum.Masculino}>Masculino</option>
                    <option value={GeneroEnum.Femenino}>Femenino</option>
                </Select>
            )} />
            <Input id="email" label="Email *" type="email" {...register('email')} error={errors.email?.message} placeholder="Email" />
            <Input id="telefono" label="Teléfono *" {...register('telefono')} error={errors.telefono?.message} placeholder="+59172973548" />
            <div className="md:col-span-2">
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                <textarea id="direccion" {...register('direccion')} rows={3} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm p-2" placeholder="Dirección" />
                {errors.direccion && <span className="text-red-500 text-xs mt-1">{errors.direccion.message}</span>}
            </div>
            <Controller name="estado" control={control} render={({ field }) => (
                <Select {...field} label="Estado">
                    <option value={EstadoEnum.Activo}>Activo</option>
                    <option value={EstadoEnum.Inactivo}>Inactivo</option>
                </Select>
            )} />
        </div>
      )}

      {mode === 'full' && (
        <div className="md:col-span-2 mt-4">
          <label htmlFor="persona_rol_ids" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Roles de la Persona</label>
          {loadingRoles ? <LoadingSpinner /> : (
            <Controller name="rol_ids" control={control} render={({ field }) => (
                <Select 
                    id="persona_rol_ids" 
                    multiple 
                    {...field} 
                    value={field.value?.map(String) || []}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => field.onChange(Array.from(e.target.selectedOptions, option => Number(option.value)))} 
                    className="w-full h-32"
                >
                    {availableRoles.map(rol => <option key={rol.rol_id} value={rol.rol_id}>{rol.nombre_rol}</option>)}
                </Select>
            )} />
          )}
        </div>
      )}

      {mode === 'full' && !isEditing && (
        <div className="md:col-span-2 mt-6 p-6 border rounded-lg bg-blue-50 dark:bg-gray-900">
          <label className="flex items-center text-gray-800 dark:text-gray-200">
            <Controller 
              name="crear_usuario_asociado" 
              control={control} 
              render={({ field }) => (
                <input 
                  type="checkbox" 
                  checked={field.value || false} 
                  onChange={field.onChange} 
                  className="h-5 w-5 rounded" 
                />
              )} 
            />
            <span className="ml-3 text-base font-medium">¿Crear Usuario asociado?</span>
          </label>
          {showUserDataFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Input 
                id="nombre_usuario" 
                label="Nombre de Usuario *" 
                {...register('nombre_usuario')} 
                error={errors.nombre_usuario?.message} 
                placeholder="Nombre de Usuario" 
              />
              <div className="relative">
                <Input 
                  id="contraseña" 
                  label="Contraseña *" 
                  type={showPassword ? "text" : "password"} 
                  {...register('contraseña')} 
                  error={errors.contraseña?.message} 
                  placeholder="Contraseña" 
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
              <Input id="user_photo" label="Foto de Usuario" type="file" accept="image/*" onChange={handlePhotoSelect}
              
              />

            </div>
          )}
          
        </div>
      )}

      {formSubmitError && <ErrorMessage message={formSubmitError} />}
      <div className="flex justify-end space-x-4 mt-6">
        {showCancelButton && onCancel && <Button type="button" onClick={onCancel} variant="secondary">Cancelar</Button>}
        <Button type="submit" disabled={loading || !isValid} variant="primary">
          {loading ? <LoadingSpinner /> : (isEditing ? 'Actualizar Persona' : 'Guardar Persona')}
        </Button>
      </div>
    </form>
  );
};

export default PersonaForm;