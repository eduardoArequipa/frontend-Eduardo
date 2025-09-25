// src/types/marca.ts
import { EstadoEnum } from "./enums";

export interface MarcaBase {
    nombre_marca: string;
}

export interface MarcaCreate extends MarcaBase {
    descripcion?: string | null;
    pais_origen?: string | null;
}

export interface MarcaUpdate extends MarcaCreate {
    estado?: EstadoEnum;
}

export interface Marca {
    marca_id: number;
    nombre_marca: string;
    descripcion?: string | null;
    pais_origen?: string | null;
    estado: EstadoEnum;
    creado_en: string;
}

export interface MarcaNested {
    marca_id: number;
    nombre_marca: string;
}

export interface MarcaPagination {
    items: Marca[];
    total: number;
}