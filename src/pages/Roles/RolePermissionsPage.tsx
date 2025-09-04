// src/pages/Roles/RolePermissionsPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoleById, updateMenusForRole } from '../../services/rolService';
import { getAllMenus } from '../../services/menuService';

// Tipos
import { IRolInDB } from '../../types/rol';
import { IMenuInDB } from '../../types/menu';

// Componentes
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import Checkbox from '../../components/Common/Checkbox';

const RolePermissionsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const rolId = id ? parseInt(id, 10) : NaN;

    const [role, setRole] = useState<IRolInDB | null>(null);
    const [allMenus, setAllMenus] = useState<IMenuInDB[]>([]);
    const [selectedMenuIds, setSelectedMenuIds] = useState<Set<number>>(new Set());
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isNaN(rolId)) {
            setError("ID de rol inválido.");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [roleData, menusData] = await Promise.all([
                    getRoleById(rolId),
                    getAllMenus(),
                ]);

                setRole(roleData);
                setAllMenus(menusData);
                
                const initialMenuIds = new Set(roleData.menus.map(menu => menu.menu_id));
                setSelectedMenuIds(initialMenuIds);

            } catch (err: any) {
                setError(err.response?.data?.detail || "Error al cargar los datos de permisos.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [rolId]);

    const handleCheckboxChange = (menuId: number, isChecked: boolean) => {
        setSelectedMenuIds(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(menuId);
            } else {
                newSet.delete(menuId);
            }
            return newSet;
        });
    };

const handleSaveChanges = async () => {
    if (!role) return;
    setIsSaving(true);
    setError(null);
    try {
        await updateMenusForRole(role.rol_id, Array.from(selectedMenuIds));
        const updatedRoleData = await getRoleById(role.rol_id);
        
        setRole(updatedRoleData);
        setSelectedMenuIds(new Set(updatedRoleData.menus.map(menu => menu.menu_id)));
        
        alert("Permisos actualizados con éxito!");
    } catch (err: any) {
        setError(err.response?.data?.detail || "No se pudieron guardar los cambios.");
    } finally {
        setIsSaving(false);
    }
};

    if (loading) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner /> Cargando permisos...</div>;
    }

    if (error && !role) {
        return <ErrorMessage message={error} />;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                Asignar permisos para el Rol: <span className='text-indigo-600 dark:text-indigo-400'>{role?.nombre_rol}</span>
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">Selecciona los módulos a los que este rol tendrá acceso.</p>

            {error && <ErrorMessage message={error} />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allMenus.map(menu => (
                    <div key={menu.menu_id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex items-center">
                        <Checkbox
                            id={`menu-${menu.menu_id}`}
                            checked={selectedMenuIds.has(menu.menu_id)}
                            onChange={(e) => handleCheckboxChange(menu.menu_id, e.target.checked)}
                        />
                        <label htmlFor={`menu-${menu.menu_id}`} className="ml-3 text-gray-800 dark:text-gray-200">
                            <span className="font-semibold">{menu.nombre}</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{menu.descripcion}</p>
                        </label>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end space-x-4">
                <Button type="button" variant="secondary" onClick={() => navigate('/roles')}>Cancelar</Button>
                <Button type="button" onClick={handleSaveChanges} disabled={isSaving} variant="primary">
                    {isSaving ? <LoadingSpinner /> : 'Guardar Cambios'}
                </Button>
            </div>
        </div>
    );
};

export default RolePermissionsPage;