// src/services/auditLogService.ts

import axiosInstance from '../api/axiosInstance';
import { IAuditLog, IAuditLogStats, IAuditLogPagination } from '../types/auditLog';

const API_URL = '/audit-logs';

export const auditLogService = {
  // Obtener logs con filtros y paginación
  async getAuditLogs(params: {
    skip?: number;
    limit?: number;
    usuario_id?: number;
    tabla?: string;
    accion?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    ip_address?: string;
    search?: string;
  }): Promise<IAuditLogPagination> {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) =>
        value !== undefined && value !== null && value !== ''
      )
    );

    const response = await axiosInstance.get(API_URL, { params: cleanParams });
    return response.data;
  },

  // Obtener estadísticas de auditoría
  async getAuditStats(params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<IAuditLogStats> {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, value]) =>
        value !== undefined && value !== null && value !== ''
      )
    );

    const response = await axiosInstance.get(`${API_URL}/stats`, { params: cleanParams });
    return response.data;
  },

  // Obtener un log específico por ID
  async getAuditLogById(logId: number): Promise<IAuditLog> {
    const response = await axiosInstance.get(`${API_URL}/${logId}`);
    return response.data;
  },

  // Obtener acciones disponibles para filtros
  async getAvailableActions(): Promise<string[]> {
    const response = await axiosInstance.get(`${API_URL}/actions`);
    return response.data;
  },

  // Obtener tablas disponibles para filtros
  async getAvailableTables(): Promise<string[]> {
    const response = await axiosInstance.get(`${API_URL}/tables`);
    return response.data;
  },

  // Exportar logs a CSV (función helper del frontend)
  exportToCSV: (logs: IAuditLog[], filename: string = 'audit_logs.csv') => {
    const headers = [
      'ID',
      'Fecha',
      'Usuario',
      'Tabla',
      'Acción',
      'Descripción',
      'IP',
      'País',
      'Ciudad',
      'User Agent'
    ];

    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.log_id,
        new Date(log.fecha).toLocaleString('es-ES'),
        log.usuario_nombre || 'Sistema',
        log.tabla,
        log.accion,
        `"${log.descripcion || ''}"`,
        log.ip_address || '',
        log.pais || '',
        log.ciudad || '',
        `"${log.user_agent || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Formatear fecha para mostrar
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  // Formatear user agent para mostrar solo navegador
  formatUserAgent: (userAgent?: string): string => {
    if (!userAgent) return 'Desconocido';

    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';

    return 'Otro';
  },

  // Generar descripción legible de cambios
  formatChanges: (valoresAntes?: Record<string, any>, valoresDespues?: Record<string, any>): string => {
    if (!valoresAntes && !valoresDespues) return '';

    if (valoresDespues && !valoresAntes) {
      // Creación
      const keys = Object.keys(valoresDespues).filter(key => key !== 'timestamp');
      return `Creado con: ${keys.join(', ')}`;
    }

    if (valoresAntes && valoresDespues) {
      // Actualización
      const changes: string[] = [];
      for (const key in valoresDespues) {
        if (key !== 'timestamp' && valoresAntes[key] !== valoresDespues[key]) {
          changes.push(`${key}: "${valoresAntes[key]}" → "${valoresDespues[key]}"`);
        }
      }
      return changes.length > 0 ? `Cambios: ${changes.join(', ')}` : 'Sin cambios detectados';
    }

    if (valoresAntes && !valoresDespues) {
      // Eliminación
      return 'Registro eliminado';
    }

    return '';
  }
};