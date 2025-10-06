// src/context/LowStockContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { getLowStockProducts } from '../services/productoService';
import { Producto } from '../types/producto';
import { useAuth } from '../hooks/useAuth'; // Para saber si el usuario está autenticado

// Define la estructura del contexto
interface LowStockContextType {
    lowStockProducts: Producto[];
    showNotification: boolean;
    loadingLowStock: boolean;
    errorLowStock: string | null;
    fetchLowStockProducts: () => Promise<void>;
    dismissNotification: () => void;
}

// Crea el Contexto con un valor por defecto (que será sobrescrito por el Provider)
const LowStockContext = createContext<LowStockContextType | undefined>(undefined);

// Props para el LowStockProvider
interface LowStockProviderProps {
    children: ReactNode;
}

export const LowStockProvider: React.FC<LowStockProviderProps> = ({ children }) => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [lowStockProducts, setLowStockProducts] = useState<Producto[]>([]);
    const [showNotification, setShowNotification] = useState(false);
    const [loadingLowStock, setLoadingLowStock] = useState(true);
    const [errorLowStock, setErrorLowStock] = useState<string | null>(null);

    // Función para obtener los productos con bajo stock
    const fetchLowStockProducts = useCallback(async () => {
        if (authLoading) {
            return;
        }

        if (!isAuthenticated) {
            setLowStockProducts([]);
            setShowNotification(false);
            setLoadingLowStock(false);
            setErrorLowStock(null);
            return;
        }

        setLoadingLowStock(true);
        setErrorLowStock(null);
        try {
            const products = await getLowStockProducts();
            setLowStockProducts(products);
            if (products.length > 0) {
                setShowNotification(true);
            } else {
                setShowNotification(false);
            }
        } catch (err: any) {
            let displayErrorMessage = "Error desconocido al verificar stock.";

            // Intenta obtener el detalle del error de FastAPI
            if (err.response && err.response.data) {
                if (typeof err.response.data === 'object' && err.response.data !== null) {
                    // Si es un objeto (como el detalle de validación de FastAPI), lo stringificamos
                    displayErrorMessage = JSON.stringify(err.response.data, null, 2);
                } else {
                    // Si es una cadena u otro tipo primitivo
                    displayErrorMessage = String(err.response.data);
                }
            } else if (err.message) {
                // Si no hay response.data, usa el mensaje general del error
                displayErrorMessage = err.message;
            }

            setErrorLowStock(`Error al verificar stock: ${displayErrorMessage}`);
            setLowStockProducts([]);
            setShowNotification(true); // Mostrar la notificación de error
        } finally {
            setLoadingLowStock(false);
        }
    }, [isAuthenticated, authLoading]);

    useEffect(() => {
        if (!authLoading) {
            fetchLowStockProducts();
        }
    }, [authLoading, fetchLowStockProducts]);

    const dismissNotification = () => {
        setShowNotification(false);
        setErrorLowStock(null);
    };

    const contextValue: LowStockContextType = {
        lowStockProducts,
        showNotification,
        loadingLowStock,
        errorLowStock,
        fetchLowStockProducts,
        dismissNotification,
    };

    return (
        <LowStockContext.Provider value={contextValue}>
            {children}
        </LowStockContext.Provider>
    );
};

export const useLowStock = () => {
    const context = useContext(LowStockContext);
    if (context === undefined) {
        throw new Error('useLowStock must be used within a LowStockProvider');
    }
    return context;
};
