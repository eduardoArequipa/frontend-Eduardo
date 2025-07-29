// src/components/Layout/Layout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar'; // Importa el Sidebar si lo estás usando
import { LowStockProvider } from '../../context/LowStockContext'; // Importa el proveedor del contexto
import LowStockNotification from '../Common/LowStockNotification'; // Importa el componente de notificación

const Layout: React.FC = () => {
    return (
        // Envuelve toda la estructura del layout con LowStockProvider
        <LowStockProvider>
            <div className="flex flex-col min-h-screen bg-gray-100">
                <Navbar />
                <div className="flex flex-grow">
                    <Sidebar />

                    <main className="flex-grow p-2 container mx-auto">
                        <Outlet />
                    </main>
                </div>
                
                {/* Renderiza el componente de notificación de bajo stock */}
                {/* Se posicionará en la esquina superior derecha de la pantalla */}
                <LowStockNotification />
            </div>
        </LowStockProvider>
    );
};

export default Layout;
