// src/pages/Proveedores/ProveedoresFormPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProveedorById, createProveedor, updateProveedor } from '../../services/proveedorService';
// Asumiendo que getPersonasWithoutUser está diseñado para personas que no son usuarios
import { getPersonasWithoutUser } from '../../services/personaService'; 
import { getEmpresas } from '../../services/empresaService'; // Asumiendo que getEmpresas es para empresas sin usuarios específicos
import {
    ProveedorCreate,
    ProveedorUpdate,
} from '../../types/proveedor';
import { EstadoEnum, GeneroEnum } from '../../types/enums'; // Asegúrate de importar GeneroEnum
import { PersonaCreate, PersonaUpdate, PersonaNested } from '../../types/persona'; 
import { EmpresaCreate, EmpresaUpdate, EmpresaNested } from '../../types/empresa';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const ProveedoresFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;
    const proveedorId = id ? parseInt(id, 10) : null;

    // Estado para los datos del Proveedor (el "contenedor" principal)
    interface ProveedorFormState {
        estado: EstadoEnum;
    }
    const [proveedorFormData, setProveedorFormData] = useState<ProveedorFormState>({
        estado: EstadoEnum.Activo, // Default inicial
    });

    // Estado para el tipo de proveedor (Persona o Empresa)
    const [proveedorType, setProveedorType] = useState<'persona' | 'empresa' | ''>('');

    // Estados para los datos de Persona y Empresa (dependiendo del tipo)
    const [personaFormData, setPersonaFormData] = useState<PersonaCreate | PersonaUpdate | null>(null);
    const [empresaFormData, setEmpresaFormData] = useState<EmpresaCreate | EmpresaUpdate | null>(null);

    // Estados para las listas de Personas y Empresas disponibles (para asociación, aunque aquí se están creando)
    // Actualmente, estas listas no se usan para "seleccionar" una persona/empresa existente, sino para crear una nueva
    // si el proveedor es nuevo. Si la intención es asociar con existentes, necesitarías Dropdowns y handlers.
    // Pero por tu descripción, entiendo que es "registrar al proveedor sin usuario", lo que implica crearlo aquí.
    const [, setAvailablePersonas] = useState<PersonaNested[]>([]);
    const [, setAvailableEmpresas] = useState<EmpresaNested[]>([]);
    
    // Estados de carga y error
    const [loadingAssociationData, setLoadingAssociationData] = useState(true);
    const [errorAssociationData, setErrorAssociationData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState<string | null>(null); 
    const [formSubmitError, setFormSubmitError] = useState<string | null>(null); 

    // *** Efecto para Cargar Datos Iniciales (Proveedor Existente y Listas para Asociación) ***
    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingAssociationData(true);
            setErrorAssociationData(null);
            try {
                // Si la intención es crear una *nueva* persona/empresa que sea proveedor,
                // realmente no necesitas cargar todas las personas/empresas existentes aquí,
                // a menos que quieras validar que no exista ya una persona con el mismo CI, por ejemplo.
                // Sin embargo, mantener las llamadas no causa daño y podría ser útil para depuración.

                // getPersonasWithoutUser() debería traer personas que no tienen un `usuario_id` asociado.
                const personasResponse = await getPersonasWithoutUser(); 
                setAvailablePersonas(personasResponse);

                // getEmpresas() debería traer todas las empresas, ya que no se asocian a usuarios directamente.
                const empresasResponse = await getEmpresas({ limit: 1000 }); 
                const empresaData = empresasResponse.map(e => ({
                    empresa_id: e.empresa_id,
                    razon_social: e.razon_social,
                    identificacion: e.identificacion,
                    nombre_contacto: e.nombre_contacto,
                    telefono: e.telefono,
                    email: e.email,
                    direccion: e.direccion,
                    estado: e.estado 
                }));
                setAvailableEmpresas(empresaData);

            } catch (err) {
                console.error("Error loading association data:", err);
                setErrorAssociationData("No se pudieron cargar las listas de Personas/Empresas.");
            } finally {
                setLoadingAssociationData(false);
            }

            if (isEditing && proveedorId) {
                setLoading(true); 
                setError(null);

                try {
                    const data = await getProveedorById(proveedorId); 
                    setProveedorFormData({ estado: data.estado });

                    if (data.persona) {
                        setProveedorType('persona');
                        // Asegúrate de que los tipos de PersonaUpdate sean compatibles con lo que el servicio de proveedor espera
                        // para persona_data. Si data.persona tiene un `persona_id`, inclúyelo en PersonaUpdate.
                        setPersonaFormData({
                            persona_id: data.persona.persona_id, // Incluir ID si existe para update
                            nombre: data.persona.nombre,
                            apellido_paterno: data.persona.apellido_paterno,
                            apellido_materno: data.persona.apellido_materno,
                            ci: data.persona.ci,
                            genero: data.persona.genero,
                            telefono: data.persona.telefono,
                            email: data.persona.email,
                            direccion: data.persona.direccion,
                            // estado: data.persona.estado, // Si PersonaUpdate maneja estado
                        } as PersonaUpdate); 
                    } else if (data.empresa) {
                        setProveedorType('empresa');
                        // Similarmente, si data.empresa tiene un `empresa_id`, inclúyelo en EmpresaUpdate.
                        setEmpresaFormData({
                            empresa_id: data.empresa.empresa_id, // Incluir ID si existe para update
                            razon_social: data.empresa.razon_social,
                            identificacion: data.empresa.identificacion,
                            nombre_contacto: data.empresa.nombre_contacto,
                            telefono: data.empresa.telefono,
                            email: data.empresa.email,
                            direccion: data.empresa.direccion,
                            // estado: data.empresa.estado, // Si EmpresaUpdate maneja estado
                        } as EmpresaUpdate); 
                    } else {
                        setError("Proveedor existente con tipo desconocido o datos faltantes.");
                    }
                    setLoading(false); 
                } catch (err) {
                    console.error("Error loading proveedor for edit:", err);
                    setError("No se pudo cargar el proveedor para editar.");
                    setLoading(false); 
                }
            } else {
                 setLoading(false); // Desactiva loading principal si no es edición
            }
        };

        loadInitialData();
    }, [isEditing, proveedorId]); // Dependencias del useEffect

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value as 'persona' | 'empresa' | '';
        setProveedorType(type);
        // Limpiar formularios de Persona/Empresa y selectores de asociación al cambiar de tipo
        setPersonaFormData(null); // Asegura que se reinicie
        setEmpresaFormData(null); // Asegura que se reinicie
        
        // Inicializa el estado del formulario del tipo seleccionado si es un nuevo proveedor
        if (!isEditing && type === 'persona') {
             setPersonaFormData({} as PersonaCreate); // Inicializa para nuevos datos
        } else if (!isEditing && type === 'empresa') {
             setEmpresaFormData({} as EmpresaCreate); // Inicializa para nuevos datos
        }
    };

    const handleProveedorInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProveedorFormData(prev => ({
            ...prev,
            [name]: value as EstadoEnum,
        }));
    };

    const handlePersonaInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPersonaFormData(prev => {
            if (!prev) return null; 
            let processedValue: any = value;
            // Asegúrate de que el enum GeneroEnum esté correctamente importado y usado
             if (name === 'genero') { processedValue = value as GeneroEnum; } 
            // El estado de persona generalmente no se actualiza desde aquí, sino desde una acción de admin
            // if (name === 'estado') { processedValue = value as EstadoEnum; } 
            return {
                ...prev,
                [name]: processedValue,
            };
        });
    };

    const handleEmpresaInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEmpresaFormData(prev => {
            if (!prev) return null; 
            let processedValue: any = value;
            // El estado de empresa generalmente no se actualiza desde aquí
            // if (name === 'estado') { processedValue = value as EstadoEnum; }
            return {
                ...prev,
                [name]: processedValue,
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); 
        setFormSubmitError(null); 

        try {
            // Validaciones básicas del tipo de proveedor seleccionado
            if (!isEditing && proveedorType === '') {
                setFormSubmitError("Debe seleccionar un tipo de proveedor (Persona o Empresa).");
                setLoading(false); return;
            }

            // Validaciones de datos de Persona/Empresa
            if (proveedorType === 'persona') {
                if (!personaFormData) {
                    setFormSubmitError("Error: Datos de Persona no inicializados.");
                    setLoading(false); return;
                }
                // Validaciones de campos obligatorios para Persona
                if (!personaFormData.nombre || personaFormData.nombre.trim() === '') {
                    setFormSubmitError("El nombre de la Persona es requerido."); setLoading(false); return;
                }
                // Puedes añadir más validaciones aquí (ej. CI, email)
            } else if (proveedorType === 'empresa') {
                if (!empresaFormData) {
                    setFormSubmitError("Error: Datos de Empresa no inicializados.");
                    setLoading(false); return;
                }
                // Validaciones de campos obligatorios para Empresa
                if (!empresaFormData.razon_social || empresaFormData.razon_social.trim() === '') {
                    setFormSubmitError("La Razón Social de la Empresa es requerida."); setLoading(false); return;
                }
                // Puedes añadir más validaciones aquí (ej. Identificación, email)
            }

            // --- Lógica para Actualizar un Proveedor Existente ---
            if (isEditing && proveedorId) {
                const dataToSend: ProveedorUpdate = {
                    estado: proveedorFormData.estado,
                    // Si el proveedor existente es una persona, envía sus datos para actualización
                    persona_data: proveedorType === 'persona' ? (personaFormData as PersonaUpdate) : undefined, 
                    // Si el proveedor existente es una empresa, envía sus datos para actualización
                    empresa_data: proveedorType === 'empresa' ? (empresaFormData as EmpresaUpdate) : undefined, 
                };

                console.log("Sending update payload:", dataToSend);
                await updateProveedor(proveedorId, dataToSend); 
                alert("Proveedor actualizado con éxito!");
                navigate('/proveedores'); 

            } 
            // --- Lógica para Crear un Nuevo Proveedor ---
            else {
                let dataToSend: ProveedorCreate;

                if (proveedorType === 'persona' && personaFormData) {
                    dataToSend = {
                        estado: proveedorFormData.estado,
                        persona_data: personaFormData as PersonaCreate, // Envía los datos para crear una nueva Persona
                    };
                } else if (proveedorType === 'empresa' && empresaFormData) {
                    dataToSend = {
                        estado: proveedorFormData.estado,
                        empresa_data: empresaFormData as EmpresaCreate, // Envía los datos para crear una nueva Empresa
                    };
                } else {
                    setFormSubmitError("Datos de creación incompletos o tipo no seleccionado.");
                    setLoading(false); return;
                }

                console.log("Sending create payload:", dataToSend);
                await createProveedor(dataToSend); // Llama al servicio de creación
                alert("Proveedor creado con éxito!");
                navigate('/proveedores'); 
            }

        } catch (err: any) {
            console.error("Error submitting proveedor form:", err.response?.data || err);

            let errorMessage = "Ocurrió un error al guardar el proveedor.";

            if (err.response && err.response.data) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    try {
                        errorMessage = err.response.data.detail
                            .map((errorDetail: any) => {
                                // Intentar obtener el campo si está disponible
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
                     errorMessage = "Error del servidor con formato inesperado.";
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            setFormSubmitError(errorMessage); 
        } finally {
            setLoading(false); 
        }
    };

    // --- Renderizado Condicional de Estados de Carga/Error ---
    if ((isEditing && loading) || loadingAssociationData) {
         return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner /> {isEditing ? 'Cargando datos del proveedor...' : 'Cargando opciones de asociación...'}
            </div>
         );
    }

    if (error) { // Error de carga del proveedor (solo en edición)
        return <div className="text-red-500 text-center mt-4">Error al cargar el proveedor: {error}</div>;
    }
    if (errorAssociationData) { // Error de carga de listas para asociación (en ambos modos)
         return <div className="text-red-500 text-center mt-4">Error al cargar opciones de asociación: {errorAssociationData}</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">{isEditing ? `Editar Proveedor (ID: ${proveedorId})` : 'Crear Nuevo Proveedor'}</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Campo Estado del Proveedor */}
                <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado del Proveedor</label>
                    <select
                        id="estado"
                        name="estado"
                        required
                        value={proveedorFormData.estado}
                        onChange={handleProveedorInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value={EstadoEnum.Activo}>Activo</option>
                        <option value={EstadoEnum.Inactivo}>Inactivo</option>
                    </select>
                 </div>

                {/* Selector de Tipo de Proveedor (Solo en Creación) */}
                {!isEditing && (
                     <div>
                        <label htmlFor="proveedorType" className="block text-sm font-medium text-gray-700">Tipo de Proveedor</label>
                         <select
                            id="proveedorType"
                            name="proveedorType"
                            required={!isEditing}
                            value={proveedorType}
                            onChange={handleTypeChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                         >
                            <option value="">-- Seleccionar Tipo --</option>
                            <option value="persona">Persona (sin usuario)</option> {/* Aclaración para el usuario */}
                            <option value="empresa">Empresa</option>
                         </select>
                     </div>
                )}
                {/* Sección Condicional para Proveedor Tipo Persona */}
                {proveedorType === 'persona' && (
                     <div className="md:col-span-2 border-t pt-4 mt-4"> {/* Separador visual */}
                         <h2 className="text-xl font-semibold mb-4">Datos de Persona (Proveedor sin Usuario)</h2>

                         {/* Formulario para Crear/Editar Persona */}
                         {/* Mostrar si hay datos en personaFormData (en creación después de seleccionar tipo, o en edición) */}
                         {personaFormData !== null && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 {/* Campos del formulario de Persona */}
                                  <div>
                                      <label htmlFor="persona_nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
                                      <Input id="persona_nombre" name="nombre" type="text" required value={personaFormData.nombre || ''} onChange={handlePersonaInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                  </div>
                                  <div>
                                      <label htmlFor="persona_apellido_paterno" className="block text-sm font-medium text-gray-700">Apellido Paterno</label>
                                      <Input id="persona_apellido_paterno" name="apellido_paterno" type="text" value={personaFormData.apellido_paterno || ''} onChange={handlePersonaInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                  </div>
                                   <div>
                                      <label htmlFor="persona_apellido_materno" className="block text-sm font-medium text-gray-700">Apellido Materno</label>
                                      <Input id="persona_apellido_materno" name="apellido_materno" type="text" value={personaFormData.apellido_materno || ''} onChange={handlePersonaInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                  </div>
                                   <div>
                                      <label htmlFor="persona_ci" className="block text-sm font-medium text-gray-700">CI</label>
                                      <Input id="persona_ci" name="ci" type="text" value={personaFormData.ci || ''} onChange={handlePersonaInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                  </div>
                                   <div>
                                      <label htmlFor="persona_genero" className="block text-sm font-medium text-gray-700">Género</label>
                                       <select id="persona_genero" name="genero" value={personaFormData.genero || ''} onChange={handlePersonaInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                           <option value="">-- Seleccionar --</option>
                                           <option value={GeneroEnum.Masculino}>Masculino</option>
                                           <option value={GeneroEnum.Femenino}>Femenino</option>
                                       </select>
                                  </div>
                                   <div>
                                      <label htmlFor="persona_telefono" className="block text-sm font-medium text-gray-700">Teléfono</label>
                                      <Input id="persona_telefono" name="telefono" type="text" value={personaFormData.telefono || ''} onChange={handlePersonaInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                  </div>
                                   <div>
                                      <label htmlFor="persona_email" className="block text-sm font-medium text-gray-700">Email</label>
                                      <Input id="persona_email" name="email" type="email" value={personaFormData.email || ''} onChange={handlePersonaInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                  </div>
                                   <div className="md:col-span-2">
                                      <label htmlFor="persona_direccion" className="block text-sm font-medium text-gray-700">Dirección</label>
                                      <textarea id="persona_direccion" name="direccion" value={personaFormData.direccion || ''} onChange={handlePersonaInputChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                                  </div>

                             </div>
                         )}
                     </div>
                )}

                {/* --- Sección Condicional para Proveedor Tipo Empresa --- */}
                {proveedorType === 'empresa' && (
                     <div className="md:col-span-2 border-t pt-4 mt-4"> {/* Separador visual */}
                         <h2 className="text-xl font-semibold mb-4">Datos de Empresa</h2>

                         {empresaFormData !== null && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 {/* Campos del formulario de Empresa */}
                                  <div>
                                      <label htmlFor="empresa_razon_social" className="block text-sm font-medium text-gray-700">Razón Social</label>
                                      <Input id="empresa_razon_social" name="razon_social" type="text" required value={empresaFormData.razon_social || ''} onChange={handleEmpresaInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                  </div>
                                   <div>
                                      <label htmlFor="empresa_identificacion" className="block text-sm font-medium text-gray-700">Identificación</label>
                                      <Input id="empresa_identificacion" name="identificacion" type="text" value={empresaFormData.identificacion || ''} onChange={handleEmpresaInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                  </div>
                                   <div>
                                      <label htmlFor="empresa_nombre_contacto" className="block text-sm font-medium text-gray-700">Nombre Contacto</label>
                                      <Input id="empresa_nombre_contacto" name="nombre_contacto" type="text" value={empresaFormData.nombre_contacto || ''} onChange={handleEmpresaInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                  </div>
                                   <div>
                                      <label htmlFor="empresa_telefono" className="block text-sm font-medium text-gray-700">Teléfono</label>
                                      <Input id="empresa_telefono" name="telefono" type="text" value={empresaFormData.telefono || ''} onChange={handleEmpresaInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                  </div>
                                   <div>
                                      <label htmlFor="empresa_email" className="block text-sm font-medium text-gray-700">Email</label>
                                      <Input id="empresa_email" name="email" type="email" value={empresaFormData.email || ''} onChange={handleEmpresaInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                  </div>
                                   <div className="md:col-span-2">
                                      <label htmlFor="empresa_direccion" className="block text-sm font-medium text-gray-700">Dirección</label>
                                      <textarea id="empresa_direccion" name="direccion" value={empresaFormData.direccion || ''} onChange={handleEmpresaInputChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                                  </div>
                             </div>
                         )}
                     </div>
                )}

                {/* --- Botones de Acción y Mensajes de Error --- */}
                {formSubmitError && (
                    <div className="md:col-span-2 text-red-500 text-center mb-4">{formSubmitError}</div>
                )}

                <div className="md:col-span-2 flex justify-end space-x-4">
                    {/* Botón Cancelar */}
                    <Link to="/proveedores">
                        <Button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded shadow">
                            Cancelar
                        </Button>
                    </Link>
                    {/* Botón Guardar/Crear */}
                    <Button
                        type="submit"
                        disabled={loading || loadingAssociationData || (!isEditing && proveedorType === '') || (!isEditing && proveedorType === 'persona' && personaFormData === null) || (!isEditing && proveedorType === 'empresa' && empresaFormData === null)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <LoadingSpinner /> : (isEditing ? 'Actualizar Proveedor' : 'Crear Proveedor')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProveedoresFormPage;