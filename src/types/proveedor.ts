// src/types/proveedor.ts
import { EstadoEnum } from "./enums"; 
import { PersonaNested, PersonaCreate,PersonaUpdate } from "./persona";
import { EmpresaNested, EmpresaCreate, EmpresaUpdate } from "./empresa";

export interface ProveedorBase {
    estado: EstadoEnum;
}

export interface ProveedorCreate extends ProveedorBase {
    persona_id?: number | null;
    empresa_id?: number | null;
    persona_data?: PersonaCreate | null;
    empresa_data?: EmpresaCreate | null;
}

export interface ProveedorUpdate {
    estado?: EstadoEnum; 
    persona_data?: PersonaUpdate | null; 
    empresa_data?: EmpresaUpdate | null; 
}

export interface Proveedor extends ProveedorBase {
    proveedor_id: number; 
    persona?: PersonaNested | null; 
    empresa?: EmpresaNested | null; 

}

export interface ProveedorNested {
    proveedor_id: number;
    persona?: PersonaNested | null; 
    empresa?: EmpresaNested | null; 
}


export interface GetProveedoresParams {
    estado?: EstadoEnum;
    tipo?: 'persona' | 'empresa'; 
    search?: string; 
    skip?: number; 
    limit?: number; 
}
