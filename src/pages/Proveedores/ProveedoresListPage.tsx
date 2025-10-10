// src/pages/Proveedores/ProveedoresListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getProveedores, deleteProveedor, activateProveedor } from '../../services/proveedorService';
import { Proveedor } from '../../types/proveedor'; 
import { EstadoEnum } from '../../types/enums';
import Table from '../../components/Common/Table'; 
import Button from '../../components/Common/Button'; 
import Input from '../../components/Common/Input'; 
import LoadingSpinner from '../../components/Common/LoadingSpinner'; 
import Select from '../../components/Common/Select'; // Asegúrate de que este Select es el componente común
import ErrorMessage from '../../components/Common/ErrorMessage';
import { GetProveedoresParams } from '../../types/proveedor'; // Asegúrate de que esta ruta y nombre de tipo sean correctos
import Modal from '../../components/Common/Modal';
import { useNotification } from '../../context/NotificationContext';
const ProveedoresListPage: React.FC = () => {

    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addNotification } = useNotification();

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        action: (() => Promise<any>) | null;
        title: string;
        message: React.ReactNode;
        confirmText: string;
        confirmVariant: 'danger' | 'success';
    }>({
        isOpen: false,
        action: null,
        title: '',
        message: null,
        confirmText: '',
        confirmVariant: 'danger',
    });

    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>('');
    const [tipoFilter, setTipoFilter] = useState<'persona' | 'empresa' | ''>('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const fetchProveedores = async () => {
        setLoading(true);
        setError(null);

        try {
            const params: GetProveedoresParams = {
                 ...(search && { search }),
                 ...(estadoFilter && { estado: estadoFilter }),
                 ...(tipoFilter && { tipo: tipoFilter }),
                 skip: (currentPage - 1) * itemsPerPage,
                 limit: itemsPerPage,
            };
             const data = await getProveedores(params);
             setProveedores(data.items || []);
             setTotalItems(data.total);

        } catch (err: any) {
            setError(err.response?.data?.detail || "Error al cargar los proveedores.");
            setProveedores([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProveedores();
    }, [search, estadoFilter, tipoFilter, currentPage, itemsPerPage]); 

     const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
         setter(value);
         setCurrentPage(1);
     };

    const handleCloseConfirmationModal = () => {
        setModalState({ isOpen: false, action: null, title: '', message: null, confirmText: '', confirmVariant: 'danger' });
    };

    const handleConfirmAction = async () => {
        if (modalState.action) {
            try {
                await modalState.action();
                addNotification('Acción completada con éxito', 'success');
            } catch (err: any) {
                const errorMessage = err.response?.data?.detail || 'Ocurrió un error al realizar la acción.';
                addNotification(errorMessage, 'error');
            } finally {
                handleCloseConfirmationModal();
                fetchProveedores();
            }
        }
    };

    const handleDelete = (id: number, nombreProveedor: string) => {
        setModalState({
            isOpen: true,
            title: 'Confirmar Desactivación',
            message: <p>¿Estás seguro de desactivar al proveedor <strong>{nombreProveedor}</strong>?</p>,
            confirmText: 'Sí, Desactivar',
            confirmVariant: 'danger',
            action: () => deleteProveedor(id),
        });
    };

     const handleActivate = (id: number, nombreProveedor: string) => {
        setModalState({
            isOpen: true,
            title: 'Confirmar Activación',
            message: <p>¿Estás seguro de activar al proveedor <strong>{nombreProveedor}</strong>?</p>,
            confirmText: 'Sí, Activar',
            confirmVariant: 'success',
            action: () => activateProveedor(id),
        });
     };

    const columns = useMemo(() => {
        type RowData = Proveedor;
        type TableCellProps = { row: { original: RowData; }; };

        return [
            { Header: 'ID', accessor: 'proveedor_id' },
            {
                 Header: 'Tipo',
                 accessor: 'tipo', 
                 Cell: ({ row }: TableCellProps): React.ReactNode => {
                      if (row.original.persona) {
                           return 'Persona';
                      } else if (row.original.empresa) {
                           return 'Empresa';
                      }
                      return 'Desconocido'; 
                 },
            },
            {
                 Header: 'Nombre / Razón Social',
                 accessor: 'nombre_completo',
                 Cell: ({ row }: TableCellProps): React.ReactNode => {
                      if (row.original.persona) {
                           const p = row.original.persona;
                           return `${p.nombre} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim();
                      } else if (row.original.empresa) {
                           return row.original.empresa.razon_social;
                      }
                      return '-';
                 },
            },
             {
                 Header: 'CI / Identificación',
                 accessor: 'identificacion_proveedor', 
                 Cell: ({ row }: TableCellProps): React.ReactNode => {
                      if (row.original.persona) {
                           return row.original.persona.ci || '-';
                      } else if (row.original.empresa) {
                           return row.original.empresa.identificacion || '-';
                      }
                      return '-';
                 },
             },
            { Header: 'Estado', accessor: 'estado' },
            {
                Header: 'Acciones',
                accessor: 'acciones',
                Cell: ({ row }: TableCellProps): React.ReactNode => {
                    const nombreParaConfirmacion = row.original.persona
                        ? `${row.original.persona.nombre} ${row.original.persona.apellido_paterno || ''}`.trim()
                        : row.original.empresa
                            ? row.original.empresa.razon_social
                            : `ID ${row.original.proveedor_id}`;

                    return (
                        <div className="flex space-x-2">
                            <Link to={`/proveedores/edit/${row.original.proveedor_id}`}>
                                <Button variant="primary" size="sm">Editar</Button>
                            </Link>
                             {row.original.estado === EstadoEnum.Activo ? (
                                 <Button onClick={() => handleDelete(row.original.proveedor_id, nombreParaConfirmacion)} variant="danger" size="sm" disabled={loading}>Desactivar</Button>
                             ) : (
                                  row.original.estado === EstadoEnum.Inactivo ? (
                                     <Button onClick={() => handleActivate(row.original.proveedor_id, nombreParaConfirmacion)} variant="success" size="sm" disabled={loading}>Activar</Button>
                                 ) : (
                                     <Button variant="secondary" size="sm" disabled>{row.original.estado}</Button>
                                 )
                             )}
                        </div>
                    );
                },
            },
        ];
    }, [proveedores, handleDelete, handleActivate, loading]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (loading && proveedores.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200">
                 <LoadingSpinner /> Cargando proveedores...
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Gestión de Proveedores</h1>

            <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                 <div className="flex-grow min-w-[150px]">
                    <Input id="search" type="text" placeholder="Buscar por nombre, CI o identificación" value={search} onChange={(e) => handleFilterValueChange(setSearch)(e.target.value)} />
                 </div>
                 <div>
                     <Select id="estadoFilter" value={estadoFilter} onChange={(e) => handleFilterValueChange(setEstadoFilter)(e.target.value as EstadoEnum | '')} options={[
                            { value: '', label: 'Todos los estados' },
                            { value: EstadoEnum.Activo, label: 'Activo' },
                            { value: EstadoEnum.Inactivo, label: 'Inactivo' },
                        ]} />
                 </div>
                 <div>
                     <Select id="tipoFilter" value={tipoFilter} onChange={(e) => handleFilterValueChange(setTipoFilter)(e.target.value as 'persona' | 'empresa' | '')} options={[
                            { value: '', label: 'Todos los tipos' },
                            { value: 'persona', label: 'Persona' },
                            { value: 'empresa', label: 'Empresa' },
                        ]} />
                 </div>
                 <div className="flex-grow md:flex-none flex justify-end">
                     <Link to="/proveedores/new">
                         <Button variant="success">Crear Nuevo Proveedor</Button>
                     </Link>
                 </div>
            </div>
            {loading && proveedores.length > 0 && (
                 <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 z-10">
                     <LoadingSpinner />
                 </div>
            )}
            {proveedores.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No hay proveedores que coincidan con los filtros.</p>
            ) : (
                 <div className="relative overflow-x-auto">
                    <Table columns={columns} data={proveedores} />
                 </div>
            )}
             <div className="mt-4 flex justify-center items-center space-x-4">
                 <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} variant="secondary">Anterior</Button>
                 <span className="text-gray-700 dark:text-gray-300">Página {currentPage} de {totalPages} (Total: {totalItems} proveedores)</span>
                 <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} variant="secondary">Siguiente</Button>
             </div>

            <Modal
                isOpen={modalState.isOpen}
                onClose={handleCloseConfirmationModal}
                onConfirm={handleConfirmAction}
                title={modalState.title}
                confirmButtonText={modalState.confirmText}
                confirmButtonVariant={modalState.confirmVariant}
                showConfirmButton={true}
                isConfirmButtonDisabled={loading}
            >
                <div>{modalState.message}</div>
            </Modal>
        </div>
    );
};

export default ProveedoresListPage;