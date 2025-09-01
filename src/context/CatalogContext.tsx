// src/context/CatalogContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { getCategorias } from '../services/categoriaService';
import { getMarcas } from '../services/marcaService';
import { getUnidadesMedida } from '../services/unidadMedidaService';
import { getProductos, getConversiones } from '../services/productoService';
import { CategoriaNested } from '../types/categoria';
import { MarcaNested } from '../types/marca';
import { UnidadMedidaNested } from '../types/unidad_medida';
import { Producto, Conversion } from '../types/producto';
import { EstadoEnum } from '../types/enums';

interface CatalogContextType {
  categorias: CategoriaNested[];
  marcas: MarcaNested[];
  unidadesMedida: UnidadMedidaNested[];
  productos: Producto[];
  conversiones: Conversion[];
  isLoading: boolean;
  error: string | null;
  refetchCatalogs: () => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categorias, setCategorias] = useState<CategoriaNested[]>([]);
  const [marcas, setMarcas] = useState<MarcaNested[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaNested[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [conversiones, setConversiones] = useState<Conversion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogs = useCallback(async () => {
    console.log("CatalogContext: Iniciando fetchCatalogs...");
    setIsLoading(true);
    setError(null);
    try {
      const [categoriasData, marcasData, unidadesMedidaData, productosData, conversionesData] = await Promise.all([
        getCategorias({ limit: 500 }),
        getMarcas({ limit: 500 }),
        getUnidadesMedida({ limit: 500 }),
        getProductos({ limit: 1000, estado: EstadoEnum.Activo }),
        getConversiones({ limit: 500 })
      ]);
      
      setCategorias(categoriasData.items);
      console.log("CatalogContext: Categorías actualizadas.", categoriasData.items.length);
      setMarcas(marcasData);
      console.log("CatalogContext: Marcas actualizadas.", marcasData.length);
      setUnidadesMedida(unidadesMedidaData);
      console.log("CatalogContext: Unidades de Medida actualizadas.", unidadesMedidaData.length);
      setProductos(productosData.items.filter(p => p.estado === EstadoEnum.Activo));
      console.log("CatalogContext: Productos actualizados.", productosData.items.length);
      setConversiones(conversionesData);
      console.log("CatalogContext: Conversiones actualizadas.", conversionesData.length);

    } catch (err) {
      setError('Error al cargar los catálogos. Por favor, intente recargar la página.');
      console.error("CatalogContext: Error en fetchCatalogs", err);
    } finally {
      setIsLoading(false);
      console.log("CatalogContext: fetchCatalogs finalizado.");
    }
  }, []);

  useEffect(() => {
    console.log("CatalogContext: useEffect inicial ejecutado.");
    fetchCatalogs();
  }, [fetchCatalogs]);

  const value = {
    categorias,
    marcas,
    unidadesMedida,
    productos,
    conversiones,
    isLoading,
    error,
    refetchCatalogs: fetchCatalogs,
  };

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalogs = (): CatalogContextType => {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalogs debe ser usado dentro de un CatalogProvider');
  }
  return context;
};