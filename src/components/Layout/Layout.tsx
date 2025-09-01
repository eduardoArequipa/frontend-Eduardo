// src/components/Layout/Layout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { LowStockProvider } from '../../context/LowStockContext';
import LowStockNotification from '../Common/LowStockNotification';
import NotificationToast from '../Common/NotificationToast';

const Layout: React.FC = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    return (
        <LowStockProvider>
            <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Navbar onMenuButtonClick={toggleSidebar} />
                    <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
                        <Outlet />
                    </main>
                    <Footer />
                </div>
                <LowStockNotification />
                <NotificationToast />
            </div>
        </LowStockProvider>
    );
};

export default Layout;