// src/components/Layout/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 text-center text-gray-600 dark:text-gray-400 mt-auto">
            <div className="container mx-auto">
                <p className="text-sm">
                    &copy; {currentYear} Comercial Don Eduardo. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    );
};

export default Footer;