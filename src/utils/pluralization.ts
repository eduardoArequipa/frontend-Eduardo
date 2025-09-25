// src/utils/pluralization.ts
/**
 * Pluraliza correctamente las palabras en español
 * @param palabra - La palabra en singular
 * @param cantidad - La cantidad para determinar si pluralizar
 * @returns La palabra correctamente pluralizada
 */
export function pluralizar(palabra: string, cantidad: number): string {
    // Si es 1, devolver singular
    if (cantidad === 1) {
        return palabra;
    }

    // Convertir a minúsculas para el análisis
    const palabraLower = palabra.toLowerCase();
    
    // Reglas de pluralización en español
    // 1. Palabras que terminan en vocal no acentuada: agregar 's'
    if (palabraLower.match(/[aeiou]$/)) {
        return palabra + 's';
    }
    
    // 2. Palabras que terminan en consonante: agregar 'es'
    if (palabraLower.match(/[bcdfghjklmnpqrstvwxyz]$/)) {
        return palabra + 'es';
    }
    
    // 3. Palabras que terminan en 'z': cambiar 'z' por 'ces'
    if (palabraLower.endsWith('z')) {
        return palabra.slice(0, -1) + 'ces';
    }
    
    // 4. Palabras que terminan en vocal acentuada: agregar 's'
    if (palabraLower.match(/[áéíóú]$/)) {
        return palabra + 's';
    }
    
    // Por defecto, agregar 's'
    return palabra + 's';
}

/**
 * Formatea correctamente una presentación con su cantidad
 * @param cantidad - La cantidad numérica
 * @param nombreSingular - El nombre de la presentación en singular
 * @param abreviatura - La abreviatura de la presentación (opcional)
 * @param incluirAbreviatura - Si incluir la abreviatura en el resultado
 * @returns String formateado con cantidad y presentación pluralizada correctamente
 */
export function formatearPresentacion(
    cantidad: number | string,
    nombreSingular: string,
    abreviatura?: string,
    incluirAbreviatura = false
): string {
    // Convertir cantidad a número si viene como string
    const cantidadNumero = typeof cantidad === 'string' ? parseFloat(cantidad) : cantidad;

    // Validar que sea un número válido
    if (isNaN(cantidadNumero)) {
        console.warn('formatearPresentacion: cantidad inválida', cantidad);
        return `${cantidad} ${nombreSingular}`;
    }

    const nombrePluralizadlo = pluralizar(nombreSingular, cantidadNumero);

    // Formatear cantidad: si es entero, sin decimales; si es decimal, con decimales
    const cantidadFormateada = cantidadNumero % 1 === 0
        ? cantidadNumero.toString()
        : cantidadNumero.toFixed(2).replace(/\.?0+$/, '');

    if (incluirAbreviatura && abreviatura) {
        return `${cantidadFormateada} ${nombrePluralizadlo} (${abreviatura})`;
    }

    return `${cantidadFormateada} ${nombrePluralizadlo}`;
}

/**
 * Formatea la presentación de forma compacta usando abreviatura cuando está disponible
 */
export function formatearPresentacionCompacta(
    cantidad: number | string,
    nombreSingular: string,
    abreviatura?: string
): string {
    // Convertir cantidad a número si viene como string
    const cantidadNumero = typeof cantidad === 'string' ? parseFloat(cantidad) : cantidad;

    // Validar que sea un número válido
    if (isNaN(cantidadNumero)) {
        console.warn('formatearPresentacionCompacta: cantidad inválida', cantidad);
        return `${cantidad} ${abreviatura || nombreSingular}`;
    }

    // Formatear cantidad: si es entero, sin decimales; si es decimal, con decimales
    const cantidadFormateada = cantidadNumero % 1 === 0
        ? cantidadNumero.toString()
        : cantidadNumero.toFixed(2).replace(/\.?0+$/, '');

    // Si hay abreviatura, usarla
    if (abreviatura && abreviatura.trim()) {
        return `${cantidadFormateada} ${abreviatura}`;
    }

    // Si no hay abreviatura, usar el nombre pluralizado
    const nombrePluralizadlo = pluralizar(nombreSingular, cantidadNumero);
    return `${cantidadFormateada} ${nombrePluralizadlo}`;
}