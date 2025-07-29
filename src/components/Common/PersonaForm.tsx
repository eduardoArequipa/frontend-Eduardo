
// src/components/Common/PersonaForm.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { getPersonaById, createPersona, updatePersona, getPersonas } from '../../services/personaService';
import { getRoles } from '../../services/rolService';
import { uploadImage } from '../../services/uploadService';

// Tipos
import { IPersonaInDB, IPersonaCreate, IPersonaUpdate, IPersonaNested } from '../../types/persona';
import { IUsuarioCreateNested } from '../../types/usuario';
import { IRolInDB } from '../../types/rol';
import { EstadoEnum, GeneroEnum } from '../../types/enums';

// Componentes
import Input from './Input';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Select from './Select';

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

  // --- ESTADOS GENERALES ---
  const [personaFormData, setPersonaFormData] = useState<Partial<IPersonaCreate & IPersonaUpdate>>({
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);

  // --- ESTADOS PARA MODO "full" ---
  const [userDataFields, setUserDataFields] = useState<Partial<IUsuarioCreateNested>>({});
  const [showUserDataFields, setShowUserDataFields] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [availableRoles, setAvailableRoles] = useState<IRolInDB[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // --- ESTADOS PARA MODO "assign-role" ---
  const [useExistingPerson, setUseExistingPerson] = useState<boolean>(true);
  const [searchPersonaTerm, setSearchPersonaTerm] = useState<string>('');
  const [foundPersonas, setFoundPersonas] = useState<IPersonaNested[]>([]);
  const [searchingPersonas, setSearchingPersonas] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | ''>( '');
  const [roleToAssignId, setRoleToAssignId] = useState<number | null>(null);

  // --- LÓGICA DE VALIDACIÓN ---
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'nombre':
        return value.length < 3 ? 'El nombre debe tener al menos 3 caracteres.' : '';
      case 'apellido_paterno':
        return value && value.length < 3 ? 'Debe tener al menos 3 caracteres.' : '';
      case 'apellido_materno':
        return value && value.length < 3 ? 'Debe tener al menos 3 caracteres.' : '';
      case 'ci':
        if (!value || value.trim() === '') return 'El CI es requerido.';
        if (/\s/.test(value)) return 'El CI no debe contener espacios.';
        return '';
      case 'email':
        if (!value) return 'El email es requerido.';
        return !/\S+@\S+\.\S+/.test(value) ? 'El formato del email no es válido.' : '';
      case 'telefono':
        if (!value) return 'El teléfono es requerido.';
        return !/^\+?[0-9]+$/.test(value) ? 'Formato inválido. Use +59172973548.' : '';
      default:
        return '';
    }
  };

  // --- EFECTOS DE CARGA INICIAL ---

  // Cargar Rol a Asignar (para modo 'assign-role')
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

  // Cargar datos de la persona (si se edita) y roles disponibles (para modo 'full')
  useEffect(() => {
    const loadPersonaData = async () => {
      if (isEditing && personaId) {
        setLoading(true);
        try {
          const data = await getPersonaById(personaId);
          setPersonaFormData({
            nombre: data.nombre || '',
            apellido_paterno: data.apellido_paterno || '',
            apellido_materno: data.apellido_materno || '',
            ci: data.ci || '',
            genero: data.genero || undefined,
            email: data.email || '',
            telefono: data.telefono || '',
            direccion: data.direccion || '',
            estado: data.estado || EstadoEnum.Activo,
            rol_ids: data.roles.map(r => r.rol_id),
          });
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
  }, [isEditing, personaId, mode]);


  // --- LÓGICA DE BÚSQUEDA (para modo 'assign-role') ---
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.length < 2) {
        setFoundPersonas([]);
        return;
      }
      setSearchingPersonas(true);
      try {
        // CORRECCIÓN API: Usamos getPersonas con el parámetro 'search'
        const personas = await getPersonas({ search: term, limit: 10 });
        setFoundPersonas(personas);
      } catch (err) {
        setFormSubmitError("Error al buscar personas.");
      } finally {
        setSearchingPersonas(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (mode === 'assign-role' && searchPersonaTerm) {
      debouncedSearch(searchPersonaTerm);
    }
  }, [searchPersonaTerm, mode, debouncedSearch]);


  // --- MANEJADORES DE EVENTOS ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPersonaFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserDataFields(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRoleIds = Array.from(e.target.selectedOptions).map(option => parseInt(option.value, 10));
    setPersonaFormData(prev => ({ ...prev, rol_ids: selectedRoleIds }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedPhoto(e.target.files[0]);
    }
  };

  // --- LÓGICA DE ENVÍO DEL FORMULARIO ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todo el formulario antes de enviar
    const formErrors: Record<string, string> = {};
    Object.keys(personaFormData).forEach(key => {
      const error = validateField(key, personaFormData[key as keyof typeof personaFormData]);
      if (error) {
        formErrors[key] = error;
      }
    });

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setFormSubmitError("Por favor, corrija los errores en el formulario.");
      return;
    }

    setLoading(true);
    setFormSubmitError(null);

    // --- Lógica para MODO "assign-role" ---
    if (mode === 'assign-role') {
      if (!roleToAssignId) {
        setFormSubmitError("El rol a asignar no está configurado correctamente.");
        setLoading(false);
        return;
      }

      try {
        let finalPersona: IPersonaInDB;

        if (useExistingPerson) {
          if (!selectedPersonaId) {
            setFormSubmitError("Debe seleccionar una persona existente.");
            setLoading(false);
            return;
          }
          const personaToUpdate = await getPersonaById(selectedPersonaId);
          const updatedRoles = [...new Set([...personaToUpdate.roles.map(r => r.rol_id), roleToAssignId])];
          finalPersona = await updatePersona(selectedPersonaId, { rol_ids: updatedRoles });

        } else { // Crear nueva persona
          const createPayload: IPersonaCreate = {
            nombre: personaFormData.nombre!,
            apellido_paterno: personaFormData.apellido_paterno ?? '',
            apellido_materno: personaFormData.apellido_materno ?? '',
            ci: personaFormData.ci!,
            genero: personaFormData.genero ?? null,
            telefono: personaFormData.telefono ?? '',
            email: personaFormData.email!,
            direccion: personaFormData.direccion ?? '',
            estado: personaFormData.estado ?? EstadoEnum.Activo,
            rol_ids: [roleToAssignId],
          };
          finalPersona = await createPersona(createPayload);
        }
        onSuccess(finalPersona);

      } catch (err: any) {
        setFormSubmitError(err.response?.data?.detail || "Ocurrió un error al asignar el rol.");
      } finally {
        setLoading(false);
      }
      return; // Termina la ejecución para este modo
    }


    // --- Lógica para MODO "full" ---
    try {
      let photoPath: string | undefined = undefined;
      if (!isEditing && showUserDataFields && selectedPhoto) {
        photoPath = await uploadImage(selectedPhoto);
      }

      if (isEditing && personaId) {
        const updatePayload: IPersonaUpdate = { ...personaFormData };
        const updatedPersona = await updatePersona(personaId, updatePayload);
        onSuccess(updatedPersona);
      } else {
        const createPayload: IPersonaCreate = {
          ...personaFormData,
          nombre: personaFormData.nombre!,
          ci: personaFormData.ci!,
          email: personaFormData.email!,
          telefono: personaFormData.telefono!,
          usuario_data: showUserDataFields ? {
            nombre_usuario: userDataFields.nombre_usuario!,
            contraseña: userDataFields.contraseña!,
            foto_ruta: photoPath,
          } : undefined,
        };
        const newPersona = await createPersona(createPayload);
        onSuccess(newPersona);
      }
    } catch (err: any) {
      setFormSubmitError(err.response?.data?.detail || "Ocurrió un error al guardar la persona.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZADO ---

  if (initialLoadError) {
    return <ErrorMessage message={initialLoadError} />;
  }

  if (loading && !formSubmitError) {
      return <div className="flex justify-center items-center p-8"><LoadingSpinner /></div>;
  }

  const isFormInvalid = Object.values(errors).some(error => error !== '');

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl space-y-6">
      {showTitle && <h1 className="text-3xl font-bold text-gray-800">{isEditing ? 'Editar Persona' : `Crear Nueva Persona`}</h1>}

      {/* --- Selector de Modo para 'assign-role' --- */}
      {mode === 'assign-role' && !isEditing && (
        <div className="mb-4">
          <div className="flex space-x-4">
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

      {/* --- Formulario de Búsqueda/Creación para 'assign-role' --- */}
      {mode === 'assign-role' && !isEditing && useExistingPerson && (
        <div className="border p-4 rounded-md bg-blue-50">
          <Input
            type="text"
            placeholder="Buscar por CI, nombre..."
            value={searchPersonaTerm}
            onChange={(e) => setSearchPersonaTerm(e.target.value)}
            disabled={searchingPersonas}
          />
          {searchingPersonas && <LoadingSpinner />}
          {foundPersonas.length > 0 && (
            <Select value={selectedPersonaId} onChange={(e) => setSelectedPersonaId(Number(e.target.value))} required>
              <option value="">-- Seleccione una persona --</option>
              {foundPersonas.map(p => (
                <option key={p.persona_id} value={p.persona_id}>
                  {`${p.nombre} ${p.apellido_paterno || ''} (CI: ${p.ci || 'N/A'})`}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      {/* --- Campos del Formulario Principal --- */}
      {((mode === 'assign-role' && !useExistingPerson) || mode === 'full') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input id="nombre" name="nombre" label="Nombre *" value={personaFormData.nombre || ''} onChange={handleInputChange} required placeholder="Nombre" error={errors.nombre} />
            <Input id="apellido_paterno" name="apellido_paterno" label="Apellido Paterno" value={personaFormData.apellido_paterno || ''} onChange={handleInputChange} placeholder="Apellido Paterno" error={errors.apellido_paterno} />
            <Input id="apellido_materno" name="apellido_materno" label="Apellido Materno" value={personaFormData.apellido_materno || ''} onChange={handleInputChange} placeholder="Apellido Materno" error={errors.apellido_materno} />
            <Input id="ci" name="ci" label="CI *" value={personaFormData.ci || ''} onChange={handleInputChange} required placeholder="CI" error={errors.ci} />
            <Select name="genero" label="Género" value={personaFormData.genero || ''} onChange={handleInputChange}>
                <option value="">Seleccionar...</option>
                <option value={GeneroEnum.Masculino}>Masculino</option>
                <option value={GeneroEnum.Femenino}>Femenino</option>
            </Select>
            <Input id="email" name="email" label="Email *" type="email" value={personaFormData.email || ''} onChange={handleInputChange} required placeholder="Email" error={errors.email} />
            <Input id="telefono" name="telefono" label="Teléfono *" value={personaFormData.telefono || ''} onChange={handleInputChange} required placeholder="+59172973548" error={errors.telefono} />
            <div className="md:col-span-2">
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <textarea id="direccion" name="direccion" value={personaFormData.direccion || ''} onChange={handleInputChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" placeholder="Dirección" />
            </div>
            <Select name="estado" label="Estado" value={personaFormData.estado || EstadoEnum.Activo} onChange={handleInputChange}>
                <option value={EstadoEnum.Activo}>Activo</option>
                <option value={EstadoEnum.Inactivo}>Inactivo</option>
            </Select>
        </div>
      )}

      {/* --- Sección de Roles para 'full' mode --- */}
      {mode === 'full' && (
        <div className="md:col-span-2 mt-4">
          <label htmlFor="persona_rol_ids" className="block text-sm font-medium text-gray-700 mb-1">Roles de la Persona</label>
          {loadingRoles ? <LoadingSpinner /> : (
            <Select id="persona_rol_ids" name="rol_ids" multiple value={personaFormData.rol_ids?.map(String) || []} onChange={handleRoleSelectChange} className="w-full h-32">
              {availableRoles.map(rol => (
                <option key={rol.rol_id} value={rol.rol_id}>{rol.nombre_rol}</option>
              ))}
            </Select>
          )}
        </div>
      )}

      {/* --- Sección de Usuario para 'full' mode --- */}
      {mode === 'full' && !isEditing && (
        <div className="md:col-span-2 mt-6 p-6 border rounded-lg bg-blue-50">
          <label className="flex items-center">
            <input type="checkbox" checked={showUserDataFields} onChange={(e) => setShowUserDataFields(e.target.checked)} className="h-5 w-5" />
            <span className="ml-3 text-base font-medium">¿Crear Usuario asociado?</span>
          </label>
          {showUserDataFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Input id="nombre_usuario" name="nombre_usuario" label="Nombre de Usuario *" value={userDataFields.nombre_usuario || ''} onChange={handleUserInputChange} required={showUserDataFields} placeholder="Nombre de Usuario" />
              <Input id="contraseña" name="contraseña" label="Contraseña *" type="password" value={userDataFields.contraseña || ''} onChange={handleUserInputChange} required={showUserDataFields} placeholder="Contraseña" />
              <Input id="user_photo" name="user_photo" label="Foto de Usuario" type="file" accept="image/*" onChange={handlePhotoSelect} />
            </div>
          )}
        </div>
      )}

      {/* --- Botones y Errores --- */}
      {formSubmitError && <ErrorMessage message={formSubmitError} />}
      <div className="flex justify-end space-x-4 mt-6">
        {showCancelButton && onCancel && (
          <Button type="button" onClick={onCancel} className="bg-gray-300 hover:bg-gray-400">Cancelar</Button>
        )}
        <Button type="submit" disabled={loading || isFormInvalid} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {loading ? <LoadingSpinner /> : (isEditing ? 'Actualizar' : 'Guardar')}
        </Button>
      </div>
    </form>
  );
};

export default PersonaForm;
