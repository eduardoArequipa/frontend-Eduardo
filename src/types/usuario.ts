// src/types/usuario.ts

import { EstadoEnum } from './enums';
import { IPersonaWithRoles } from './persona'; // <-- ¡Importa esta interfaz!

export interface IUsuarioBase {
    nombre_usuario: string;
    contraseña: string; // This is a required property here

    estado?: EstadoEnum; // Opcional al crear/actualizar, pero siempre presente en DB
    foto_ruta?: string | null; // Puede ser null si no hay foto
}


export interface IUsuarioCreate extends IUsuarioBase {
    persona_id: number; // Obligatorio al crear un usuario (asociarlo a una Persona existente)
    contraseña: string; // La contraseña sin hashear para la creación
    // rol_ids? no debería estar aquí, los roles se gestionan a través de la persona
}


export interface IUsuarioCreateNested extends IUsuarioBase {
}


export interface IUsuarioUpdate extends Partial<IUsuarioBase> {
    contraseña?: string; 
}


export interface IUsuarioInDB extends IUsuarioBase {
    usuario_id: number;
    persona_id: number; // El ID de la persona asociada
    estado: EstadoEnum; // Obligatorio y siempre presente al recuperar de DB
    intentos_fallidos: number;
    bloqueado_hasta: string | null; // Puede ser string (ISO 8601) o null
    codigo_recuperacion: string | null; // Hice este campo opcional, ya que solo existe temporalmente
    expiracion_codigo_recuperacion: string | null; // Hice este campo opcional
    creado_en: string; // Campo de auditoría (fecha de creación)


    persona: IPersonaWithRoles | null; // Persona asociada, puede ser con roles o sin ellos

}

/**
 * Interfaz para una versión anidada o "ligera" de Usuario, usada en contextos
 * donde solo se necesita información básica (ej. auditoría de creador/modificador).
 */
export interface IUsuarioAudit {
    usuario_id: number;
    nombre_usuario: string;
    foto_ruta?: string | null; // Podría incluirse si se usa en la UI de auditoría (ej. avatar del creador)
}

/**
 * Interfaz para un Usuario cuando se incluye anidado en otros esquemas
 * (ej. en Venta, Compra). Generalmente, es una versión que no incluye sus
 * propias relaciones anidadas completas para evitar recursión infinita en tipos.
 * Podría ser lo mismo que IUsuarioAudit o un subconjunto de IUsuarioInDB.
 */
export interface IUsuarioNested extends IUsuarioAudit {
    // Si necesitas más campos aparte de usuario_id y nombre_usuario en la versión anidada
    // Puedes añadirlos aquí. Por ejemplo, si solo necesitas el estado:
    // estado?: EstadoEnum;
}

/**
 * Interfaz para la respuesta del endpoint /auth/me o cualquier lectura detallada de Usuario.
 * Extiende IUsuarioInDB y añade los detalles del creador/modificador,
 * que son de tipo IUsuarioAudit para evitar ciclos infinitos.
 */
export interface IUsuarioReadAudit extends IUsuarioInDB {
    creador?: IUsuarioAudit; // El usuario que creó este registro (solo ID y nombre)
    modificador?: IUsuarioAudit; // El usuario que modificó por última vez este registro (solo ID y nombre)
}

export interface UsuarioPagination {
    items: IUsuarioReadAudit[];
    total: number;
}
