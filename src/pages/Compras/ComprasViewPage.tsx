// src/pages/Compras/ComprasViewPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
// Importa la función del servicio para obtener una compra por ID
import { getCompraById } from '../../services/compraService';

// Importa los tipos necesarios
import { Compra } from '../../types/compra'; // Esquema de lectura completo
import { EstadoCompraEnum } from '../../types/enums'; // Para mostrar el estado

// Importa componentes comunes
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';


const ComprasViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Obtiene el ID de la URL

    const compraId = id ? parseInt(id, 10) : null; // Convierte el ID a número

    // Estado para almacenar los datos de la compra
    const [compra, setCompra] = useState<Compra | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    // *** Efecto para cargar los datos de la compra por ID ***
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
                console.error(`Error loading compra ${compraId}:`, err);
                setError(err.response?.data?.detail || "Error al cargar los detalles de la compra.");
                setLoading(false);
            });
    }, [compraId]); // Dependencia: Recargar si cambia el ID en la URL


    // --- Renderizado Condicional de Estados Globales ---

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner /> Cargando detalles de la compra...
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center mt-4">Error: {error}</div>;
    }

    if (!compra) {
        // Esto no debería ocurrir si no hay error y loading es false, pero es un fallback seguro
        return <div className="text-gray-500 text-center mt-4">No se encontraron datos para esta compra.</div>;
    }


    // --- JSX Principal (Mostrar Detalles de la Compra) ---
    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Detalles de Compra #{compra.compra_id}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Información General</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Proveedor</p>
                                <p className="text-lg text-gray-900">
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
                                <p className="text-sm font-medium text-gray-500">Fecha de Compra</p>
                                <p className="text-lg text-gray-900">{new Date(compra.fecha_compra).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Estado</p>
                                <p className={`text-lg font-semibold ${
                                    compra.estado === EstadoCompraEnum.completada ? 'text-green-600' :
                                    compra.estado === EstadoCompraEnum.anulada ? 'text-red-600' :
                                    'text-yellow-600'
                                }`}>
                                    {compra.estado}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total</p>
                                <p className="text-lg font-semibold text-gray-900">{compra.total} bs</p>
                            </div>
                            {compra.creador && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Creado Por</p>
                                    <p className="text-lg text-gray-900">{compra.creador.nombre_usuario}</p>
                                </div>
                            )}
                            {compra.modificador && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Modificado Por</p>
                                    <p className="text-lg text-gray-900">{compra.modificador.nombre_usuario}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Productos Comprados</h2>
                        {compra.detalles && compra.detalles.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Producto</th>
                                            <th scope="col" className="px-6 py-3">Cantidad</th>
                                            <th scope="col" className="px-6 py-3">Precio Unitario</th>
                                            <th scope="col" className="px-6 py-3">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {compra.detalles.map(detalle => (
                                            <tr key={detalle.detalle_id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4">{detalle.producto ? detalle.producto.nombre : 'Producto Desconocido'}</td>
                                                <td className="px-6 py-4">{detalle.cantidad}</td>
                                                <td className="px-6 py-4">{Number(detalle.precio_unitario).toFixed(2)} bs</td>
                                                <td className="px-6 py-4">{(detalle.cantidad * detalle.precio_unitario).toFixed(2)} bs</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">No hay detalles de productos para esta compra.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Link to="/compras">
                    <Button className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                        Volver al Listado
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default ComprasViewPage;
