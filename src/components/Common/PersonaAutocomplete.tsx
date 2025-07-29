// src/components/Common/PersonaAutocomplete.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { getPersonas } from '../../services/personaService';
import { PersonaInDB } from '../../types/persona';
import Input from './Input';
import LoadingSpinner from './LoadingSpinner';
import { EstadoEnum } from '../../types/enums';

interface Props {
    onPersonaSelect: (persona: PersonaInDB | null) => void;
    initialPersonaId?: number | null;
    // Nueva prop para filtrar por un rol específico (ej. 'Cliente')
    rolFilterName?: string;
    // Nueva prop para excluir personas con un rol específico (ej. 'Cliente')
    excludeRolName?: string; 
    // La prop onlyWithoutUser se mantiene si la usas en otro contexto
    onlyWithoutUser?: boolean; // Mantener si es necesario para otros formularios
}

const PersonaAutocomplete: React.FC<Props> = ({ 
    onPersonaSelect, 
    initialPersonaId, 
    rolFilterName, // <- Nueva prop
    excludeRolName, // <- Nueva prop
    onlyWithoutUser = false // Mantener si es necesario
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<PersonaInDB[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPersonaName, setSelectedPersonaName] = useState<string>('');
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

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
            const params: any = { // Usamos 'any' temporalmente para la flexibilidad de los parámetros
                search,
                skip: 0,
                limit: 10,
                estado: EstadoEnum.Activo
            };

            // Aplica el filtro de rol si la prop está presente
            if (rolFilterName) {
                params.rol_nombre = rolFilterName;
            }
            // Aplica el filtro de exclusión de rol si la prop está presente
            if (excludeRolName) {
                params.exclude_rol_nombre = excludeRolName;
            }

            // OJO: Si usas 'onlyWithoutUser', asegúrate de que no entre en conflicto con rolFilterName
            // Por ejemplo, un cliente siempre debe tener usuario, entonces 'onlyWithoutUser' no aplicaría aquí.
            // Si tu getPersonasWithoutUser es un endpoint diferente, lo manejarías aquí:
            // if (onlyWithoutUser) {
            //     response = await getPersonasWithoutUser();
            // } else {
            //     response = await getPersonas(params);
            // }

            const response = await getPersonas(params); 
            setSuggestions(response);
        } catch (err) {
            setError('Error al buscar personas.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const debouncedFetch = useCallback(debounce(fetchSuggestions, 300), [rolFilterName, excludeRolName]); // Añadir dependencias

    useEffect(() => {
        if (searchTerm) {
            debouncedFetch(searchTerm);
        } else {
            setSuggestions([]);
        }
    }, [searchTerm, debouncedFetch]);

    // Lógica para cargar la persona inicial si initialPersonaId está presente
    useEffect(() => {
        const loadInitialPersona = async () => {
            if (initialPersonaId && !initialLoadComplete) {
                setIsLoading(true);
                try {
                    // Carga la persona inicial aplicando también los filtros si aplican
                    const params: any = { 
                        skip: 0, 
                        limit: 1,
                        persona_id: initialPersonaId // Si tu API soporta buscar por persona_id
                    };
                    if (rolFilterName) { params.rol_nombre = rolFilterName; }
                    if (excludeRolName) { params.exclude_rol_nombre = excludeRolName; }

                    const response = await getPersonas(params);
                    if (response.length > 0) {
                        const persona = response[0];
                        setSelectedPersonaName(`${persona.nombre} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim());
                        onPersonaSelect(persona);
                    }
                } catch (err) {
                    console.error('Error al cargar persona inicial:', err);
                    setError('Error al cargar la persona inicial.');
                } finally {
                    setIsLoading(false);
                    setInitialLoadComplete(true);
                }
            }
        };
        loadInitialPersona();
    }, [initialPersonaId, onPersonaSelect, initialLoadComplete, rolFilterName, excludeRolName]); // Añadir dependencias

    const handleSelect = (persona: PersonaInDB) => {
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
                className="w-full"
            />
            {selectedPersonaName && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600"
                    title="Limpiar selección"
                >
                    &times;
                </button>
            )}

            {isLoading && <div className="absolute z-10 w-full mt-1"><LoadingSpinner /></div>}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

            {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {suggestions.map(persona => (
                        <li
                            key={persona.persona_id}
                            onClick={() => handleSelect(persona)}
                            className="p-2 hover:bg-indigo-100 cursor-pointer"
                        >
                            {`${persona.nombre} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim()}
                            <span className="text-sm text-gray-500 ml-2">(CI: {persona.ci || 'N/A'})</span>
                        </li>
                    ))}
                     <li
                        onClick={handleClear}
                        className="p-2 hover:bg-gray-100 cursor-pointer border-t"
                    >
                        <span className="italic text-gray-600">Consumidor Final (limpiar)</span>
                    </li>
                </ul>
            )}
        </div>
    );
};

export default PersonaAutocomplete;