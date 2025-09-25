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

/**
 * Interfaz extendida que incluye información de roles para filtrado dinámico.
 */
export interface IMenuWithRoles extends IMenuInDB {
    rol_menu?: Array<{
        rol: {
            rol_id: number;
            nombre_rol: string;
        };
    }>;
}
