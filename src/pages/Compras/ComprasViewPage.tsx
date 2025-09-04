// src/pages/Compras/ComprasViewPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCompraById, anularCompra, completarCompra } from '../../services/compraService';

import { Compra } from '../../types/compra';
import { EstadoCompraEnum } from '../../types/enums';

import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import ErrorMessage from '../../components/Common/ErrorMessage';
import DetalleCompraModal from './DetalleCompraModal';

const ComprasViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const compraId = id ? parseInt(id, 10) : null;

    const [compra, setCompra] = useState<Compra | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

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

    const handleAnularCompra = async () => {
        if (!compra || !compraId) return;
        
        const mensaje = compra.estado === EstadoCompraEnum.completada 
            ? `¿Estás seguro de anular la compra #${compraId}? Esto revertirá el stock asociado.`
            : `¿Estás seguro de anular la compra #${compraId}? Esta compra aún no ha modificado el stock.`;
        
        if (window.confirm(mensaje)) {
            setActionLoading(true);
            try {
                const updatedCompra = await anularCompra(compraId);
                setCompra(updatedCompra);
                alert(`Compra #${compraId} anulada con éxito!`);
            } catch (err: any) {
                alert(`Error al anular la compra: ${err.response?.data?.detail || err.message}`);
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleCompletarCompra = async () => {
        if (!compraId) return;
        
        if (window.confirm(`¿Estás seguro de marcar la compra #${compraId} como completada? Esto actualizará el stock de los productos.`)) {
            setActionLoading(true);
            try {
                const updatedCompra = await completarCompra(compraId);
                setCompra(updatedCompra);
                alert(`Compra #${compraId} marcada como completada!`);
            } catch (err: any) {
                alert(`Error al completar la compra: ${err.response?.data?.detail || err.message}`);
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleEditCompra = () => {
        navigate(`/compras/edit/${compraId}`);
    };

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
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Resumen de Productos</h2>
                            <Button 
                                onClick={() => setModalOpen(true)}
                                variant="primary"
                                className="flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Ver Detalles
                            </Button>
                        </div>
                        {compra.detalles && compra.detalles.length > 0 ? (
                            <div className="space-y-3">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">{compra.detalles.length}</span> productos comprados
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {compra.detalles.slice(0, 6).map(detalle => (
                                        <div key={detalle.detalle_id} className="p-3 border rounded-lg border-gray-200 dark:border-gray-600">
                                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                                {detalle.producto ? detalle.producto.nombre : 'Producto Desconocido'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {detalle.cantidad} {detalle.presentacion_compra || 'unidades'}
                                            </p>
                                            <p className="text-sm text-gray-900 dark:text-gray-100">
                                                {(detalle.cantidad * detalle.precio_unitario).toFixed(2)} bs
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {compra.detalles.length > 6 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                        Y {compra.detalles.length - 6} productos más...
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">No hay detalles de productos para esta compra.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
                <Link to="/compras">
                    <Button variant="secondary">Volver al Listado</Button>
                </Link>
                
                {compra && (
                    <div className="flex space-x-4">
                        {compra.estado === EstadoCompraEnum.pendiente && (
                            <>
                                <Button 
                                    onClick={handleEditCompra}
                                    variant="primary"
                                    disabled={actionLoading}
                                >
                                    Editar
                                </Button>
                                <Button 
                                    onClick={handleCompletarCompra}
                                    variant="success"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <LoadingSpinner className="w-4 h-4" /> : 'Completar'}
                                </Button>
                            </>
                        )}
                        
                        {(compra.estado === EstadoCompraEnum.pendiente || compra.estado === EstadoCompraEnum.completada) && (
                            <Button 
                                onClick={handleAnularCompra}
                                variant="danger"
                                disabled={actionLoading}
                            >
                                {actionLoading ? <LoadingSpinner className="w-4 h-4" /> : 'Anular'}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <DetalleCompraModal
                compra={compra}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
};

export default ComprasViewPage;