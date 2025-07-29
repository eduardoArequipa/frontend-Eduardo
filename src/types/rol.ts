// src/types/rol.ts

import { EstadoEnum } from './enums';

/**
 * Interfaz base para los datos de un Rol.
 * Define los campos comunes para creación y actualización.
 */
export interface IRolBase {
    nombre_rol: string;
    descripcion: string;
}

/**
 * Interfaz para la creación de un Rol.
 * Extiende de IRolBase.
 */
export interface IRolCreate extends IRolBase {
    // No se añaden campos adicionales aquí por ahora,
    // ya que el estado suele ser manejado por defecto en el backend al crear.
}

/**
 * Interfaz para la actualización de un Rol.
 * Todos los campos son opcionales para permitir actualizaciones parciales.
 */
export interface IRolUpdate extends Partial<IRolBase> { // Usa Partial para hacer todos los campos opcionales
    estado?: EstadoEnum; // Permite actualizar el estado del rol
}

/**
 * Interfaz que representa un Rol tal como se almacena en la base de datos
 * y se recupera desde el backend. Incluye el ID y el estado.
 */
export interface IRolInDB extends IRolBase {
    rol_id: number;
    estado: EstadoEnum; // El estado es obligatorio cuando se recupera de la DB
    // Opcionalmente, puedes añadir campos de auditoría si el backend los devuelve
    // creado_en?: string;
    // modificado_en?: string;
}

/**
 * Interfaz para un Rol anidado, usado en otros esquemas
 * donde solo se necesita información básica del rol (ej. en Usuario).
 */
export interface IRolNested extends IRolBase {
    // Asegúrate de incluir el 'estado' si tu JSON lo tiene para cada rol
    estado: EstadoEnum | string; // O el tipo exacto que uses
    // Si el 'rol_id' se incluye en la respuesta anidada (tu JSON no lo muestra, así que es opcional)
    // rol_id?: number; 
}