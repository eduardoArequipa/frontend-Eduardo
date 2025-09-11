import React, { useEffect, useState, useMemo } from 'react';
import { getMarcas, deleteMarca, activateMarca } from '../../services/marcaService';
import { Marca } from '../../types/marca';
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

const MarcasListPage: React.FC = () => {
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<EstadoEnum | ''>(EstadoEnum.Activo);

    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingMarca, setEditingMarca] = useState<Marca | null>(null);

    // Ya no necesitamos invalidateMarcas porque MarcaForm notifica directamente

    const fetchMarcas = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                ...(search && { search }),
                ...(estadoFilter && { estado: estadoFilter }),
                limit: 1000, // Limite alto para traer todas las marcas activas
            };
            const fetchedData = await getMarcas(params);
            setMarcas(fetchedData);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Error al cargar las marcas.");
            setMarcas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarcas();
    }, [search, estadoFilter]);

    const handleFilterValueChange = (setter: React.Dispatch<any>) => (value: any) => {
        setter(value);
    };

    const handleDelete = async (id: number, nombreMarca: string) => {
        if (window.confirm(`¿Estás seguro de desactivar la marca "${nombreMarca}"?`)) {
            try {
                await deleteMarca(id);
                fetchMarcas(); // Solo recargar la lista local
                alert(`Marca "${nombreMarca}" desactivada con éxito!`);
            } catch (err: any) {
                alert(`Error al desactivar: ${err.response?.data?.detail || err.message}`);
            }
        }
    };

    const handleActivate = async (id: number, nombreMarca: string) => {
        if (window.confirm(`¿Estás seguro de activar la marca "${nombreMarca}"?`)) {
            try {
                await activateMarca(id);
                fetchMarcas(); // Solo recargar la lista local
                alert(`Marca "${nombreMarca}" activada con éxito!`);
            } catch (err: any) {
                alert(`Error al activar: ${err.response?.data?.detail || err.message}`);
            }
        }
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

            <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title="Crear Nueva Marca" widthClass="max-w-lg" showCancelButton={false}>
                <MarcaForm onSuccess={handleAddSuccess} onCancel={handleCloseAddModal} />
            </Modal>

            {editingMarca && (
                <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`Editar Marca: ${editingMarca.nombre_marca}`} widthClass="max-w-lg" showCancelButton={false}>
                    <MarcaForm marcaId={editingMarca.marca_id} onSuccess={handleEditSuccess} onCancel={handleCloseEditModal} />
                </Modal>
            )}
        </div>
    );
};

export default MarcasListPage;