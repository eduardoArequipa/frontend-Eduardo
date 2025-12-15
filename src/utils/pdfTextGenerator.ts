import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  TopSellingProduct,
  SalesDataPoint,
  InventoryByCategory,
  PurchaseStats,
  LowStockProduct
} from '../types/dashboard';
import { obtenerFechaActualFormateada, obtenerFechaArchivo, formatearPeriodo } from './dateUtils';

/**
 * Opciones para la generación de PDFs textuales
 */
interface PDFTextOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Genera un PDF textual con la tabla del Top 5 Productos Más Vendidos
 */
export const generateTopProductsPDF = (
  products: TopSellingProduct[],
  options: PDFTextOptions = {}
): void => {
  const {
    filename = `Top_5_Productos_${obtenerFechaArchivo()}.pdf`,
    title = 'Top 5 Productos Más Vendidos',
    subtitle = 'Reporte de Productos con Mayores Ingresos',
    orientation = 'portrait',
  } = options;

  // Crear el documento PDF
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // --- ENCABEZADO ---
  // Logo o nombre de la empresa
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Color azul
  doc.text('Comercial Don Eduardo', pageWidth / 2, 20, { align: 'center' });

  // Título del reporte
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, 30, { align: 'center' });

  // Subtítulo
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(subtitle, pageWidth / 2, 37, { align: 'center' });

  // Fecha de generación
  doc.setFontSize(9);
  const currentDate = obtenerFechaActualFormateada(true, false);
  doc.text(`Generado: ${currentDate}`, pageWidth / 2, 43, { align: 'center' });

  // Línea divisoria
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, 47, pageWidth - margin, 47);

  // --- RESUMEN EJECUTIVO ---
  let yPosition = 55;

  // Calcular totales
  const totalIngresos = products.reduce((sum, p) => sum + p.ingresos_totales, 0);
  const promedioIngresos = totalIngresos / products.length;
  const productoTop = products[0];

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Resumen Ejecutivo', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const resumenTexto = [
    `• Total de ingresos generados: Bs. ${totalIngresos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• Promedio de ingresos por producto: Bs. ${promedioIngresos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• Producto líder: "${productoTop?.producto || 'N/A'}" con Bs. ${(productoTop?.ingresos_totales || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• Número de productos en el top: ${products.length}`,
  ];

  resumenTexto.forEach((texto) => {
    doc.text(texto, margin + 5, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // --- TABLA DE PRODUCTOS ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Detalle de Productos', margin, yPosition);
  yPosition += 5;

  // Preparar datos para la tabla
  const tableData = products.map((product, index) => {
    const porcentaje = ((product.ingresos_totales / totalIngresos) * 100).toFixed(1);
    return [
      (index + 1).toString(),
      product.producto,
      `Bs. ${product.ingresos_totales.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${porcentaje}%`,
    ];
  });

  // Generar tabla con autoTable
  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Producto', 'Ingresos Totales', '% del Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // Azul
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 45 },
      3: { halign: 'center', cellWidth: 30 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: margin, right: margin },
  });

  // Obtener la posición Y final de la tabla
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 40;

  // --- GRÁFICO DE BARRAS ASCII (OPCIONAL - Visual textual) ---
  yPosition = finalY + 10;

  if (yPosition + 50 < pageHeight - 20) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Representación Visual', margin, yPosition);
    yPosition += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const maxIngresos = Math.max(...products.map(p => p.ingresos_totales));
    const maxBarWidth = pageWidth - margin * 2 - 60; // Espacio para etiquetas

    products.forEach((product, index) => {
      const barWidth = (product.ingresos_totales / maxIngresos) * maxBarWidth;
      const productName = product.producto.length > 25
        ? product.producto.substring(0, 22) + '...'
        : product.producto;

      // Dibujar barra
      doc.setFillColor(37, 99, 235);
      doc.rect(margin + 50, yPosition - 3, barWidth, 5, 'F');

      // Nombre del producto
      doc.setTextColor(60, 60, 60);
      doc.text(`${index + 1}. ${productName}`, margin, yPosition);

      // Valor al final de la barra
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Bs. ${product.ingresos_totales.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`,
        margin + 52 + barWidth,
        yPosition
      );
      doc.setFont('helvetica', 'normal');

      yPosition += 8;
    });
  }

  // --- PIE DE PÁGINA ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Este reporte es confidencial y para uso interno de Comercial Don Eduardo',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  doc.text(`Página 1 de 1`, pageWidth - margin, pageHeight - 10, { align: 'right' });

  // Descargar el PDF
  doc.save(filename);
};

/**
 * Genera un PDF textual con el reporte de Ventas
 */
export const generateSalesPDF = (
  salesData: SalesDataPoint[],
  period: 'daily' | 'monthly' | 'yearly',
  options: PDFTextOptions = {}
): void => {
  const periodTitles = {
    daily: 'Reporte de Ventas Diarias',
    monthly: 'Reporte de Ventas Mensuales',
    yearly: 'Reporte de Ventas Anuales'
  };

  const {
    filename = `Ventas_${period}_${obtenerFechaArchivo()}.pdf`,
    title = periodTitles[period],
    subtitle = 'Análisis de Rendimiento de Ventas',
    orientation = 'portrait',
  } = options;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Encabezado
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Comercial Don Eduardo', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(subtitle, pageWidth / 2, 37, { align: 'center' });

  const currentDate = obtenerFechaActualFormateada(true, false);
  doc.setFontSize(9);
  doc.text(`Generado: ${currentDate}`, pageWidth / 2, 43, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, 47, pageWidth - margin, 47);

  // Resumen Ejecutivo
  let yPosition = 55;
  const totalVentas = salesData.reduce((sum, s) => sum + s.total, 0);
  const promedioVentas = totalVentas / salesData.length;
  const ventaMaxima = Math.max(...salesData.map(s => s.total));
  const ventaMinima = Math.min(...salesData.map(s => s.total));
  const totalTransacciones = salesData.reduce((sum, s) => sum + (s.quantity || 0), 0);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Resumen Ejecutivo', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const resumen = [
    `• Total de ventas: Bs. ${totalVentas.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• Promedio por período: Bs. ${promedioVentas.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• Venta máxima: Bs. ${ventaMaxima.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• Venta mínima: Bs. ${ventaMinima.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• Total de transacciones: ${totalTransacciones}`,
    `• Número de períodos analizados: ${salesData.length}`,
  ];

  resumen.forEach((texto) => {
    doc.text(texto, margin + 5, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // Tabla de Ventas
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Ventas por Período', margin, yPosition);
  yPosition += 5;

  const tableData = salesData.map((sale) => {
    const porcentaje = ((sale.total / totalVentas) * 100).toFixed(1);
    return [
      formatearPeriodo(sale.period),
      `Bs. ${sale.total.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sale.quantity?.toString() || '-',
      `${porcentaje}%`,
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['Período', 'Monto Total', 'Transacciones', '% del Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 45 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: margin, right: margin },
  });

  // Pie de página
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Este reporte es confidencial y para uso interno de Comercial Don Eduardo',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  doc.text(`Página 1 de 1`, pageWidth - margin, pageHeight - 10, { align: 'right' });

  doc.save(filename);
};

/**
 * Genera un PDF textual con el inventario por categoría
 */
export const generateCategoryInventoryPDF = (
  categories: InventoryByCategory[],
  options: PDFTextOptions = {}
): void => {
  const {
    filename = `Inventario_Por_Categoria_${obtenerFechaArchivo()}.pdf`,
    title = 'Inventario por Categoría',
    subtitle = 'Distribución del Valor del Inventario',
    orientation = 'portrait',
  } = options;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Encabezado
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Comercial Don Eduardo', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(subtitle, pageWidth / 2, 37, { align: 'center' });

  const currentDate = obtenerFechaActualFormateada(true, false);
  doc.setFontSize(9);
  doc.text(`Generado: ${currentDate}`, pageWidth / 2, 43, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, 47, pageWidth - margin, 47);

  // Resumen Ejecutivo
  let yPosition = 55;
  const totalInventario = categories.reduce((sum, c) => sum + c.valor_inventario, 0);
  const promedioCategoria = totalInventario / categories.length;
  const categoriaTop = categories[0];

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Resumen Ejecutivo', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const resumen = [
    `• Valor total del inventario: Bs. ${totalInventario.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• Promedio por categoría: Bs. ${promedioCategoria.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• Categoría con mayor valor: "${categoriaTop?.categoria || 'N/A'}" con Bs. ${(categoriaTop?.valor_inventario || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• Número de categorías: ${categories.length}`,
  ];

  resumen.forEach((texto) => {
    doc.text(texto, margin + 5, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // Tabla
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle por Categoría', margin, yPosition);
  yPosition += 5;

  const tableData = categories.map((cat, index) => {
    const porcentaje = ((cat.valor_inventario / totalInventario) * 100).toFixed(1);
    return [
      (index + 1).toString(),
      cat.categoria,
      `Bs. ${cat.valor_inventario.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${porcentaje}%`,
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Categoría', 'Valor de Inventario', '% del Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 50 },
      3: { halign: 'center', cellWidth: 30 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: margin, right: margin },
  });

  // Pie de página
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Este reporte es confidencial y para uso interno de Comercial Don Eduardo',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  doc.text(`Página 1 de 1`, pageWidth - margin, pageHeight - 10, { align: 'right' });

  doc.save(filename);
};

/**
 * Genera un PDF textual con las estadísticas de compras
 */
export const generatePurchaseStatsPDF = (
  purchaseStats: PurchaseStats,
  options: PDFTextOptions = {}
): void => {
  const {
    filename = `Estadisticas_Compras_${obtenerFechaArchivo()}.pdf`,
    title = 'Estadísticas de Compras',
    subtitle = 'Top Proveedores y Productos Más Comprados',
    orientation = 'portrait',
  } = options;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Encabezado
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Comercial Don Eduardo', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(subtitle, pageWidth / 2, 37, { align: 'center' });

  const currentDate = obtenerFechaActualFormateada(true, false);
  doc.setFontSize(9);
  doc.text(`Generado: ${currentDate}`, pageWidth / 2, 43, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, 47, pageWidth - margin, 47);

  // Resumen de Proveedores
  let yPosition = 55;
  const totalCompras = purchaseStats.top_suppliers.reduce((sum, s) => sum + s.total_compras, 0);
  const totalCantidad = purchaseStats.top_purchased_products.reduce((sum, p) => sum + p.cantidad_comprada, 0);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Resumen Ejecutivo', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const resumen = [
    `• Total de compras (top ${purchaseStats.top_suppliers.length} proveedores): Bs. ${totalCompras.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• Total de unidades compradas (top ${purchaseStats.top_purchased_products.length} productos): ${totalCantidad.toLocaleString('es-BO')}`,
    `• Proveedor principal: "${purchaseStats.top_suppliers[0]?.proveedor || 'N/A'}"`,
    `• Producto más comprado: "${purchaseStats.top_purchased_products[0]?.producto || 'N/A'}"`,
  ];

  resumen.forEach((texto) => {
    doc.text(texto, margin + 5, yPosition);
    yPosition += 6;
  });

  yPosition += 8;

  // Tabla de Top Proveedores
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Top Proveedores', margin, yPosition);
  yPosition += 5;

  const suppliersData = purchaseStats.top_suppliers.map((supplier, index) => {
    const porcentaje = ((supplier.total_compras / totalCompras) * 100).toFixed(1);
    return [
      (index + 1).toString(),
      supplier.proveedor,
      `Bs. ${supplier.total_compras.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${porcentaje}%`,
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Proveedor', 'Total Compras', '% del Total']],
    body: suppliersData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 45 },
      3: { halign: 'center', cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: margin, right: margin },
  });

  const finalY1 = (doc as any).lastAutoTable.finalY || yPosition + 40;
  yPosition = finalY1 + 10;

  // Tabla de Productos Más Comprados
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Top Productos Más Comprados', margin, yPosition);
  yPosition += 5;

  const productsData = purchaseStats.top_purchased_products.map((product, index) => {
    const porcentaje = ((product.cantidad_comprada / totalCantidad) * 100).toFixed(1);
    return [
      (index + 1).toString(),
      product.producto,
      product.cantidad_comprada.toLocaleString('es-BO'),
      `${porcentaje}%`,
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Producto', 'Cantidad Comprada', '% del Total']],
    body: productsData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 45 },
      3: { halign: 'center', cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: margin, right: margin },
  });

  // Pie de página
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Este reporte es confidencial y para uso interno de Comercial Don Eduardo',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  doc.text(`Página 1 de 1`, pageWidth - margin, pageHeight - 10, { align: 'right' });

  doc.save(filename);
};

/**
 * Genera un PDF textual con los productos con bajo stock
 */
export const generateLowStockPDF = (
  lowStockProducts: LowStockProduct[],
  options: PDFTextOptions = {}
): void => {
  const {
    filename = `Productos_Bajo_Stock_${obtenerFechaArchivo()}.pdf`,
    title = 'Productos con Bajo Stock',
    subtitle = 'Alerta de Productos que Requieren Reabastecimiento',
    orientation = 'portrait',
  } = options;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Encabezado
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Rojo para urgencia
  doc.text('Comercial Don Eduardo', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(220, 38, 38);
  doc.text(title, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(subtitle, pageWidth / 2, 37, { align: 'center' });

  const currentDate = obtenerFechaActualFormateada(true, false);
  doc.setFontSize(9);
  doc.text(`Generado: ${currentDate}`, pageWidth / 2, 43, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, 47, pageWidth - margin, 47);

  // Alerta
  let yPosition = 55;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(`⚠ ALERTA: ${lowStockProducts.length} productos requieren atención inmediata`, margin, yPosition);
  yPosition += 10;

  // Tabla
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Listado de Productos', margin, yPosition);
  yPosition += 5;

  const tableData = lowStockProducts.map((product) => {
    const stockNum = Number(product.stock);
    const stockMin = Number(product.stock_minimo || 0);
    const diferencia = stockMin - stockNum;
    const urgencia = stockNum === 0 ? 'CRÍTICO' : diferencia > 5 ? 'URGENTE' : 'BAJO';

    return [
      product.producto_id.toString(),
      product.nombre,
      stockNum.toString(),
      stockMin.toString(),
      diferencia.toString(),
      urgencia,
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['ID', 'Producto', 'Stock Actual', 'Stock Mín.', 'Diferencia', 'Urgencia']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 25 },
      5: { halign: 'center', cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [255, 245, 245],
    },
    margin: { left: margin, right: margin },
    didParseCell: (data: any) => {
      // Colorear la columna de urgencia
      if (data.column.index === 5 && data.section === 'body') {
        const urgencia = data.cell.raw;
        if (urgencia === 'CRÍTICO') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else if (urgencia === 'URGENTE') {
          data.cell.styles.textColor = [234, 88, 12];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Pie de página
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Este reporte es confidencial y para uso interno de Comercial Don Eduardo',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  doc.text(`Página 1 de 1`, pageWidth - margin, pageHeight - 10, { align: 'right' });

  doc.save(filename);
};
