/**
 * Utilidades para manejo de fechas y formatos estándar en el sistema.
 * Equivalente al date_utils.py del backend
 */

// Formatos estándar del sistema
//const FORMATO_FECHA_SISTEMA = "DD/MM/YYYY"; // 29/11/2025
//const FORMATO_FECHA_HORA_SISTEMA = "DD/MM/YYYY HH:MM"; // 29/11/2025 18:50
//const FORMATO_FECHA_HORA_COMPLETA = "DD/MM/YYYY HH:MM:SS"; // 29/11/2025 18:50:20

// Formato para nombres de archivos (sin caracteres especiales)
//const FORMATO_FECHA_ARCHIVO = "YYYYMMDD"; // 20251129

/**
 * Formatea una fecha al formato estándar del sistema (DD/MM/YYYY)
 */
export const formatearFecha = (
  fecha: Date = new Date(),
  incluirHora: boolean = false,
  horaCompleta: boolean = false
): string => {
  const pad = (num: number): string => num.toString().padStart(2, '0');

  const dia = pad(fecha.getDate());
  const mes = pad(fecha.getMonth() + 1);
  const anio = fecha.getFullYear();

  const fechaFormateada = `${dia}/${mes}/${anio}`;

  if (horaCompleta && incluirHora) {
    const horas = pad(fecha.getHours());
    const minutos = pad(fecha.getMinutes());
    const segundos = pad(fecha.getSeconds());
    return `${fechaFormateada} ${horas}:${minutos}:${segundos}`;
  } else if (incluirHora) {
    const horas = pad(fecha.getHours());
    const minutos = pad(fecha.getMinutes());
    return `${fechaFormateada} ${horas}:${minutos}`;
  }

  return fechaFormateada;
};

/**
 * Formatea una fecha para usar en nombres de archivos (YYYYMMDD)
 */
export const formatearFechaArchivo = (fecha: Date = new Date()): string => {
  const pad = (num: number): string => num.toString().padStart(2, '0');

  const anio = fecha.getFullYear();
  const mes = pad(fecha.getMonth() + 1);
  const dia = pad(fecha.getDate());

  return `${anio}${mes}${dia}`;
};

/**
 * Obtiene la fecha actual en formato del sistema
 */
export const obtenerFechaActualFormateada = (
  incluirHora: boolean = true,
  horaCompleta: boolean = false
): string => {
  return formatearFecha(new Date(), incluirHora, horaCompleta);
};

/**
 * Obtiene la fecha actual para nombres de archivo
 */
export const obtenerFechaArchivo = (): string => {
  return formatearFechaArchivo(new Date());
};

/**
 * Formatea un período ISO a formato legible
 * - "2025-12-09" -> "09/12/2025"
 * - "2025-12" -> "12/2025"
 * - "2025" -> "2025"
 */
export const formatearPeriodo = (periodo: string): string => {
  // Si es formato YYYY-MM-DD (10 caracteres)
  if (periodo.length === 10 && periodo.includes('-')) {
    const [anio, mes, dia] = periodo.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  // Si es formato YYYY-MM (7 caracteres)
  if (periodo.length === 7 && periodo.includes('-')) {
    const [anio, mes] = periodo.split('-');
    return `${mes}/${anio}`;
  }

  // Si es solo el año o cualquier otro formato, retornar tal cual
  return periodo;
};
