// src/types/categoria.ts

import { EstadoEnum } from "./enums"; 

export interface CategoriaBase {
    nombre_categoria: string;
}

export interface CategoriaCreate extends CategoriaBase {
}

export interface CategoriaUpdate {
    nombre_categoria?: string; 
    estado?: EstadoEnum; 
}

export interface Categoria extends CategoriaBase {
    categoria_id: number; 
    estado: EstadoEnum;

}
export interface CategoriaNested {
    categoria_id: number;
    nombre_categoria: string;
}

export interface CategoriaPagination {
    items: Categoria[];
    total: number;
}
