import { Producto } from './producto';
import { Usuario } from './usuario';

export interface MovimientoBase {
    producto_id: number;
    tipo_movimiento: 'merma' | 'ajuste_positivo' | 'ajuste_negativo' | 'uso_interno';
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

    // Opcional: Si el backend devuelve los objetos completos
    producto?: Producto;
    usuario?: Usuario;
}
