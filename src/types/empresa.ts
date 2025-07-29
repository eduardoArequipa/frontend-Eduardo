// src/types/empresa.ts
import { EstadoEnum } from "./enums"; 

export interface EmpresaBase {
    razon_social: string; 
}


export interface EmpresaCreate extends EmpresaBase {
    identificacion?: string | null; 
    nombre_contacto?: string | null; 
    telefono?: string | null;
    email?: string | null; 
    direccion?: string | null; 
}

export interface EmpresaUpdate {
    razon_social?: string; 
    identificacion?: string | null; 
    nombre_contacto?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    estado?: EstadoEnum; 
}

export interface Empresa extends EmpresaBase {
    empresa_id: number;
    identificacion?: string | null; 
    nombre_contacto?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    estado: EstadoEnum; 

}


export interface EmpresaNested {
    empresa_id: number;
    razon_social: string; 
    identificacion?: string | null; 
    nombre_contacto?: string | null; 
    telefono?: string | null; 
    email?: string | null; 
    direccion?: string | null;
    estado: EstadoEnum;
}