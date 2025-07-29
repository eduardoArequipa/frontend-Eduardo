// src/types/unidad_medida.ts
import { EstadoEnum } from "./enums"; 

export interface UnidadMedidaBase {
    nombre_unidad: string;
    abreviatura: string;
    es_fraccionable: boolean;
}

export interface UnidadMedidaCreate extends UnidadMedidaBase {
    descripcion?: string | null;
}

export interface UnidadMedida {
    unidad_id: number;
    nombre_unidad: string;
    abreviatura: string;
    es_fraccionable: boolean;
    descripcion?: string | null;
    estado: EstadoEnum;
    creado_en: string;
}

export interface UnidadMedidaNested {
    unidad_id: number;
    nombre_unidad: string;
    abreviatura: string;
    es_fraccionable: boolean;
}