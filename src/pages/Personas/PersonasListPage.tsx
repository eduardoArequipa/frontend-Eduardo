import React, { useEffect, useState } from 'react';
import { getPersonas, deactivatePersona, activatePersona, GetPersonasParams } from '../../services/personaService';
import { getRoles } from '../../services/rolService'; // Importar servicio de roles
import { IPersonaWithRoles } from '../../types/persona';
import { IRolInDB } from '../../types/rol'; // Importar tipo de Rol
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Select from '../../components/Common/Select';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { ProfileCard } from '../../components/Common/Card';
import ActionsDropdown, { ActionConfig } from '../../components/Common/ActionsDropdown';
import InfoIcon from '../../components/Common/InfoIcon';
import { useNavigate } from 'react-router-dom';
import { EstadoEnum, GeneroEnum } from '../../types/enums';
import Modal from '../../components/Common/Modal';
import { useNotification } from '../../context/NotificationContext';

const PersonasListPage: React.FC = () => {
    const navigate = useNavigate();
    const [personas, setPersonas] = useState<IPersonaWithRoles[]>([]);
    const [roles, setRoles] = useState<IRolInDB[]>([]); // Estado para roles
    const [totalPersonas, setTotalPersonas] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addNotification } = useNotification();

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        action: (() => Promise<void>) | null;
        title: string;
        message: React.ReactNode;
        confirmText: string;
        confirmVariant: 'danger' | 'success';
    }>({
        isOpen: false,
        action: null,
        title: '',
        message: null,
        confirmText: '',
        confirmVariant: 'danger',
    });

    // Estados de los filtros
    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>(EstadoEnum.Activo);
    const [generoFilter, setGeneroFilter] = useState<GeneroEnum | '' > ('');
    const [rolFilter, setRolFilter] = useState<string>(''); // Estado para el filtro de rol

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Fetch de Roles para el dropdown
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const rolesData = await getRoles({ estado: EstadoEnum.Activo });
                setRoles(rolesData);
            } catch (err) {
                console.error("Error fetching roles:", err);
            }
        };
        fetchRoles();
    }, []);

    const fetchPersonas = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: GetPersonasParams = {
                 search: search || undefined,
                 estado: estadoFilter || undefined,
                 genero: generoFilter || undefined,
                 rol_nombre: rolFilter || undefined, // Añadir rol_nombre a los parámetros
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };

            Object.keys(params).forEach(key => params[key as keyof GetPersonasParams] === undefined && delete params[key as keyof GetPersonasParams]);

            const fetchedData = await getPersonas(params);
            setPersonas(fetchedData.items);
            setTotalPersonas(fetchedData.total);

        } catch (err: any) {
            console.error("Error fetching personas:", err);
            setError(err.response?.data?.detail || "Error al cargar las personas.");
            setPersonas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPersonas();
    }, [search, estadoFilter, generoFilter, rolFilter, currentPage, itemsPerPage]); // Añadir rolFilter a las dependencias

    const handleFilterChange = (setter: React.Dispatch<any>) => (value: any) => {
        setter(value);
        setCurrentPage(1);
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, action: null, title: '', message: null, confirmText: '', confirmVariant: 'danger' });
    };

    const handleConfirmAction = async () => {
        if (modalState.action) {
            try {
                await modalState.action();
                addNotification('Acción completada con éxito', 'success');
            } catch (err: any) {
                const errorMessage = err.response?.data?.detail || 'Ocurrió un error al realizar la acción.';
                addNotification(errorMessage, 'error');
            } finally {
                handleCloseModal();
                fetchPersonas();
            }
        }
    };

    const handleDelete = (id: number, nombreCompleto: string) => {
        setModalState({
            isOpen: true,
            title: 'Confirmar Desactivación',
            message: <p>¿Estás seguro de desactivar a <strong>{nombreCompleto}</strong>?</p>,
            confirmText: 'Sí, Desactivar',
            confirmVariant: 'danger',
            action: () => deactivatePersona(id),
        });
    };

    const handleActivate = (id: number, nombreCompleto: string) => {
        setModalState({
            isOpen: true,
            title: 'Confirmar Activación',
            message: <p>¿Estás seguro de activar a <strong>{nombreCompleto}</strong>?</p>,
            confirmText: 'Sí, Activar',
            confirmVariant: 'success',
            action: () => activatePersona(id),
        });
    };

    const totalPages = Math.ceil(totalPersonas / itemsPerPage);

    const generatePersonaActions = (persona: IPersonaWithRoles): ActionConfig[] => {
        const nombreCompleto = `${persona.nombre} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim();
        return [
            { 
                label: 'Editar', 
                onClick: () => navigate(`/personas/edit/${persona.persona_id}`), 
                isVisible: true 
            },
            { 
                label: 'Desactivar', 
                onClick: () => handleDelete(persona.persona_id, nombreCompleto), 
                isVisible: persona.estado === EstadoEnum.Activo, 
                colorClass: 'text-red-700 dark:text-red-400' 
            },
            { 
                label: 'Activar', 
                onClick: () => handleActivate(persona.persona_id, nombreCompleto), 
                isVisible: persona.estado === EstadoEnum.Inactivo, 
                colorClass: 'text-green-700 dark:text-green-400' 
            }
        ];
    };

    if (loading && personas.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                 <LoadingSpinner /> Cargando personas...
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Gestión de Personas</h1>

            <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-grow min-w-[150px]">
                    <label htmlFor="search" className="sr-only">Buscar</label>
                    <Input
                        id="search"
                        type="text"
                        placeholder="Buscar por nombre, CI, etc."
                        value={search}
                        onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="rolFilter" className="sr-only">Filtrar por Rol</label>
                    <Select
                        id="rolFilter"
                        value={rolFilter}
                        onChange={(e) => handleFilterChange(setRolFilter)(e.target.value)}
                        options={[
                            { value: '', label: 'Todos los roles' },
                            ...roles.map(rol => ({ value: rol.nombre_rol, label: rol.nombre_rol }))
                        ]}
                    />
                </div>

                <div>
                    <label htmlFor="estadoFilter" className="sr-only">Filtrar por Estado</label>
                    <Select
                        id="estadoFilter"
                        value={estadoFilter}
                        onChange={(e) => handleFilterChange(setEstadoFilter)(e.target.value as EstadoEnum | '')}
                        options={[
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                            { value: '', label: 'Todos los estados' },
                        ]}
                    />
                </div>

                <div>
                    <label htmlFor="generoFilter" className="sr-only">Filtrar por Género</label>
                    <Select
                        id="generoFilter"
                        value={generoFilter}
                        onChange={(e) => handleFilterChange(setGeneroFilter)(e.target.value as GeneroEnum | '')}
                        options={[
                            { value: '', label: 'Todos los géneros' },
                            { value: GeneroEnum.Masculino, label: 'Masculino' },
                            { value: GeneroEnum.Femenino, label: 'Femenino' },
                        ]}
                    />
                </div>

                <div className="flex-grow md:flex-none flex justify-end">
                    <Button
                        onClick={() => navigate('/personas/new')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
                    >
                        Registrar Nueva Persona
                    </Button>
                </div>
            </div>

            {loading && personas.length > 0 && (
                <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 z-10">
                     <LoadingSpinner />
                </div>
            )}
            {personas.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No hay personas registradas que coincidan con los filtros.</p>
            ) : (
                personas.length > 0 && (
                    <div className="relative">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {personas.map(persona => {
                                const nombreCompleto = `${persona.nombre} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim();
                                const personaActions = generatePersonaActions(persona);

                                // Generar badges dinámicos
                                const badges: Array<{
                                    text: string;
                                    variant?: 'success' | 'danger' | 'warning' | 'info' | 'secondary';
                                }> = [
                                    {
                                        text: persona.estado.charAt(0).toUpperCase() + persona.estado.slice(1),
                                        variant: persona.estado === EstadoEnum.Activo ? 'success' : 'danger'
                                    }
                                ];

                                // Agregar badge de género si existe
                                if (persona.genero) {
                                    badges.push({
                                        text: persona.genero === GeneroEnum.Masculino ? '♂️ M' : '♀️ F',
                                        variant: 'info'
                                    });
                                }

                                // Agregar badge de roles activos
                                if (persona.roles.length > 0) {
                                    badges.push({
                                        text: `${persona.roles.length} rol${persona.roles.length > 1 ? 'es' : ''}`,
                                        variant: 'secondary'
                                    });
                                }

                                return (
                                    <ProfileCard
                                        key={persona.persona_id}
                                        avatar={{
                                            alt: nombreCompleto,
                                            size: 'md',
                                            showFallback: true
                                        }}
                                        title={nombreCompleto}
                                        subtitle={persona.genero ? `${persona.genero} • CI: ${persona.ci}` : `CI: ${persona.ci}`}
                                        badges={badges}
                                        actions={<ActionsDropdown actions={personaActions} isLoading={loading} />}
                                        className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-indigo-500/30 hover:border-l-indigo-500"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <InfoIcon type="email" className="w-4 h-4 text-indigo-500" />
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">EMAIL</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={persona.email || 'No especificado'}>
                                                        {persona.email || (
                                                            <span className="text-gray-400 italic">No especificado</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                                <InfoIcon type="phone" className="w-4 h-4 text-green-500" />
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">TELÉFONO</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {persona.telefono || (
                                                            <span className="text-gray-400 italic">No especificado</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start space-x-2">
                                                <InfoIcon type="role" className="w-4 h-4 text-purple-500 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">ROLES</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {persona.roles.length > 0 ? (
                                                            persona.roles.map((rol, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium"
                                                                >
                                                                    {rol.nombre_rol}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400 italic text-sm">Sin roles asignados</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </ProfileCard>
                                );
                            })}
                        </div>
                        <div className="mt-8 flex justify-center items-center space-x-4">
                            <Button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || loading}
                                variant="secondary"
                            >
                                Anterior
                            </Button>
                            <span className="text-gray-700 dark:text-gray-300">
                                Página {currentPage} de {totalPages} (Total: {totalPersonas} personas)
                            </span>
                            <Button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || loading}
                                variant="secondary"
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )
            )}

            <Modal
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmAction}
                title={modalState.title}
                confirmButtonText={modalState.confirmText}
                confirmButtonVariant={modalState.confirmVariant}
                showConfirmButton={true}
                isConfirmButtonDisabled={loading}
            >
                <div>{modalState.message}</div>
            </Modal>
        </div>
    );
};

export default PersonasListPage;