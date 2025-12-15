// Tipos para los reportes

export interface ReporteVentaItem {
  venta_id: number;
  fecha_venta: string;
  cliente_nombre?: string;
  cliente_apellido?: string;
  vendedor_nombre?: string;
  metodo_pago?: string;
  producto_nombre: string;
  categoria_nombre: string;
  cantidad: number;
  presentacion_venta?: string;
  precio_unitario: number;
  precio_compra?: number;
  subtotal: number;
  costo_total?: number;
  utilidad?: number;
  margen_porcentaje?: number;
}

export interface ReporteCompraItem {
  compra_id: number;
  fecha_compra: string;
  proveedor_nombre: string;
  proveedor_ruc?: string;
  empleado_nombre?: string;
  producto_nombre: string;
  categoria_nombre: string;
  cantidad: number;
  presentacion_compra?: string;
  precio_compra: number;
  subtotal: number;
}

export interface ReporteProductoItem {
  producto_id: number;
  codigo: string;
  nombre: string;
  categoria_nombre: string;
  marca_nombre: string;
  stock_actual: number;
  stock_minimo: number;
  precio_compra: number;
  precio_venta: number;
  unidad_medida: string;
  estado: string;
  total_vendido?: number;
  total_comprado?: number;
  margen_ganancia?: number;
}

export interface ResumenVentas {
  total_ventas: number;
  total_costos?: number;
  utilidad_total?: number;
  margen_promedio?: number;
  cantidad_ventas: number;
  promedio_venta: number;
  producto_mas_vendido?: string;
  categoria_mas_vendida?: string;
  cantidad_productos_vendidos?: number;
}

export interface ResumenCompras {
  total_compras: number;
  cantidad_compras: number;
  promedio_compra: number;
  proveedor_mas_frecuente?: string;
  categoria_mas_comprada?: string;
}

export interface ResumenProductos {
  total_productos: number;
  productos_con_stock: number;
  productos_sin_stock: number;
  productos_stock_bajo: number;
  valor_inventario: number;
  valor_inventario_venta?: number;
  utilidad_potencial?: number;
}

export interface ReporteVentasResponse {
  items: ReporteVentaItem[];
  resumen: ResumenVentas;
  periodo: string;
}

export interface ReporteComprasResponse {
  items: ReporteCompraItem[];
  resumen: ResumenCompras;
  periodo: string;
}

export interface ReporteProductosResponse {
  items: ReporteProductoItem[];
  resumen: ResumenProductos;
}

export type TipoReporte = 'ventas' | 'compras' | 'productos';
export type PeriodoTipo = 'dia' | 'mes' | 'año' | 'personalizado';