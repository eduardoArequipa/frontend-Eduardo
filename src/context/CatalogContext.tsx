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
import eventBus, { EVENTS } from '../utils/EventBus';

interface CatalogContextType {
  categorias: CategoriaNested[];
  marcas: MarcaNested[];
  unidadesMedida: UnidadMedidaNested[];
  productos: Producto[];
  conversiones: Conversion[];
  isLoading: boolean;
  error: string | null;
  // Funciones optimizadas
  ensureProductos: () => Promise<void>;
  ensureConversiones: () => Promise<void>;
  ensureCategorias: () => Promise<void>;
  ensureMarcas: () => Promise<void>;
  // Funciones para notificar cambios (será llamada por formularios)
  notifyProductoCreated: (producto: Producto) => void;
  notifyProductoUpdated: (producto: Producto) => void;
  notifyProductoDeleted: (productoId: number) => void;
  notifyCategoriaCreated: (categoria: CategoriaNested) => void;
  notifyMarcaCreated: (marca: MarcaNested) => void;
  // Funciones para invalidar cache específico
  invalidateConversiones: () => Promise<void>;
  // Legacy compatibility
  refetchCatalogs: () => void;
  loadProductos: () => void;
  loadConversiones: () => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categorias, setCategorias] = useState<CategoriaNested[]>([]);
  const [marcas, setMarcas] = useState<MarcaNested[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaNested[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [conversiones, setConversiones] = useState<Conversion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para controlar qué datos están en cache
  const [cache, setCache] = useState({
    categorias: { loaded: false, timestamp: 0 },
    marcas: { loaded: false, timestamp: 0 },
    unidadesMedida: { loaded: false, timestamp: 0 },
    productos: { loaded: false, timestamp: 0 },
    conversiones: { loaded: false, timestamp: 0 }
  });

  // ⚡ FUNCIONES OPTIMIZADAS - Solo cargan si no están en cache
  
  const ensureCategorias = useCallback(async () => {
    if (cache.categorias.loaded) {
      console.log("📋 Categorías ya en cache, no se recargan");
      return;
    }
    
    console.log("📡 Cargando categorías...");
    setIsLoading(true);
    try {
      const categoriasData = await getCategorias({ limit: 500 });
      setCategorias(categoriasData.items);
      setCache(prev => ({
        ...prev,
        categorias: { loaded: true, timestamp: Date.now() }
      }));
      console.log(`✅ Categorías cargadas: ${categoriasData.items.length} items`);
    } catch (err) {
      setError('Error al cargar categorías.');
      console.error("❌ Error cargando categorías", err);
    } finally {
      setIsLoading(false);
    }
  }, [cache.categorias.loaded]);

  const ensureMarcas = useCallback(async () => {
    if (cache.marcas.loaded) {
      console.log("🏷️ Marcas ya en cache, no se recargan");
      return;
    }
    
    console.log("📡 Cargando marcas...");
    setIsLoading(true);
    try {
      const marcasData = await getMarcas({ limit: 500 });
      setMarcas(marcasData);
      setCache(prev => ({
        ...prev,
        marcas: { loaded: true, timestamp: Date.now() }
      }));
      console.log(`✅ Marcas cargadas: ${marcasData.length} items`);
    } catch (err) {
      setError('Error al cargar marcas.');
      console.error("❌ Error cargando marcas", err);
    } finally {
      setIsLoading(false);
    }
  }, [cache.marcas.loaded]);

  const ensureUnidadesMedida = useCallback(async () => {
    if (cache.unidadesMedida.loaded) {
      console.log("📏 Unidades ya en cache, no se recargan");
      return;
    }
    
    console.log("📡 Cargando unidades de medida...");
    setIsLoading(true);
    try {
      const unidadesData = await getUnidadesMedida({ limit: 500 });
      setUnidadesMedida(unidadesData);
      setCache(prev => ({
        ...prev,
        unidadesMedida: { loaded: true, timestamp: Date.now() }
      }));
      console.log(`✅ Unidades cargadas: ${unidadesData.length} items`);
    } catch (err) {
      setError('Error al cargar unidades de medida.');
      console.error("❌ Error cargando unidades", err);
    } finally {
      setIsLoading(false);
    }
  }, [cache.unidadesMedida.loaded]);

  const ensureProductos = useCallback(async () => {
    if (cache.productos.loaded) {
      console.log("📦 Productos ya en cache, no se recargan");
      return;
    }
    
    console.log("📡 Cargando productos...");
    setIsLoading(true);
    try {
      const productosData = await getProductos({ limit: 1000, estado: EstadoEnum.Activo });
      setProductos(productosData.items.filter(p => p.estado === EstadoEnum.Activo));
      setCache(prev => ({
        ...prev,
        productos: { loaded: true, timestamp: Date.now() }
      }));
      console.log(`✅ Productos cargados: ${productosData.items.length} items`);
    } catch (err) {
      setError('Error al cargar productos.');
      console.error("❌ Error cargando productos", err);
    } finally {
      setIsLoading(false);
    }
  }, [cache.productos.loaded]);

  const ensureConversiones = useCallback(async () => {
    if (cache.conversiones.loaded) {
      console.log("🔄 Conversiones ya en cache, no se recargan");
      return;
    }
    
    console.log("📡 Cargando conversiones...");
    setIsLoading(true);
    try {
      const conversionesData = await getConversiones({ limit: 500 });
      setConversiones(conversionesData);
      setCache(prev => ({
        ...prev,
        conversiones: { loaded: true, timestamp: Date.now() }
      }));
      console.log(`✅ Conversiones cargadas: ${conversionesData.length} items`);
    } catch (err) {
      setError('Error al cargar conversiones.');
      console.error("❌ Error cargando conversiones", err);
    } finally {
      setIsLoading(false);
    }
  }, [cache.conversiones.loaded]);

  // 🚀 FUNCIONES DE NOTIFICACIÓN - Para actualizar cache sin hacer peticiones
  
  const notifyProductoCreated = useCallback((producto: Producto) => {
    console.log("➕ Producto creado, agregando a cache:", producto.nombre);
    setProductos(prev => [...prev, producto]);
    eventBus.emit(EVENTS.PRODUCTO_CREATED, producto);
  }, []);

  const notifyProductoUpdated = useCallback((producto: Producto) => {
    console.log("✏️ Producto actualizado, actualizando cache:", producto.nombre);
    setProductos(prev => prev.map(p => 
      p.producto_id === producto.producto_id ? producto : p
    ));
    eventBus.emit(EVENTS.PRODUCTO_UPDATED, producto);
  }, []);

  const notifyProductoDeleted = useCallback((productoId: number) => {
    console.log("🗑️ Producto eliminado, removiendo de cache:", productoId);
    setProductos(prev => prev.filter(p => p.producto_id !== productoId));
    eventBus.emit(EVENTS.PRODUCTO_DELETED, productoId);
  }, []);

  const notifyCategoriaCreated = useCallback((categoria: CategoriaNested) => {
    console.log("➕ Categoría creada, agregando a cache:", categoria.nombre_categoria);
    setCategorias(prev => [...prev, categoria]);
    eventBus.emit(EVENTS.CATEGORIA_CREATED, categoria);
  }, []);

  const notifyMarcaCreated = useCallback((marca: MarcaNested) => {
    console.log("➕ Marca creada, agregando a cache:", marca.nombre_marca);
    setMarcas(prev => [...prev, marca]);
    eventBus.emit(EVENTS.MARCA_CREATED, marca);
  }, []);

  // 🔄 INVALIDAR CONVERSIONES - Para cuando se modifican las presentaciones
  const invalidateConversiones = useCallback(async () => {
    console.log("🔄 Invalidando conversiones...");
    setCache(prev => ({ ...prev, conversiones: { loaded: false, timestamp: 0 } }));
    setConversiones([]);
    
    try {
      const conversionesData = await getConversiones({ limit: 500 });
      setConversiones(conversionesData);
      setCache(prev => ({
        ...prev,
        conversiones: { loaded: true, timestamp: Date.now() }
      }));
      console.log(`✅ Conversiones refrescadas: ${conversionesData.length} items`);
      eventBus.emit(EVENTS.CONVERSION_UPDATED, conversionesData);
    } catch (err) {
      console.error("❌ Error refrescando conversiones:", err);
      setError('Error al refrescar conversiones.');
    }
  }, []);

  // Legacy compatibility - mantener para no romper código existente
  const loadProductos = ensureProductos;
  const loadConversiones = ensureConversiones;
  
  const fetchCatalogs = useCallback(async () => {
    await Promise.all([
      ensureCategorias(),
      ensureMarcas(), 
      ensureUnidadesMedida(),
      ensureProductos(),
      ensureConversiones()
    ]);
  }, [ensureCategorias, ensureMarcas, ensureUnidadesMedida, ensureProductos, ensureConversiones]);

  // 🎯 CARGA INICIAL OPTIMIZADA - Solo unidades de medida (son pocas y se necesitan siempre)
  useEffect(() => {
    console.log("🚀 CatalogContext: Carga inicial optimizada");
    ensureUnidadesMedida(); // Solo las unidades que se necesitan siempre
  }, [ensureUnidadesMedida]);

  // 📡 EVENT LISTENERS - Escuchar notificaciones de otros módulos
  useEffect(() => {
    const handleProductoCreatedFromExternal = (producto: Producto) => {
      if (cache.productos.loaded) {
        console.log("📨 Recibida notificación externa: producto creado", producto.nombre);
        setProductos(prev => {
          // Evitar duplicados
          if (prev.find(p => p.producto_id === producto.producto_id)) {
            return prev;
          }
          return [...prev, producto];
        });
      }
    };

    const handleProductoUpdatedFromExternal = (producto: Producto) => {
      if (cache.productos.loaded) {
        console.log("📨 Recibida notificación externa: producto actualizado", producto.nombre);
        setProductos(prev => prev.map(p => 
          p.producto_id === producto.producto_id ? producto : p
        ));
      }
    };

    const handleConversionUpdatedFromExternal = (conversiones: Conversion[]) => {
      if (cache.conversiones.loaded) {
        console.log("📨 Recibida notificación externa: conversiones actualizadas", conversiones.length);
        setConversiones(conversiones);
      }
    };

    // Suscribirse a eventos
    eventBus.on(EVENTS.PRODUCTO_CREATED, handleProductoCreatedFromExternal);
    eventBus.on(EVENTS.PRODUCTO_UPDATED, handleProductoUpdatedFromExternal);
    eventBus.on(EVENTS.CONVERSION_UPDATED, handleConversionUpdatedFromExternal);

    return () => {
      eventBus.off(EVENTS.PRODUCTO_CREATED, handleProductoCreatedFromExternal);
      eventBus.off(EVENTS.PRODUCTO_UPDATED, handleProductoUpdatedFromExternal);
      eventBus.off(EVENTS.CONVERSION_UPDATED, handleConversionUpdatedFromExternal);
    };
  }, [cache.productos.loaded, cache.conversiones.loaded]);

  const value = {
    categorias,
    marcas,
    unidadesMedida,
    productos,
    conversiones,
    isLoading,
    error,
    // Funciones optimizadas principales
    ensureProductos,
    ensureConversiones,
    ensureCategorias,
    ensureMarcas,
    // Funciones de notificación
    notifyProductoCreated,
    notifyProductoUpdated,
    notifyProductoDeleted,
    notifyCategoriaCreated,
    notifyMarcaCreated,
    // Funciones de invalidación específica
    invalidateConversiones,
    // Legacy compatibility
    refetchCatalogs: fetchCatalogs,
    loadProductos,
    loadConversiones,
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