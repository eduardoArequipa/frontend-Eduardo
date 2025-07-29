// src/types/producto.ts
import { EstadoEnum } from "./enums";
import { CategoriaNested } from "./categoria";
import { IUsuarioAudit } from "./usuario";
import { UnidadMedidaNested } from "./unidad_medida";
import { MarcaNested } from "./marca";

// Corresponde a ProductoBase en el backend
export interface ProductoBase {
    codigo: string;
    nombre: string;
    precio_compra: number;
    precio_venta: number;
    stock_minimo: number;
    categoria_id: number;
    unidad_medida_id: number;
    marca_id: number;
}

export interface ProductoCreate extends ProductoBase {
    imagen_ruta?: string | null;
    stock?: number; // Opcional, con default 0 en el backend
    estado?: EstadoEnum;
    metros_por_rollo?: number | null; // Opcional, solo para unidades "metro"
}

export interface ProductoUpdate {
    codigo?: string;
    nombre?: string;
    precio_compra?: number;
    precio_venta?: number;
    stock?: number; // Soporta fracciones
    stock_minimo?: number; // Soporta fracciones
    categoria_id?: number;
    imagen_ruta?: string | null;
    estado?: EstadoEnum;
    unidad_medida_id?: number; // Opcional en update
    marca_id?: number;         // Opcional en update
    metros_por_rollo?: number | null; // Opcional, solo para unidades "metro"
}

export interface Producto extends ProductoBase {
    producto_id: number;
    imagen_ruta?: string | null;
    stock: number; // Soporta fracciones
    estado: EstadoEnum;

    categoria: CategoriaNested;
    creador?: IUsuarioAudit | null;
    modificador?: IUsuarioAudit | null;

    // Relaciones anidadas para Unidad de Medida y Marca
    unidad_medida: UnidadMedidaNested; // Espera un objeto que cumpla la interfaz UnidadMedidaNested
    marca: MarcaNested;                 // Espera un objeto que cumpla la interfaz MarcaNested
    metros_por_rollo?: number | null;   // Opcional, reflejo del backend
}

// Para resolver el error de "ProductoNested no exportado"
// Si tu interfaz `Producto` ya contiene las relaciones anidadas, puedes simplemente
// crear un alias `ProductoNested` que apunte a `Producto`.
export type ProductoNested = Producto; // <--- ¡Este es el cambio clave aquí!

export interface ProductoSchemaBase {
    producto_id: number;
    codigo: string;
    nombre: string;
    precio_compra: number;
    precio_venta: number;
    stock: number; // Soporta fracciones
    estado: EstadoEnum;
    unidad_medida_id: number;
    marca_id: number;
    metros_por_rollo?: number | null; // Opcional, reflejo del backend
    nombre_unidad?: string;
    abreviatura_unidad?: string;
    es_fraccionable_unidad?: boolean;
    nombre_marca?: string;
}