import React, { useState, useEffect } from 'react';
import { TipoMargenEnum } from '../../types/enums';
import Input from '../Common/Input';
import Select from '../Common/Select';
import { 
  calcularPrecioVenta, 
  calcularMargenAplicado, 
  validarPrecioVentaMinimo, 
  obtenerPrecioMinimoPermitido, 
  formatearPrecioParaUI, 
  validarEntradaPrecio 
} from '../../services/precioService';
import { useTheme } from '../../context/ThemeContext';

interface MargenConfigFormProps {
  precio_compra: string; // Cambiado a string para precisión decimal
  tipo_margen: TipoMargenEnum;
  margen_valor: string; // Cambiado a string para precisión decimal
  precio_manual_activo: boolean;
  precio_venta: string; // Cambiado a string para precisión decimal
  onChange: (field: string, value: any) => void;
  onPrecioVentaChange: (precio: string) => void; // Cambiado a string
  disabled?: boolean;
  isCreationMode?: boolean;
}

const MargenConfigForm: React.FC<MargenConfigFormProps> = ({
  precio_compra,
  tipo_margen,
  margen_valor,
  precio_manual_activo,
  precio_venta,
  onChange,
  onPrecioVentaChange,
  disabled = false,
  isCreationMode = false
}) => {
  const { theme } = useTheme();
  const [calculando, setCalculando] = useState(false);
  const [errores, setErrores] = useState<{[key: string]: string}>({});
  
  // Estados locales para inputs - ya son strings
  const [localPrecioCompra, setLocalPrecioCompra] = useState(precio_compra);
  const [localMargenValor, setLocalMargenValor] = useState(margen_valor);
  const [localPrecioVenta, setLocalPrecioVenta] = useState(precio_venta);

  // Opciones para el tipo de margen
  const tipoMargenOptions = [
    { value: TipoMargenEnum.Porcentaje, label: 'Porcentaje (%)' },
    { value: TipoMargenEnum.Fijo, label: 'Valor Fijo (Bs)' }
  ];

  // Sincronizar estados locales cuando cambien las props
  useEffect(() => {
    setLocalPrecioCompra(precio_compra);
  }, [precio_compra]);

  useEffect(() => {
    setLocalMargenValor(margen_valor);
  }, [margen_valor]);

  useEffect(() => {
    setLocalPrecioVenta(precio_venta);
  }, [precio_venta]);

  // Calcular precio automáticamente cuando cambien parámetros
  useEffect(() => {
    if (!precio_manual_activo && localPrecioCompra && localMargenValor) {
      calcularPrecioAutomatico();
    }
  }, [localPrecioCompra, localMargenValor, tipo_margen, precio_manual_activo]);

  const calcularPrecioAutomatico = () => {
    try {
      setCalculando(true);
      const precioCalculado = calcularPrecioVenta(
        localPrecioCompra,
        tipo_margen,
        localMargenValor
      );
      
      setLocalPrecioVenta(precioCalculado);
      onPrecioVentaChange(precioCalculado);
      setErrores(prev => ({ ...prev, precio_venta: '' }));
    } catch (error) {
      console.error('Error calculando precio automático:', error);
    } finally {
      setCalculando(false);
    }
  };

  const handlePrecioCompraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setLocalPrecioCompra(valor);
    
    const validacion = validarEntradaPrecio(valor);
    if (!validacion.esValido) {
      setErrores(prev => ({ ...prev, precio_compra: validacion.error! }));
    } else {
      setErrores(prev => ({ ...prev, precio_compra: '' }));
      onChange('precio_compra', validacion.valor);
    }
  };

  const handleTipoMargenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoTipo = e.target.value as TipoMargenEnum;
    onChange('tipo_margen', nuevoTipo);
  };

  const handleMargenValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setLocalMargenValor(valor);
    
    const validacion = validarEntradaPrecio(valor);
    if (!validacion.esValido) {
      setErrores(prev => ({ ...prev, margen_valor: validacion.error! }));
    } else {
      setErrores(prev => ({ ...prev, margen_valor: '' }));
      onChange('margen_valor', validacion.valor);
    }
  };

  const handlePrecioManualChange = (checked: boolean) => {
    onChange('precio_manual_activo', checked);
    
    // Si se desactiva el modo manual, recalcular automáticamente
    if (!checked) {
      calcularPrecioAutomatico();
    }
  };

  const handlePrecioVentaManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setLocalPrecioVenta(valor);
    
    const validacion = validarEntradaPrecio(valor);
    if (!validacion.esValido) {
      setErrores(prev => ({ ...prev, precio_venta: validacion.error! }));
    } else {
      const esValido = validarPrecioVentaMinimo(localPrecioCompra, validacion.valor);
      if (!esValido) {
        setErrores(prev => ({ 
          ...prev, 
          precio_venta: `El precio de venta no puede ser menor al de compra (${formatearPrecioParaUI(localPrecioCompra)})` 
        }));
      } else {
        setErrores(prev => ({ ...prev, precio_venta: '' }));
        onPrecioVentaChange(validacion.valor);
      }
    }
  };

  const getPrecioMinimoPermitido = () => obtenerPrecioMinimoPermitido(localPrecioCompra);

  // Si es modo creación, mostrar solo configuración básica de márgenes
  if (isCreationMode) {
    return (
      <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg space-y-4`}>
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Configuración de Márgenes (Valores por Defecto)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Tipo de Margen
            </label>
            <Select
              value={tipo_margen}
              onChange={handleTipoMargenChange}
              options={tipoMargenOptions}
              disabled={disabled}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Valor del Margen {tipo_margen === TipoMargenEnum.Porcentaje ? '(%)' : '(Bs)'}
            </label>
            <Input
              type="number"
              value={localMargenValor}
              onChange={handleMargenValorChange}
              step={tipo_margen === TipoMargenEnum.Porcentaje ? "1" : "0.01"}
              min="0"
              disabled={disabled}
              placeholder={tipo_margen === TipoMargenEnum.Porcentaje ? "30" : "5.00"}
            />
          </div>
        </div>

        <div className={`${theme === 'dark' ? 'bg-blue-900 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'} border p-3 rounded`}>
          <p className="text-sm">
            ℹ️ Estos valores se usarán como configuración predeterminada. Los precios reales se calcularán cuando realices la primera compra.
          </p>
        </div>
        
        {/* Campos ocultos para el formulario */}
        <input type="hidden" value={precio_manual_activo ? 'true' : 'false'} />
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg space-y-4`}>
      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Configuración de Márgenes y Precios</h3>
      
      {/* Precio de compra */}
      <div>
        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
          Precio de Compra (Bs.)
        </label>
        <Input
          type="number"
          value={localPrecioCompra}
          onChange={handlePrecioCompraChange}
          disabled={disabled}
          step="0.01"
          className={`${errores.precio_compra ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="0.00"
        />
        {errores.precio_compra && (
          <span className="text-red-500 text-xs mt-1">{errores.precio_compra}</span>
        )}
        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
          Este precio se actualiza automáticamente al completar compras
        </p>
      </div>

      {/* Configuración de margen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            Tipo de Margen
          </label>
          <Select
            value={tipo_margen}
            onChange={handleTipoMargenChange}
            options={tipoMargenOptions}
            disabled={disabled}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            Valor del Margen {tipo_margen === TipoMargenEnum.Porcentaje ? '(%)' : '(Bs)'}
            {calculando && <span className={`ml-2 text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`}>actualizando...</span>}
          </label>
          <Input
            type="number"
            value={localMargenValor}
            onChange={handleMargenValorChange}
            step={tipo_margen === TipoMargenEnum.Porcentaje ? "1" : "0.01"}
            min="0"
            disabled={disabled}
            placeholder={tipo_margen === TipoMargenEnum.Porcentaje ? "30" : "5.00"}
            className={`${errores.margen_valor ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errores.margen_valor && (
            <span className="text-red-500 text-xs mt-1">{errores.margen_valor}</span>
          )}
        </div>
      </div>

      {/* Preview del cálculo */}
      {!isCreationMode && localPrecioCompra && localMargenValor && (
        <div className={`${theme === 'dark' ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'} p-3 rounded border`}>
          <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'} mb-2`}>Vista Previa del Cálculo</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Precio Base:</span>
              <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                {formatearPrecioParaUI(localPrecioCompra)}
              </p>
            </div>
            <div>
              <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Margen Aplicado:</span>
              <p className={`font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                +{formatearPrecioParaUI(calcularMargenAplicado(localPrecioCompra, localPrecioVenta))}
              </p>
            </div>
            <div>
              <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Precio Calculado:</span>
              <p className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                {formatearPrecioParaUI(calcularPrecioVenta(localPrecioCompra, tipo_margen, localMargenValor))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control de precio manual */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="precio_manual_activo"
          checked={precio_manual_activo}
          onChange={(e) => handlePrecioManualChange(e.target.checked)}
          disabled={disabled}
          className={`w-4 h-4 text-blue-600 ${theme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-gray-100 border-gray-300'} rounded focus:ring-blue-500`}
        />
        <label htmlFor="precio_manual_activo" className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Usar precio de venta manual
        </label>
      </div>

      {/* Precio de venta */}
      <div>
        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
          Precio de Venta Final
          {precio_manual_activo ? ' (Manual)' : ' (Automático)'}
        </label>
        <Input
          type="number"
          value={localPrecioVenta}
          onChange={handlePrecioVentaManualChange}
          step="0.01"
          min={getPrecioMinimoPermitido()}
          disabled={disabled || (!precio_manual_activo && calculando)}
          className={`${errores.precio_venta ? 'border-red-500' : ''} ${precio_manual_activo 
            ? (theme === 'dark' ? 'border-orange-400' : 'border-orange-300') 
            : (theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100')
          }`}
        />
        {errores.precio_venta && (
          <span className="text-red-500 text-xs mt-1">{errores.precio_venta}</span>
        )}
        <div className="flex justify-between text-xs mt-1">
          <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Precio mínimo: {formatearPrecioParaUI(getPrecioMinimoPermitido())}
          </span>
          {calculando && (
            <span className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`}>Calculando...</span>
          )}
        </div>
      </div>

      {/* Advertencias */}
      {!validarPrecioVentaMinimo(localPrecioCompra, localPrecioVenta) && (
        <div className={`${theme === 'dark' ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border p-3 rounded`}>
          <p className={`${theme === 'dark' ? 'text-red-200' : 'text-red-800'} text-sm`}>
            ⚠️ <strong>Advertencia:</strong> El precio de venta es menor al precio de compra. Esto resultará en pérdidas.
          </p>
        </div>
      )}
    </div>
  );
};

export default MargenConfigForm;