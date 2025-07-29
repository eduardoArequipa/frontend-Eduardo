import axiosInstance from '../api/axiosInstance'; // Asegúrate de que esta ruta sea correcta
import {
    IPersonaInDB,
   IPersonaCreate,
 IPersonaUpdate,
   IPersonaNested,
} from '../types/persona';
import { IRolInDB } from '../types/rol'; // Asegúrate de que esta ruta y nombre de tipo sean correctos
import { EstadoEnum } from '../types/enums'; // Si el estado de la persona es un EstadoEnum


// Definición de parámetros para la obtención de personas, similar a GetProductosParams
export interface GetPersonasParams {
    skip?: number;
    limit?: number;
    rol_id?: number;
    genero?: string; // O el tipo de tu enum si tienes uno para género
    estado?: EstadoEnum; // Asumiendo que usas EstadoEnum para el estado general de la persona
    search?: string;
    rol_nombre?: string; // Nuevo parámetro para filtrar por nombre de rol
}

// --- Servicios para Persona ---

/**
 * Obtiene una lista de personas con opciones de filtrado y paginación.
 * Utiliza axiosInstance para incluir el token de autenticación.
 * @param params Parámetros de filtrado y paginación.
 * @returns Una promesa que resuelve con una lista de PersonaInDB.
 */
export const getPersonas = async (params?: GetPersonasParams): Promise<IPersonaInDB[]> => {
    // Si tienes un endpoint que soporta 'rol_nombre' como filtro, lo incluyes aquí.
    // Tu backend ya lo soporta, así que es bueno pasarlo.
    const response = await axiosInstance.get('/personas/', { params });
    return response.data;
};

/**
 * Obtiene los detalles de una persona específica por su ID.
 * @param id El ID de la persona.
 * @returns Una promesa que resuelve con un objeto PersonaInDB.
 */
export const getPersonaById = async (id: number): Promise<IPersonaInDB> => {
    const response = await axiosInstance.get(`/personas/${id}`);
    return response.data;
};

export const getPersonasWithoutUser = async (): Promise<IPersonaNested[]> => {
    const response = await axiosInstance.get('/personas/without-user/');
    return response.data; 
};
/**
 * Crea una nueva persona en el sistema.
 * @param personaData Los datos de la nueva persona.
 * @returns Una promesa que resuelve con el objeto PersonaInDB de la persona creada.
 */
export const createPersona = async (personaData: IPersonaCreate): Promise<IPersonaInDB> => {
    const response = await axiosInstance.post('/personas/', personaData);
    return response.data;
};

/**
 * Actualiza una persona existente por su ID.
 * Nota: Se usa PATCH para actualizaciones parciales, PUT si fuera una sustitución completa.
 * @param id El ID de la persona a actualizar.
 * @param personaData Los datos parciales de la persona a actualizar.
 * @returns Una promesa que resuelve con el objeto PersonaInDB actualizado.
 */
export const updatePersona = async (id: number, personaData: IPersonaUpdate): Promise<IPersonaInDB> => {
    const response = await axiosInstance.put(`/personas/${id}`, personaData);
    return response.data;
};

export const deactivatePersona = async (id: number): Promise<void> => {
    await axiosInstance.post(`/personas/${id}/desactivar`);
};

/**
 * Activa una persona en el sistema.
 * @param id El ID de la persona a activar.
 * @returns Una promesa que resuelve con el objeto PersonaInDB actualizada.
 */
export const activatePersona = async (id: number): Promise<void> => {
    await axiosInstance.post(`/personas/${id}/activar`);
};

// --- Servicios para Roles ---


export const assignRoleToPersona = async (personaId: number, rolId: number): Promise<any> => {
    const response = await axiosInstance.post(`/personas/${personaId}/roles/${rolId}`);
    return response.data;
};

/**
 * Obtiene todos los roles disponibles en el sistema.
 * @returns Una promesa que resuelve con una lista de IRolInDB.
 */
export const getRoles = async (): Promise<IRolInDB[]> => {
    const response = await axiosInstance.get('/roles/');
    return response.data;
};