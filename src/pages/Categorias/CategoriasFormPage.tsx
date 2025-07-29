// src/pages/Categorias/CategoriasFormPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCategoriaById, createCategoria, updateCategoria } from '../../services/categoriaService';
import {  CategoriaCreate, CategoriaUpdate } from '../../types/categoria'; // Esquemas de lectura y creación/actualización
import { EstadoEnum } from '../../types/enums'; 
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';


const CategoriasFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>(); 
    const navigate = useNavigate(); 

    const isEditing = !!id;
    const categoriaId = id ? parseInt(id, 10) : null; 

    interface CategoriaFormState {
        nombre_categoria: string;
        estado: EstadoEnum; 
    }

    // Inicializamos el estado del formulario
    const [categoriaFormData, setCategoriaFormData] = useState<CategoriaFormState>({
        nombre_categoria: '',
        estado: EstadoEnum.Activo, 
    });

    // Estados de carga y error
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState<string | null>(null); 
    const [formSubmitError, setFormSubmitError] = useState<string | null>(null);


    // *** Efecto para Cargar Datos de la Categoría Existente al Editar ***
    useEffect(() => {
        if (isEditing && categoriaId) { 
            setLoading(true); 
            setError(null); 

            getCategoriaById(categoriaId)
                .then(data => {
                    // Mapear los datos obtenidos (Categoria) al estado del formulario (CategoriaFormState)
                    setCategoriaFormData({
                       nombre_categoria: data.nombre_categoria,
                       estado: data.estado,
                    });
                    setLoading(false); 
                })
                .catch(err => {
                    console.error("Error loading categoria for edit:", err);
                    setError("No se pudo cargar la categoría para editar.");
                    setLoading(false); 
                });
        } else {
            setLoading(false);
        }
    }, [isEditing, categoriaId]); 


    // *** Manejar cambios en los inputs del formulario (nombre_categoria, estado) ***
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCategoriaFormData(prev => ({
            ...prev,
            // El valor del select de estado ya es un string de EstadoEnum
            [name]: value,
        }));
    };


    // *** Manejar Envío del Formulario (Crear o Actualizar) ***
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); 
        setLoading(true); 
        setFormSubmitError(null); 

        try {
            if (isEditing && categoriaId) {
                const dataToSend: CategoriaUpdate = {
                    nombre_categoria: categoriaFormData.nombre_categoria,
                    estado: categoriaFormData.estado,
                };
                 if (!dataToSend.nombre_categoria || dataToSend.nombre_categoria.trim() === '') {
                     setFormSubmitError("El nombre de la categoría es requerido.");
                     setLoading(false);
                     return;
                 }

                console.log("Sending update payload:", dataToSend); 
                await updateCategoria(categoriaId, dataToSend); 
                alert("Categoría actualizada con éxito!"); 
                navigate('/categorias'); 

            } else {

                 const dataToSend: CategoriaCreate = {
                    nombre_categoria: categoriaFormData.nombre_categoria, 
                 };

                 // Validaciones básicas en el frontend (nombre_categoria es requerido)
                 if (!dataToSend.nombre_categoria || dataToSend.nombre_categoria.trim() === '') {
                     setFormSubmitError("El nombre de la categoría es requerido.");
                     setLoading(false);
                     return;
                 }

                console.log("Sending create payload:", dataToSend); 
                await createCategoria(dataToSend); 
                alert("Categoría creada con éxito!"); 
                navigate('/categorias'); 
            }

        } catch (err: any) {
            // *** Manejo de errores (similar al formulario de Usuario) ***
            console.error("Error submitting categoria form:", err.response?.data || err);

            let errorMessage = "Ocurrió un error al guardar la categoría.";

            if (err.response && err.response.data) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    try {
                        errorMessage = err.response.data.detail
                            .map((errorDetail: any) => {
                                const loc = Array.isArray(errorDetail.loc) ? errorDetail.loc.join(' -> ') : 'Desconocido';
                                const msg = errorDetail.msg;
                                return `${loc}: ${msg}`;
                            })
                            .join('; ');
                    } catch (parseError) {
                        console.error("Failed to parse 422 error detail:", parseError);
                        errorMessage = "Error de validación desconocido.";
                    }
                } else {
                     errorMessage = "Error del servidor con formato inesperado.";
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            setFormSubmitError(errorMessage); // Establece el mensaje de error formateado
        } finally {
            setLoading(false); // Desactiva loading al finalizar (éxito o error)
        }
    };

    if (isEditing && loading) {
         return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <LoadingSpinner /> Cargando datos de la categoría...
            </div>
         );
    }

    // Mostrar error si falló la carga inicial (solo en edición)
    if (error) {
        return <div className="text-red-500 text-center mt-4">Error: {error}</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">{isEditing ? 'Editar Categoría' : 'Crear Nueva Categoría'}</h1>

            {/* El formulario se renderiza si no hay errores de carga inicial */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Campo Nombre de Categoría */}
                <div>
                    <label htmlFor="nombre_categoria" className="block text-sm font-medium text-gray-700">Nombre de Categoría</label>
                    <Input
                        id="nombre_categoria"
                        name="nombre_categoria" 
                        type="text"
                        required 
                        value={categoriaFormData.nombre_categoria || ''} 
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                 </div>

                 {/* Campo Estado (Select) - Se muestra en creación y edición */}
                 {/* Aunque el estado no se envía en el payload de CREACION, se maneja en el formulario */}
                 <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                        id="estado"
                        name="estado" 
                        value={categoriaFormData.estado} 
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value={EstadoEnum.Activo}>Activo</option>
                        <option value={EstadoEnum.Inactivo}>Inactivo</option>
                         {/* Añade otros estados si tu Enum los tiene y aplican a Categorías */}
                         {/* <option value={EstadoEnum.Bloqueado}>Bloqueado</option> */}
                    </select>
                 </div>

                {/* --- Botones de Acción y Mensajes de Error --- */}
                {formSubmitError && ( 
                    <div className="md:col-span-2 text-red-500 text-center mb-4">{formSubmitError}</div>
                )}

                <div className="md:col-span-2 flex justify-end space-x-4">

                    <Link to="/categorias">
                        <Button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded shadow">
                            Cancelar
                        </Button>
                    </Link>
                    {/* Botón Guardar/Crear */}
                    <Button
                        type="submit"
                        // Deshabilita el botón durante el envío
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {/* Muestra el spinner si loading es true, de lo contrario muestra texto */}
                        {loading ? <LoadingSpinner /> : (isEditing ? 'Actualizar Categoría' : 'Crear Categoría')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CategoriasFormPage;