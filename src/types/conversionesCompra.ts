export interface ConversionCompra {
  conversion_id: number;
  producto_id: number;
  nombre_presentacion: string;
  unidad_inventario_por_presentacion: number;
}

export interface CreateConversionCompraDto {
  producto_id: number;
  nombre_presentacion: string;
  unidad_inventario_por_presentacion: number;
}

export interface UpdateConversionCompraDto {
  producto_id?: number;
  nombre_presentacion?: string;
  unidad_inventario_por_presentacion?: number;
}
