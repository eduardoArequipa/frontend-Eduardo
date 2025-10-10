// src/components/Specific/ConversionesManager.tsx
import React, { useState } from 'react';
import { Conversion, ConversionCreate } from '../../types/producto';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Button from '../Common/Button';

// Tipo local que permite tanto conversiones reales como temporales
type ConversionLocal = Omit<Conversion, 'producto_id'> & { 
  producto_id?: number; 
  tempId?: number; 
};

interface ConversionesManagerProps {
  conversiones: ConversionLocal[];
  unidadInventarioNombre?: string;
  onAddConversion: (conversion: ConversionCreate) => Promise<void>;
  onUpdateConversion: (id: number, conversion: ConversionCreate) => Promise<void>;
  onDeleteConversion: (id: number) => Promise<void>;
  disabled?: boolean;
  isCreationMode?: boolean;
}

const ConversionesManager: React.FC<ConversionesManagerProps> = ({
  conversiones,
  unidadInventarioNombre,
  onAddConversion,
  onUpdateConversion,
  onDeleteConversion,
  disabled = false,
  isCreationMode = false
}) => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();

  const [localConversiones, setLocalConversiones] = useState<ConversionLocal[]>(conversiones);
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre_presentacion: '',
    unidades_por_presentacion: '',
    es_para_compra: false,
    es_para_venta: false,
    descripcion_detallada: '',
    // Campos adicionales para cálculos automáticos
    rollsPerBox: '',
    metersPerRoll: ''
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Opciones predefinidas para presentaciones
  const presentacionOptions = [
    { value: '', label: '-- Seleccionar Presentación --' },
    { value: 'Caja', label: 'Caja' },
    { value: 'Rollo', label: 'Rollo' },
    { value: 'Blíster', label: 'Blíster' },
    { value: 'Paquete', label: 'Paquete' },
    { value: 'Docena', label: 'Docena' },
    { value: 'Centena', label: 'Centena' },
    { value: 'Otro', label: 'Otro...' }
  ];

  // Calcular unidades automáticamente para metros
  React.useEffect(() => {
    if (unidadInventarioNombre === 'Metro' && formData.rollsPerBox && formData.metersPerRoll) {
      const rolls = parseFloat(formData.rollsPerBox);
      const meters = parseFloat(formData.metersPerRoll);
      
      if (!isNaN(rolls) && !isNaN(meters) && rolls > 0 && meters > 0) {
        setFormData(prev => ({
          ...prev,
          unidades_por_presentacion: (rolls * meters).toString(),
          descripcion_detallada: `${rolls} rollos × ${meters}m c/u`
        }));
      }
    }
  }, [formData.rollsPerBox, formData.metersPerRoll, unidadInventarioNombre]);

  const resetForm = () => {
    setFormData({
      nombre_presentacion: '',
      unidades_por_presentacion: '',
      es_para_compra: false,
      es_para_venta: false,
      descripcion_detallada: '',
      rollsPerBox: '',
      metersPerRoll: ''
    });
    setEditingId(null);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nombre_presentacion.trim()) {
      newErrors.nombre_presentacion = 'El nombre de la presentación es requerido';
    }

    const unidades = parseFloat(formData.unidades_por_presentacion);
    if (!formData.unidades_por_presentacion || isNaN(unidades) || unidades <= 0) {
      newErrors.unidades_por_presentacion = 'Las unidades deben ser un número mayor a 0';
    }

    if (!Number.isInteger(unidades)) {
      newErrors.unidades_por_presentacion = 'Las unidades deben ser un número entero';
    }

    if (!formData.es_para_compra && !formData.es_para_venta) {
      newErrors.uso = 'Debe seleccionar al menos un uso (compra o venta)';
    }

    // Verificar duplicados
    const nombreExistente = localConversiones.find(conv => 
      conv.nombre_presentacion.toLowerCase() === formData.nombre_presentacion.toLowerCase() &&
      (editingId === null || conv.id !== editingId)
    );

    if (nombreExistente) {
      newErrors.nombre_presentacion = 'Ya existe una presentación con este nombre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    
    if (!validateForm()) return;

    const conversionData: ConversionCreate = {
      nombre_presentacion: formData.nombre_presentacion.trim(),
      unidades_por_presentacion: parseFloat(formData.unidades_por_presentacion),
      es_para_compra: formData.es_para_compra,
      es_para_venta: formData.es_para_venta,
      descripcion_detallada: formData.descripcion_detallada.trim() || null
    };

    try {
      if (editingId) {
        await onUpdateConversion(editingId, conversionData);
        // Actualizar estado local
        setLocalConversiones(prev => 
          prev.map(conv => conv.id === editingId ? { ...conv, ...conversionData } : conv)
        );
        addNotification('Presentación actualizada exitosamente', 'success');
      } else {
        // Siempre llamar onAddConversion para que el padre maneje el estado
        await onAddConversion(conversionData);
        
        if (isCreationMode) {
          // En modo creación, también actualizar estado local para mostrar en UI
          const newConversion: ConversionLocal = {
            ...conversionData,
            id: 0,
            tempId: Date.now()
          };
          setLocalConversiones(prev => [...prev, newConversion]);
        }
        addNotification('Presentación agregada exitosamente', 'success');
      }
      
      resetForm();
      setIsFormVisible(false);
    } catch (error: any) {
      addNotification(`Error: ${error.response?.data?.detail || error.message}`, 'error');
    }
  };

  const handleEdit = (conversion: ConversionLocal) => {
    setFormData({
      nombre_presentacion: conversion.nombre_presentacion,
      unidades_por_presentacion: conversion.unidades_por_presentacion.toString(),
      es_para_compra: conversion.es_para_compra,
      es_para_venta: conversion.es_para_venta,
      descripcion_detallada: conversion.descripcion_detallada || '',
      rollsPerBox: '',
      metersPerRoll: ''
    });
    setEditingId(conversion.id);
    setIsFormVisible(true);
  };

  const handleDelete = async (conversion: ConversionLocal) => {
    if (!window.confirm(`¿Está seguro de eliminar la presentación "${conversion.nombre_presentacion}"?`)) {
      return;
    }

    try {
      if (isCreationMode || conversion.tempId) {
        // Solo remover del estado local
        setLocalConversiones(prev => prev.filter(conv => 
          conv.tempId ? conv.tempId !== conversion.tempId : conv.id !== conversion.id
        ));
      } else {
        await onDeleteConversion(conversion.id);
        setLocalConversiones(prev => prev.filter(conv => conv.id !== conversion.id));
      }
      addNotification('Presentación eliminada exitosamente', 'success');
    } catch (error: any) {
      addNotification(`Error al eliminar: ${error.response?.data?.detail || error.message}`, 'error');
    }
  };

  const showCalculatorFields = unidadInventarioNombre === 'Metro' && 
    (formData.nombre_presentacion.toLowerCase().includes('caja') 
     
  // || formData.nombre_presentacion.toLowerCase().includes('rollo')
   );

  return (
    <div className={`space-y-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Presentaciones de Compra/Venta
          {unidadInventarioNombre && (
            <span className="text-sm font-normal ml-2">
              (Unidad base: {unidadInventarioNombre})
            </span>
          )}
        </h3>
        {!isFormVisible && (
          <Button
            type="button"
            onClick={() => setIsFormVisible(true)}
            disabled={disabled}
            variant="secondary"
            size="sm"
          >
            + Agregar Presentación
          </Button>
        )}
      </div>

      {/* Lista de conversiones existentes */}
      {localConversiones.length > 0 && (
        <div className="space-y-2">
          {localConversiones.map(conversion => (
            <div 
              key={conversion.id || conversion.tempId} 
              className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <h4 className="font-medium">
                      {conversion.nombre_presentacion}
                    </h4>
                    <span className="text-sm font-mono">
                      = {conversion.unidades_por_presentacion} {unidadInventarioNombre || 'unidades'}
                      {conversion.descripcion_detallada && (
                        <span className={`ml-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          ({conversion.descripcion_detallada})
                        </span>
                      )}
                    </span>
                    <div className="flex space-x-2">
                      {conversion.es_para_compra && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full">
                          Compra
                        </span>
                      )}
                      {conversion.es_para_venta && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full">
                          Venta
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    onClick={() => handleEdit(conversion)}
                    disabled={disabled}
                    variant="secondary"
                    size="sm"
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleDelete(conversion)}
                    disabled={disabled}
                    variant="danger"
                    size="sm"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario de agregar/editar */}
      {isFormVisible && (
        <div className={`p-4 rounded-lg border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">
                {editingId ? 'Editar Presentación' : 'Nueva Presentación'}
              </h4>
              <Button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsFormVisible(false);
                }}
                variant="secondary"
                size="sm"
              >
                Cancelar
              </Button>
            </div>

            <div className="space-y-4">
              {/* Primera fila: Nombre y Unidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre de presentación */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombre de Presentación *
                  </label>
                  <Select
                    value={formData.nombre_presentacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre_presentacion: e.target.value }))}
                    options={presentacionOptions}
                    disabled={disabled}
                    className={errors.nombre_presentacion ? 'border-red-500' : ''}
                  />
                  {(formData.nombre_presentacion === 'Otro' || 
                    (formData.nombre_presentacion && !presentacionOptions.find(opt => opt.value === formData.nombre_presentacion))) && (
                    <Input
                      type="text"
                      placeholder="Escriba el nombre..."
                      value={formData.nombre_presentacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre_presentacion: e.target.value }))}
                      disabled={disabled}
                      className="mt-2"
                    />
                  )}
                  {errors.nombre_presentacion && (
                    <span className="text-red-500 text-xs mt-1">{errors.nombre_presentacion}</span>
                  )}
                </div>

                {/* Unidades por presentación */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Unidades por Presentación *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.unidades_por_presentacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidades_por_presentacion: e.target.value }))}
                    disabled={disabled || showCalculatorFields}
                    placeholder="Ej: 24"
                    className={errors.unidades_por_presentacion ? 'border-red-500' : ''}
                  />
                  {errors.unidades_por_presentacion && (
                    <span className="text-red-500 text-xs mt-1">{errors.unidades_por_presentacion}</span>
                  )}
                  {showCalculatorFields && (
                    <p className="text-xs text-gray-500 mt-1">Se calcula automáticamente</p>
                  )}
                </div>

                {/* Campos de calculadora para metros */}
                {showCalculatorFields && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Rollos por Caja
                      </label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={formData.rollsPerBox}
                        onChange={(e) => setFormData(prev => ({ ...prev, rollsPerBox: e.target.value }))}
                        disabled={disabled}
                        placeholder="Ej: 50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Metros por Rollo
                      </label>
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={formData.metersPerRoll}
                        onChange={(e) => setFormData(prev => ({ ...prev, metersPerRoll: e.target.value }))}
                        disabled={disabled}
                        placeholder="Ej: 10"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Descripción detallada */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Descripción Detallada
                  <span className={`ml-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    (Opcional - ej: "20 rollos × 10m c/u")
                  </span>
                </label>
                <Input
                  type="text"
                  value={formData.descripcion_detallada}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion_detallada: e.target.value }))}
                  disabled={disabled || (showCalculatorFields && !editingId)}
                  placeholder="Ej: 12 unidades por caja, 20 rollos × 10m c/u"
                  className="w-full"
                />
                {showCalculatorFields && !editingId && (
                  <p className="text-xs text-gray-500 mt-1">Se genera automáticamente</p>
                )}
                {showCalculatorFields && editingId && (
                  <p className="text-xs text-blue-500 mt-1">Puedes editarlo manualmente o usar la calculadora</p>
                )}
              </div>
            </div>

            {/* Uso de la presentación */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Uso de la Presentación *
              </label>
              <div className="flex space-x-6">
                <div className="flex items-center">
                  <input
                    id="es_para_compra"
                    type="checkbox"
                    checked={formData.es_para_compra}
                    onChange={(e) => setFormData(prev => ({ ...prev, es_para_compra: e.target.checked }))}
                    disabled={disabled}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="es_para_compra" className="ml-2 text-sm">
                    Para Compras
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="es_para_venta"
                    type="checkbox"
                    checked={formData.es_para_venta}
                    onChange={(e) => setFormData(prev => ({ ...prev, es_para_venta: e.target.checked }))}
                    disabled={disabled}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="es_para_venta" className="ml-2 text-sm">
                    Para Ventas
                  </label>
                </div>
              </div>
              {errors.uso && (
                <span className="text-red-500 text-xs mt-1">{errors.uso}</span>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsFormVisible(false);
                }}
                variant="secondary"
                disabled={disabled}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                variant="primary"
                disabled={disabled}
              >
                {editingId ? 'Actualizar' : 'Agregar'} Presentación
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {localConversiones.length === 0 && !isFormVisible && (
        <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="text-sm">
            No hay presentaciones configuradas. 
            {!disabled && (
              <span className="block mt-2">
                <Button
                  type="button"
                  onClick={() => setIsFormVisible(true)}
                  variant="secondary"
                  size="sm"
                >
                  Agregar la primera presentación
                </Button>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConversionesManager;
