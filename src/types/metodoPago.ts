// src/types/metodoPago.ts
import { EstadoEnum } from './enums';

export interface MetodoPagoNested {
  metodo_pago_id: number;
  nombre_metodo: string;
  estado: EstadoEnum;
}