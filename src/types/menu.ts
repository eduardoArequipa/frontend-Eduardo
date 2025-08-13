// src/types/menu.ts

/**
 * Interfaz que representa un Menú/Módulo tal como se recupera del backend.
 */
export interface IMenuInDB {
    menu_id: number;
    nombre: string;
    ruta: string;
    descripcion?: string | null;
    icono?: string | null;
}
