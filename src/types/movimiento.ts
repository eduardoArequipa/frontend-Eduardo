import { Producto } from './producto';
import { IUsuarioNested } from './usuario';

export type TipoMovimientoEnum = 'merma' | 'ajuste_positivo' | 'ajuste_negativo' | 'uso_interno';

export interface MovimientoBase {
    producto_id: number;
    tipo_movimiento: TipoMovimientoEnum;
    cantidad: number;
    motivo?: string;
}

export interface MovimientoCreate extends MovimientoBase {}

export interface MovimientoResponse extends MovimientoBase {
    movimiento_id: number;
    usuario_id: number;
    stock_anterior: number;
    stock_nuevo: number;
    fecha_movimiento: string; // ISO 8601 string

    // Objetos completos del backend
    producto: Producto;
    usuario: IUsuarioNested;
}

export interface MovimientoPagination {
    items: MovimientoResponse[];
    total: number;
}
