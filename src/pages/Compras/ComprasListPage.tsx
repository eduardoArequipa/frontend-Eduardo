import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importa useNavigate
import { getCompras, anularCompra, completarCompra } from '../../services/compraService';
import { getProveedores } from '../../services/proveedorService'; 
import { getUsers } from '../../services/userService'; 

import {
    Compra, 
    GetComprasParams 
} from '../../types/compra';
import { EstadoCompraEnum, EstadoEnum } from '../../types/enums'; 
import { Proveedor} from '../../types/proveedor'; 
import { UsuarioNested } from '../../types/usuario'; 


import Table from '../../components/Common/Table'; 
import Button from '../../components/Common/Button'; 
import Input from '../../components/Common/Input'; 
import LoadingSpinner from '../../components/Common/LoadingSpinner'; 
import ActionsDropdown from '../../components/Common/ActionsDropdown'; // Importa ActionsDropdown
import { ActionConfig } from '../../components/Common/ActionsDropdown'; // Importa ActionConfig para tipado


const ComprasListPage: React.FC = () => {
    const navigate = useNavigate(); // Inicializa useNavigate

    // Estados para la lista de compras
    const [compras, setCompras] = useState<Compra[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para filtros y búsqueda (coinciden con tu router GET /compras/)
    const [estadoFilter, setEstadoFilter] = useState<EstadoCompraEnum | ''>(); // Filtro por estado
    const [proveedorFilter, setProveedorFilter] = useState<number | ''>(''); // Filtro por proveedor_id
    const [creadorFilter, setCreadorFilter] = useState<number | ''>(''); // FILTRO POR CREADOR_ID (antes usuarioFilter)
    const [fechaDesdeFilter, setFechaDesdeFilter] = useState<string>(''); // Filtro fecha_desde (YYYY-MM-DD)
    const [fechaHastaFilter, setFechaHastaFilter] = useState<string>(''); // Filtro fecha_hasta (YYYY-MM-DD)
    const [search, setSearch] = useState(''); // Búsqueda combinada

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Estados para los datos de los selectores (Proveedores y Usuarios)
    const [availableProveedores, setAvailableProveedores] = useState<Proveedor[]>([]);
    const [availableUsuarios, setAvailableUsuarios] = useState<UsuarioNested[]>([]); // Para el filtro de creador
    const [loadingFiltersData, setLoadingFiltersData] = useState(true);
    const [errorFiltersData, setErrorFiltersData] = useState<string | null>(null);


    // Función para obtener la lista de compras con los parámetros actuales
    const fetchCompras = async () => {
        setLoading(true);
        setError(null);

        try {
            // Construir el objeto de parámetros para la API (usa la interfaz GetComprasParams)
            const params: GetComprasParams = {
                 ...(estadoFilter && { estado: estadoFilter }),
                 ...(proveedorFilter && { proveedor_id: proveedorFilter }),
                 ...(creadorFilter && { creador_id: creadorFilter }), // AHORA FILTRA POR CREADOR_ID
                 ...(fechaDesdeFilter && { fecha_desde: fechaDesdeFilter }),
                 ...(fechaHastaFilter && { fecha_hasta: fechaHastaFilter }),
                 ...(search && { search }),
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };

            // Llama al servicio getCompras con los parámetros
             const data = await getCompras(params);
             setCompras(data);


        } catch (err: any) {
            console.error("Error fetching compras:", err);
            setError(err.response?.data?.detail || "Error al cargar las compras.");
            setCompras([]);
            // setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    // Efecto para cargar Compras cuando cambian Filtros, Búsqueda o Paginación
    useEffect(() => {
        fetchCompras();
        // Dependencias: Incluye todos los estados que, al cambiar, deben recargar la lista
    }, [estadoFilter, proveedorFilter, creadorFilter, fechaDesdeFilter, fechaHastaFilter, search, currentPage, itemsPerPage]);


    // Efecto para cargar los datos necesarios para los filtros (Proveedores y Usuarios)
    useEffect(() => {
        const fetchFiltersData = async () => {
            setLoadingFiltersData(true);
            setErrorFiltersData(null);
            try {
                // Obtener lista de proveedores (quizás solo activos o todos)
                const proveedoresResponse = await getProveedores({ estado: EstadoEnum.Activo, limit: 1000 });
                setAvailableProveedores(proveedoresResponse);

                // Obtener lista de usuarios (para el filtro de 'creador')
                const usersResponse = await getUsers({ estado: EstadoEnum.Activo, limit: 1000 });
                setAvailableUsuarios(usersResponse);

            } catch (err: any) {
                console.error("Error fetching filters data:", err);
                setErrorFiltersData("Error al cargar datos para filtros.");
            } finally {
                setLoadingFiltersData(false);
            }
        };
        fetchFiltersData();
    }, []);


    // Handler genérico para cambios en filtros (resetea la página a 1)
     const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
         setter(value);
         setCurrentPage(1); // Resetear página al cambiar cualquier filtro o búsqueda
     };

     // Handler específico para cambios en selectores numéricos
     const handleNumericFilterChange = (setter: React.Dispatch<any>) => (e: React.ChangeEvent<HTMLSelectElement>) => {
         const value = e.target.value;
         setter(value === '' ? '' : parseInt(value, 10));
         setCurrentPage(1);
     };


    // Función para manejar la anulación de una Compra (PATCH)
    const handleAnularCompra = async (id: number) => {
        if (window.confirm(`¿Estás seguro de anular la compra #${id}? Esto revertirá el stock asociado.`)) {
            try {
                const updatedCompra = await anularCompra(id);
                setCompras(compras.map(c => c.compra_id === id ? updatedCompra : c));
                alert(`Compra #${id} anulada con éxito!`);

            } catch (err: any) {
                 console.error(`Error anuling compra ${id}:`, err.response?.data || err);
                 alert(`Error al anular la compra #${id}: ${err.response?.data?.detail || err.message}`);
            }
        }
    };

     // Función para manejar la completación de una Compra (PATCH)
     const handleCompletarCompra = async (id: number) => {
         if (window.confirm(`¿Estás seguro de marcar la compra #${id} como completada?`)) {
             try {
                 const updatedCompra = await completarCompra(id);
                 setCompras(compras.map(c => c.compra_id === id ? updatedCompra : c));
                 alert(`Compra #${id} marcada como completada!`);

             } catch (err: any) {
                 console.error(`Error completing compra ${id}:`, err.response?.data || err);
                 alert(`Error al marcar la compra #${id} como completada: ${err.response?.data?.detail || err.message}`);
            }
        }
    };

    // Función para navegar a la vista de detalles de la compra
    const handleViewCompra = (id: number) => {
        navigate(`/compras/view/${id}`);
    };

    // Función para navegar a la edición de la compra
    const handleEditCompra = (id: number) => {
        navigate(`/compras/edit/${id}`);
    };


    // Definición de las columnas de la tabla de Compras
    const columns = useMemo(() => {
        type RowData = Compra;
        type TableCellProps = {
            row: {
                original: RowData;
            };
        };

        return [
            { Header: 'ID', accessor: 'compra_id' },
            {
                 Header: 'Proveedor',
                 accessor: 'proveedor',
                 Cell: ({ row }: TableCellProps): React.ReactNode => {
                      const p = row.original.proveedor;
                      // console.log("Proveedor object in table cell:", p); // Para depuración
                      if (p) {
                           // Muestra el nombre completo si es persona, o la razón social si es empresa
                           if (p.persona && p.persona.nombre) { // Asegura que persona y su nombre existan
                               return `${p.persona.nombre} ${p.persona.apellido_paterno || ''}`.trim();
                           } else if (p.empresa && p.empresa.razon_social) { // Asegura que empresa y su razón social existan
                               return p.empresa.razon_social;
                           } else {
                               // Fallback si los datos de persona/empresa faltan o están incompletos
                               return `ID ${p.proveedor_id !== undefined ? p.proveedor_id : 'N/A'}`;
                           }
                      }
                      return '-'; // Fallback si el objeto proveedor es null/undefined
                 },
            },

            {
                 Header: 'Fecha',
                 accessor: 'fecha_compra',
                 Cell: ({ row }: TableCellProps): React.ReactNode => {
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
                 Cell: ({ row }: TableCellProps): React.ReactNode => {
                      const value = row.original.total;
                      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
                      if (typeof numericValue === 'number' && !isNaN(numericValue)) {
                          return `${numericValue.toFixed(2)} bs`;
                      }
                      return `${value} bs`;
                 },
            },
            { 
                Header: 'Estado', 
                accessor: 'estado',
                Cell: ({ row }: TableCellProps): React.ReactNode => {
                    const estado = row.original.estado;
                    let textColorClass = '';
                    let bgColorClass = '';

                    switch (estado) {
                        case EstadoCompraEnum.pendiente:
                            textColorClass = 'text-blue-900';
                            bgColorClass = 'bg-blue-200';
                            break;
                        case EstadoCompraEnum.completada:
                            textColorClass = 'text-green-900';
                            bgColorClass = 'bg-green-200';
                            break;
                        case EstadoCompraEnum.anulada:
                            textColorClass = 'text-red-900';
                            bgColorClass = 'bg-red-200';
                            break;
                        default:
                            // Fallback para cualquier estado inesperado
                            textColorClass = 'text-gray-900';
                            bgColorClass = 'bg-gray-200';
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
                Cell: ({ row }: TableCellProps): React.ReactNode => {
                    const compra = row.original;
                    const isAnulada = compra.estado === EstadoCompraEnum.anulada;
                    const isCompletada = compra.estado === EstadoCompraEnum.completada;
                    const isPendiente = compra.estado === EstadoCompraEnum.pendiente;

                    // Define las acciones específicas para Compras
                    const compraActions: ActionConfig[] = [
                        {
                            label: 'Ver',
                            onClick: () => handleViewCompra(compra.compra_id),
                            isVisible: true, // Siempre visible
                            buttonVariant: 'menuItem'
                        },
                        {
                            label: 'Editar',
                            onClick: () => handleEditCompra(compra.compra_id),
                            isVisible: isPendiente, // Solo si está pendiente
                            buttonVariant: 'menuItem'
                        },
                        {
                            label: 'Completar',
                            onClick: () => handleCompletarCompra(compra.compra_id),
                            isVisible: isPendiente, // Solo si está pendiente
                            buttonVariant: 'menuItem',
                            colorClass: 'text-green-700'
                        },
                        {
                            label: 'Anular',
                            onClick: () => handleAnularCompra(compra.compra_id),
                            isVisible: !isAnulada && !isCompletada, // Solo si no está anulada ni completada
                            buttonVariant: 'menuItem',
                            colorClass: 'text-red-700'
                        },
                    ];

                    return (
                        <ActionsDropdown
                            actions={compraActions}
                            isLoading={loading} // Pasa el estado de carga global
                        />
                    );
                },
            },
        ];
    }, [compras, handleAnularCompra, handleCompletarCompra, handleViewCompra, handleEditCompra, loading]);


    // --- Renderizado Condicional de Estados Globales ---
    if (loading && compras.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner /> Cargando compras...
            </div>
        );
    }

    if (error && !loading) {
        return <div className="text-red-500 text-center mt-4">Error: {error}</div>;
    }
     if (errorFiltersData && !loadingFiltersData) {
         return <div className="text-red-500 text-center mt-4">Error al cargar datos para filtros: {errorFiltersData}</div>;
     }


    // --- JSX Principal ---
    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Compras</h1>
                <Button
                    onClick={() => navigate('/compras/new')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200"
                >
                    Registrar Nueva Compra
                </Button>
            </div>

            {/* Sección de Búsqueda y Filtros */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                    <Input
                        id="search"
                        type="text"
                        placeholder="Buscar por proveedor o producto"
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterValueChange(setSearch)(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label htmlFor="estadoFilter" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                        id="estadoFilter"
                        value={estadoFilter}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterValueChange(setEstadoFilter)(e.target.value as EstadoCompraEnum | '')}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Todos los estados</option>
                        <option value={EstadoCompraEnum.pendiente}>Pendiente</option>
                        <option value={EstadoCompraEnum.completada}>Completada</option>
                        <option value={EstadoCompraEnum.anulada}>Anulada</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="proveedorFilter" className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                    <select
                        id="proveedorFilter"
                        value={proveedorFilter}
                        onChange={handleNumericFilterChange(setProveedorFilter)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        disabled={loadingFiltersData}
                    >
                        <option value="">Todos los proveedores</option>
                        {availableProveedores.map(prov => (
                            <option key={prov.proveedor_id} value={prov.proveedor_id}>
                                {prov.persona
                                    ? `${prov.persona.nombre} ${prov.persona.apellido_paterno || ''}`.trim()
                                    : prov.empresa
                                        ? prov.empresa.razon_social
                                        : `ID ${prov.proveedor_id}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="creadorFilter" className="block text-sm font-medium text-gray-700 mb-1">Registrado por</label>
                    <select
                        id="creadorFilter"
                        value={creadorFilter}
                        onChange={handleNumericFilterChange(setCreadorFilter)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        disabled={loadingFiltersData}
                    >
                        <option value="">Todos</option>
                        {availableUsuarios.map(user => (
                            <option key={user.usuario_id} value={user.usuario_id}>
                                {user.nombre_usuario}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="fechaDesdeFilter" className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <Input
                        id="fechaDesdeFilter"
                        type="date"
                        value={fechaDesdeFilter}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterValueChange(setFechaDesdeFilter)(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label htmlFor="fechaHastaFilter" className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <Input
                        id="fechaHastaFilter"
                        type="date"
                        value={fechaHastaFilter}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterValueChange(setFechaHastaFilter)(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
            </div>


            {/* Contenedor de la Tabla y Mensajes Condicionales */}
            {loading && compras.length > 0 && (
                 <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-10">
                     <LoadingSpinner />
                 </div>
            )}
            {compras.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500">No hay compras registradas que coincidan con los filtros.</p>
            ) : (
                 compras.length > 0 && (
                     <div className="relative overflow-x-auto">
                        <Table columns={columns} data={compras} />
                     </div>
                 )
            )}

            {/* Sección de Paginación */}
             <div className="mt-4 flex justify-center items-center space-x-4">
                 <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">Anterior</Button>
                 <span className="text-gray-700">Página {currentPage}</span>
                 <Button onClick={() => setCurrentPage(prev => prev + 1)} disabled={loading /* || currentPage >= totalPages */} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</Button>
             </div>
        </div>
    );
};

export default ComprasListPage;
