import React from 'react';
import { useNotification, NotificationType } from '../../context/NotificationContext';

const NotificationToast: React.FC = () => {
    const { notifications, removeNotification } = useNotification();

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
            case 'error':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />;
            case 'warning':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />;
            case 'info':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
        }
    };

    const getBackgroundColor = (type: NotificationType) => {
        switch (type) {
            case 'success': return 'bg-green-500';
            case 'error': return 'bg-red-500';
            case 'warning': return 'bg-yellow-500';
            case 'info': return 'bg-blue-500';
        }
    };

    if (!notifications.length) {
        return null;
    }

    return (
        <div className="fixed top-5 right-5 z-50 space-y-3 w-80">
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`${getBackgroundColor(notification.type)} text-white p-4 rounded-lg shadow-lg flex items-center animate-fade-in-right`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {getIcon(notification.type)}
                    </svg>
                    <span className="flex-grow">{notification.message}</span>
                    <button onClick={() => removeNotification(notification.id)} className="ml-4 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NotificationToast;
