// src/types/producto.ts
import { EstadoEnum, TipoMargenEnum } from "./enums";
import { CategoriaNested } from "./categoria";
import { IUsuarioAudit } from "./usuario";
import { UnidadMedidaNested } from "./unidad_medida";
import { MarcaNested } from "./marca";

// Interfaz para las conversiones de compra/venta
export interface Conversion {
  id: number;
  producto_id: number;
  nombre_presentacion: string;
  unidades_por_presentacion: number;
  es_para_compra: boolean;
  es_para_venta: boolean;
  es_activo?: boolean;
  descripcion_detallada?: string | null;
}

export interface ConversionCreate {
  nombre_presentacion: string;
  unidades_por_presentacion: number;
  es_para_compra: boolean;
  es_para_venta: boolean;
  descripcion_detallada?: string | null;
}

// Corresponde a ProductoBase en el backend
export interface ProductoBase {
    codigo: string;
    nombre: string;
    precio_compra: string; // String para precisión decimal en precios
    precio_venta: string; // String para precisión decimal en precios
    stock_minimo: number;
    categoria_id: number;
    unidad_inventario_id: number;
    marca_id: number;
    unidad_compra_predeterminada?: string | null;
    tipo_margen?: TipoMargenEnum;
    margen_valor?: string; // String para precisión decimal en márgenes
    precio_manual_activo?: boolean;
}

// Tipo que se usa en el formulario de ventas para buscar productos
// Es un subconjunto de Producto, pero incluye las conversiones
export interface ProductoSchemaBase {
    producto_id: number;
    codigo: string;
    nombre: string;
    precio_venta: string; // String para precisión decimal
    stock: number; // Número entero para stock
    unidad_inventario: UnidadMedidaNested;
    conversiones: Conversion[];
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
    precio_compra?: string; // String para precisión decimal
    precio_venta?: string; // String para precisión decimal
    stock?: number; // Número entero para stock
    stock_minimo?: number;
    categoria_id?: number;
    imagen_ruta?: string | null;
    estado?: EstadoEnum;
    unidad_inventario_id?: number;
    marca_id?: number;
    unidad_compra_predeterminada?: string | null;
    tipo_margen?: TipoMargenEnum;
    margen_valor?: string; // String para precisión decimal
    precio_manual_activo?: boolean;
}

// Una presentación del desglose de stock
export interface DesglosePresentacion {
    nombre: string;
    cantidad: number;
    abreviatura: string;
}

// Información del stock convertido a unidad de venta preferida
export interface StockConvertido {
    cantidad: number;
    unidad_nombre: string;
    unidad_abreviatura: string;
    es_aproximado?: boolean; // Si la conversión no es exacta
}

// El tipo de dato COMPLETO del producto
export interface Producto extends ProductoBase {
    producto_id: number;
    imagen_ruta?: string | null;
    stock: number; // Número entero para stock
    estado: EstadoEnum;
    categoria: CategoriaNested;
    creador?: IUsuarioAudit | null;
    modificador?: IUsuarioAudit | null;
    unidad_inventario: UnidadMedidaNested;
    marca: MarcaNested;
    conversiones: Conversion[];
    stock_convertido?: StockConvertido | null; // Nuevo campo calculado
    stock_desglosado?: DesglosePresentacion[] | null; // Nuevo campo para desglose detallado
}

export interface ProductoPagination {
    items: Producto[];
    total: number;
}

// Interfaces para cálculo de precios sugeridos
export interface PrecioSugeridoRequest {
    precio_compra: string; // String para precisión decimal
    tipo_margen: TipoMargenEnum;
    margen_valor: string; // String para precisión decimal
}

export interface PrecioSugeridoResponse {
    precio_compra: string; // String para precisión decimal
    precio_venta_sugerido: string; // String para precisión decimal
    tipo_margen: TipoMargenEnum;
    margen_valor: string; // String para precisión decimal
    margen_aplicado: string; // String para precisión decimal
}
