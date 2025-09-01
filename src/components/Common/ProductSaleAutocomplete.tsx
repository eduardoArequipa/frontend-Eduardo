// src/components/Common/ProductSaleAutocomplete.tsx
import React, { useState, useMemo } from 'react';
import { useCatalogs } from '../../context/CatalogContext';
import { ProductoSchemaBase } from '../../types/producto';
import Input from './Input';

interface Props {
    onProductSelect: (producto: ProductoSchemaBase) => void;
}

const ProductSaleAutocomplete: React.FC<Props> = ({ onProductSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { productos: allProducts, isLoading } = useCatalogs();

    const filteredProducts = useMemo(() => {
        if (!searchTerm) {
            return [];
        }
        return allProducts.filter(p =>
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
    }, [searchTerm, allProducts]);

    const handleSelect = (producto: ProductoSchemaBase) => {
        onProductSelect(producto);
        setSearchTerm('');
    };

    return (
        <div className="relative">
            <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar producto por nombre o código..."
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={isLoading}
            />
            {isLoading && <p className="p-2">Cargando productos...</p>}
            {searchTerm && filteredProducts.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {filteredProducts.map((producto) => (
                        <li
                            key={producto.producto_id}
                            onClick={() => handleSelect(producto)}
                            className="p-3 hover:bg-indigo-100 cursor-pointer"
                        >
                            <p className="font-semibold">{producto.nombre}</p>
                            <p className="text-sm text-gray-600">Cód: {producto.codigo} - Stock: {producto.stock}</p>
                        </li>
                    ))}
                </ul>
            )}
            {searchTerm && !isLoading && filteredProducts.length === 0 && (
                 <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-3">
                    <p className="text-gray-500">No se encontraron productos.</p>
                </div>
            )}
        </div>
    );
};

export default ProductSaleAutocomplete;