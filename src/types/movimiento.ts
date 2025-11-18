import { Producto } from './producto';
import { IUsuarioNested } from './usuario';

export type TipoMovimientoEnum = 'merma' | 'ajuste_positivo' | 'ajuste_negativo' | 'uso_interno' | 'devolucion' ;

// Para la creación de movimientos
export interface MovimientoItem {
    cantidad: number;
    conversion_id?: number | null;
}

export interface MovimientoCreate {
    producto_id: number;
    tipo_movimiento: TipoMovimientoEnum;
    motivo?: string;
    items: MovimientoItem[];
}

// Para la respuesta de la API
interface ConversionNested {
    nombre_presentacion: string;
}

interface DetalleMovimientoResponse {
    cantidad: number;
    conversion: ConversionNested | null;
}

export interface MovimientoResponse {
    movimiento_id: number;
    producto_id: number;
    usuario_id: number;
    tipo_movimiento: TipoMovimientoEnum;
    cantidad: number; // Cantidad total en unidad base
    motivo?: string;
    stock_anterior: number;
    stock_nuevo: number;
    fecha_movimiento: string; // ISO 8601 string

    // Objetos anidados
    producto: Producto;
    usuario: IUsuarioNested;
    detalles: DetalleMovimientoResponse[];
}

export interface MovimientoPagination {
    items: MovimientoResponse[];
    total: number;
}
