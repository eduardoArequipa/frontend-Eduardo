import React, { useEffect, useState, useMemo, useCallback } from 'react';
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

import Table from '../../components/Common/Table'; 
import Button from '../../components/Common/Button'; 
import Input from '../../components/Common/Input'; 
import LoadingSpinner from '../../components/Common/LoadingSpinner'; 
import ActionsDropdown from '../../components/Common/ActionsDropdown';
import { ActionConfig } from '../../components/Common/ActionsDropdown';
import Select from '../../components/Common/Select';
import ErrorMessage from '../../components/Common/ErrorMessage';

const ComprasListPage: React.FC = () => {
    const navigate = useNavigate();

    const [compras, setCompras] = useState<Compra[]>([]);
    const [totalCompras, setTotalCompras] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [estadoFilter, setEstadoFilter] = useState<EstadoCompraEnum | ''>(EstadoCompraEnum.pendiente);
    const [proveedorFilter, setProveedorFilter] = useState<number | ''>('');
    const [fechaDesdeFilter, setFechaDesdeFilter] = useState<string>('');
    const [fechaHastaFilter, setFechaHastaFilter] = useState<string>('');
    const [search, setSearch] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [availableProveedores, setAvailableProveedores] = useState<Proveedor[]>([]);
    const [loadingFiltersData, setLoadingFiltersData] = useState(true);
    const [errorFiltersData, setErrorFiltersData] = useState<string | null>(null);

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

    const handleAnularCompra = async (id: number) => {
        if (window.confirm(`¿Estás seguro de anular la compra #${id}? Esto revertirá el stock asociado.`)) {
            try {
                const updatedCompra = await anularCompra(id);
                setCompras(compras.map(c => c.compra_id === id ? updatedCompra : c));
                alert(`Compra #${id} anulada con éxito!`);

            } catch (err: any) {
                 alert(`Error al anular la compra #${id}: ${err.response?.data?.detail || err.message}`);
            }
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

    const handleViewCompra = useCallback((id: number) => {
        navigate(`/compras/view/${id}`);
              

    }, [navigate]);

    const handleEditCompra = useCallback((id: number) => {
        navigate(`/compras/edit/${id}`);
    }, [navigate]);

    const totalPages = Math.ceil(totalCompras / itemsPerPage);

    const columns = useMemo(() => {
        return [
            { Header: 'ID', accessor: 'compra_id' },
            {
                 Header: 'Proveedor',
                 accessor: 'proveedor',
                 Cell: ({ row }: { row: { original: Compra } }): React.ReactNode => {
                      const p = row.original.proveedor;
                      if (p) {
                           if (p.persona && p.persona.nombre) {
                               return `${p.persona.nombre} ${p.persona.apellido_paterno || ''}`.trim();
                           } else if (p.empresa && p.empresa.razon_social) {
                               return p.empresa.razon_social;
                           } else {
                               return `ID ${p.proveedor_id !== undefined ? p.proveedor_id : 'N/A'}`;
                           }
                      }
                      return '-';
                 },
            },

            {
                 Header: 'Fecha',
                 accessor: 'fecha_compra',
                 Cell: ({ row }: { row: { original: Compra } }): React.ReactNode => {
                      const value = row.original.fecha_compra;
                      try {
                           const date = new Date(value);
                           return date.toLocaleDateString();
                      } catch {
                           return value;
                      }
                 },
            },
            {
                 Header: 'Total',
                 accessor: 'total',
                 Cell: ({ row }: { row: { original: Compra } }): React.ReactNode => {
                      const value = row.original.total;
                      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
                      if (typeof numericValue === 'number' && !isNaN(numericValue)) {
                          return <span className="text-green-700 dark:text-green-400 font-semibold">{`${numericValue.toFixed(2)} Bs`}</span>;
                      }
                      return <span className="text-gray-700 dark:text-gray-300">{`${value} Bs`}</span>;
                 },
            },
            { 
                Header: 'Estado', 
                accessor: 'estado',
                Cell: ({ row }: { row: { original: Compra } }): React.ReactNode => {
                    const estado = row.original.estado;
                    let textColorClass = '';
                    let bgColorClass = '';

                    switch (estado) {
                        case EstadoCompraEnum.pendiente:
                            textColorClass = 'text-blue-900 dark:text-blue-200';
                            bgColorClass = 'bg-blue-200 dark:bg-blue-800';
                            break;
                        case EstadoCompraEnum.completada:
                            textColorClass = 'text-green-900 dark:text-green-200';
                            bgColorClass = 'bg-green-200 dark:bg-green-800';
                            break;
                        case EstadoCompraEnum.anulada:
                            textColorClass = 'text-red-900 dark:text-red-200';
                            bgColorClass = 'bg-red-200 dark:bg-red-800';
                            break;
                        default:
                            textColorClass = 'text-gray-900 dark:text-gray-200';
                            bgColorClass = 'bg-gray-200 dark:bg-gray-700';
                            break;
                    }

                    return (
                        <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${textColorClass}`}>
                            <span aria-hidden="true" className={`absolute inset-0 opacity-50 rounded-full ${bgColorClass}`}></span>
                            <span className="relative">{estado.charAt(0).toUpperCase() + estado.slice(1)}</span>
                        </span>
                    );
                },
            },
            {
                Header: 'Acciones',
                accessor: 'acciones',
                Cell: ({ row }: { row: { original: Compra } }): React.ReactNode => {
                    const compra = row.original;
                    const isAnulada = compra.estado === EstadoCompraEnum.anulada;
                    const isCompletada = compra.estado === EstadoCompraEnum.completada;
                    const isPendiente = compra.estado === EstadoCompraEnum.pendiente;

                    const compraActions: ActionConfig[] = [
                        { label: 'Ver', onClick: () => handleViewCompra(compra.compra_id), isVisible: true, buttonVariant: 'menuItem' },
                        { label: 'Editar', onClick: () => handleEditCompra(compra.compra_id), isVisible: isPendiente, buttonVariant: 'menuItem' },
                        { label: 'Completar', onClick: () => handleCompletarCompra(compra.compra_id), isVisible: isPendiente, buttonVariant: 'menuItem', colorClass: 'text-green-700 dark:text-green-400' },
                        { label: 'Anular', onClick: () => handleAnularCompra(compra.compra_id), isVisible: !isAnulada && !isCompletada, buttonVariant: 'menuItem', colorClass: 'text-red-700 dark:text-red-400' },
                    ];

                    return (
                        <ActionsDropdown actions={compraActions} isLoading={loading} />
                    );
                },
            },
        ];
    }, [handleAnularCompra, handleCompletarCompra, handleViewCompra, handleEditCompra, loading]);

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

            {loading && compras.length > 0 && (
                 <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 z-10">
                     <LoadingSpinner />
                 </div>
            )}
            {compras.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No hay compras registradas que coincidan con los filtros.</p>
            ) : (
                 <div className="relative overflow-x-auto">
                    <Table columns={columns} data={compras} />
                    <div className="mt-4 flex justify-center items-center space-x-4">
                        <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} variant="secondary">Anterior</Button>
                        <span className="text-gray-700 dark:text-gray-300">
                            Página {currentPage} de {totalPages} (Total: {totalCompras} compras)
                        </span>
                        <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} variant="secondary">Siguiente</Button>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default ComprasListPage;