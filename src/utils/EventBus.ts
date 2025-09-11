// src/utils/EventBus.ts
type EventCallback = (data?: any) => void;

interface EventMap {
  [key: string]: EventCallback[];
}

class EventBus {
  private events: EventMap = {};

  // Suscribirse a un evento
  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  // Desuscribirse de un evento
  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    
    // Limpiar el array si está vacío
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }

  // Emitir un evento
  emit(event: string, data?: any): void {
    console.log(`📡 EventBus: Emitiendo evento '${event}'`, data);
    
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Error en listener de evento '${event}':`, error);
      }
    });
  }

  // Limpiar todos los eventos
  clear(): void {
    this.events = {};
  }

  // Debug - Ver todos los eventos suscritos
  getSubscriptions(): EventMap {
    return { ...this.events };
  }
}

// Instancia singleton
const eventBus = new EventBus();

// Eventos específicos del sistema
export const EVENTS = {
  // Productos
  PRODUCTO_CREATED: 'producto.created',
  PRODUCTO_UPDATED: 'producto.updated', 
  PRODUCTO_DELETED: 'producto.deleted',
  
  // Conversiones
  CONVERSION_CREATED: 'conversion.created',
  CONVERSION_UPDATED: 'conversion.updated',
  CONVERSION_DELETED: 'conversion.deleted',
  
  // Categorías
  CATEGORIA_CREATED: 'categoria.created',
  CATEGORIA_UPDATED: 'categoria.updated',
  CATEGORIA_DELETED: 'categoria.deleted',
  
  // Marcas
  MARCA_CREATED: 'marca.created',
  MARCA_UPDATED: 'marca.updated',
  MARCA_DELETED: 'marca.deleted',
  
  // Personas
  PERSONA_CREATED: 'persona.created',
  PERSONA_UPDATED: 'persona.updated',
  PERSONA_DELETED: 'persona.deleted',
  
  // Ventas
  VENTA_CREATED: 'venta.created',
  VENTA_UPDATED: 'venta.updated',
  
  // Compras
  COMPRA_CREATED: 'compra.created',
  COMPRA_UPDATED: 'compra.updated',
  
  // Cache
  CACHE_INVALIDATE: 'cache.invalidate',
  CACHE_REFRESH: 'cache.refresh'
} as const;

export default eventBus;