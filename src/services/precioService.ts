// src/services/precioService.ts
import { TipoMargenEnum } from '../types/enums';

/**
 * Convierte string a número decimal para cálculos precisos
 */
const parseDecimal = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value || '0');
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formatea número a string con precisión decimal
 */
const formatDecimal = (value: number, decimales: number = 2): string => {
  return value.toFixed(decimales);
};

/**
 * Calcula el precio de venta basado en precio de compra y margen
 */
export const calcularPrecioVenta = (
  precioCompra: string | number,
  tipoMargen: TipoMargenEnum,
  margenValor: string | number
): string => {
  const compra = parseDecimal(precioCompra);
  const margen = parseDecimal(margenValor);

  if (compra <= 0) return '0.00';

  let precioVenta: number;

  if (tipoMargen === TipoMargenEnum.Porcentaje) {
    precioVenta = compra * (1 + margen / 100);
  } else { // TipoMargenEnum.Fijo
    precioVenta = compra + margen;
  }

  // Nunca permitir precio de venta menor al de compra
  precioVenta = Math.max(precioVenta, compra);

  return formatDecimal(precioVenta);
};

/**
 * Calcula el margen aplicado en términos monetarios
 */
export const calcularMargenAplicado = (
  precioCompra: string | number,
  precioVenta: string | number
): string => {
  const compra = parseDecimal(precioCompra);
  const venta = parseDecimal(precioVenta);

  const margenAplicado = Math.max(0, venta - compra);
  return formatDecimal(margenAplicado);
};

/**
 * Calcula el porcentaje de margen real aplicado
 */
export const calcularPorcentajeMargen = (
  precioCompra: string | number,
  precioVenta: string | number
): string => {
  const compra = parseDecimal(precioCompra);
  const venta = parseDecimal(precioVenta);

  if (compra <= 0) return '0.00';

  const porcentaje = ((venta - compra) / compra) * 100;
  return formatDecimal(Math.max(0, porcentaje));
};

/**
 * Valida que el precio de venta no sea menor al de compra
 */
export const validarPrecioVentaMinimo = (
  precioCompra: string | number,
  precioVenta: string | number
): boolean => {
  const compra = parseDecimal(precioCompra);
  const venta = parseDecimal(precioVenta);

  return venta >= compra;
};

/**
 * Obtiene el precio mínimo permitido (igual al precio de compra)
 */
export const obtenerPrecioMinimoPermitido = (precioCompra: string | number): string => {
  return formatDecimal(parseDecimal(precioCompra));
};

/**
 * Calcula datos completos de precio para preview
 */
export const calcularDatosCompletos = (
  precioCompra: string | number,
  tipoMargen: TipoMargenEnum,
  margenValor: string | number
): {
  precioVenta: string;
  margenAplicado: string;
  porcentajeMargen: string;
  esValido: boolean;
} => {
  const precioVenta = calcularPrecioVenta(precioCompra, tipoMargen, margenValor);
  const margenAplicado = calcularMargenAplicado(precioCompra, precioVenta);
  const porcentajeMargen = calcularPorcentajeMargen(precioCompra, precioVenta);
  const esValido = validarPrecioVentaMinimo(precioCompra, precioVenta);

  return {
    precioVenta,
    margenAplicado,
    porcentajeMargen,
    esValido
  };
};

/**
 * Formatea precio para mostrar en la UI
 */
export const formatearPrecioParaUI = (precio: string | number): string => {
  const valor = parseDecimal(precio);
  return `${formatDecimal(valor)} Bs.`;
};

/**
 * Valida entrada de precio desde input
 */
export const validarEntradaPrecio = (input: string): {
  esValido: boolean;
  valor: string;
  error?: string;
} => {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      esValido: false,
      valor: '0.00',
      error: 'El precio no puede estar vacío'
    };
  }

  const regex = /^\d+(\.\d{1,2})?$/;
  if (!regex.test(trimmed)) {
    return {
      esValido: false,
      valor: '0.00',
      error: 'Formato inválido. Use formato: 123.45'
    };
  }

  const valor = parseFloat(trimmed);
  if (valor < 0) {
    return {
      esValido: false,
      valor: '0.00',
      error: 'El precio no puede ser negativo'
    };
  }

  return {
    esValido: true,
    valor: formatDecimal(valor)
  };
};