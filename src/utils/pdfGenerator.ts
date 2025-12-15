import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Opciones para la generación de PDFs
 */
interface PDFOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  quality?: number;
}

/**
 * Captura un elemento HTML y lo convierte en imagen
 */
const captureElement = async (element: HTMLElement, quality: number = 0.95): Promise<string> => {
  const canvas = await html2canvas(element, {
    scale: 2, // Mayor resolución
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    imageTimeout: 0,
    allowTaint: true,
  });

  return canvas.toDataURL('image/png', quality);
};

/**
 * Genera un PDF del dashboard completo
 */
export const generateDashboardPDF = async (options: PDFOptions = {}): Promise<void> => {
  const {
    filename = `Dashboard_${new Date().toISOString().split('T')[0]}.pdf`,
    title = 'Dashboard Comercial',
    orientation = 'landscape',
    quality = 0.95,
  } = options;

  try {
    // Crear el documento PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    // Agregar encabezado
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, pageWidth / 2, 15, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    pdf.text(`Generado: ${currentDate}`, pageWidth / 2, 22, { align: 'center' });

    let yPosition = 30;

    // Secciones a capturar (en orden)
    const sections = [
      { id: 'kpi-section', title: 'Indicadores Clave', height: 60 },
      { id: 'sales-chart-section', title: 'Rendimiento de Ventas', height: 80 },
      { id: 'products-categories-section', title: 'Productos y Categorías', height: 80 },
      { id: 'purchases-stock-section', title: 'Compras y Stock', height: 80 },
    ];

    for (const section of sections) {
      const element = document.getElementById(section.id);

      if (element) {
        // Capturar el elemento
        const imageData = await captureElement(element, quality);

        // Calcular dimensiones manteniendo aspecto
        const elementWidth = element.offsetWidth;
        const elementHeight = element.offsetHeight;
        const ratio = elementHeight / elementWidth;
        const imgWidth = contentWidth;
        const imgHeight = imgWidth * ratio;

        // Verificar si necesitamos una nueva página
        if (yPosition + imgHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        // Agregar la imagen al PDF
        pdf.addImage(imageData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 5;
      }
    }

    // Agregar pie de página en todas las páginas
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }

    // Descargar el PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('No se pudo generar el PDF del dashboard');
  }
};

/**
 * Genera un PDF de una sección específica del dashboard
 */
export const generateSectionPDF = async (
  elementId: string,
  options: PDFOptions = {}
): Promise<void> => {
  const {
    filename = `Seccion_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`,
    title = 'Sección del Dashboard',
    orientation = 'landscape',
    quality = 0.95,
  } = options;

  try {
    const element = document.getElementById(elementId);

    if (!element) {
      throw new Error(`Elemento con ID "${elementId}" no encontrado`);
    }

    // Capturar el elemento
    const imageData = await captureElement(element, quality);

    // Crear el documento PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    // Agregar encabezado
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, pageWidth / 2, 15, { align: 'center' });

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    pdf.text(`Generado: ${currentDate}`, pageWidth / 2, 21, { align: 'center' });

    // Calcular dimensiones
    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;
    const ratio = elementHeight / elementWidth;
    const contentWidth = pageWidth - (margin * 2);
    const imgWidth = contentWidth;
    const imgHeight = Math.min(imgWidth * ratio, pageHeight - 40);

    // Agregar la imagen
    pdf.addImage(imageData, 'PNG', margin, 28, imgWidth, imgHeight);

    // Pie de página
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Comercial Don Eduardo', pageWidth / 2, pageHeight - 5, { align: 'center' });

    // Descargar el PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error al generar PDF de sección:', error);
    throw new Error('No se pudo generar el PDF de la sección');
  }
};
