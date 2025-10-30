
import React, { useState, useEffect } from 'react';
import { getVentas, anularVenta, descargarFacturaPdf } from '../../services/ventasService';
import { Venta, VentaPagination } from '../../types/venta';
import { EstadoVentaEnum } from '../../types/enums';
import { useNotification } from '../../context/NotificationContext'; // 1. Importar hook

import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import Select from '../../components/Common/Select';
import Modal from '../../components/Common/Modal';
import DetalleVentaModal from './DetalleVentaModal';
import { TransactionCard } from '../../components/Common/Card';
import ActionsDropdown, { ActionConfig } from '../../components/Common/ActionsDropdown';
import { useNavigate } from 'react-router-dom';

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
    
    const { addNotification } = useNotification(); // 2. Usar el hook

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
            const errorMessage = err.response?.data?.detail || 'Error al cargar las ventas.';
            setError(errorMessage);
            addNotification(errorMessage, 'error');
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

    const handleAnularVentaClick = (venta: Venta) => {
        setSelectedVenta(venta);
        setIsAnularModalOpen(true);
    };

    const handleConfirmAnularVenta = async () => {
        if (!selectedVenta) return;

        setIsLoading(true);
        setError(null);
        try {
            await anularVenta(selectedVenta.venta_id);
            // Mensaje más descriptivo que incluye la factura si existe
            const mensaje = selectedVenta.factura_electronica?.estado === 'VALIDADA'
                ? 'Venta y factura electrónica anuladas con éxito. Stock revertido.'
                : 'Venta anulada con éxito y stock revertido.';
            addNotification(mensaje, 'success');
            fetchVentas();
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Error al anular la venta.';
            addNotification(errorMessage, 'error'); // 3. Reemplazar
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setIsAnularModalOpen(false);
            setSelectedVenta(null);
        }
    };

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
        setError(null);
        try {
            await descargarFacturaPdf(facturaId);
            addNotification('Factura descargada exitosamente.', 'success'); // 3. Reemplazar
        } catch (err: any) {
            const errorMessage = err.message || 'Error al descargar la factura.';
            addNotification(errorMessage, 'error'); // 3. Reemplazar
            setError(errorMessage);
        }
    };

    const totalPages = Math.ceil(totalVentas / pageSize);

    const generateVentaActions = (venta: Venta): ActionConfig[] => [
        { 
            label: 'Ver Detalles', 
            onClick: () => handleViewDetailsClick(venta), 
            isVisible: true 
        },
        {
            label: venta.factura_electronica?.estado === 'VALIDADA' ? 'Anular Venta y Factura' : 'Anular Venta',
            onClick: () => handleAnularVentaClick(venta),
            isVisible: venta.estado === EstadoVentaEnum.activa,
            colorClass: 'text-red-700 dark:text-red-400'
        },
        { 
            label: 'Descargar Factura', 
            onClick: () => handleDescargarFactura(venta.factura_electronica!.factura_id), 
            isVisible: !!(venta.factura_electronica && venta.factura_electronica.estado === 'VALIDADA'), 
            colorClass: 'text-blue-700 dark:text-blue-400' 
        }
    ];

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Listado de Ventas</h1>
                <Button onClick={handleCreateNewSale} variant="success">
                    Registrar Nueva Venta
                </Button>
            </div>

            {isLoading && ventas.length === 0 && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}

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
                <div className="relative">
                    {isLoading && ventas.length > 0 && (
                        <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 z-10">
                            <LoadingSpinner />
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ventas.map(venta => {
                            const cliente = venta.persona 
                                ? `${venta.persona.nombre || ''} ${venta.persona.apellido_paterno || ''}`.trim()
                                : 'Consumidor Final';
                            
                            const ventaActions = generateVentaActions(venta);
                            
                            // Items adicionales para mostrar en la card
                            const items = [];
                            
                            // Información de factura electrónica
                            if (venta.factura_electronica) {
                                items.push({
                                    label: 'Factura',
                                    value: venta.factura_electronica.estado,
                                    icon: (
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    )
                                });
                            } else {
                                items.push({
                                    label: 'Factura',
                                    value: 'No Solicitada',
                                    icon: (
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    )
                                });
                            }

                            return (
                                <TransactionCard
                                    key={venta.venta_id}
                                    transactionId={venta.venta_id}
                                    date={venta.fecha_venta}
                                    client={cliente}
                                    total={Number(venta.total)}
                                    status={{
                                        text: venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1),
                                        variant: venta.estado === EstadoVentaEnum.activa ? 'success' : 'danger'
                                    }}
                                    items={items}
                                    actions={<ActionsDropdown actions={ventaActions} isLoading={isLoading} />}
                                    variant="sale"
                                />
                            );
                        })}
                    </div>
                    
                    <div className="flex justify-center items-center mt-8 space-x-4">
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
                showConfirmButton={true}
                confirmButtonVariant="danger"
                isConfirmButtonDisabled={isLoading}
                isCancelButtonDisabled={isLoading}

            >
                {selectedVenta && (
                    <div>
                        <p className="text-gray-700 dark:text-gray-300">
                            ¿Estás seguro de que quieres anular la venta <strong>#{selectedVenta.venta_id}</strong>
                            {selectedVenta.factura_electronica?.estado === 'VALIDADA' && ' y su factura electrónica'}?
                        </p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Cliente: {selectedVenta.persona ? `${selectedVenta.persona.nombre} ${selectedVenta.persona.apellido_paterno || ''}`.trim() : 'Consumidor Final'}<br/>
                            Total: {Number(selectedVenta.total).toFixed(2)} Bs.
                            {selectedVenta.factura_electronica?.estado === 'VALIDADA' && (
                                <><br/>Factura: {selectedVenta.factura_electronica.cuf || 'Generada'}</>
                            )}
                        </p>
                        <p className="mt-4 font-semibold text-red-600 dark:text-red-400">
                            Esta acción es irreversible y repondrá el stock de los productos involucrados.
                            {selectedVenta.factura_electronica?.estado === 'VALIDADA' && ' La factura electrónica también será anulada en Tesabiz.'}
                        </p>
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
