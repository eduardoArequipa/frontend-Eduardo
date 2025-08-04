// src/pages/Compras/ComprasViewPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCompraById } from '../../services/compraService';

import { Compra } from '../../types/compra';
import { EstadoCompraEnum } from '../../types/enums';

import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import ErrorMessage from '../../components/Common/ErrorMessage';

const ComprasViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const compraId = id ? parseInt(id, 10) : null;

    const [compra, setCompra] = useState<Compra | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (compraId === null) {
            setError("ID de compra no válido.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        getCompraById(compraId)
            .then(data => {
                setCompra(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.response?.data?.detail || "Error al cargar los detalles de la compra.");
                setLoading(false);
            });
    }, [compraId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                 <LoadingSpinner /> Cargando detalles de la compra...
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!compra) {
        return <div className="text-gray-500 dark:text-gray-400 text-center mt-4">No se encontraron datos para esta compra.</div>;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Detalles de Compra #{compra.compra_id}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Información General</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Proveedor</p>
                                <p className="text-lg text-gray-900 dark:text-gray-100">
                                    {compra.proveedor ? (
                                        compra.proveedor.persona
                                            ? `${compra.proveedor.persona.nombre} ${compra.proveedor.persona.apellido_paterno || ''}`.trim()
                                            : compra.proveedor.empresa
                                                ? compra.proveedor.empresa.razon_social
                                                : `ID ${compra.proveedor.proveedor_id}`
                                    ) : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Compra</p>
                                <p className="text-lg text-gray-900 dark:text-gray-100">{new Date(compra.fecha_compra).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</p>
                                <p className={`text-lg font-semibold ${
                                    compra.estado === EstadoCompraEnum.completada ? 'text-green-600 dark:text-green-400' :
                                    compra.estado === EstadoCompraEnum.anulada ? 'text-red-600 dark:text-red-400' :
                                    'text-yellow-600 dark:text-yellow-400'
                                }`}>
                                    {compra.estado}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{compra.total} bs</p>
                            </div>
                            {compra.creador && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Creado Por</p>
                                    <p className="text-lg text-gray-900 dark:text-gray-100">{compra.creador.nombre_usuario}</p>
                                </div>
                            )}
                            {compra.modificador && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Modificado Por</p>
                                    <p className="text-lg text-gray-900 dark:text-gray-100">{compra.modificador.nombre_usuario}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Productos Comprados</h2>
                        {compra.detalles && compra.detalles.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Producto</th>
                                            <th scope="col" className="px-6 py-3">Cantidad</th>
                                            <th scope="col" className="px-6 py-3">Precio Unitario</th>
                                            <th scope="col" className="px-6 py-3">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {compra.detalles.map(detalle => (
                                            <tr key={detalle.detalle_id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{detalle.producto ? detalle.producto.nombre : 'Producto Desconocido'}</td>
                                                <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{detalle.cantidad}</td>
                                                <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{Number(detalle.precio_unitario).toFixed(2)} bs</td>
                                                <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{(detalle.cantidad * detalle.precio_unitario).toFixed(2)} bs</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">No hay detalles de productos para esta compra.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Link to="/compras">
                    <Button variant="secondary">Volver al Listado</Button>
                </Link>
            </div>
        </div>
    );
};

export default ComprasViewPage;