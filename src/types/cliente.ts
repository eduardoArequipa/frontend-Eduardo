// src/types/cliente.ts

import { IPersonaNested } from './persona'; // Importamos el tipo de Persona

// Define la interfaz base para un Cliente
// Un Cliente es una Persona con atributos adicionales si los hubiera,
// y es crucial que contenga el persona_id.
export interface IClienteBase {
    // Si la base de datos aún mantiene un cliente_id separado
    // aunque la lógica de negocio se centre en persona_id, inclúyelo.
    // cliente_id: number; // Opcional, si el backend todavía lo usa como ID primario para el cliente
    // Puedes añadir otros campos específicos de cliente si existen
    // por ejemplo:
    // historial_compras_acumulado?: number;
}

// Interfaz para un Cliente tal como se recibe de la base de datos,
// incluyendo los detalles anidados de la Persona.
// Esta es la que usaría ClienteAutocomplete para devolver la información completa.
export interface IClienteInDB extends IClienteBase {
    cliente_id: number; // Aseguramos que cliente_id existe para identificar la instancia de Cliente
    persona_id: number; // EL CAMPO CRÍTICO: el ID de la persona asociada a este cliente
    persona: IPersonaNested; // Detalles anidados de la persona
    estado: string; // Asumiendo que un cliente también tiene un estado (Activo/Inactivo)
    fecha_creacion: string;
    fecha_actualizacion: string;
}

// Interfaz para la creación de un Cliente (cuando se envía al backend)
// Generalmente, solo necesitaríamos los datos de la persona y el estado inicial
export interface IClienteCreate {
    persona_id?: number; // Si se asocia a una persona existente
    persona?: Omit<IPersonaNested, 'persona_id' | 'fecha_creacion' | 'fecha_actualizacion' | 'estado'>; // O si se crea una nueva persona
    estado?: string;
}

// Interfaz para la actualización de un Cliente
export interface IClienteUpdate {
    persona_id?: number; // Para reasignar si es necesario
    estado?: string;
}

// Interfaz para cuando solo se necesita una referencia anidada a Cliente,
// por ejemplo, dentro de un objeto de Venta si se necesita un resumen rápido
export interface IClienteNested {
    cliente_id: number;
    persona_id: number; // Esto es crucial para la referencia
    persona: IPersonaNested; // Solo los datos esenciales de la persona
    estado?: string;
}