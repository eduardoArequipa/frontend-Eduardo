// src/components/Common/ProductAutocomplete.tsx (Nuevo componente)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import  Input  from './Input'; // Tu componente Input
import  LoadingSpinner  from './LoadingSpinner'; // Tu componente LoadingSpinner
import { ProductoSchemaBase } from '../../types/producto'; // El tipo de tu producto
import axios from 'axios'; // Para las llamadas a la API

interface ProductAutocompleteProps {
    onProductSelected: (product: ProductoSchemaBase) => void;
    placeholder?: string;
}

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const ProductAutocomplete: React.FC<ProductAutocompleteProps> = ({ onProductSelected, placeholder = "Buscar producto por nombre o código..." }) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<ProductoSchemaBase[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showResults, setShowResults] = useState<boolean>(false);
    const autocompleteRef = useRef<HTMLDivElement>(null); // Referencia para cerrar los resultados

    const fetchProducts = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setIsLoading(true);
        try {
            // Llama a tu endpoint de backend para buscar productos
            // Asegúrate de que tu backend tenga un endpoint GET /productos/?search=...
            const response = await axios.get(`${API_URL}/productos/?search=${query}&estado=Activo&min_stock=1`);
            setSearchResults(response.data);
            setShowResults(true); // Muestra los resultados si hay una búsqueda
        } catch (error) {
            console.error("Error buscando productos:", error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce para la búsqueda (espera un poco antes de llamar a la API)
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchProducts(searchTerm);
        }, 300); // Espera 300ms después de que el usuario deja de escribir
        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, fetchProducts]);

    // Cerrar resultados al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelectProduct = (product: ProductoSchemaBase) => {
        onProductSelected(product);
        setSearchTerm(''); // Limpia el buscador
        setSearchResults([]);
        setShowResults(false);
    };

    return (
        <div className="relative" ref={autocompleteRef}>
            <Input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSearchTerm(e.target.value)}
                onFocus={() => setShowResults(true)} // Muestra resultados al enfocar
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {isLoading && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <LoadingSpinner />
                </div>
            )}

            {showResults && searchTerm.trim() && searchResults.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {searchResults.map((product) => (
                        <li
                            key={product.producto_id}
                            className="p-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                            onClick={() => handleSelectProduct(product)}
                        >
                            <span>{product.nombre} ({product.codigo})</span>
                            <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                        </li>
                    ))}
                </ul>
            )}
            {showResults && searchTerm.trim() && !isLoading && searchResults.length === 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 p-2 text-gray-500 text-sm">
                    No se encontraron productos.
                </div>
            )}
        </div>
    );
};

export default ProductAutocomplete;