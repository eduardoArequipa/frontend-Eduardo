// src/types/producto.ts
import { EstadoEnum } from "./enums";
import { CategoriaNested } from "./categoria";
import { IUsuarioAudit } from "./usuario";
import { UnidadMedidaNested } from "./unidad_medida";
import { MarcaNested } from "./marca";

// Interfaz para las conversiones de compra/venta
export interface ConversionCompra {
  conversion_id: number;
  producto_id: number;
  nombre_presentacion: string;
  unidad_inventario_por_presentacion: number;
}

export interface ConversionCompraCreate {
  nombre_presentacion: string;
  unidad_inventario_por_presentacion: number;
}

// Corresponde a ProductoBase en el backend
export interface ProductoBase {
    codigo: string;
    nombre: string;
    precio_compra: number;
    precio_venta: number;
    stock_minimo: number;
    categoria_id: number;
    unidad_inventario_id: number;
    marca_id: number;
    unidad_compra_predeterminada?: string | null;
}

// Tipo que se usa en el formulario de ventas para buscar productos
// Es un subconjunto de Producto, pero incluye las conversiones
export interface ProductoSchemaBase {
    producto_id: number;
    codigo: string;
    nombre: string;
    precio_venta: number;
    stock: number;
    unidad_inventario: UnidadMedidaNested;
    conversiones: ConversionCompra[];
    estado: EstadoEnum;
}


export interface ProductoCreate extends ProductoBase {
    imagen_ruta?: string | null;
    stock?: number;
    estado?: EstadoEnum;
}

export interface ProductoUpdate {
    codigo?: string;
    nombre?: string;
    precio_compra?: number;
    precio_venta?: number;
    stock?: number;
    stock_minimo?: number;
    categoria_id?: number;
    imagen_ruta?: string | null;
    estado?: EstadoEnum;
    unidad_inventario_id?: number;
    marca_id?: number;
    unidad_compra_predeterminada?: string | null;
}

// El tipo de dato COMPLETO del producto
export interface Producto extends ProductoBase {
    producto_id: number;
    imagen_ruta?: string | null;
    stock: number;
    estado: EstadoEnum;
    categoria: CategoriaNested;
    creador?: IUsuarioAudit | null;
    modificador?: IUsuarioAudit | null;
    unidad_inventario: UnidadMedidaNested;
    marca: MarcaNested;
    conversiones: ConversionCompra[];
}

export interface ProductoPagination {
    items: Producto[];
    total: number;
}
