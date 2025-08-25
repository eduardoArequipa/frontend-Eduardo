// src/components/Common/ProductPurchaseAutocomplete.tsx
import React, { useState, useEffect } from 'react';
import { getProductos } from '../../services/productoService';
import { Producto } from '../../types/producto';

interface Props {
    onProductSelect: (producto: Producto) => void;
}

const ProductPurchaseAutocomplete: React.FC<Props> = ({ onProductSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchTerm.length < 2) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const response = await getProductos({ search: searchTerm, limit: 10 });
                setSuggestions(response.items);
            } catch (error) {
                console.error('Error al buscar productos:', error);
            }
            setLoading(false);
        };

        const debounceTimeout = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounceTimeout);
    }, [searchTerm]);

    const handleSelect = (producto: Producto) => {
        onProductSelect(producto);
        setSearchTerm('');
        setSuggestions([]);
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar producto por nombre o código..."
                className="w-full p-2 border border-gray-300 rounded-md"
            />
            {loading && <p>Buscando...</p>}
            {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
                    {suggestions.map((producto) => (
                        <li
                            key={producto.producto_id}
                            onClick={() => handleSelect(producto)}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                            {producto.nombre} ({producto.codigo})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ProductPurchaseAutocomplete;