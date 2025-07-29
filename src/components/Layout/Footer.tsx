// src/components/Layout/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
    // Obtener el año actual dinámicamente
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-800 text-white p-4 text-center mt-auto">
            {/* El 'mt-auto' es crucial si este footer se usa dentro de un flexbox vertical */}
            <div className="container mx-auto">
                <p className="text-sm">
                    &copy; {currentYear} Comercial Don Eduardo. Todos los derechos reservados.
                </p>
                {/* Puedes añadir enlaces o más información aquí si lo necesitas */}
                {/* <div className="mt-2 text-xs">
                    <a href="/politica-privacidad" className="text-gray-400 hover:text-white mx-2">Política de Privacidad</a>
                    <a href="/terminos-servicio" className="text-gray-400 hover:text-white mx-2">Términos de Servicio</a>
                </div> */}
            </div>
        </footer>
    );
};

export default Footer;
