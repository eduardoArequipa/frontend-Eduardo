import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompras, anularCompra, completarCompra } from '../../services/compraService';
import { getProveedores } from '../../services/proveedorService';

import {
    Compra, 
    GetComprasParams, 
    CompraPagination 
} from '../../types/compra';
import { EstadoCompraEnum, EstadoEnum } from '../../types/enums'; 
import { Proveedor} from '../../types/proveedor'; 

import Button from '../../components/Common/Button'; 
import Input from '../../components/Common/Input'; 
import LoadingSpinner from '../../components/Common/LoadingSpinner'; 
import ActionsDropdown from '../../components/Common/ActionsDropdown';
import { ActionConfig } from '../../components/Common/ActionsDropdown';
import Select from '../../components/Common/Select';
import ErrorMessage from '../../components/Common/ErrorMessage';
import DetalleCompraModal from './DetalleCompraModal';
import { TransactionCard } from '../../components/Common/Card';
import Modal from '../../components/Common/Modal'; // Importar Modal
import { useNotification } from '../../context/NotificationContext'; // Importar el hook de notificación

const ComprasListPage: React.FC = () => {
    const navigate = useNavigate();

    const [compras, setCompras] = useState<Compra[]>([]);
    const [totalCompras, setTotalCompras] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [estadoFilter, setEstadoFilter] = useState<EstadoCompraEnum | ''>();
    const [proveedorFilter, setProveedorFilter] = useState<number | ''>('');
    const [fechaDesdeFilter, setFechaDesdeFilter] = useState<string>('');
    const [fechaHastaFilter, setFechaHastaFilter] = useState<string>('');
    const [search, setSearch] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [availableProveedores, setAvailableProveedores] = useState<Proveedor[]>([]);
    const [loadingFiltersData, setLoadingFiltersData] = useState(true);
    const [errorFiltersData, setErrorFiltersData] = useState<string | null>(null);

    const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isAnularModalOpen, setIsAnularModalOpen] = useState(false); // Nuevo estado para el modal de anulación

    const { addNotification } = useNotification(); // Hook para notificaciones

    const fetchCompras = async () => {
        setLoading(true);
        setError(null);

        try {
            const params: GetComprasParams = {
                 ...(estadoFilter && { estado: estadoFilter }),
                 ...(proveedorFilter && { proveedor_id: proveedorFilter }),
                 ...(fechaDesdeFilter && { fecha_desde: fechaDesdeFilter }),
                 ...(fechaHastaFilter && { fecha_hasta: fechaHastaFilter }),
                 ...(search && { search }),
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };

             const fetchedData: CompraPagination = await getCompras(params);
             setCompras(fetchedData.items);
             setTotalCompras(fetchedData.total);

        } catch (err: any) {
            setError(err.response?.data?.detail || "Error al cargar las compras.");
            setCompras([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompras();
    }, [estadoFilter, proveedorFilter, fechaDesdeFilter, fechaHastaFilter, search, currentPage, itemsPerPage]);

    useEffect(() => {
        const fetchFiltersData = async () => {
            setLoadingFiltersData(true);
            setErrorFiltersData(null);
            try {
                const proveedoresResponse = await getProveedores({ estado: EstadoEnum.Activo, limit: 1000 });
                setAvailableProveedores(proveedoresResponse.items || []);
            } catch (err: any) {
                setErrorFiltersData("Error al cargar datos para filtros.");
            } finally {
                setLoadingFiltersData(false);
            }
        };
        fetchFiltersData();
    }, []);

     const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
         setter(value);
         setCurrentPage(1);
     };

     const handleNumericFilterChange = (setter: React.Dispatch<any>) => (e: React.ChangeEvent<HTMLSelectElement>) => {
         const value = e.target.value;
         setter(value === '' ? '' : parseInt(value, 10));
         setCurrentPage(1);
     };

    const handleAnularCompraClick = (compra: Compra) => {
        setSelectedCompra(compra);
        setIsAnularModalOpen(true);
    };

    const handleConfirmAnularCompra = async () => {
        if (!selectedCompra) return;

        const compraId = selectedCompra.compra_id;
        const originalState = [...compras];

        try {
            // Optimistic UI update
            const updatedCompras = compras.map(c => 
                c.compra_id === compraId ? { ...c, estado: EstadoCompraEnum.anulada } : c
            );
            setCompras(updatedCompras);

            await anularCompra(compraId);

            const mensaje = selectedCompra.estado === EstadoCompraEnum.completada
                ? `Compra #${compraId} anulada y stock revertido con éxito.`
                : `Compra #${compraId} anulada con éxito.`;
            addNotification(mensaje, 'success');
            
            // Fetch data again to ensure consistency
            fetchCompras(); 

        } catch (err: any) {
            // Revert UI on error
            setCompras(originalState);
            const errorMessage = err.response?.data?.detail || `Error al anular la compra #${compraId}`;
            addNotification(errorMessage, 'error');
        } finally {
            setIsAnularModalOpen(false);
            setSelectedCompra(null);
        }
    };

     const handleCompletarCompra = async (id: number) => {
         if (window.confirm(`¿Estás seguro de marcar la compra #${id} como completada?`)) {
             try {
                 const updatedCompra = await completarCompra(id);
                 setCompras(compras.map(c => c.compra_id === id ? updatedCompra : c));
                 alert(`Compra #${id} marcada como completada!`);

             } catch (err: any) {
                 alert(`Error al marcar la compra #${id} como completada: ${err.response?.data?.detail || err.message}`);
            }
        }
    };


    const handleViewModal = useCallback((compra: Compra) => {
        setSelectedCompra(compra);
        setIsDetailModalOpen(true);
    }, []);

    const handleEditCompra = useCallback((id: number) => {
        navigate(`/compras/edit/${id}`);
    }, [navigate]);

    const totalPages = Math.ceil(totalCompras / itemsPerPage);

    const generateCompraActions = (compra: Compra): ActionConfig[] => {
        const isAnulada = compra.estado === EstadoCompraEnum.anulada;
        const isPendiente = compra.estado === EstadoCompraEnum.pendiente;

        return [
            { label: 'Ver Detalle', onClick: () => handleViewModal(compra), isVisible: true, buttonVariant: 'menuItem', colorClass: 'text-blue-700 dark:text-blue-400' },
            { label: 'Editar', onClick: () => handleEditCompra(compra.compra_id), isVisible: isPendiente, buttonVariant: 'menuItem' },
            { label: 'Completar', onClick: () => handleCompletarCompra(compra.compra_id), isVisible: isPendiente, buttonVariant: 'menuItem', colorClass: 'text-green-700 dark:text-green-400' },
            { label: 'Anular', onClick: () => handleAnularCompraClick(compra), isVisible: !isAnulada, buttonVariant: 'menuItem', colorClass: 'text-red-700 dark:text-red-400' },
        ];
    };

    if (loading && compras.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                 <LoadingSpinner /> Cargando compras...
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }
     if (errorFiltersData) {
         return <ErrorMessage message={errorFiltersData} />;
     }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gestión de Compras</h1>
                <Button onClick={() => navigate('/compras/new')} variant="success">
                    Registrar Nueva Compra
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
                    <Input id="search" type="text" placeholder="Buscar por proveedor o producto" value={search} onChange={(e) => handleFilterValueChange(setSearch)(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="estadoFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                    <Select id="estadoFilter" value={estadoFilter} onChange={(e) => handleFilterValueChange(setEstadoFilter)(e.target.value as EstadoCompraEnum | '')} options={[
                        { value: '', label: 'Todos los estados' },
                        { value: EstadoCompraEnum.pendiente, label: 'Pendiente' },
                        { value: EstadoCompraEnum.completada, label: 'Completada' },
                        { value: EstadoCompraEnum.anulada, label: 'Anulada' },
                    ]} />
                </div>
                <div>
                    <label htmlFor="proveedorFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proveedor</label>
                    <Select id="proveedorFilter" value={proveedorFilter} onChange={handleNumericFilterChange(setProveedorFilter)} disabled={loadingFiltersData} options={[
                        { value: '', label: 'Todos los proveedores' },
                        ...availableProveedores.map(prov => ({
                            value: prov.proveedor_id,
                            label: prov.persona ? `${prov.persona.nombre} ${prov.persona.apellido_paterno || ''}`.trim() : prov.empresa ? prov.empresa.razon_social : `ID ${prov.proveedor_id}`,
                        })),
                    ]} />
                </div>
                <div>
                    <label htmlFor="fechaDesdeFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desde</label>
                    <Input id="fechaDesdeFilter" type="date" value={fechaDesdeFilter} onChange={(e) => handleFilterValueChange(setFechaDesdeFilter)(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="fechaHastaFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hasta</label>
                    <Input id="fechaHastaFilter" type="date" value={fechaHastaFilter} onChange={(e) => handleFilterValueChange(setFechaHastaFilter)(e.target.value)} />
                </div>
            </div>

            {compras.length === 0 && !loading && !error ? (
                <p className="text-gray-600 dark:text-gray-400 text-center mt-8">No hay compras registradas que coincidan con los filtros.</p>
            ) : (
                <div className="relative">
                    {loading && compras.length > 0 && (
                        <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 z-10">
                            <LoadingSpinner />
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {compras.map(compra => {
                            const proveedor = compra.proveedor
                                ? compra.proveedor.persona 
                                    ? `${compra.proveedor.persona.nombre} ${compra.proveedor.persona.apellido_paterno || ''}`.trim()
                                    : compra.proveedor.empresa 
                                        ? compra.proveedor.empresa.razon_social
                                        : `ID ${compra.proveedor.proveedor_id}`
                                : 'Sin proveedor';
                            
                            const compraActions = generateCompraActions(compra);
                            
                            const items = [];
                            
                            if (compra.estado === EstadoCompraEnum.completada) {
                                items.push({
                                    label: 'Stock',
                                    value: 'Actualizado',
                                    icon: (
                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )
                                });
                            } else if (compra.estado === EstadoCompraEnum.pendiente) {
                                items.push({
                                    label: 'Stock',
                                    value: 'Pendiente',
                                    icon: (
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )
                                });
                            }

                            return (
                                <TransactionCard
                                    key={compra.compra_id}
                                    transactionId={compra.compra_id}
                                    date={compra.fecha_compra}
                                    client={proveedor}
                                    total={Number(compra.total)}
                                    status={{
                                        text: compra.estado.charAt(0).toUpperCase() + compra.estado.slice(1),
                                        variant: compra.estado === EstadoCompraEnum.completada 
                                            ? 'success' 
                                            : compra.estado === EstadoCompraEnum.anulada 
                                                ? 'danger' 
                                                : 'info'
                                    }}
                                    items={items}
                                    actions={<ActionsDropdown actions={compraActions} isLoading={loading} />}
                                    variant="purchase"
                                />
                            );
                        })}
                    </div>
                    
                    <div className="flex justify-center items-center mt-8 space-x-4">
                        <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} variant="secondary">Anterior</Button>
                        <span className="text-gray-700 dark:text-gray-300">
                            Página {currentPage} de {totalPages} (Total: {totalCompras} compras)
                        </span>
                        <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} variant="secondary">Siguiente</Button>
                    </div>
                </div>
            )}
            
            <DetalleCompraModal
                compra={selectedCompra}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
            />

            {/* Modal de Anulación */}
            <Modal
                isOpen={isAnularModalOpen}
                onClose={() => setIsAnularModalOpen(false)}
                onConfirm={handleConfirmAnularCompra}
                title="Confirmar Anulación de Compra"
                confirmButtonText="Sí, Anular Compra"
                showConfirmButton={true}
                confirmButtonVariant="danger"
                isConfirmButtonDisabled={loading}
                isCancelButtonDisabled={loading}
                showCancelButton={true}
            >
                {selectedCompra && (
                    <div>
                        <p className="text-gray-700 dark:text-gray-300">
                            ¿Estás seguro de que quieres anular la compra <strong>#{selectedCompra.compra_id}</strong>?
                        </p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Proveedor: {selectedCompra.proveedor?.persona?.nombre || selectedCompra.proveedor?.empresa?.razon_social || 'N/A'}<br/>
                            Total: {Number(selectedCompra.total).toFixed(2)} Bs.
                        </p>
                        <p className="mt-4 font-semibold text-red-600 dark:text-red-400">
                            Esta acción es irreversible.
                            {selectedCompra.estado === EstadoCompraEnum.completada && ' Se repondrá el stock de los productos involucrados.'}
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ComprasListPage;