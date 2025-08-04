// src/types/persona.ts
import { EstadoEnum, GeneroEnum } from './enums';
import { IRolInDB } from './rol'; // Asume que IRolInDB existe y coincide con RolInDB del backend
import { IUsuarioCreateNested } from './usuario';

export interface PersonaBase {
    nombre: string;
    apellido_paterno?: string | null; // Opcional según tu backend
    apellido_materno?: string | null;
    ci?: string | null;             // Opcional según tu backend
    genero?: GeneroEnum | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    estado?: EstadoEnum;

}

export interface IPersonaCreate extends PersonaBase {
    rol_ids?: number[]; // IDs de los roles de persona a asignar
    usuario_data?: IUsuarioCreateNested; // Datos para crear un usuario asociado
}

export interface IPersonaUpdate extends Partial<PersonaBase> {
    rol_ids?: number[]; // IDs de los roles de persona para actualizar
}

export interface IPersonaWithRoles extends PersonaBase {
    persona_id: number;
    creado_en: string;
    modificado_en?: string | null;
    modificado_por?: number | null;
    estado: EstadoEnum; // Estado de la persona, aquí es requerido porque viene de DB
    roles: IRolInDB[]; // Confirmado: Lista de roles de la persona
}

export type IPersonaInDB = IPersonaWithRoles;

export interface IPersonaNested extends PersonaBase {
    persona_id: number;
    creado_en: string;
    modificado_en?: string | null;
    modificado_por?: number | null;
    estado: EstadoEnum;

}

export interface PersonaPagination {
    items: IPersonaWithRoles[];
    total: number;
}
