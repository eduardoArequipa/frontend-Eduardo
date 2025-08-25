
// src/pages/Proveedores/ProveedoresFormPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProveedorById, createProveedor, updateProveedor } from '../../services/proveedorService';
import { getPersonasWithoutUser } from '../../services/personaService'; 
import { getEmpresas } from '../../services/empresaService';
import { getRoles } from '../../services/rolService';
import {
    ProveedorCreate,
    ProveedorUpdate,
} from '../../types/proveedor';
import { EstadoEnum, GeneroEnum } from '../../types/enums';
import { IPersonaCreate, IPersonaUpdate, IPersonaNested } from '../../types/persona'; 
import { EmpresaCreate, EmpresaUpdate, EmpresaNested } from '../../types/empresa';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select';
import ErrorMessage from '../../components/Common/ErrorMessage';

const ProveedoresFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;
    const proveedorId = id ? parseInt(id, 10) : null;

    interface ProveedorFormState {
        estado: EstadoEnum;
    }
    const [proveedorFormData, setProveedorFormData] = useState<ProveedorFormState>({
        estado: EstadoEnum.Activo,
    });

    const [proveedorType, setProveedorType] = useState<'persona' | 'empresa' | ''>('');
    const [proveedorRoleId, setProveedorRoleId] = useState<number | null>(null);

    const [personaFormData, setPersonaFormData] = useState<IPersonaCreate | IPersonaUpdate | null>(null);
    const [empresaFormData, setEmpresaFormData] = useState<EmpresaCreate | EmpresaUpdate | null>(null);
    const [, setAvailablePersonas] = useState<IPersonaNested[]>([]);
    const [, setAvailableEmpresas] = useState<EmpresaNested[]>([]);
    
    const [loadingAssociationData, setLoadingAssociationData] = useState(true);
    const [errorAssociationData, setErrorAssociationData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState<string | null>(null); 
    const [formSubmitError, setFormSubmitError] = useState<string | null>(null); 

    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingAssociationData(true);
            setErrorAssociationData(null);
            try {
                const roles = await getRoles({ search: 'Proveedor' });
                console.log("Rol encontrado por la API:", roles);
                const proveedorRole = roles.find(role => role.nombre_rol === 'Proveedor');
                if (proveedorRole) {
                    setProveedorRoleId(proveedorRole.rol_id);
                } else {
                    console.error("El rol 'Proveedor' no fue encontrado en la respuesta de la API. Asegúrate de que exista en la base de datos.");
                    setErrorAssociationData("Error crítico: El rol 'Proveedor' no está configurado en el sistema.");
                }

                const personasResponse = await getPersonasWithoutUser(); 
                setAvailablePersonas(personasResponse);
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
                setErrorAssociationData("No se pudieron cargar las listas de Personas/Empresas.");
            } finally {
                setLoadingAssociationData(false);
            }

            if (isEditing && proveedorId) {
                setLoading(true); 
                try {
                    const data = await getProveedorById(proveedorId); 
                    setProveedorFormData({ estado: data.estado });

                    if (data.persona) {
                        setProveedorType('persona');
                        setPersonaFormData({
                            persona_id: data.persona.persona_id,
                            nombre: data.persona.nombre,
                            apellido_paterno: data.persona.apellido_paterno,
                            apellido_materno: data.persona.apellido_materno,
                            ci: data.persona.ci,
                            genero: data.persona.genero,
                            telefono: data.persona.telefono,
                            email: data.persona.email,
                            direccion: data.persona.direccion,
                        } as IPersonaUpdate); 
                    } else if (data.empresa) {
                        setProveedorType('empresa');
                        setEmpresaFormData({
                            empresa_id: data.empresa.empresa_id,
                            razon_social: data.empresa.razon_social,
                            identificacion: data.empresa.identificacion,
                            nombre_contacto: data.empresa.nombre_contacto,
                            telefono: data.empresa.telefono,
                            email: data.empresa.email,
                            direccion: data.empresa.direccion,
                        } as EmpresaUpdate); 
                    } else {
                        setError("Proveedor existente con tipo desconocido o datos faltantes.");
                    }
                    setLoading(false); 
                } catch (err) {
                    setError("No se pudo cargar el proveedor para editar.");
                    setLoading(false); 
                }
            } else {
                 setLoading(false); 
            }
        };

        loadInitialData();
    }, [isEditing, proveedorId]);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value as 'persona' | 'empresa' | '';
        setProveedorType(type);
        setPersonaFormData(null);
        setEmpresaFormData(null);
        
        if (!isEditing && type === 'persona') {
             setPersonaFormData({} as IPersonaCreate);
        } else if (!isEditing && type === 'empresa') {
             setEmpresaFormData({} as EmpresaCreate);
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
             if (name === 'genero') { processedValue = value as GeneroEnum; } 
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
            if (!isEditing && proveedorType === '') {
                setFormSubmitError("Debe seleccionar un tipo de proveedor (Persona o Empresa).");
                setLoading(false); return;
            }

            if (proveedorType === 'persona') {
                if (!personaFormData) {
                    setFormSubmitError("Error: Datos de Persona no inicializados.");
                    setLoading(false); return;
                }
                if (!personaFormData.nombre || personaFormData.nombre.trim() === '') {
                    setFormSubmitError("El nombre de la Persona es requerido."); setLoading(false); return;
                }
            } else if (proveedorType === 'empresa') {
                if (!empresaFormData) {
                    setFormSubmitError("Error: Datos de Empresa no inicializados.");
                    setLoading(false); return;
                }
                if (!empresaFormData.razon_social || empresaFormData.razon_social.trim() === '') {
                    setFormSubmitError("La Razón Social de la Empresa es requerida."); setLoading(false); return;
                }
            }

            if (isEditing && proveedorId) {
                const dataToSend: ProveedorUpdate = {
                    estado: proveedorFormData.estado,
                    persona_data: proveedorType === 'persona' ? (personaFormData as IPersonaUpdate) : undefined, 
                    empresa_data: proveedorType === 'empresa' ? (empresaFormData as EmpresaUpdate) : undefined, 
                };
                await updateProveedor(proveedorId, dataToSend); 
                alert("Proveedor actualizado con éxito!");
                navigate('/proveedores'); 

            } 
            else {
                let dataToSend: ProveedorCreate;

                if (proveedorType === 'persona' && personaFormData) {
                    const personaDataWithRole: IPersonaCreate = {
                        ...(personaFormData as IPersonaCreate),
                        rol_ids: proveedorRoleId ? [proveedorRoleId] : [],
                    };
                    dataToSend = {
                        estado: proveedorFormData.estado,
                        persona_data: personaDataWithRole,
                    };
                } else if (proveedorType === 'empresa' && empresaFormData) {
                    dataToSend = {
                        estado: proveedorFormData.estado,
                        empresa_data: empresaFormData as EmpresaCreate,
                    };
                } else {
                    setFormSubmitError("Datos de creación incompletos o tipo no seleccionado.");
                    setLoading(false); return;
                }
                await createProveedor(dataToSend); 
                alert("Proveedor creado con éxito!");
                navigate('/proveedores'); 
            }

        } catch (err: any) {
            let errorMessage = "Ocurrió un error al guardar el proveedor.";
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

    if ((isEditing && loading) || loadingAssociationData) {
         return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                 <LoadingSpinner /> {isEditing ? 'Cargando datos del proveedor...' : 'Cargando opciones de asociación...'}
            </div>
         );
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }
    if (errorAssociationData) {
         return <ErrorMessage message={errorAssociationData} />;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{isEditing ? `Editar Proveedor (ID: ${proveedorId})` : 'Crear Nuevo Proveedor'}</h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado del Proveedor</label>
                    <Select
                        id="estado"
                        name="estado"
                        required
                        value={proveedorFormData.estado}
                        onChange={handleProveedorInputChange}
                        options={[
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                        ]}
                    />
                 </div>

                {!isEditing && (
                     <div>
                        <label htmlFor="proveedorType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Proveedor</label>
                         <Select
                            id="proveedorType"
                            name="proveedorType"
                            required={!isEditing}
                            value={proveedorType}
                            onChange={handleTypeChange}
                            options={[
                                { value: '', label: '-- Seleccionar Tipo --' },
                                { value: 'persona', label: 'Persona (sin usuario)' },
                                { value: 'empresa', label: 'Empresa' },
                            ]}
                         />
                     </div>
                )}
                {proveedorType === 'persona' && (
                     <div className="md:col-span-2 border-t pt-4 mt-4 border-gray-200 dark:border-gray-700">
                         <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Datos de Persona (Proveedor sin Usuario)</h2>

                         {personaFormData !== null && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <label htmlFor="persona_nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                                      <Input id="persona_nombre" name="nombre" type="text" required value={personaFormData.nombre || ''} onChange={handlePersonaInputChange} />
                                  </div>
                                  <div>
                                      <label htmlFor="persona_apellido_paterno" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apellido Paterno</label>
                                      <Input id="persona_apellido_paterno" name="apellido_paterno" type="text" value={personaFormData.apellido_paterno || ''} onChange={handlePersonaInputChange} />
                                  </div>
                                   <div>
                                      <label htmlFor="persona_apellido_materno" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apellido Materno</label>
                                      <Input id="persona_apellido_materno" name="apellido_materno" type="text" value={personaFormData.apellido_materno || ''} onChange={handlePersonaInputChange} />
                                  </div>
                                   <div>
                                      <label htmlFor="persona_ci" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CI</label>
                                      <Input id="persona_ci" name="ci" type="text" value={personaFormData.ci || ''} onChange={handlePersonaInputChange} />
                                  </div>
                                   <div>
                                      <label htmlFor="persona_genero" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Género</label>
                                       <Select id="persona_genero" name="genero" value={personaFormData.genero || ''} onChange={handlePersonaInputChange} options={[
                                           { value: '', label: '-- Seleccionar --' },
                                           { value: GeneroEnum.Masculino, label: 'Masculino' },
                                           { value: GeneroEnum.Femenino, label: 'Femenino' },
                                       ]} />
                                  </div>
                                   <div>
                                      <label htmlFor="persona_telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                                      <Input id="persona_telefono" name="telefono" type="text" value={personaFormData.telefono || ''} onChange={handlePersonaInputChange} />
                                  </div>
                                   <div>
                                      <label htmlFor="persona_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                      <Input id="persona_email" name="email" type="email" value={personaFormData.email || ''} onChange={handlePersonaInputChange} />
                                  </div>
                                   <div className="md:col-span-2">
                                      <label htmlFor="persona_direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                                      <textarea id="persona_direccion" name="direccion" value={personaFormData.direccion || ''} onChange={handlePersonaInputChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm"></textarea>
                                  </div>
                             </div>
                         )}
                     </div>
                )}

                {proveedorType === 'empresa' && (
                     <div className="md:col-span-2 border-t pt-4 mt-4 border-gray-200 dark:border-gray-700">
                         <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Datos de Empresa</h2>

                         {empresaFormData !== null && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <label htmlFor="empresa_razon_social" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Razón Social</label>
                                      <Input id="empresa_razon_social" name="razon_social" type="text" required value={empresaFormData.razon_social || ''} onChange={handleEmpresaInputChange} />
                                  </div>
                                   <div>
                                      <label htmlFor="empresa_identificacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Identificación</label>
                                      <Input id="empresa_identificacion" name="identificacion" type="text" value={empresaFormData.identificacion || ''} onChange={handleEmpresaInputChange} />
                                  </div>
                                   <div>
                                      <label htmlFor="empresa_nombre_contacto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Contacto</label>
                                      <Input id="empresa_nombre_contacto" name="nombre_contacto" type="text" value={empresaFormData.nombre_contacto || ''} onChange={handleEmpresaInputChange} />
                                  </div>
                                   <div>
                                      <label htmlFor="empresa_telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                                      <Input id="empresa_telefono" name="telefono" type="text" value={empresaFormData.telefono || ''} onChange={handleEmpresaInputChange} />
                                  </div>
                                   <div>
                                      <label htmlFor="empresa_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                      <Input id="empresa_email" name="email" type="email" value={empresaFormData.email || ''} onChange={handleEmpresaInputChange} />
                                  </div>
                                   <div className="md:col-span-2">
                                      <label htmlFor="empresa_direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                                      <textarea id="empresa_direccion" name="direccion" value={empresaFormData.direccion || ''} onChange={handleEmpresaInputChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm"></textarea>
                                  </div>
                             </div>
                         )}
                     </div>
                )}

                {formSubmitError && <div className="md:col-span-2"><ErrorMessage message={formSubmitError} /></div>}

                <div className="md:col-span-2 flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={() => navigate('/proveedores')}>Cancelar</Button>
                    <Button type="submit" disabled={loading || loadingAssociationData || (!isEditing && proveedorType === '') || (!isEditing && proveedorType === 'persona' && personaFormData === null) || (!isEditing && proveedorType === 'empresa' && empresaFormData === null)} variant="primary">
                        {loading ? <LoadingSpinner /> : (isEditing ? 'Actualizar Proveedor' : 'Crear Proveedor')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProveedoresFormPage;
