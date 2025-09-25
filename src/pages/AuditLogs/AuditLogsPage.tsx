// src/pages/AuditLogs/AuditLogsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {  FaDownload, FaFilter, FaEye, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Select from '../../components/Common/Select';
import Table from '../../components/Common/Table';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import { Card } from '../../components/Common/Card';
import Modal from '../../components/Common/Modal';

import { auditLogService } from '../../services/auditLogService';
import {
  IAuditLog,
  IAuditLogStats,
  AuditLogFilters,
  AUDIT_ACTION_LABELS,
  AUDIT_TABLE_LABELS,
  AUDIT_ACTION_COLORS
} from '../../types/auditLog';

const AuditLogsPage: React.FC = () => {
  // Estados principales
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [stats, setStats] = useState<IAuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados de filtros
  const [filters, setFilters] = useState<AuditLogFilters>({
    search: '',
    tabla: '',
    accion: '',
    usuario_id: '',
    fecha_desde: '',
    fecha_hasta: '',
    ip_address: ''
  });

  // Estados para opciones de filtros
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);

  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<IAuditLog | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Función para cargar los logs
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        search: filters.search || undefined,
        tabla: filters.tabla || undefined,
        accion: filters.accion || undefined,
        usuario_id: filters.usuario_id ? parseInt(filters.usuario_id) : undefined,
        fecha_desde: filters.fecha_desde || undefined,
        fecha_hasta: filters.fecha_hasta || undefined,
        ip_address: filters.ip_address || undefined,
      };

      const response = await auditLogService.getAuditLogs(params);
      setLogs(response.items);
      setTotalItems(response.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar los logs de auditoría');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]);

  // Función para cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      const statsParams = {
        fecha_desde: filters.fecha_desde || undefined,
        fecha_hasta: filters.fecha_hasta || undefined,
      };
      const statsData = await auditLogService.getAuditStats(statsParams);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [filters.fecha_desde, filters.fecha_hasta]);

  // Cargar opciones para filtros
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [actions, tables] = await Promise.all([
          auditLogService.getAvailableActions(),
          auditLogService.getAvailableTables()
        ]);
        setAvailableActions(actions);
        setAvailableTables(tables);
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };

    loadFilterOptions();
  }, []);

  // Cargar datos cuando cambien los filtros o la página
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Cargar estadísticas cuando cambien los filtros de fecha
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Manejar cambios de filtros
  const handleFilterChange = (field: keyof AuditLogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      search: '',
      tabla: '',
      accion: '',
      usuario_id: '',
      fecha_desde: '',
      fecha_hasta: '',
      ip_address: ''
    });
    setCurrentPage(1);
  };

  // Exportar logs
  const handleExport = () => {
    if (logs.length > 0) {
      auditLogService.exportToCSV(logs, `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  // Ver detalles de un log
  const viewLogDetails = (log: IAuditLog) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  // Configuración de columnas para la tabla
  const columns = [
    {
      Header: 'Fecha/Hora',
      Cell: ({ row }: { row: { original: IAuditLog } }) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {auditLogService.formatDate(row.original.fecha)}
          </div>
        </div>
      )
    },
    {
      Header: 'Usuario',
      Cell: ({ row }: { row: { original: IAuditLog } }) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {row.original.usuario_nombre || 'Sistema'}
        </div>
      )
    },
    {
      Header: 'Acción',
      Cell: ({ row }: { row: { original: IAuditLog } }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          AUDIT_ACTION_COLORS[row.original.accion] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        }`}>
          {AUDIT_ACTION_LABELS[row.original.accion] || row.original.accion}
        </span>
      )
    },
    {
      Header: 'Tabla',
      Cell: ({ row }: { row: { original: IAuditLog } }) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {AUDIT_TABLE_LABELS[row.original.tabla] || row.original.tabla}
        </div>
      )
    },
    {
      Header: 'Descripción',
      Cell: ({ row }: { row: { original: IAuditLog } }) => (
        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
          {row.original.descripcion || '-'}
        </div>
      )
    },
    {
      Header: 'Ubicación',
      Cell: ({ row }: { row: { original: IAuditLog } }) => (
        <div className="text-sm">
          {row.original.pais ? (
            <div className="flex items-center space-x-1">
              <FaMapMarkerAlt className="text-gray-400 text-xs" />
              <span className="text-gray-900 dark:text-gray-100">
                {row.original.ciudad}, {row.original.pais}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      Header: 'IP',
      Cell: ({ row }: { row: { original: IAuditLog } }) => (
        <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
          {row.original.ip_address || '-'}
        </div>
      )
    },
    {
      Header: 'Acciones',
      Cell: ({ row }: { row: { original: IAuditLog } }) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => viewLogDetails(row.original)}
          className="flex items-center space-x-1"
        >
          <FaEye className="text-xs" />
          <span>Ver</span>
        </Button>
      )
    }
  ];

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Logs de Auditoría
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor de actividad del sistema y usuarios
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <FaFilter />
            <span>Filtros</span>
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={logs.length === 0}
            className="flex items-center space-x-2"
          >
            <FaDownload />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Logs
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.total_logs.toLocaleString()}
                </p>
              </div>
              <FaClock className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Logs Hoy
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.logs_hoy.toLocaleString()}
                </p>
              </div>
              <FaClock className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Usuarios Más Activos
              </p>
              <div className="space-y-1">
                {stats.usuarios_mas_activos.slice(0, 2).map((user, index) => (
                  <div key={index} className="text-xs text-gray-900 dark:text-gray-100">
                    <span className="font-medium">{user.usuario}:</span> {user.acciones}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                IPs Más Frecuentes
              </p>
              <div className="space-y-1">
                {stats.ips_mas_frecuentes.slice(0, 2).map((ip, index) => (
                  <div key={index} className="text-xs text-gray-900 dark:text-gray-100">
                    <span className="font-mono">{ip.ip}:</span> {ip.acciones}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Panel de Filtros */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Input
              label="Búsqueda"
              placeholder="Buscar en descripción..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />

            <Select
              label="Tabla"
              value={filters.tabla}
              onChange={(e) => handleFilterChange('tabla', e.target.value)}
              options={[
                { value: '', label: 'Todas las tablas' },
                ...availableTables.map(table => ({
                  value: table,
                  label: AUDIT_TABLE_LABELS[table] || table
                }))
              ]}
            />

            <Select
              label="Acción"
              value={filters.accion}
              onChange={(e) => handleFilterChange('accion', e.target.value)}
              options={[
                { value: '', label: 'Todas las acciones' },
                ...availableActions.map(action => ({
                  value: action,
                  label: AUDIT_ACTION_LABELS[action] || action
                }))
              ]}
            />

            <Input
              label="ID Usuario"
              type="number"
              placeholder="ID del usuario"
              value={filters.usuario_id}
              onChange={(e) => handleFilterChange('usuario_id', e.target.value)}
            />

            <Input
              label="Fecha Desde"
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
            />

            <Input
              label="Fecha Hasta"
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
            />

            <Input
              label="Dirección IP"
              placeholder="192.168.1.1"
              value={filters.ip_address}
              onChange={(e) => handleFilterChange('ip_address', e.target.value)}
            />

            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={clearFilters}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tabla de Logs */}
      <Card>
        <Table
          columns={columns}
          data={logs}
        />

        {/* Paginación Mejorada */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Información de registros - siempre visible */}
          <div className="flex justify-center p-2 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span className="font-medium">{totalItems.toLocaleString()}</span> registros
            </div>
          </div>

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col lg:flex-row justify-between items-center p-4 space-y-4 lg:space-y-0">
              {/* Navegación principal */}
              <div className="flex items-center space-x-2">
              {/* Botón Primera página */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2"
                title="Primera página"
              >
                ««
              </Button>

              {/* Botón Página anterior */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3"
              >
                ‹ Anterior
              </Button>

              {/* Números de página */}
              <div className="hidden sm:flex items-center space-x-1">
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5; // Número fijo para evitar problemas de hidratación
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                  // Ajustar startPage si endPage alcanzó el límite
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  // Página 1 con separador si es necesario
                  if (startPage > 1) {
                    pages.push(
                      <Button
                        key={1}
                        variant={1 === currentPage ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        className="px-3 min-w-[40px]"
                      >
                        1
                      </Button>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <span key="start-ellipsis" className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                  }

                  // Páginas del rango visible
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant={i === currentPage ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setCurrentPage(i)}
                        className="px-3 min-w-[40px]"
                      >
                        {i}
                      </Button>
                    );
                  }

                  // Última página con separador si es necesario
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span key="end-ellipsis" className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    pages.push(
                      <Button
                        key={totalPages}
                        variant={totalPages === currentPage ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 min-w-[40px]"
                      >
                        {totalPages}
                      </Button>
                    );
                  }

                  return pages;
                })()}
              </div>

              {/* Botón Página siguiente */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3"
              >
                Siguiente ›
              </Button>

              {/* Botón Última página */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2"
                title="Última página"
              >
                »»
              </Button>
              </div>

              {/* Indicador de página en móvil */}
              <div className="sm:hidden text-sm text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </div>

              {/* Controles adicionales */}
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                {/* Salto directo a página - solo en pantallas medianas y grandes */}
                <div className="hidden md:flex items-center space-x-2 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Ir a:</span>
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value=""
                    placeholder={currentPage.toString()}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const page = parseInt((e.target as HTMLInputElement).value);
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                    className="w-16 text-center"
                  />
                </div>

                {/* Selector de elementos por página */}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Mostrar:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onChange={(e) => {
                      const newItemsPerPage = parseInt(e.target.value);
                      // Ajustar página actual al cambiar items por página
                      const newPage = Math.ceil(((currentPage - 1) * itemsPerPage + 1) / newItemsPerPage);
                      setCurrentPage(newPage);
                      setItemsPerPage(newItemsPerPage);
                    }}
                    options={[
                      { value: '10', label: '10' },
                      { value: '25', label: '25' },
                      { value: '50', label: '50' },
                      { value: '100', label: '100' }
                    ]}
                    className="w-20"
                  />
                  <span className="text-gray-700 dark:text-gray-300">por página</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Detalles del Log */}
      {showLogModal && selectedLog && (
        <Modal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          title="Detalles del Log de Auditoría"
          widthClass="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  ID del Log
                </label>
                <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  #{selectedLog.log_id}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fecha y Hora
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {auditLogService.formatDate(selectedLog.fecha)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Usuario
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedLog.usuario_nombre || 'Sistema'} {selectedLog.usuario_id ? `(ID: ${selectedLog.usuario_id})` : ''}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Acción
                </label>
                <p className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    AUDIT_ACTION_COLORS[selectedLog.accion] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                  }`}>
                    {AUDIT_ACTION_LABELS[selectedLog.accion] || selectedLog.accion}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tabla Afectada
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {AUDIT_TABLE_LABELS[selectedLog.tabla] || selectedLog.tabla}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  ID del Registro
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedLog.registro_id || '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Dirección IP
                </label>
                <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {selectedLog.ip_address || '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Ubicación
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedLog.pais ? `${selectedLog.ciudad}, ${selectedLog.region}, ${selectedLog.pais}` : '-'}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Descripción
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                {selectedLog.descripcion || '-'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                User Agent
              </label>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded break-all">
                {selectedLog.user_agent || '-'}
              </p>
            </div>

            {/* Valores Antes/Después */}
            {(selectedLog.valores_antes || selectedLog.valores_despues) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedLog.valores_antes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Valores Anteriores
                    </label>
                    <pre className="text-xs text-gray-900 dark:text-gray-100 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded overflow-auto max-h-32">
                      {JSON.stringify(selectedLog.valores_antes, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.valores_despues && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Valores Nuevos
                    </label>
                    <pre className="text-xs text-gray-900 dark:text-gray-100 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded overflow-auto max-h-32">
                      {JSON.stringify(selectedLog.valores_despues, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Resumen de Cambios */}
            {(selectedLog.valores_antes || selectedLog.valores_despues) && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Resumen de Cambios
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                  {auditLogService.formatChanges(selectedLog.valores_antes, selectedLog.valores_despues)}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AuditLogsPage;