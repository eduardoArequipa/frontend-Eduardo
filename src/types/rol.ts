// src/types/rol.ts

import { EstadoEnum } from './enums';
import { IMenuInDB } from './menu';
/**
 * Interfaz que representa un Rol tal como se almacena en la base de datos
 * y se recupera desde el backend. Incluye el ID, estado y los menús asociados.
 */
export interface IRolInDB {
    rol_id: number;
    nombre_rol: string;
    descripcion: string;
    estado: EstadoEnum;
   menus: IMenuInDB[]; // Menús a los que el rol tiene acceso
}

/**
 * Interfaz para un Rol anidado, usado en otros esquemas
 * donde solo se necesita información básica del rol (ej. en Usuario).
 */
export interface IRolNestedSimple {
    rol_id: number;
    nombre_rol: string;
}

/**
 * Interfaz para crear un nuevo rol.
 */
export interface IRolCreate {
    nombre_rol: string;
    descripcion?: string;
    estado?: EstadoEnum;
}

/**
 * Interfaz para actualizar un rol existente.
 */
export interface IRolUpdate {
    nombre_rol?: string;
    descripcion?: string;
    estado?: EstadoEnum;
}
