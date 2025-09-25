import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getProveedores } from '../services/proveedorService';
import { Proveedor } from '../types/proveedor';
import { EstadoEnum } from '../types/enums';
import { useAuth } from '../hooks/useAuth';

interface CompraContextType {
    proveedores: Proveedor[];
    isLoading: boolean;
    error: string | null;
    refetchProveedores: () => void;
}

const CompraContext = createContext<CompraContextType | undefined>(undefined);

export const CompraProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProveedores = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedData = await getProveedores({ estado: EstadoEnum.Activo, limit: 1000 });
            setProveedores(fetchedData.items || []);
        } catch (err) {
            setError('Error al cargar los proveedores.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            fetchProveedores();
        }
    }, [isAuthenticated, authLoading, fetchProveedores]);

    return (
        <CompraContext.Provider value={{ proveedores, isLoading, error, refetchProveedores: fetchProveedores }}>
            {children}
        </CompraContext.Provider>
    );
};

export const useCompraContext = () => {
    const context = useContext(CompraContext);
    if (context === undefined) {
        throw new Error('useCompraContext debe ser usado dentro de un CompraProvider');
    }
    return context;
};
