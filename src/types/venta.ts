import { MetodoPagoNested } from "./metodoPago";
import { ProductoSchemaBase } from "./producto";
import { IPersonaNested } from "./persona";
import { EstadoVentaEnum } from "./enums";
import { IUsuarioAudit } from "./usuario"; // Asegúrate de tener este tipo para el creador/modificador

// --- Detalle de Venta ---
// Interfaz para la creación de un detalle de venta.
export interface DetalleVentaCreate {
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
}

// Interfaz completa para un detalle de venta, tal como se recibe de la API.
export interface DetalleVenta extends DetalleVentaCreate {
    detalle_id: number;
    subtotal: number; // El subtotal ahora viene calculado desde el backend.
    producto: ProductoSchemaBase;
}

// --- Venta ---
// Interfaz para la creación de una nueva venta.
export interface VentaCreate {
    persona_id: number | null;
    metodo_pago_id: number;
    estado: EstadoVentaEnum;
    total: number;
    detalles: DetalleVentaCreate[];
}

// Interfaz completa para una Venta, tal como se recibe de la API.
export interface Venta {
    venta_id: number;
    fecha_venta: string;
    total: number;
    estado: EstadoVentaEnum;
    persona_id: number | null;
    metodo_pago_id: number;

    // Relaciones anidadas
    persona?: IPersonaNested;
    metodo_pago: MetodoPagoNested;
    detalles: DetalleVenta[];
    creador?: IUsuarioAudit;
    modificador?: IUsuarioAudit;
    fecha_creacion?: string;
    fecha_actualizacion?: string;
}

export interface VentaPagination {
    items: Venta[];
    total: number;
}
