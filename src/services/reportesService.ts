import axiosInstance from '../api/axiosInstance';
import { notification } from 'antd';

// Interfaces para los parámetros de reportes
export interface ReporteVentasParams {
  fecha_desde?: string;
  fecha_hasta?: string;
  periodo_tipo?: 'dia' | 'mes' | 'año';
  producto_ids?: number[];
  categoria_ids?: number[];
  empleado_ids?: number[];
  metodo_pago_ids?: number[];
}

export interface ReporteComprasParams {
  fecha_desde?: string;
  fecha_hasta?: string;
  periodo_tipo?: 'dia' | 'mes' | 'año';
  proveedor_ids?: number[];
  producto_ids?: number[];
  categoria_ids?: number[];
  empleado_ids?: number[];
}

export interface ReporteProductosParams {
  categoria_ids?: number[];
  marca_ids?: number[];
  stock_minimo?: boolean;
  sin_stock?: boolean;
}

// Función genérica para descargar PDFs
const downloadPDF = async (url: string, params: any, filename: string) => {
  try {
    // Limpiar parámetros indefinidos
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null && (Array.isArray(v) ? v.length > 0 : true))
    );

    const response = await axiosInstance.get(url, {
      params: {
        ...cleanParams,
        formato: 'pdf'
      },
      responseType: 'blob',
    });

    // Crear una URL para el blob y simular un clic para descargar
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;

    // Extraer el nombre del archivo de los encabezados de respuesta
    const contentDisposition = response.headers['content-disposition'];
    let finalFileName = filename;
    if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.*)"/); 
        if (fileNameMatch && fileNameMatch.length === 2) {
            finalFileName = fileNameMatch[1];
        }
    }

    link.setAttribute('download', finalFileName);
    document.body.appendChild(link);
    link.click();

    // Limpiar
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    notification.success({
      message: 'Reporte Generado',
      description: 'La descarga de tu reporte en PDF ha comenzado.',
    });

  } catch (error: any) {
    console.error(`Error al generar el reporte en PDF (${url}):`, error);

    let errorMessage = "Ocurrió un error al generar el reporte.";
    let isNoDataError = false;

    if (error.response) {
      if (error.response.status === 404 || error.response.status === 400) {
        // Usar el mensaje del backend si está disponible
        errorMessage = error.response.data?.detail || "No se encontraron datos con los filtros seleccionados.";
        isNoDataError = true;
      }
    }

    // Usar alert nativo que siempre funciona
    if (isNoDataError) {
      alert(`📊 SIN DATOS DISPONIBLES\n\n${errorMessage}\n\nPor favor, registra ventas/compras primero para poder generar reportes.`);
    } else {
      alert(`❌ ERROR\n\n${errorMessage}`);
    }

    throw error;
  }
};

// Función genérica para obtener datos JSON
const fetchReportData = async (url: string, params: any) => {
  try {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null && (Array.isArray(v) ? v.length > 0 : true))
    );

    const response = await axiosInstance.get(url, {
      params: {
        ...cleanParams,
        formato: 'json'
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(`Error al obtener datos del reporte (${url}):`, error);

    let errorMessage = "Ocurrió un error al obtener los datos del reporte.";
    let isNoDataError = false;

    if (error.response) {
      if (error.response.status === 404 || error.response.status === 400) {
        errorMessage = error.response.data?.detail || "No se encontraron datos con los filtros seleccionados.";
        isNoDataError = true;
      }
    }

    // Usar alert nativo que siempre funciona
    if (isNoDataError) {
      alert(`📊 SIN DATOS DISPONIBLES\n\n${errorMessage}\n\nPor favor, registra datos primero para poder generar reportes.`);
    } else {
      alert(`❌ ERROR\n\n${errorMessage}`);
    }

    throw error;
  }
};

// Servicios para reportes de ventas
export const generarReporteVentasPDF = async (params: ReporteVentasParams): Promise<void> => {
  return downloadPDF('/reportes/ventas', params, 'reporte_ventas.pdf');
};

export const obtenerReporteVentasJSON = async (params: ReporteVentasParams) => {
  return fetchReportData('/reportes/ventas', params);
};

// Servicios para reportes de compras
export const generarReporteComprasPDF = async (params: ReporteComprasParams): Promise<void> => {
  return downloadPDF('/reportes/compras', params, 'reporte_compras.pdf');
};

export const obtenerReporteComprasJSON = async (params: ReporteComprasParams) => {
  return fetchReportData('/reportes/compras', params);
};

// Servicios para reportes de productos
export const generarReporteProductosPDF = async (params: ReporteProductosParams): Promise<void> => {
  return downloadPDF('/reportes/productos', params, 'reporte_inventario.pdf');
};

export const obtenerReporteProductosJSON = async (params: ReporteProductosParams) => {
  return fetchReportData('/reportes/productos', params);
};

// Funciones de utilidad para períodos
export const getPeriodoActual = (tipo: 'dia' | 'mes' | 'año'): { fecha_desde: string; fecha_hasta: string } => {
  const ahora = new Date();
  let fechaDesde: Date;
  let fechaHasta: Date;

  switch (tipo) {
    case 'dia':
      fechaDesde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      fechaHasta = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);
      break;
    case 'mes':
      fechaDesde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      fechaHasta = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
      break;
    case 'año':
      fechaDesde = new Date(ahora.getFullYear(), 0, 1);
      fechaHasta = new Date(ahora.getFullYear() + 1, 0, 1);
      break;
    default:
      fechaDesde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      fechaHasta = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
  }

  return {
    fecha_desde: fechaDesde.toISOString().split('T')[0],
    fecha_hasta: fechaHasta.toISOString().split('T')[0]
  };
};

// Funciones específicas para generar reportes rápidos
export const generarReporteVentasHoy = () => {
  const { fecha_desde, fecha_hasta } = getPeriodoActual('dia');
  return generarReporteVentasPDF({ periodo_tipo: 'dia', fecha_desde, fecha_hasta });
};

export const generarReporteVentasMes = () => {
  const { fecha_desde, fecha_hasta } = getPeriodoActual('mes');
  return generarReporteVentasPDF({ periodo_tipo: 'mes', fecha_desde, fecha_hasta });
};

export const generarReporteVentasAño = () => {
  const { fecha_desde, fecha_hasta } = getPeriodoActual('año');
  return generarReporteVentasPDF({ periodo_tipo: 'año', fecha_desde, fecha_hasta });
};

export const generarReporteComprasHoy = () => {
  const { fecha_desde, fecha_hasta } = getPeriodoActual('dia');
  return generarReporteComprasPDF({ periodo_tipo: 'dia', fecha_desde, fecha_hasta });
};

export const generarReporteComprasMes = () => {
  const { fecha_desde, fecha_hasta } = getPeriodoActual('mes');
  return generarReporteComprasPDF({ periodo_tipo: 'mes', fecha_desde, fecha_hasta });
};

export const generarReporteComprasAño = () => {
  const { fecha_desde, fecha_hasta } = getPeriodoActual('año');
  return generarReporteComprasPDF({ periodo_tipo: 'año', fecha_desde, fecha_hasta });
};