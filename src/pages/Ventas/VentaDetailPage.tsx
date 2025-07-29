// src/pages/Ventas/VentaDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVentaById } from '../../services/ventasService';
import { Venta } from '../../types/venta';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import { EstadoVentaEnum } from '../../types/enums';

const VentaDetailPage: React.FC = () => {
    const { ventaId } = useParams<{ ventaId: string }>();
    const navigate = useNavigate();

    const [venta, setVenta] = useState<Venta | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ventaId) {
            setError('ID de venta no proporcionado.');
            setIsLoading(false);
            return;
        }

        const fetchVentaDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getVentaById(Number(ventaId));
                setVenta(data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Error al cargar los detalles de la venta.');
                console.error('Error al obtener venta:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVentaDetails();
    }, [ventaId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-md m-6">
                <p>{error}</p>
                <Button onClick={() => navigate(-1)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                    Volver
                </Button>
            </div>
        );
    }

    if (!venta) {
        return (
            <div className="p-6 text-gray-700 m-6">
                <p>No se encontraron detalles para esta venta.</p>
                <Button onClick={() => navigate(-1)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                    Volver
                </Button>
            </div>
        );
    }

    // Formatear la fecha para una mejor visualización
    const formattedDate = new Date(venta.fecha_venta).toLocaleString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Detalles de Venta #{venta.venta_id}</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Información General</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong>Fecha y Hora:</strong> {formattedDate}</p>
                    <p><strong>Estado:</strong> <span className={`font-semibold ${venta.estado === EstadoVentaEnum.activa ? 'text-green-600' : 'text-red-600'}`}>{venta.estado}</span></p>
                    {/* 🚨🚨🚨 ¡CAMBIO AQUÍ! Accede a `venta.persona` */}
                    <p>
                        <strong>Cliente:</strong>{' '}
                        {venta.persona
                            ? `${venta.persona.nombre} ${venta.persona.apellido_paterno || ''}`.trim()
                            : 'Consumidor Final'}
                    </p>
                    <p><strong>Método de Pago:</strong> {venta.metodo_pago ? venta.metodo_pago.nombre_metodo : 'N/A'}</p>
                    <p><strong>Total de Venta:</strong> {Number(venta.total)} Bs.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Detalles de Productos</h2>
                {venta.detalles && venta.detalles.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Código</th>
                                    <th scope="col" className="px-6 py-3">Producto</th>
                                    <th scope="col" className="px-6 py-3">Cantidad</th>
                                    <th scope="col" className="px-6 py-3">Precio Unitario</th>
                                    <th scope="col" className="px-6 py-3">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {venta.detalles.map(detalle => (
                                    <tr key={detalle.detalle_id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">{detalle.producto?.codigo || 'N/A'}</td>
                                        <td className="px-6 py-4">{detalle.producto?.nombre || 'Producto Desconocido'}</td>
                                        <td className="px-6 py-4">{detalle.cantidad}</td>
                                        <td className="px-6 py-4">{detalle.precio_unitario} Bs.</td>
                                        <td className="px-6 py-4">{(detalle.cantidad * detalle.precio_unitario)} Bs.</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No hay detalles de productos para esta venta.</p>
                )}
            </div>

            <div className="mt-6 flex justify-end">
                <Button
                    onClick={() => navigate(-1)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                    Volver a la lista de Ventas
                </Button>
            </div>
        </div>
    );
};

export default VentaDetailPage;