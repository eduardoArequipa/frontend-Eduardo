// src/hooks/useScannerWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { Producto } from '../types/producto'; // Asegúrate de tener este tipo

interface ScannerMessage {
    event: string;
    type: 'sales_scan' | 'purchase_scan'; // Define los tipos que esperas
    product?: Producto; // El objeto completo del producto
    product_code?: string; // Por si acaso, si el backend no siempre envía el objeto completo
}

interface UseScannerWebSocketResult {
    websocketStatus: string;
    scannerError: string | null;
    lastScannedProduct: Producto | null;
    lastScannedType: 'sales_scan' | 'purchase_scan' | null;
}

const useScannerWebSocket = (): UseScannerWebSocketResult => {
    const [websocketStatus, setWebsocketStatus] = useState<string>('Desconectado');
    const [scannerError, setScannerError] = useState<string | null>(null);
    const [lastScannedProduct, setLastScannedProduct] = useState<Producto | null>(null);
    const [lastScannedType, setLastScannedType] = useState<'sales_scan' | 'purchase_scan' | null>(null);

    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = useRef(1000);
    const websocketRef = useRef<WebSocket | null>(null);
    const isMounted = useRef(true); // Para evitar actualizaciones de estado en componentes desmontados

    const connectWebSocket = useCallback(() => {
        if (!isMounted.current) return; // No conectar si el hook ya no está montado

        if (websocketRef.current && (websocketRef.current.readyState === WebSocket.OPEN || websocketRef.current.readyState === WebSocket.CONNECTING)) {
            websocketRef.current.close();
        }

        setWebsocketStatus('Conectando escáner...');
        setScannerError(null);

        const ws = new WebSocket('ws://localhost:8000/ws/queue'); // La URL de tu WebSocket
        websocketRef.current = ws;

        ws.onopen = () => {
            if (isMounted.current) {
                setWebsocketStatus('Conectado');
                reconnectAttempts.current = 0;
                reconnectDelay.current = 1000;
                setScannerError(null);
                console.log('WebSocket de escáner: Conexión establecida. ✅');
            }
        };

        ws.onmessage = (event) => {
            if (!isMounted.current) return;
            console.log('WebSocket de escáner: Mensaje recibido:', event.data);
            try {
                const data: ScannerMessage = JSON.parse(event.data);
                if (data.event === 'product_scanned' && data.product && (data.type === 'sales_scan' || data.type === 'purchase_scan')) {
                    setLastScannedProduct(data.product);
                    setLastScannedType(data.type);
                    setScannerError(null);
                } else {
                    console.log('WebSocket de escáner: Mensaje ignorado o formato incorrecto:', data);
                }
            } catch (e) {
                console.error('WebSocket de escáner: Error al parsear mensaje JSON:', e);
                setScannerError('Error al procesar mensaje del escáner: ' + (e as Error).message);
            }
        };

        ws.onclose = (event) => {
            if (!isMounted.current) return;
            setWebsocketStatus(`Desconectado (código: ${event.code})`);
            console.warn('WebSocket de escáner: Conexión cerrada.', event);
            setScannerError('Conexión con el escáner perdida. Intentando reconectar...');

            if (reconnectAttempts.current < maxReconnectAttempts) {
                reconnectAttempts.current += 1;
                reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000); // Backoff exponencial
                console.log(`WebSocket de escáner: Intentando reconectar en ${reconnectDelay.current / 1000} segundos (Intento: ${reconnectAttempts.current})...`);
                setTimeout(connectWebSocket, reconnectDelay.current); // Reintento
            } else {
                setWebsocketStatus('Fallo de conexión');
                setScannerError('No se pudo establecer la conexión con el escáner después de varios intentos.');
                console.error('WebSocket de escáner: Demasiados intentos de reconexión fallidos.');
            }
        };

        ws.onerror = (errorEvent) => {
            if (!isMounted.current) return;
            setWebsocketStatus('Error');
            console.error('WebSocket de escáner: Error en la conexión:', errorEvent);
            setScannerError('Error en la conexión WebSocket. Revisa el servidor backend o la red.');
        };
    }, []); // Sin dependencias para que solo se cree una vez

    useEffect(() => {
        isMounted.current = true;
        connectWebSocket(); // Conectar al montar

        return () => {
            isMounted.current = false; // Marcar como desmontado
            if (websocketRef.current && (websocketRef.current.readyState === WebSocket.OPEN || websocketRef.current.readyState === WebSocket.CONNECTING)) {
                websocketRef.current.close();
            }
            // Limpiar cualquier timeout de reconexión pendiente
            const timeoutId = setTimeout(() => {}, 0); // Truco para obtener el ID del último timeout
            for (let i = Number(timeoutId) - Number(reconnectAttempts.current); i <= Number(timeoutId); i++) {
                clearTimeout(i);
            }
            console.log('WebSocket de escáner: Conexión y timeouts limpiados al desmontar.');
        };
    }, [connectWebSocket]); // Dependencia del useCallback

    return { websocketStatus, scannerError, lastScannedProduct, lastScannedType };
};

export default useScannerWebSocket;