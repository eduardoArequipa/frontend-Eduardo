import React, { useState, useEffect } from 'react';
import ConversionesCompraModal from './ConversionesCompraModal';
import { getConversionesCompra, deleteConversionCompra } from '../../services/conversionesCompraService';
import { ConversionCompra } from '../../types/conversionesCompra';

const ConversionesCompraList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConversion, setSelectedConversion] = useState<ConversionCompra | null>(null); // Para edición
  const [conversiones, setConversiones] = useState<ConversionCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversiones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConversionesCompra();
      setConversiones(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversiones();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false); // Cerrar modal después de éxito
    setSelectedConversion(null); // Resetear selección
    fetchConversiones(); // Refrescar la lista después de una operación exitosa
  };

  const handleEdit = (conversion: ConversionCompra) => {
    setSelectedConversion(conversion);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, nombrePresentacion: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la conversión de "${nombrePresentacion}"?`)) {
      try {
        await deleteConversionCompra(id);
        fetchConversiones();
        alert(`Conversión de "${nombrePresentacion}" eliminada con éxito!`);
      } catch (err: any) {
        alert(`Error al eliminar la conversión: ${err.response?.data?.detail || err.message}`);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Gestión de Conversiones de Compra</h1>

      <button
        onClick={() => { setSelectedConversion(null); setIsModalOpen(true); }}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Añadir Nueva Conversión
      </button>

      {loading && <p className="text-gray-600 dark:text-gray-400">Cargando conversiones...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && conversiones.length === 0 && (
        <p className="text-gray-600 dark:text-gray-400">No hay conversiones de compra registradas.</p>
      )}

      {!loading && !error && conversiones.length > 0 && (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="py-3 px-4 text-left">ID Conversión</th>
                <th className="py-3 px-4 text-left">ID Producto</th>
                <th className="py-3 px-4 text-left">Nombre Presentación</th>
                <th className="py-3 px-4 text-left">Unidad Inventario por Presentación</th>
                <th className="py-3 px-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300">
              {conversiones.map((conversion) => (
                <tr key={conversion.conversion_id} className="border-b border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="py-3 px-4">{conversion.conversion_id}</td>
                  <td className="py-3 px-4">{conversion.producto_id}</td>
                  <td className="py-3 px-4">{conversion.nombre_presentacion}</td>
                  <td className="py-3 px-4">{conversion.unidad_inventario_por_presentacion}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleEdit(conversion)}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 mr-2"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(conversion.conversion_id, conversion.nombre_presentacion)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConversionesCompraModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedConversion(null); }} // Resetear al cerrar
        onSuccess={handleSuccess}
        initialData={selectedConversion}
      />
    </div>
  );
};

export default ConversionesCompraList;
