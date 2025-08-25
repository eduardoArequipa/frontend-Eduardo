// src/types/compra.ts
import { EstadoCompraEnum } from "./enums"; 
import { ProveedorNested } from "./proveedor"; 
import { ProductoSchemaBase } from "./producto";
import { IUsuarioAudit } from "./usuario"; 

export interface DetalleCompraCreate {
    producto_id: number | ''; 
    cantidad: number | ''; 
    precio_unitario: number | '';
    presentacion_compra?: string; // Nuevo
}

export interface DetalleCompra {
    detalle_id: number;
    compra_id: number; 
    producto: ProductoSchemaBase; 
    cantidad: number;
    precio_unitario: number;
    presentacion_compra?: string; // Nuevo
}

export interface CompraBase {
    proveedor_id: number;
    fecha_compra: string;
    estado: EstadoCompraEnum;
    total:number;
}

export interface CompraCreate {
    proveedor_id: number;
    fecha_compra?: string; 
    detalles: DetalleCompraCreate[]; 
    estado?: EstadoCompraEnum; 
}

export interface CompraUpdate {
    proveedor_id?: number; 
    fecha_compra?: string; 
    detalles?: DetalleCompraCreate[]; 
    estado?: EstadoCompraEnum; 
}

export interface Compra extends CompraBase {
    compra_id: number; 
    proveedor: ProveedorNested; 
    detalles: DetalleCompra[]; 
    creador?: IUsuarioAudit | null; 
    modificador?: IUsuarioAudit | null; 
}
export interface GetComprasParams {
    estado?: EstadoCompraEnum;
    proveedor_id?: number;
    creador_id?: number; 
    fecha_desde?: string; 
    fecha_hasta?: string; 
    search?: string; 
    skip?: number; 
    limit?: number; 
}

export interface CompraPagination {
    items: Compra[];
    total: number;
}
