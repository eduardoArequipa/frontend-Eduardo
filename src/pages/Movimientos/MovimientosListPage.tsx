import React, { useEffect, useState, useMemo } from 'react';
import { getMovimientos, GetMovimientosParams } from '../../services/movimientoService';
import { getProductos } from '../../services/productoService';
import { MovimientoResponse, MovimientoPagination, TipoMovimientoEnum } from '../../types/movimiento';
import { Producto } from '../../types/producto';
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select';
import ErrorMessage from '../../components/Common/ErrorMessage';
import Modal from '../../components/Common/Modal';
import MovimientoForm from '../../components/Specific/MovimientoForm';
import { useTheme } from '../../context/ThemeContext';
import { formatStockBreakdown } from '../../utils/stockBreakdown';
import { formatearCantidad } from '../../utils/numberFormat';

const MovimientosListPage: React.FC = () => {
    const { theme } = useTheme();
    const [movimientos, setMovimientos] = useState<MovimientoResponse[]>([]);
    const [totalMovimientos, setTotalMovimientos] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState(''); // Para buscar por motivo
    const [productoFilter, setProductoFilter] = useState<number | ''>('');
    const [tipoMovimientoFilter, setTipoMovimientoFilter] = useState<TipoMovimientoEnum | ''>('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [availableProductosFilter, setAvailableProductosFilter] = useState<Producto[]>([]);
    const [loadingFilterData, setLoadingFilterData] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

    const fetchMovimientos = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: GetMovimientosParams = {
                 ...(search && { search }),
                 ...(productoFilter !== '' && { producto_id: productoFilter }),
                 ...(tipoMovimientoFilter && { tipo_movimiento: tipoMovimientoFilter }),
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };
            const response: MovimientoPagination = await getMovimientos(params);
            setMovimientos(response.items);
            setTotalMovimientos(response.total);
        } catch (err: any) {
            console.error("Error fetching movimientos:", err);
            setError(err.response?.data?.detail || "Error al cargar los movimientos.");
            setMovimientos([]);
            setTotalMovimientos(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadFilterData = async () => {
            setLoadingFilterData(true);
            try {
                const productosData = await getProductos({ limit: 100 }); // Obtener todos los productos para el filtro
                setAvailableProductosFilter(productosData.items);
            } catch (err) {
                console.error("Error loading filter data:", err);
                setError("Error al cargar datos de filtro.");
            } finally {
                setLoadingFilterData(false);
            }
        };
        loadFilterData();
    }, []);

    useEffect(() => {
        if (!loadingFilterData) {
            fetchMovimientos();
        }
    }, [search, productoFilter, tipoMovimientoFilter, currentPage, itemsPerPage, loadingFilterData]);

    const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
        setter(value);
        setCurrentPage(1);
    };
    const handleOpenAddModal = () => setIsAddModalOpen(true);
    const handleCloseAddModal = () => setIsAddModalOpen(false);
    const handleAddSuccess = () => {
        handleCloseAddModal();
        fetchMovimientos();
    };

    const columns = useMemo(() => {
        type RowData = MovimientoResponse;
        type TableCellProps = { row: { original: RowData; }; };

        return [
            { Header: 'Producto', accessor: 'producto.nombre', Cell: ({ row }: TableCellProps) => row.original.producto?.nombre || 'N/A' },
            { Header: 'Tipo', accessor: 'tipo_movimiento' },
            { Header: 'Cantidad', Cell: ({ row }: TableCellProps) => {
                const total = formatearCantidad(row.original.cantidad);
                const detalles = row.original.detalles;

                if (!detalles || detalles.length === 0) {
                    return total;
                }

                const desglose = detalles.map(d => {
                    const cantidad = formatearCantidad(d.cantidad);
                    const nombre = d.conversion ? d.conversion.nombre_presentacion : row.original.producto.unidad_inventario.abreviatura;
                    return `${cantidad} ${nombre}`;
                }).join(', ');

                return `${total} (${desglose})`;
            } },
            { Header: 'Motivo', accessor: 'motivo' },
            { 
                Header: 'Stock Anterior', 
                accessor: 'stock_anterior',
                Cell: ({ row }: TableCellProps) => {
                    const formattedStock = formatStockBreakdown(row.original.stock_anterior, row.original.producto);
                    return (
                        <span title={`Total: ${formatearCantidad(row.original.stock_anterior)}`}>
                            {formattedStock}
                        </span>
                    );
                }
            },
            { 
                Header: 'Stock Nuevo', 
                accessor: 'stock_nuevo',
                Cell: ({ row }: TableCellProps) => {
                    const formattedStock = formatStockBreakdown(row.original.stock_nuevo, row.original.producto);
                    return (
                        <span title={`Total: ${formatearCantidad(row.original.stock_nuevo)}`}>
                            {formattedStock}
                        </span>
                    );
                }
            },
            { Header: 'Usuario', accessor: 'usuario.nombre_usuario', Cell: ({ row }: TableCellProps) => row.original.usuario?.nombre_usuario || 'N/A' },
            { Header: 'Fecha', accessor: 'fecha_movimiento', Cell: ({ row }: TableCellProps) => new Date(row.original.fecha_movimiento).toLocaleString('es-BO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }) },
        ];
    }, [movimientos]);

    if ((loading || loadingFilterData) && movimientos.length === 0) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner /> Cargando movimientos...</div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    return (
        <div className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'} min-h-screen p-4`}>
            <h1 className="text-2xl font-bold mb-4">Gestión de Movimientos de Inventario</h1>

            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4 mb-4`}>
                <div className="flex-grow min-w-[150px]">
                    <Input id="search" type="text" placeholder="Buscar por motivo" value={search} onChange={(e) => handleFilterValueChange(setSearch)(e.target.value)} />
                 </div>
                <div>
                     <Select
                         id="tipoMovimientoFilter"
                         value={tipoMovimientoFilter}
                         onChange={(e) => handleFilterValueChange(setTipoMovimientoFilter)(e.target.value as TipoMovimientoEnum | '')}
                         options={[
                             { value: '', label: 'Todos los tipos' },
                             { value: 'merma', label: 'Merma' },
                             { value: 'ajuste_positivo', label: 'Ajuste Positivo' },
                             { value: 'ajuste_negativo', label: 'Ajuste Negativo' },
                             { value: 'uso_interno', label: 'Uso Interno' },
                            { value: 'devolucion', label: 'devolucion' },

                         ]}
                     />
                 </div>
                 {availableProductosFilter.length > 0 && !loadingFilterData && (
                      <div>
                          <Select id="productoFilter" value={productoFilter || ''} onChange={(e) => handleFilterValueChange(setProductoFilter)(e.target.value === '' ? '' : parseInt(e.target.value, 10))} options={[{ value: '', label: 'Todos los productos' }, ...availableProductosFilter.map(p => ({ value: p.producto_id, label: p.nombre }))]} />
                      </div>
                 )}
                 <div className="flex-grow md:flex-none flex justify-end">
                     <Button onClick={handleOpenAddModal} className="bg-green-600 hover:bg-green-700 text-white">Registrar Nuevo Movimiento</Button>
                 </div>
            </div>

            {loading && movimientos.length > 0 && <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-10"><LoadingSpinner /></div>}
            
            {movimientos.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500">No hay movimientos que coincidan con los filtros.</p>
            ) : (
                 <div className="relative overflow-x-auto">
                    <Table columns={columns} data={movimientos} />
                 </div>
            )}

             <div className="mt-4 flex justify-center items-center space-x-4">
                 <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading}>Anterior</Button>
                 <span>Página {currentPage} de {Math.ceil(totalMovimientos / itemsPerPage)} (Total: {totalMovimientos} movimientos)</span>
                 <Button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage >= Math.ceil(totalMovimientos / itemsPerPage) || loading}>Siguiente</Button>
             </div>

            {/* Modal para CREAR Nuevo Movimiento */}
            <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title="Registrar Nuevo Movimiento" widthClass="max-w-xl" showCancelButton={false} showConfirmButton={false}>
                <MovimientoForm onSuccess={handleAddSuccess} onCancel={handleCloseAddModal} />
            </Modal>
        </div>
    );
};

export default MovimientosListPage;
