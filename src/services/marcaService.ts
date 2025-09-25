// src/services/marcaService.ts
import axiosInstance from '../api/axiosInstance'; // Import your configured Axios instance
import { Marca, MarcaCreate, MarcaUpdate, MarcaPagination } from '../types/marca'; // Import Marca and MarcaCreate types
import { EstadoEnum } from '../types/enums'; // Import EstadoEnum if used for filters/status types

/**
 * Interface for query parameters when fetching brands.
 */
interface GetMarcasParams {
    estado?: EstadoEnum;
    search?: string; // Search by brand name
    skip?: number;
    limit?: number;
}

/**
 * Fetches a list of brands with pagination.
 * @param params Optional parameters for filtering, searching, and pagination.
 * @returns A promise that resolves to a MarcaPagination object.
 */
export const getMarcas = async (params?: GetMarcasParams): Promise<MarcaPagination> => {
    const response = await axiosInstance.get<MarcaPagination>('/marcas/', { params });
    return response.data;
};

/**
 * Fetches a brand by its ID.
 * @param id The ID of the brand to fetch.
 * @returns A promise that resolves to a Marca object.
 */
export const getMarcaById = async (id: number): Promise<Marca> => {
    const response = await axiosInstance.get(`/marcas/${id}`);
    // Assuming the backend returns an object that conforms to Marca.
    return response.data;
};

/**
 * Creates a new brand.
 * @param marcaData The data for the brand to create.
 * @returns A promise that resolves to the created Marca.
 */
export const createMarca = async (marcaData: MarcaCreate): Promise<Marca> => {
    const response = await axiosInstance.post('/marcas/', marcaData);
    // Assuming the backend returns the created Marca.
    return response.data;
};

/**
 * Updates an existing brand.
 * Note: Using MarcaCreate for update as per backend schema, assuming all fields in MarcaCreate are updatable.
 * If you need a specific MarcaUpdate interface with partial fields, define it in types/marca.ts.
 * @param id The ID of the brand to update.
 * @param marcaData The updated data for the brand.
 * @returns A promise that resolves to the updated Marca.
 */
export const updateMarca = async (id: number, marcaData: MarcaUpdate): Promise<Marca> => {
    const response = await axiosInstance.put(`/marcas/${id}`, marcaData);
    // Assuming the backend returns the updated Marca.
    return response.data;
};

/**
 * Deactivates (soft deletes) a brand by its ID.
 * @param id The ID of the brand to deactivate.
 * @returns A promise that resolves when the operation completes.
 */
export const deleteMarca = async (id: number): Promise<void> => {
    // Your DELETE /marcas/{id} route should return 204 No Content
    await axiosInstance.delete(`/marcas/${id}`);
};

/**
 * Activates a brand by its ID.
 * @param id The ID of the brand to activate.
 * @returns A promise that resolves to the activated Marca.
 */
export const activateMarca = async (id: number): Promise<Marca> => {
    const response = await axiosInstance.patch(`/marcas/${id}`);
    return response.data;
};
