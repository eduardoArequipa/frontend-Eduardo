// src/pages/Compras/DetalleCompraModal.tsx
import React, { useMemo, useRef } from 'react';
import { Compra } from '../../types/compra';
import { EstadoCompraEnum } from '../../types/enums';
import ModalContainer from '../../components/Common/ModalContainer';
import Button from '../../components/Common/Button';
import Table from '../../components/Common/Table';
import { useReactToPrint } from 'react-to-print';
import { formatearCantidad } from '../../utils/numberFormat';

// Iconos SVG como componentes funcionales para reutilización
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const SupplierIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h2M9 7h6m-3 4v4m-2-4h4" /></svg>;
//const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293A1 1 0 005 16v0a1 1 0 001 1h11M9 19a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

interface DetalleCompraModalProps {
  compra: Compra | null;
  isOpen: boolean;
  onClose: () => void;
}

const DetalleCompraModal: React.FC<DetalleCompraModalProps> = ({ compra, isOpen, onClose }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  // Definir columnas de la tabla antes del return temprano
  const detalleColumns = useMemo(() => [
    {
        Header: 'Código',
        accessor: 'producto.codigo',
        Cell: ({ row }: any) => <span className="font-mono">{row.original.producto?.codigo || 'N/A'}</span>
    },
    {
      Header: 'Producto',
      accessor: 'producto.nombre',
      Cell: ({ row }: any) => row.original.producto?.nombre || 'N/A'
    },
    {
      Header: 'Cantidad',
      accessor: 'cantidad',
      Cell: ({ row }: any) => <div className="text-right">{formatearCantidad(row.original.cantidad)}</div>
    },
    {
      Header: 'Presentación',
      accessor: 'presentacion_compra',
      Cell: ({ row }: any) => <div className="text-center">{row.original.presentacion_compra || 'Unidad'}</div>
    },
    {
      Header: 'P. Unitario',
      accessor: 'precio_unitario',
      Cell: ({ row }: any) => <div className="text-right">{Number(row.original.precio_unitario).toFixed(2)} Bs.</div>
    },
    {
        Header: 'Subtotal',
        accessor: 'subtotal',
        Cell: ({ row }: any) => {
            const subtotal = row.original.cantidad * row.original.precio_unitario;
            return <div className="text-right font-semibold">{Number(subtotal).toFixed(2)} Bs.</div>
        }
    }
  ], []);

  // Return temprano después de todos los hooks
  if (!compra) return null;

  const formattedDate = new Date(compra.fecha_compra).toLocaleString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title={"Comercial Don Eduardo - Detalle de Compra"}>
        {/* Contenido que se va a imprimir */}
        <div ref={componentRef} className="p-4 bg-white dark:bg-gray-800">
            <h2 className="text-center text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Detalle de Compra #{compra.compra_id}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-sm">
                <div className="flex items-center">
                    <SupplierIcon />
                    <div>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Proveedor:</span>
                        <p className="text-gray-800 dark:text-gray-200">
                        {compra.proveedor ? (
                            compra.proveedor.persona
                                ? `${compra.proveedor.persona.nombre} ${compra.proveedor.persona.apellido_paterno || ''}`.trim()
                                : compra.proveedor.empresa
                                    ? compra.proveedor.empresa.razon_social
                                    : `ID ${compra.proveedor.proveedor_id}`
                        ) : 'Proveedor no especificado'}
                        </p>
                        {compra.proveedor?.persona?.telefono && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">Tel: {compra.proveedor.persona.telefono}</p>
                        )}
                        {compra.proveedor?.empresa?.telefono && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">Tel: {compra.proveedor.empresa.telefono}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center">
                    <CalendarIcon />
                    <div>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Fecha y Hora:</span>
                        <p className="text-gray-800 dark:text-gray-200">{formattedDate}</p>
                    </div>
                </div>
                <div className="flex items-center">
                    <UserIcon />
                    <div>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Registrado por:</span>
                        <p className="text-gray-800 dark:text-gray-200">
                          {compra.creador ? `${compra.creador.nombre_usuario}` : 'Usuario desconocido'}
                        </p>
                    </div>
                </div>
                {compra.modificador && (
                    <div className="flex items-center">
                        <UserIcon />
                        <div>
                            <span className="font-semibold text-gray-600 dark:text-gray-400">Modificado por:</span>
                            <p className="text-gray-800 dark:text-gray-200">
                              {compra.modificador.nombre_usuario}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            <div className="mb-6">
                <span className="font-semibold text-gray-600 dark:text-gray-400">Estado de la Compra:</span>
                <span 
                className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full w-min ${
                    compra.estado === EstadoCompraEnum.pendiente
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                    : compra.estado === EstadoCompraEnum.completada
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                {compra.estado}
                </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Productos Comprados</h3>
            <Table columns={detalleColumns} data={compra.detalles || []} />
            
            <div className="mt-6 text-right">
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Total: {Number(compra.total).toFixed(2)} Bs.
            </span>
            </div>
        </div>
        {/* Botones que no se imprimen */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 px-6 pb-4">
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            <Button variant="primary" onClick={handlePrint}>Imprimir</Button>
        </div>
    </ModalContainer>
  );
};

export default DetalleCompraModal;