// src/pages/Ventas/VentasListPage.tsx
import React, { useState, useEffect } from 'react';
import {
    getVentas,
    anularVenta
} from '../../services/ventasService';

// Importa el tipo Venta (CORRECCIÓN: Asegúrate de que este sea el nombre de la interfaz exportada en types/venta.ts)
import { Venta } from '../../types/venta';
import { EstadoVentaEnum } from '../../types/enums';

// Importa componentes comunes
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import Select from '../../components/Common/Select';
import { Link, useNavigate } from 'react-router-dom';

const VentasListPage: React.FC = () => {
    // Usa Venta para el estado de las ventas
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Estados para filtros
    const [filters, setFilters] = useState({
        estado: '' as EstadoVentaEnum | '',
        search: '', // Para buscar por cliente o producto
        fecha_desde: '',
        fecha_hasta: '',
    });

    const navigate = useNavigate();

    // Función para obtener la lista de ventas con los parámetros actuales
    const fetchVentas = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedVentas = await getVentas({
                estado: filters.estado === '' ? undefined : filters.estado,
                search: filters.search || undefined,
                fecha_desde: filters.fecha_desde || undefined,
                fecha_hasta: filters.fecha_hasta || undefined,
            });
            setVentas(fetchedVentas);
        } catch (err: any) {
            // Asegúrate de acceder a la propiedad 'response' antes de 'data'
            setError(err.response?.data?.detail || 'Error al cargar las ventas.');
            console.error('Error fetching sales:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Efecto para cargar ventas cuando cambian los filtros (con un debounce)
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchVentas();
        }, 300); // Pequeño retardo para no hacer peticiones en cada pulsación de tecla
        return () => clearTimeout(handler);
    }, [filters]); // Dependencia: el objeto filters completo

    // Handler genérico para cambios en los inputs de filtro
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Handler para anular una venta
    const handleAnularVenta = async (ventaId: number) => {
        if (window.confirm('¿Estás seguro de que quieres ANULAR esta venta? Esta acción revertirá el stock de los productos. ¡Es irreversible!')) {
            setIsLoading(true);
            setError(null);
            try {
                await anularVenta(ventaId);
                alert('Venta anulada con éxito y stock revertido.'); // Considera reemplazar alert con un modal de notificación
                fetchVentas(); // Volver a cargar las ventas para actualizar la lista
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Error al anular la venta.');
                console.error('Error canceling sale:', err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Navegar al formulario de creación de venta
    const handleCreateNewSale = () => {
        navigate('/ventas/new');
    };

    // Definición de las columnas de la tabla de Ventas
    const columns = [
        { Header: 'ID Venta', accessor: 'venta_id' },
        {
            Header: 'Fecha',
            accessor: 'fecha_venta', // Asume que el backend devuelve 'fecha_venta'
            Cell: ({ row }: { row: { original: Venta } }) => new Date(row.original.fecha_creacion || '').toLocaleDateString(), // Maneja posible undefined
        },
        {
            Header: 'Cliente',
            accessor: 'persona', // Accesamos al objeto persona
            Cell: ({ row }: { row: { original: Venta } }) => {
                const ventaItem = row.original;
                // Asume que si persona_id existe, entonces venta.persona debería estar poblado en la respuesta.
                // Si persona_id es null, es una venta a Consumidor Final.
                return ventaItem.persona // Asegúrate de que `persona` esté en tu tipo `Venta` si esperas el objeto anidado
                    ? `${ventaItem.persona.nombre || ''} ${ventaItem.persona.apellido_paterno || ''} ${ventaItem.persona.apellido_materno || ''}`.trim()
                    : 'Consumidor Final'; // O 'N/A' si no hay persona asignada o es una venta de mostrador
            },
        },
        {
            Header: 'Método Pago',
            accessor: 'metodo_pago',
            // Accede a 'nombre_metodo' dentro de 'metodo_pago'
            Cell: ({ row }: { row: { original: Venta } }) => {
                const ventaItem = row.original;
                // Asegúrate de que ventaItem.metodo_pago existe y tiene nombre_metodo
                return ventaItem.metodo_pago ? ventaItem.metodo_pago.nombre_metodo : 'N/A';
            },
        },
        {
            Header: 'Total',
            accessor: 'total',
            Cell: ({ row }: { row: { original: Venta } }) => `${Number(row.original.total).toFixed(2)} Bs.`,
        },
        { Header: 'Estado', accessor: 'estado' },
        {
            Header: 'Acciones',
            accessor: 'acciones',
            Cell: ({ row }: { row: { original: Venta } }) => {
                const ventaItem = row.original;
                return (
                    <div className="flex space-x-2">
                        <Link
                            to={`/ventas/${ventaItem.venta_id}`}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Ver
                        </Link>
                        {/* Solo mostrar el botón Anular si la venta está activa */}
                        {ventaItem.estado === EstadoVentaEnum.activa && (
                            <Button
                                onClick={() => handleAnularVenta(ventaItem.venta_id)}
                                className="px-3 py-1"
                                variant="danger" // Asume que tu componente Button soporta una variante 'danger'
                            >
                                Anular
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    // --- JSX Principal ---
    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Listado de Ventas</h1>
                <Button
                    onClick={handleCreateNewSale}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200"
                >
                    Crear Nueva Venta
                </Button>
            </div>

            {/* Mensajes de carga y error */}
            {isLoading && ventas.length === 0 && <LoadingSpinner />} {/* Spinner para carga inicial */}
            {error && <ErrorMessage message={error} />}

            {/* Sección de Filtros */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar (Cliente/Producto)</label>
                    <Input
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        placeholder="Buscar..."
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <Select // Usar el componente Select para consistencia
                        id="estado"
                        name="estado"
                        value={filters.estado}
                        onChange={handleFilterChange}
                        options={[
                            { value: '', label: 'Todos' },
                            { value: EstadoVentaEnum.activa, label: 'Activa' },
                            { value: EstadoVentaEnum.anulada, label: 'Anulada' },
                            // Añade otros estados si los tienes (ej: 'pendiente', 'completada')
                        ]}
                    />
                </div>
                <div>
                    <label htmlFor="fecha_desde" className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
                    <Input
                        type="date"
                        name="fecha_desde"
                        value={filters.fecha_desde}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label htmlFor="fecha_hasta" className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
                    <Input
                        type="date"
                        name="fecha_hasta"
                        value={filters.fecha_hasta}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            {/* Mensaje si no hay ventas */}
            {ventas.length === 0 && !isLoading && !error ? (
                <p className="text-gray-600 text-center mt-8">No se encontraron ventas con los filtros aplicados.</p>
            ) : (
                // Mostrar tabla si hay ventas
                <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                    {/* Spinner superpuesto si está cargando y ya hay datos */}
                    {isLoading && ventas.length > 0 && (
                        <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-10">
                            <LoadingSpinner />
                        </div>
                    )}
                    <Table columns={columns} data={ventas} />
                </div>
            )}
        </div>
    );
};

export default VentasListPage;