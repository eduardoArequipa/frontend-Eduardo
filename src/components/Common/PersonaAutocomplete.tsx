// src/components/Common/PersonaAutocomplete.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { getPersonas } from '../../services/personaService';
import { IPersonaInDB, PersonaPagination } from '../../types/persona';
import Input from './Input';
import LoadingSpinner from './LoadingSpinner';
import { EstadoEnum } from '../../types/enums';

interface Props {
    onPersonaSelect: (persona: IPersonaInDB | null) => void;
    initialPersonaId?: number | null;
    rolFilterName?: string;
    excludeRolName?: string; 
}

const PersonaAutocomplete: React.FC<Props> = ({
    onPersonaSelect,
    initialPersonaId,
    rolFilterName,
    excludeRolName,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<IPersonaInDB[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPersonaName, setSelectedPersonaName] = useState<string>('');

    const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return function(this: any, ...args: Parameters<F>) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        } as F;
    };

    const fetchSuggestions = async (search: string) => {
        if (search.length < 2) {
            setSuggestions([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const params: any = {
                search,
                skip: 0,
                limit: 10,
                estado: EstadoEnum.Activo
            };

            if (rolFilterName) {
                params.rol_nombre = rolFilterName;
            }
            if (excludeRolName) {
                params.exclude_rol_nombre = excludeRolName;
            }

            const response: PersonaPagination = await getPersonas(params); 
            setSuggestions(response.items);
        } catch (err) {
            setError('Error al buscar personas.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const debouncedFetch = useCallback(debounce(fetchSuggestions, 300), [rolFilterName, excludeRolName]);

    useEffect(() => {
        if (searchTerm) {
            debouncedFetch(searchTerm);
        } else {
            setSuggestions([]);
        }
    }, [searchTerm, debouncedFetch]);

    useEffect(() => {
        const loadInitialPersona = async () => {
            if (initialPersonaId) {
                setIsLoading(true);
                try {
                    // Usamos getPersonas con el ID para obtener el objeto completo
                    const response: PersonaPagination = await getPersonas({ 
                        persona_id: initialPersonaId, 
                        limit: 1 
                    });
                    if (response.items.length > 0) {
                        const persona = response.items[0];
                        setSelectedPersonaName(`${persona.nombre} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim());
                        // No llamamos a onPersonaSelect aquí para no crear un bucle si el padre no usa useCallback
                    }
                } catch (err) {
                    setError('Error al cargar la persona seleccionada.');
                    setSelectedPersonaName(''); // Limpiar en caso de error
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Si el ID inicial es nulo o indefinido, limpiamos el nombre
                setSelectedPersonaName('');
            }
        };
        loadInitialPersona();
    }, [initialPersonaId]);

    const handleSelect = (persona: IPersonaInDB) => {
        setSearchTerm('');
        setSuggestions([]);
        setSelectedPersonaName(`${persona.nombre} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim());
        onPersonaSelect(persona);
    };

    const handleClear = () => {
        setSearchTerm('');
        setSuggestions([]);
        setSelectedPersonaName('');
        onPersonaSelect(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setSelectedPersonaName('');
    };

    return (
        <div className="relative w-full">
            <Input
                type="text"
                value={selectedPersonaName || searchTerm}
                onChange={handleChange}
                placeholder="Buscar persona por nombre o CI..."
            />
            {selectedPersonaName && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Limpiar selección"
                >
                    &times;
                </button>
            )}

            {isLoading && <div className="absolute z-10 w-full mt-1"><LoadingSpinner /></div>}
            {error && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>}

            {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {suggestions.map(persona => (
                        <li
                            key={persona.persona_id}
                            onClick={() => handleSelect(persona)}
                            className="p-2 text-gray-900 dark:text-gray-100 hover:bg-indigo-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                            {`${persona.nombre} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim()}
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">(CI: {persona.ci || 'N/A'})</span>
                        </li>
                    ))}
                     <li
                        onClick={handleClear}
                        className="p-2 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-t border-gray-200 dark:border-gray-700"
                    >
                        <span className="italic text-gray-600 dark:text-gray-400">Consumidor Final (limpiar)</span>
                    </li>
                </ul>
            )}
        </div>
    );
};

export default PersonaAutocomplete;