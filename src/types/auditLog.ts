// src/types/auditLog.ts

export interface IAuditLog {
  log_id: number;
  usuario_id?: number;
  tabla: string;
  accion: string;
  registro_id?: number;
  valores_antes?: Record<string, any>;
  valores_despues?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  descripcion?: string;
  pais?: string;
  ciudad?: string;
  region?: string;
  fecha: string;
  usuario_nombre?: string;
}

export interface IAuditLogStats {
  total_logs: number;
  logs_hoy: number;
  acciones_por_tipo: Record<string, number>;
  usuarios_mas_activos: Array<{
    usuario: string;
    acciones: number;
  }>;
  ips_mas_frecuentes: Array<{
    ip: string;
    acciones: number;
  }>;
}

export interface IAuditLogFilter {
  usuario_id?: number;
  tabla?: string;
  accion?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  ip_address?: string;
  search?: string;
}

export interface IAuditLogPagination {
  items: IAuditLog[];
  total: number;
  skip: number;
  limit: number;
}

// Tipos para los filtros de la interfaz
export interface AuditLogFilters {
  search: string;
  tabla: string;
  accion: string;
  usuario_id: string;
  fecha_desde: string;
  fecha_hasta: string;
  ip_address: string;
}

// Mapeo de acciones para mostrar en español
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'LOGIN': 'Inicio de Sesión',
  'LOGIN_FAILED': 'Inicio de Sesión Fallido',
  'LOGOUT': 'Cierre de Sesión',
  'CREATE': 'Crear',
  'UPDATE': 'Actualizar',
  'DELETE': 'Eliminar',
};

// Mapeo de tablas para mostrar en español
export const AUDIT_TABLE_LABELS: Record<string, string> = {
  'usuarios': 'Usuarios',
  'productos': 'Productos',
  'compras': 'Compras',
  'ventas': 'Ventas',
  'personas': 'Personas',
  'categorias': 'Categorías',
  'marcas': 'Marcas',
  'proveedores': 'Proveedores',
};

// Colores para diferentes tipos de acciones
export const AUDIT_ACTION_COLORS: Record<string, string> = {
  'LOGIN': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'LOGIN_FAILED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'LOGOUT': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  'CREATE': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'UPDATE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'DELETE': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};