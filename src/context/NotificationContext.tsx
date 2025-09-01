import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (message: string, type: NotificationType) => void;
    removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((message: string, type: NotificationType) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
