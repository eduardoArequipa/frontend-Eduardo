import React, { useState, useEffect } from 'react';
import { CreateConversionCompraDto, UpdateConversionCompraDto, ConversionCompra } from '../../types/conversionesCompra';
import { createConversionCompra, updateConversionCompra } from '../../services/conversionesCompraService';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

interface ConversionesCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback para cuando la operación es exitosa
  initialData?: ConversionCompra | null; // Datos iniciales para edición
}

const ConversionesCompraModal: React.FC<ConversionesCompraModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [productoId, setProductoId] = useState<number | ''>(initialData?.producto_id || '');
  const [nombrePresentacion, setNombrePresentacion] = useState<string>(initialData?.nombre_presentacion || '');
  const [unidadInventarioPorPresentacion, setUnidadInventarioPorPresentacion] = useState<number | ''>(initialData?.unidad_inventario_por_presentacion || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setProductoId(initialData.producto_id);
        setNombrePresentacion(initialData.nombre_presentacion);
        setUnidadInventarioPorPresentacion(initialData.unidad_inventario_por_presentacion);
      } else {
        // Resetear el formulario para creación
        setProductoId('');
        setNombrePresentacion('');
        setUnidadInventarioPorPresentacion('');
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productoId || !nombrePresentacion || !unidadInventarioPorPresentacion) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      if (initialData) {
        // Actualizar
        const updatedConversion: UpdateConversionCompraDto = {
          producto_id: Number(productoId),
          nombre_presentacion: nombrePresentacion,
          unidad_inventario_por_presentacion: Number(unidadInventarioPorPresentacion),
        };
        await updateConversionCompra(initialData.conversion_id, updatedConversion);
      } else {
        // Crear
        const newConversion: CreateConversionCompraDto = {
          producto_id: Number(productoId),
          nombre_presentacion: nombrePresentacion,
          unidad_inventario_por_presentacion: Number(unidadInventarioPorPresentacion),
        };
        await createConversionCompra(newConversion);
      }
      onSuccess(); // Notificar al padre que la operación fue exitosa
      onClose(); // Cerrar el modal
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar la conversión de compra.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = initialData ? 'Editar Conversión de Compra' : 'Crear Conversión de Compra';
  const submitButtonText = initialData ? 'Actualizar Conversión' : 'Crear Conversión';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{modalTitle}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="productoId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID del Producto:</label>
            <Input
              id="productoId"
              name="productoId"
              type="number"
              value={productoId}
              onChange={(e) => setProductoId(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="nombrePresentacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de Presentación:</label>
            <Input
              id="nombrePresentacion"
              name="nombrePresentacion"
              type="text"
              value={nombrePresentacion}
              onChange={(e) => setNombrePresentacion(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="unidadInventarioPorPresentacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidad de Inventario por Presentación:</label>
            <Input
              id="unidadInventarioPorPresentacion"
              name="unidadInventarioPorPresentacion"
              type="number"
              step="0.01"
              value={unidadInventarioPorPresentacion}
              onChange={(e) => setUnidadInventarioPorPresentacion(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : submitButtonText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConversionesCompraModal;
