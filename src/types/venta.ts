
import { MetodoPagoNested } from "./metodoPago";
import {  ProductoSchemaBase } from "./producto"; 
import { IPersonaNested } from "./persona"; 

import { EstadoVentaEnum } from "./enums";

export interface CarritoItem {
    producto_id: number;
    codigo: string;
    nombre: string;
    cantidad_entrada: number;
    precio_unitario: number;
    stock_disponible_base_unit: number;
    metros_por_rollo: number | null;
    is_meter_product: boolean;
    sale_mode: 'rollo' | 'metro' | 'unidad';
}

// --- DetalleVenta ---
export interface DetalleVentaBase {
    producto_id: number;
    cantidad: number; 
    precio_unitario: number; 
}

export interface DetalleVentaCreate extends DetalleVentaBase {}

export interface DetalleVentaInDB extends DetalleVentaBase {
    detalle_id: number;
    subtotal: number; 
    producto: ProductoSchemaBase; 
    fecha_creacion?: string;
    fecha_actualizacion?: string;
}

export interface VentaBase {
    fecha_venta?: string; 
    persona_id: number | null; 
    metodo_pago_id: number;
    estado: EstadoVentaEnum;
    total: number;
}

export interface VentaCreate extends VentaBase {
    detalles: DetalleVentaCreate[];
}

export interface VentaInDB extends VentaBase {
    venta_id: number;
    fecha_venta: string; 
    total: number; 

    persona?: IPersonaNested; 

    metodo_pago: MetodoPagoNested;
    detalles: DetalleVentaInDB[]; 
    creador?: IPersonaNested; 
    modificador?: IPersonaNested; 
    fecha_creacion?: string;
    fecha_actualizacion?: string;
}

export interface Venta extends VentaInDB {}

