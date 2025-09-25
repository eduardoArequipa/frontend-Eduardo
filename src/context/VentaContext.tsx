// src/context/VentaContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getMetodosPago } from '../services/ventasService';
import { MetodoPagoNested } from '../types/metodoPago';
import { EstadoEnum } from '../types/enums';
import { useAuth } from '../hooks/useAuth';

interface VentaContextType {
    metodosPago: MetodoPagoNested[];
    isLoading: boolean;
    error: string | null;
    refetchData: () => void;
}

const VentaContext = createContext<VentaContextType | undefined>(undefined);

export const VentaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [metodosPago, setMetodosPago] = useState<MetodoPagoNested[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const metodosData = await getMetodosPago({ estado: EstadoEnum.Activo });
            setMetodosPago(metodosData);
        } catch (err) {
            setError('Error al cargar los métodos de pago.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            fetchData();
        }
    }, [isAuthenticated, authLoading, fetchData]);

    return (
        <VentaContext.Provider value={{ metodosPago, isLoading, error, refetchData: fetchData }}>
            {children}
        </VentaContext.Provider>
    );
};

export const useVentaContext = () => {
    const context = useContext(VentaContext);
    if (context === undefined) {
        throw new Error('useVentaContext debe ser usado dentro de un VentaProvider');
    }
    return context;
};