import axiosInstance from '../api/axiosInstance';
import { MovimientoResponse, MovimientoCreate, MovimientoPagination, TipoMovimientoEnum } from '../types/movimiento';
import { PaginationParams } from '../types/pagination';

export interface GetMovimientosParams extends PaginationParams {
    producto_id?: number;
    tipo_movimiento?: TipoMovimientoEnum;
    search?: string; // Para buscar por motivo
}

export const getMovimientos = async (params?: GetMovimientosParams): Promise<MovimientoPagination> => {
    try {
        const response = await axiosInstance.get<MovimientoPagination>(`/movimientos/`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching movimientos:", error);
        throw error;
    }
};

export const createMovimiento = async (movimiento: MovimientoCreate): Promise<MovimientoResponse> => {
    try {
        const response = await axiosInstance.post(`/movimientos/`, movimiento);
        return response.data;
    } catch (error) {
        console.error("Error creating movimiento:", error);
        throw error;
    }
};