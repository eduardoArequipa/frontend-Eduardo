import React, { useEffect, useState, useMemo } from 'react';
import { getMarcas, deleteMarca, activateMarca } from '../../services/marcaService';
import { Marca, MarcaPagination } from '../../types/marca';
import { EstadoEnum } from '../../types/enums';
// Ya no necesitamos useCatalogs aquí
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Select from '../../components/Common/Select';
import ErrorMessage from '../../components/Common/ErrorMessage';
import ActionsDropdown, { ActionConfig } from '../../components/Common/ActionsDropdown';
import Modal from '../../components/Common/Modal';
import MarcaForm from '../../components/Specific/MarcaForm';
import { useNotification } from '../../context/NotificationContext';

const MarcasListPage: React.FC = () => {
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [totalMarcas, setTotalMarcas] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>(EstadoEnum.Activo);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
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

    // Ya no necesitamos invalidateMarcas porque MarcaForm notifica directamente

    const fetchMarcas = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                ...(search && { search }),
                ...(estadoFilter && { estado: estadoFilter }),
                skip: (currentPage - 1) * itemsPerPage,
                limit: itemsPerPage,
            };
            const response: MarcaPagination = await getMarcas(params);
            setMarcas(response.items);
            setTotalMarcas(response.total);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Error al cargar las marcas.");
            setMarcas([]);
            setTotalMarcas(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarcas();
    }, [search, estadoFilter, currentPage]);

    const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
        setter(value);
        setCurrentPage(1); // Resetear a la primera página cuando cambian los filtros
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
                fetchMarcas();
            }
        }
    };

    const handleDelete = (id: number, nombreMarca: string) => {
        setModalState({
            isOpen: true,
            title: 'Confirmar Desactivación',
            message: <p>¿Estás seguro de desactivar la marca <strong>{nombreMarca}</strong>?</p>,
            confirmText: 'Sí, Desactivar',
            confirmVariant: 'danger',
            action: () => deleteMarca(id),
        });
    };

    const handleActivate = (id: number, nombreMarca: string) => {
        setModalState({
            isOpen: true,
            title: 'Confirmar Activación',
            message: <p>¿Estás seguro de activar la marca <strong>{nombreMarca}</strong>?</p>,
            confirmText: 'Sí, Activar',
            confirmVariant: 'success',
            action: () => activateMarca(id),
        });
    };

    const handleOpenAddModal = () => setIsAddModalOpen(true);
    const handleCloseAddModal = () => setIsAddModalOpen(false);
    const handleAddSuccess = () => {
        handleCloseAddModal();
        fetchMarcas(); // Solo recargar la lista local para paginación
        // No necesitamos invalidar porque MarcaForm ya notifica al cache global
    };

    const handleOpenEditModal = (marca: Marca) => {
        setEditingMarca(marca);
        setIsEditModalOpen(true);
    };
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingMarca(null);
    };
    const handleEditSuccess = () => {
        handleCloseEditModal();
        fetchMarcas(); // Solo recargar la lista local para paginación
        // No necesitamos invalidar porque MarcaForm ya notifica al cache global
    };

    const columns = useMemo(() => {
        return [
            { Header: 'ID', accessor: 'marca_id' },
            { Header: 'Nombre', accessor: 'nombre_marca' },
            { Header: 'Descripción', accessor: 'descripcion' },
            {
                Header: 'Estado',
                accessor: 'estado',
                Cell: ({ row }: { row: { original: Marca } }) => (
                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${row.original.estado === EstadoEnum.Activo ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'}`}>
                        <span aria-hidden className={`absolute inset-0 opacity-50 rounded-full ${row.original.estado === EstadoEnum.Activo ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800'}`}></span>
                        <span className="relative">{row.original.estado.charAt(0).toUpperCase() + row.original.estado.slice(1)}</span>
                    </span>
                ),
            },
            {
                Header: 'Acciones',
                accessor: 'acciones',
                Cell: ({ row }: { row: { original: Marca } }) => {
                    const marca = row.original;
                    const marcaActions: ActionConfig[] = [
                        { label: 'Editar', onClick: () => handleOpenEditModal(marca), isVisible: true, buttonVariant: 'menuItem' },
                        { label: 'Desactivar', onClick: () => handleDelete(marca.marca_id, marca.nombre_marca), isVisible: marca.estado === EstadoEnum.Activo, buttonVariant: 'menuItem', colorClass: 'text-red-700 dark:text-red-400' },
                        { label: 'Activar', onClick: () => handleActivate(marca.marca_id, marca.nombre_marca), isVisible: marca.estado === EstadoEnum.Inactivo, buttonVariant: 'menuItem', colorClass: 'text-green-700 dark:text-green-400' },
                    ];
                    return <ActionsDropdown actions={marcaActions} isLoading={loading} />;
                },
            },
        ];
    }, [loading]);

    if (loading && marcas.length === 0) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-gray-800 dark:text-gray-200"><LoadingSpinner /> Cargando marcas...</div>;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Gestión de Marcas</h1>

            <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-grow min-w-[150px]">
                    <Input id="search" type="text" placeholder="Buscar por nombre" value={search} onChange={(e) => handleFilterValueChange(setSearch)(e.target.value)} />
                </div>
                <div>
                    <Select id="estadoFilter" value={estadoFilter} onChange={(e) => handleFilterValueChange(setEstadoFilter)(e.target.value as EstadoEnum | '')} options={[{ value: '', label: 'Todos los estados' }, { value: EstadoEnum.Activo, label: 'Activo' }, { value: EstadoEnum.Inactivo, label: 'Inactivo' }]} />
                </div>
                <div className="flex-grow md:flex-none flex justify-end">
                    <Button onClick={handleOpenAddModal} variant="success">Crear Nueva Marca</Button>
                </div>
            </div>

            {loading && marcas.length > 0 && <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 z-10"><LoadingSpinner /></div>}
            
            {marcas.length === 0 && !loading && !error ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No hay marcas que coincidan con los filtros.</p>
            ) : (
                <div className="relative overflow-x-auto">
                    <Table columns={columns} data={marcas} />
                </div>
            )}

            {/* Paginación */}
            {totalMarcas > 0 && (
                <div className="mt-4 flex justify-center items-center space-x-4">
                    <Button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || loading}
                        variant="secondary"
                    >
                        Anterior
                    </Button>
                    <span className="text-gray-700 dark:text-gray-300">
                        Página {currentPage} de {Math.ceil(totalMarcas / itemsPerPage)} (Total: {totalMarcas} marcas)
                    </span>
                    <Button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage >= Math.ceil(totalMarcas / itemsPerPage) || loading}
                        variant="secondary"
                    >
                        Siguiente
                    </Button>
                </div>
            )}

            <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title="Crear Nueva Marca" widthClass="max-w-lg" showCancelButton={false}>
                <MarcaForm onSuccess={handleAddSuccess} onCancel={handleCloseAddModal} />
            </Modal>

            {editingMarca && (
                <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`Editar Marca: ${editingMarca.nombre_marca}`} widthClass="max-w-lg" showCancelButton={false}>
                    <MarcaForm marcaId={editingMarca.marca_id} onSuccess={handleEditSuccess} onCancel={handleCloseEditModal} />
                </Modal>
            )}

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

export default MarcasListPage;