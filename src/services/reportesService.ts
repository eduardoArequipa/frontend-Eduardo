import axiosInstance from '../api/axiosInstance';
import { notification } from 'antd';



// Interfaz para los parámetros del reporte
interface ReporteParams {
  fecha_desde?: string;
  fecha_hasta?: string;
  producto_ids?: number[];
  categoria_ids?: number[];
  empleado_ids?: number[];
}

export const generarReporteVentasPDF = async (params: ReporteParams): Promise<void> => {
  try {
    // Limpiar parámetros indefinidos
    const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v.length > 0));

    const response = await axiosInstance.get(`/reportes/ventas`, {
      params: {
        ...cleanParams,
        formato: 'pdf'
      },
      responseType: 'blob', // ¡Importante para recibir archivos!
    });

    // Crear una URL para el blob y simular un clic para descargar
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Extraer el nombre del archivo de los encabezados de respuesta
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'reporte_ventas.pdf'; // Nombre por defecto
    if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.*)"/);
        if (fileNameMatch.length === 2) {
            fileName = fileNameMatch[1];
        }
    }

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();

    // Limpiar
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);

    notification.success({
      message: 'Reporte Generado',
      description: 'La descarga de tu reporte en PDF ha comenzado.',
    });

  } catch (error: any) {
    console.error("Error al generar el reporte en PDF:", error);
    
    let errorMessage = "Ocurrió un error al generar el reporte.";
    if (error.response && error.response.status === 404) {
        errorMessage = "No se encontraron datos con los filtros seleccionados.";
    }

    notification.error({
      message: 'Error al Generar Reporte',
      description: errorMessage,
    });

    // Para que el componente que llama sepa que hubo un error
    throw error;
  }
};
