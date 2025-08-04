// src/types/compra.ts
import { EstadoCompraEnum } from "./enums"; 
import { ProveedorNested } from "./proveedor"; 
import { ProductoSchemaBase } from "./producto";
import { UsuarioAudit } from "./usuario"; 
export interface DetalleCompraCreate {
    producto_id: number | ''; 
    cantidad: number | ''; 
    precio_unitario: number | ''; 
}

export interface DetalleCompra {
    detalle_id: number;
    compra_id: number; 
    producto: ProductoSchemaBase; 
    cantidad: number;
    precio_unitario: number;
}

export interface CompraBase {
    proveedor_id: number;
    fecha_compra: string; // Formato ISO 8601 (YYYY-MM-DDTHH:MM:SS)
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
    creador?: UsuarioAudit | null; 
    modificador?: UsuarioAudit | null; 
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