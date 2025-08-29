
import React, { useState, useEffect, useMemo } from 'react';
import { getVentas, anularVenta, descargarFacturaPdf } from '../../services/ventasService';
import { Venta, VentaPagination } from '../../types/venta';
import { EstadoVentaEnum } from '../../types/enums';

import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import Select from '../../components/Common/Select';
import Modal from '../../components/Common/Modal';
import DetalleVentaModal from './DetalleVentaModal'; // Importar el nuevo modal
import { useNavigate } from 'react-router-dom';

interface Notification {
    message: string;
    type: 'success' | 'error';
}

const VentasListPage: React.FC = () => {
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [totalVentas, setTotalVentas] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize,] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    const [isAnularModalOpen, setIsAnularModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);

    const [filters, setFilters] = useState({
        estado: '' as EstadoVentaEnum | '',
        search: '',
        fecha_desde: '',
        fecha_hasta: '',
    });

    const navigate = useNavigate();

    const fetchVentas = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const skip = (currentPage - 1) * pageSize;
            const fetchedData: VentaPagination = await getVentas({
                estado: filters.estado === '' ? undefined : filters.estado,
                search: filters.search || undefined,
                fecha_desde: filters.fecha_desde || undefined,
                fecha_hasta: filters.fecha_hasta || undefined,
                skip: skip,
                limit: pageSize,
            });
            setVentas(fetchedData.items);
            setTotalVentas(fetchedData.total);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al cargar las ventas.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchVentas();
        }, 300);
        return () => clearTimeout(handler);
    }, [filters, currentPage, pageSize]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    // --- Manejo del Modal de Anulación ---
    const handleAnularVentaClick = (venta: Venta) => {
        setSelectedVenta(venta);
        setIsAnularModalOpen(true);
        setNotification(null);
    };

    const handleConfirmAnularVenta = async () => {
        if (!selectedVenta) return;

        setIsLoading(true);
        setError(null);
        try {
            await anularVenta(selectedVenta.venta_id);
            setNotification({ message: 'Venta anulada con éxito y stock revertido.', type: 'success' });
            fetchVentas();
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Error al anular la venta.';
            setError(errorMessage);
            setNotification({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setIsAnularModalOpen(false);
            setSelectedVenta(null);
        }
    };

    // --- Manejo del Modal de Detalles ---
    const handleViewDetailsClick = (venta: Venta) => {
        setSelectedVenta(venta);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedVenta(null);
    };

    const handleCreateNewSale = () => {
        navigate('/ventas/new');
    };

    const handleDescargarFactura = async (facturaId: number) => {
        setNotification(null);
        setError(null);
        try {
            await descargarFacturaPdf(facturaId);
            setNotification({ message: 'Factura descargada exitosamente.', type: 'success' });
        } catch (err: any) {
            const errorMessage = err.message || 'Error al descargar la factura.';
            setError(errorMessage);
            setNotification({ message: errorMessage, type: 'error' });
        }
    };

    const totalPages = Math.ceil(totalVentas / pageSize);

    const columns = useMemo(() => [
        { Header: 'ID Venta', accessor: 'venta_id' },
        {
            Header: 'Fecha',
            accessor: 'fecha_venta',
            Cell: ({ row }: { row: { original: Venta } }) => new Date(row.original.fecha_venta).toLocaleString('es-BO'),
        },
        {
            Header: 'Cliente',
            accessor: 'persona',
            Cell: ({ row }: { row: { original: Venta } }) => {
                const { persona } = row.original;
                return persona ? `${persona.nombre || ''} ${persona.apellido_paterno || ''}`.trim() : 'Consumidor Final';
            }
        },
        {
            Header: 'Factura',
            id: 'factura_estado',
            Cell: ({ row }: { row: { original: Venta } }) => {
                if (!row.original.factura_electronica) {
                    return <span className="text-xs text-gray-500">No Solicitada</span>;
                }
                const estado = row.original.factura_electronica.estado;
                const color = estado === 'VALIDADA' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                return <span className={`font-semibold ${color}`}>{estado}</span>;
            }
        },
        {
            Header: 'Total',
            accessor: 'total',
            Cell: ({ row }: { row: { original: Venta } }) => <span className="text-green-700 dark:text-green-400 font-semibold">{`${Number(row.original.total).toFixed(2)} Bs.`}</span>,
        },
        { 
            Header: 'Estado Venta', 
            accessor: 'estado',
            Cell: ({ row }: { row: { original: Venta } }) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    row.original.estado === EstadoVentaEnum.activa ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {row.original.estado}
                </span>
            )
        },
        {
            Header: 'Acciones',
            id: 'acciones',
            Cell: ({ row }: { row: { original: Venta } }) => (
                <div className="flex items-center space-x-2">
                    <Button
                        onClick={() => handleViewDetailsClick(row.original)}
                        size="sm"
                        variant="primary"
                    >
                        Ver
                    </Button>
                    {row.original.estado === EstadoVentaEnum.activa && (
                        <Button
                            onClick={() => handleAnularVentaClick(row.original)}
                            size="sm"
                            variant="danger"
                        >
                            Anular
                        </Button>
                    )}
                    {row.original.factura_electronica && row.original.factura_electronica.estado === 'VALIDADA' && (
                        <Button
                            onClick={() => handleDescargarFactura(row.original.factura_electronica!.factura_id)}
                            size="sm"
                            variant="secondary"
                            title="Descargar Factura PDF"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </Button>
                    )}
                </div>
            ),
        },
    ], [handleAnularVentaClick, handleDescargarFactura, handleViewDetailsClick]);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Listado de Ventas</h1>
                <Button onClick={handleCreateNewSale} variant="success">
                    Crear Nueva Venta
                </Button>
            </div>

            {notification && (
                <div className={`mb-4 p-4 rounded-md ${
                    notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {notification.message}
                </div>
            )}
            
            {isLoading && ventas.length === 0 && <LoadingSpinner />}
            {error && !notification && <ErrorMessage message={error} />}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar (Cliente/Producto)</label>
                    <Input
                        id="search"
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        placeholder="Buscar..."
                    />
                </div>
                <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                    <Select
                        id="estado"
                        name="estado"
                        value={filters.estado}
                        onChange={handleFilterChange}
                        options={[
                            { value: '', label: 'Todos' },
                            { value: EstadoVentaEnum.activa, label: 'Activa' },
                            { value: EstadoVentaEnum.anulada, label: 'Anulada' },
                        ]}
                    />
                </div>
                <div>
                    <label htmlFor="fecha_desde" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Desde</label>
                    <Input
                        id="fecha_desde"
                        type="date"
                        name="fecha_desde"
                        value={filters.fecha_desde}
                        onChange={handleFilterChange}
                    />
                </div>
                <div>
                    <label htmlFor="fecha_hasta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Hasta</label>
                    <Input
                        id="fecha_hasta"
                        type="date"
                        name="fecha_hasta"
                        value={filters.fecha_hasta}
                        onChange={handleFilterChange}
                    />
                </div>
            </div>

            {ventas.length === 0 && !isLoading && !error ? (
                <p className="text-gray-600 dark:text-gray-400 text-center mt-8">No se encontraron ventas con los filtros aplicados.</p>
            ) : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md overflow-x-auto relative">
                    {isLoading && ventas.length > 0 && (
                        <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 z-10">
                            <LoadingSpinner />
                        </div>
                    )}
                    <Table columns={columns} data={ventas} />
                    <div className="flex justify-between items-center mt-4">
                        <Button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading} variant="secondary">
                            Anterior
                        </Button>
                        <span className="text-gray-700 dark:text-gray-300">
                            Página {currentPage} de {totalPages} (Total: {totalVentas} ventas)
                        </span>
                        <Button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || isLoading} variant="secondary">
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal de Anulación */}
            <Modal
                isOpen={isAnularModalOpen}
                onClose={() => setIsAnularModalOpen(false)}
                onConfirm={handleConfirmAnularVenta}
                title="Confirmar Anulación de Venta"
                confirmButtonText="Sí, Anular Venta"
                cancelButtonText="Cancelar"
            >
                {selectedVenta && (
                    <div>
                        <p className="text-gray-700 dark:text-gray-300">¿Estás seguro de que quieres anular la venta <strong>#{selectedVenta.venta_id}</strong>?</p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Cliente: {selectedVenta.persona ? `${selectedVenta.persona.nombre} ${selectedVenta.persona.apellido_paterno || ''}`.trim() : 'Consumidor Final'}<br/>
                            Total: {Number(selectedVenta.total).toFixed(2)} Bs.
                        </p>
                        <p className="mt-4 font-semibold text-red-600 dark:text-red-400">Esta acción es irreversible y repondrá el stock de los productos involucrados.</p>
                    </div>
                )}
            </Modal>

            {/* Modal de Detalles de Venta */}
            <DetalleVentaModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                venta={selectedVenta}
            />
        </div>
    );
};

export default VentasListPage;
