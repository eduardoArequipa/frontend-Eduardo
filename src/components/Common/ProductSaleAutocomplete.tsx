// src/components/Common/ProductSaleAutocomplete.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { getProductosParaVenta } from '../../services/ventasService';
import { ProductoSchemaBase } from '../../types/producto';
import Input from './Input';

interface Props {
    onProductSelect: (producto: ProductoSchemaBase) => void;
}

const ProductSaleAutocomplete: React.FC<Props> = ({ onProductSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allProducts, setAllProducts] = useState<ProductoSchemaBase[]>([]);
    const [loading, setLoading] = useState(false);

    // Cargar todos los productos para la venta una sola vez al montar el componente
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // La respuesta es un objeto de paginación, los productos están en .items
                const response = await getProductosParaVenta(); 
                setAllProducts(response.items); // Accedemos a la propiedad .items
            } catch (error) {
                console.error('Error al cargar productos para la venta:', error);
            }
            setLoading(false);
        };
        fetchProducts();
    }, []);

    // Filtrar productos en el lado del cliente basado en el término de búsqueda
    const filteredProducts = useMemo(() => {
        if (!searchTerm) {
            return []; // No mostrar nada si no hay búsqueda
        }
        return allProducts.filter(p =>
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10); // Limitar a 10 sugerencias
    }, [searchTerm, allProducts]);

    const handleSelect = (producto: ProductoSchemaBase) => {
        onProductSelect(producto);
        setSearchTerm(''); // Limpiar el input después de seleccionar
    };

    return (
        <div className="relative">
            <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar producto por nombre o código..."
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={loading}
            />
            {loading && <p className="p-2">Cargando productos...</p>}
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
            {searchTerm && !loading && filteredProducts.length === 0 && (
                 <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-3">
                    <p className="text-gray-500">No se encontraron productos.</p>
                </div>
            )}
        </div>
    );
};

export default ProductSaleAutocomplete;
