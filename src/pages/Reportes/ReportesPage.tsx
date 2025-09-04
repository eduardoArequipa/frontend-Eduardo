import React, { useState, useEffect, useMemo } from 'react';
import { 
  DatePicker, 
  Select as AntdSelect, 
  Spin, 
  notification, 
  Card,
  Tabs,
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  Typography,
  Radio,
  Divider,
  Tooltip,
  ConfigProvider,
  theme as antdTheme,
} from 'antd';
import Button from '../../components/Common/Button';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { DefaultOptionType } from 'antd/es/select';
import { 
  FileExcelOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  DatabaseOutlined
} from '@ant-design/icons';

// Importaciones de servicios
import { getProductos } from '../../services/productoService';
import { getCategorias } from '../../services/categoriaService';
import { getUsers } from '../../services/userService';
import { getProveedores } from '../../services/proveedorService';
import { getMarcas } from '../../services/marcaService';
import { 
  generarReporteVentasPDF, 
  generarReporteComprasPDF,
  generarReporteProductosPDF,
  obtenerReporteVentasJSON,
  obtenerReporteComprasJSON,
  obtenerReporteProductosJSON,
  generarReporteVentasHoy,
  generarReporteVentasMes,
  generarReporteVentasAño,
  generarReporteComprasHoy,
  generarReporteComprasMes,
  generarReporteComprasAño,
  type ReporteVentasParams,
  type ReporteComprasParams,
  type ReporteProductosParams
} from '../../services/reportesService';

// Tipos
import { Producto } from '../../types/producto';
import { CategoriaNested } from '../../types/categoria';
import { IUsuarioReadAudit } from '../../types/usuario';
import { Proveedor } from '../../types/proveedor';
import { Marca } from '../../types/marca';
import { 
  TipoReporte, 
  PeriodoTipo, 
  ReporteVentasResponse, 
  ReporteComprasResponse,
  ReporteProductosResponse 
} from '../../types/reportes';
import { EstadoEnum } from '../../types/enums';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text } = Typography;

const ReportesPage: React.FC = () => {
  // Hook de tema
  const { theme } = useTheme();
  
  // Estilos dinámicos basados en el tema
  const themeStyles = useMemo(() => ({
    container: `bg-gray-50 dark:bg-gray-900 p-6 min-h-screen`,
    title: `text-gray-800 dark:text-gray-100 mb-6`,
    card: {
      style: {
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
        color: theme === 'dark' ? '#f9fafb' : '#111827'
      }
    },
    text: `text-gray-800 dark:text-gray-200`,
    secondaryText: `text-gray-600 dark:text-gray-400`,
    loading: `flex justify-center items-center min-h-[400px] bg-gray-50 dark:bg-gray-900`
  }), [theme]);
  
  // Estados generales
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('ventas');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Estados para datos de catálogos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaNested[]>([]);
  const [empleados, setEmpleados] = useState<IUsuarioReadAudit[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  
  // Estados para filtros de ventas
  const [fechasVentas, setFechasVentas] = useState<RangePickerProps['value']>(null);
  const [periodoVentas, setPeriodoVentas] = useState<PeriodoTipo>('personalizado');
  const [productosVentas, setProductosVentas] = useState<number[]>([]);
  const [categoriasVentas, setCategoriasVentas] = useState<number[]>([]);
  const [empleadosVentas, setEmpleadosVentas] = useState<number[]>([]);
  
  // Estados para filtros de compras
  const [fechasCompras, setFechasCompras] = useState<RangePickerProps['value']>(null);
  const [periodoCompras, setPeriodoCompras] = useState<PeriodoTipo>('personalizado');
  const [proveedoresCompras, setProveedoresCompras] = useState<number[]>([]);
  const [productosCompras, setProductosCompras] = useState<number[]>([]);
  const [categoriasCompras, setCategoriasCompras] = useState<number[]>([]);
  const [empleadosCompras, setEmpleadosCompras] = useState<number[]>([]);
  
  // Estados para filtros de productos
  const [categoriasProductos, setCategoriasProductos] = useState<number[]>([]);
  const [marcasProductos, setMarcasProductos] = useState<number[]>([]);
  const [stockMinimo, setStockMinimo] = useState<boolean>(false);
  const [sinStock, setSinStock] = useState<boolean>(false);
  
  // Estados para datos de reportes
  const [datosVentas, setDatosVentas] = useState<ReporteVentasResponse | null>(null);
  const [datosCompras, setDatosCompras] = useState<ReporteComprasResponse | null>(null);
  const [datosProductos, setDatosProductos] = useState<ReporteProductosResponse | null>(null);

  // Cargar datos para los filtros
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        const [productosRes, categoriasRes, usuariosRes, proveedoresRes, marcasRes] = await Promise.all([
          getProductos({ limit: 1000 }),
          getCategorias({ limit: 1000 }),
          getUsers({ limit: 1000 }),
          getProveedores({ limit: 1000, estado: EstadoEnum.Activo }),
          getMarcas({ limit: 1000 }),
        ]);
        
        setProductos(productosRes.items || []);
        setCategorias(categoriasRes.items || []);
        setEmpleados(usuariosRes.items || []);
        setProveedores(proveedoresRes.items || []);
        setMarcas(marcasRes || []);
        
      } catch (error) {
        console.error("Error al cargar datos para filtros:", error);
        notification.error({ 
          message: 'Error al Cargar Datos', 
          description: 'No se pudieron obtener los datos para los filtros.' 
        });
      } finally {
        setLoadingData(false);
      }
    };
    cargarDatos();
  }, []);

  // Funciones para generar reportes rápidos
  const handleReporteRapido = async (tipo: TipoReporte, periodo: 'dia' | 'mes' | 'año') => {
    setLoading(true);
    try {
      if (tipo === 'ventas') {
        switch (periodo) {
          case 'dia': await generarReporteVentasHoy(); break;
          case 'mes': await generarReporteVentasMes(); break;
          case 'año': await generarReporteVentasAño(); break;
        }
      } else if (tipo === 'compras') {
        switch (periodo) {
          case 'dia': await generarReporteComprasHoy(); break;
          case 'mes': await generarReporteComprasMes(); break;
          case 'año': await generarReporteComprasAño(); break;
        }
      }
    } catch (error) {
      console.error("Error en reporte rápido:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para generar reporte personalizado
  const handleGenerarReportePersonalizado = async (formato: 'pdf' | 'json' = 'pdf') => {
    setLoading(true);
    try {
      if (tipoReporte === 'ventas') {
        const params: ReporteVentasParams = {
          fecha_desde: fechasVentas?.[0]?.format('YYYY-MM-DD'),
          fecha_hasta: fechasVentas?.[1]?.format('YYYY-MM-DD'),
          periodo_tipo: periodoVentas !== 'personalizado' ? periodoVentas : undefined,
          producto_ids: productosVentas.length > 0 ? productosVentas : undefined,
          categoria_ids: categoriasVentas.length > 0 ? categoriasVentas : undefined,
          empleado_ids: empleadosVentas.length > 0 ? empleadosVentas : undefined,
        };
        
        if (formato === 'pdf') {
          await generarReporteVentasPDF(params);
        } else {
          const datos = await obtenerReporteVentasJSON(params);
          setDatosVentas(datos);
        }
      } else if (tipoReporte === 'compras') {
        const params: ReporteComprasParams = {
          fecha_desde: fechasCompras?.[0]?.format('YYYY-MM-DD'),
          fecha_hasta: fechasCompras?.[1]?.format('YYYY-MM-DD'),
          periodo_tipo: periodoCompras !== 'personalizado' ? periodoCompras : undefined,
          proveedor_ids: proveedoresCompras.length > 0 ? proveedoresCompras : undefined,
          producto_ids: productosCompras.length > 0 ? productosCompras : undefined,
          categoria_ids: categoriasCompras.length > 0 ? categoriasCompras : undefined,
          empleado_ids: empleadosCompras.length > 0 ? empleadosCompras : undefined,
        };
        
        if (formato === 'pdf') {
          await generarReporteComprasPDF(params);
        } else {
          const datos = await obtenerReporteComprasJSON(params);
          setDatosCompras(datos);
        }
      } else if (tipoReporte === 'productos') {
        const params: ReporteProductosParams = {
          categoria_ids: categoriasProductos.length > 0 ? categoriasProductos : undefined,
          marca_ids: marcasProductos.length > 0 ? marcasProductos : undefined,
          stock_minimo: stockMinimo || undefined,
          sin_stock: sinStock || undefined,
        };
        
        if (formato === 'pdf') {
          await generarReporteProductosPDF(params);
        } else {
          const datos = await obtenerReporteProductosJSON(params);
          setDatosProductos(datos);
        }
      }
    } catch (error) {
      console.error("Error en reporte personalizado:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    if (tipoReporte === 'ventas') {
      setFechasVentas(null);
      setPeriodoVentas('personalizado');
      setProductosVentas([]);
      setCategoriasVentas([]);
      setEmpleadosVentas([]);
      setDatosVentas(null);
    } else if (tipoReporte === 'compras') {
      setFechasCompras(null);
      setPeriodoCompras('personalizado');
      setProveedoresCompras([]);
      setProductosCompras([]);
      setCategoriasCompras([]);
      setEmpleadosCompras([]);
      setDatosCompras(null);
    } else {
      setCategoriasProductos([]);
      setMarcasProductos([]);
      setStockMinimo(false);
      setSinStock(false);
      setDatosProductos(null);
    }
  };


  // Renderizar botones de reportes rápidos
  const renderReportesRapidos = () => (
    <Card 
      title={<span className={themeStyles.text}>Reportes Rápidos</span>} 
      size="small"
      style={themeStyles.card.style}
    >
      <Space wrap>
        <Tooltip title={`Reporte de ${tipoReporte} del día actual`}>
          <Button 
            onClick={() => handleReporteRapido(tipoReporte, 'dia')}
            disabled={loading}
            variant="secondary"
            size="sm"
          >
            📅 Hoy
          </Button>
        </Tooltip>
        <Tooltip title={`Reporte de ${tipoReporte} del mes actual`}>
          <Button 
            onClick={() => handleReporteRapido(tipoReporte, 'mes')}
            disabled={loading}
            variant="secondary"
            size="sm"
          >
            📅 Este Mes
          </Button>
        </Tooltip>
        <Tooltip title={`Reporte de ${tipoReporte} del año actual`}>
          <Button 
            onClick={() => handleReporteRapido(tipoReporte, 'año')}
            disabled={loading}
            variant="secondary"
            size="sm"
          >
            📅 Este Año
          </Button>
        </Tooltip>
      </Space>
    </Card>
  );

  // Renderizar filtros de ventas
  const renderFiltrosVentas = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Row gutter={16}>
        <Col span={12}>
          <Text strong className={themeStyles.text}>Período:</Text>
          <Radio.Group 
            value={periodoVentas} 
            onChange={(e) => setPeriodoVentas(e.target.value)}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Radio.Button value="dia">Día</Radio.Button>
            <Radio.Button value="mes">Mes</Radio.Button>
            <Radio.Button value="año">Año</Radio.Button>
            <Radio.Button value="personalizado">Personalizado</Radio.Button>
          </Radio.Group>
        </Col>
        <Col span={12}>
          {periodoVentas === 'personalizado' && (
            <>
              <Text strong className={themeStyles.text}>Rango de fechas:</Text>
              <DatePicker.RangePicker 
                style={{ width: '100%', marginTop: 8 }} 
                onChange={setFechasVentas}
                value={fechasVentas}
              />
            </>
          )}
        </Col>
      </Row>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por productos:</label>
        <AntdSelect
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Seleccione productos"
          onChange={setProductosVentas}
          value={productosVentas}
          options={productos.map(p => ({ label: p.nombre, value: p.producto_id }))}
          filterOption={(input: string, option?: DefaultOptionType) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por categorías:</label>
        <AntdSelect
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Seleccione categorías"
          onChange={setCategoriasVentas}
          value={categoriasVentas}
          options={categorias.map(c => ({ label: c.nombre_categoria, value: c.categoria_id }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por empleados:</label>
        <AntdSelect
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Seleccione empleados"
          onChange={setEmpleadosVentas}
          value={empleadosVentas}
          options={empleados.map(e => ({ label: e.nombre_usuario, value: e.usuario_id }))}
        />
      </div>
    </Space>
  );

  // Renderizar filtros de compras
  const renderFiltrosCompras = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Row gutter={16}>
        <Col span={12}>
          <Text strong className={themeStyles.text}>Período:</Text>
          <Radio.Group 
            value={periodoCompras} 
            onChange={(e) => setPeriodoCompras(e.target.value)}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Radio.Button value="dia">Día</Radio.Button>
            <Radio.Button value="mes">Mes</Radio.Button>
            <Radio.Button value="año">Año</Radio.Button>
            <Radio.Button value="personalizado">Personalizado</Radio.Button>
          </Radio.Group>
        </Col>
        <Col span={12}>
          {periodoCompras === 'personalizado' && (
            <>
              <Text strong className={themeStyles.text}>Rango de fechas:</Text>
              <DatePicker.RangePicker 
                style={{ width: '100%', marginTop: 8 }} 
                onChange={setFechasCompras}
                value={fechasCompras}
              />
            </>
          )}
        </Col>
      </Row>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por proveedores:</label>
        <AntdSelect
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Seleccione proveedores"
          onChange={setProveedoresCompras}
          value={proveedoresCompras}
          options={proveedores.map(p => {
            let label = `Proveedor ${p.proveedor_id}`;
            if (p.persona?.nombre) {
              label = `${p.persona.nombre} (Persona)`;
            } else if (p.empresa?.razon_social) {
              label = `${p.empresa.razon_social} (Empresa)`;
            } else if (p.empresa?.nombre_contacto) {
              label = `${p.empresa.nombre_contacto} (Empresa)`;
            }
            return { label, value: p.proveedor_id };
          })}
          filterOption={(input: string, option?: DefaultOptionType) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por productos:</label>
        <AntdSelect
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Seleccione productos"
          onChange={setProductosCompras}
          value={productosCompras}
          options={productos.map(p => ({ label: p.nombre, value: p.producto_id }))}
          filterOption={(input: string, option?: DefaultOptionType) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por categorías:</label>
        <AntdSelect
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Seleccione categorías"
          onChange={setCategoriasCompras}
          value={categoriasCompras}
          options={categorias.map(c => ({ label: c.nombre_categoria, value: c.categoria_id }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por empleados:</label>
        <AntdSelect
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Seleccione empleados"
          onChange={setEmpleadosCompras}
          value={empleadosCompras}
          options={empleados.map(e => ({ label: e.nombre_usuario, value: e.usuario_id }))}
        />
      </div>
    </Space>
  );

  // Renderizar filtros de productos
  const renderFiltrosProductos = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por categorías:</label>
        <AntdSelect
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Seleccione categorías"
          onChange={setCategoriasProductos}
          value={categoriasProductos}
          options={categorias.map(c => ({ label: c.nombre_categoria, value: c.categoria_id }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por marcas:</label>
        <AntdSelect
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Seleccione marcas"
          onChange={setMarcasProductos}
          value={marcasProductos}
          options={marcas.map(m => ({ label: m.nombre_marca, value: m.marca_id }))}
          filterOption={(input: string, option?: DefaultOptionType) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <Button 
            variant={stockMinimo ? 'primary' : 'secondary'}
            onClick={() => setStockMinimo(!stockMinimo)}
            className="w-full"
          >
            Solo Stock Bajo
          </Button>
        </Col>
        <Col span={12}>
          <Button 
            variant={sinStock ? 'primary' : 'secondary'}
            onClick={() => setSinStock(!sinStock)}
            className="w-full"
          >
            Sin Stock
          </Button>
        </Col>
      </Row>
    </Space>
  );

  // Renderizar resumen de datos
  const renderResumen = () => {
    if (tipoReporte === 'ventas' && datosVentas) {
      return (
        <Card 
          title={<span className={themeStyles.text}>Resumen de Ventas</span>} 
          size="small"
          style={themeStyles.card.style}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Statistic 
                title={<span className={themeStyles.secondaryText}>Total Ventas</span>}
                value={datosVentas.resumen.total_ventas} 
                prefix="S/ " 
                precision={2}
                valueStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title={<span className={themeStyles.secondaryText}>Cantidad de Ventas</span>}
                value={datosVentas.resumen.cantidad_ventas}
                valueStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title={<span className={themeStyles.secondaryText}>Promedio por Venta</span>}
                value={datosVentas.resumen.promedio_venta} 
                prefix="S/ " 
                precision={2}
                valueStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Text strong className={themeStyles.text}>Producto más vendido: </Text>
              <Tag color="blue">{datosVentas.resumen.producto_mas_vendido || 'N/A'}</Tag>
            </Col>
            <Col span={12}>
              <Text strong className={themeStyles.text}>Categoría más vendida: </Text>
              <Tag color="green">{datosVentas.resumen.categoria_mas_vendida || 'N/A'}</Tag>
            </Col>
          </Row>
        </Card>
      );
    }

    if (tipoReporte === 'compras' && datosCompras) {
      return (
        <Card 
          title={<span className={themeStyles.text}>Resumen de Compras</span>} 
          size="small"
          style={themeStyles.card.style}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Statistic 
                title={<span className={themeStyles.secondaryText}>Total Compras</span>}
                value={datosCompras.resumen.total_compras} 
                prefix="S/ " 
                precision={2}
                valueStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title={<span className={themeStyles.secondaryText}>Cantidad de Compras</span>}
                value={datosCompras.resumen.cantidad_compras}
                valueStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title={<span className={themeStyles.secondaryText}>Promedio por Compra</span>}
                value={datosCompras.resumen.promedio_compra} 
                prefix="S/ " 
                precision={2}
                valueStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Text strong className={themeStyles.text}>Proveedor más frecuente: </Text>
              <Tag color="blue">{datosCompras.resumen.proveedor_mas_frecuente || 'N/A'}</Tag>
            </Col>
            <Col span={12}>
              <Text strong className={themeStyles.text}>Categoría más comprada: </Text>
              <Tag color="green">{datosCompras.resumen.categoria_mas_comprada || 'N/A'}</Tag>
            </Col>
          </Row>
        </Card>
      );
    }

    if (tipoReporte === 'productos' && datosProductos) {
      return (
        <Card 
          title={<span className={themeStyles.text}>Resumen de Inventario</span>} 
          size="small"
          style={themeStyles.card.style}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Statistic 
                title={<span className={themeStyles.secondaryText}>Total Productos</span>}
                value={datosProductos.resumen.total_productos}
                valueStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title={<span className={themeStyles.secondaryText}>Con Stock</span>}
                value={datosProductos.resumen.productos_con_stock}
                valueStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title={<span className={themeStyles.secondaryText}>Sin Stock</span>}
                value={datosProductos.resumen.productos_sin_stock}
                valueStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title={<span className={themeStyles.secondaryText}>Valor Inventario</span>}
                value={datosProductos.resumen.valor_inventario} 
                prefix="S/ " 
                precision={2}
                valueStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
              />
            </Col>
          </Row>
        </Card>
      );
    }

    return null;
  };

  if (loadingData) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: theme === 'dark' ? {
            colorBgContainer: '#374151', // gray-700
            colorBgElevated: '#374151', // gray-700  
            colorBorder: '#6b7280', // gray-500
            colorText: '#f9fafb', // gray-50
            colorTextPlaceholder: '#9ca3af', // gray-400
            colorPrimary: '#3b82f6', // blue-500
            colorBgBase: '#1f2937', // gray-800
          } : {},
        }}
      >
        <div className={themeStyles.loading}>
          <Space direction="vertical" align="center">
            <Spin size="large" />
            <Text className={themeStyles.text}>Cargando datos para reportes...</Text>
          </Space>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: theme === 'dark' ? {
          colorBgContainer: '#374151', // gray-700
          colorBgElevated: '#374151', // gray-700  
          colorBorder: '#6b7280', // gray-500
          colorText: '#f9fafb', // gray-50
          colorTextPlaceholder: '#9ca3af', // gray-400
          colorPrimary: '#3b82f6', // blue-500
          colorBgBase: '#1f2937', // gray-800
        } : {},
      }}
    >
      <div className={themeStyles.container}>
        <Title level={2} className={themeStyles.title}>
          <FileExcelOutlined />  Reportes del sistema
        </Title>
      
      <Row gutter={16}>
        <Col span={18}>
          <Tabs 
            activeKey={tipoReporte} 
            onChange={(key) => setTipoReporte(key as TipoReporte)}
            type="card"
            items={[
              {
                key: 'ventas',
                label: <span><ShoppingCartOutlined />Reportes de Ventas</span>,
                children: (
                  <Card 
                    title={<span className={themeStyles.text}>Filtros de Ventas</span>} 
                    extra={renderReportesRapidos()}
                    style={themeStyles.card.style}
                  >
                    {renderFiltrosVentas()}
                    
                    <Divider />
                    
                    <Space>
                      <Button
                        variant="primary"
                        onClick={() => handleGenerarReportePersonalizado('pdf')}
                        disabled={loading}
                      >
                        📄 Generar PDF
                      </Button>
                      <Button
                        variant="info"
                        onClick={() => handleGenerarReportePersonalizado('json')}
                        disabled={loading}
                      >
                        📊 Ver Datos
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={limpiarFiltros}
                      >
                        🗑️ Limpiar Filtros
                      </Button>
                    </Space>
                  </Card>
                )
              },
              {
                key: 'compras',
                label: <span><DollarOutlined />Reportes de Compras</span>,
                children: (
                  <Card 
                    title={<span className={themeStyles.text}>Filtros de Compras</span>} 
                    extra={renderReportesRapidos()}
                    style={themeStyles.card.style}
                  >
                    {renderFiltrosCompras()}
                    
                    <Divider />
                    
                    <Space>
                      <Button
                        variant="primary"
                        onClick={() => handleGenerarReportePersonalizado('pdf')}
                        disabled={loading}
                      >
                        📄 Generar PDF
                      </Button>
                      <Button
                        variant="info"
                        onClick={() => handleGenerarReportePersonalizado('json')}
                        disabled={loading}
                      >
                        📊 Ver Datos
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={limpiarFiltros}
                      >
                        🗑️ Limpiar Filtros
                      </Button>
                    </Space>
                  </Card>
                )
              },
              {
                key: 'productos',
                label: <span><DatabaseOutlined />Reporte de Inventario</span>,
                children: (
                  <Card 
                    title={<span className={themeStyles.text}>Filtros de Inventario</span>}
                    style={themeStyles.card.style}
                  >
                    {renderFiltrosProductos()}
                    
                    <Divider />
                    
                    <Space>
                      <Button
                        variant="primary"
                        onClick={() => handleGenerarReportePersonalizado('pdf')}
                        disabled={loading}
                      >
                        📄 Generar PDF
                      </Button>
                      <Button
                        variant="info"
                        onClick={() => handleGenerarReportePersonalizado('json')}
                        disabled={loading}
                      >
                        📊 Ver Datos
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={limpiarFiltros}
                      >
                        🗑️ Limpiar Filtros
                      </Button>
                    </Space>
                  </Card>
                )
              }
            ]}
          />
        </Col>
        
        <Col span={6}>
          {renderResumen()}
        </Col>
      </Row>
      </div>
    </ConfigProvider>
  );
};

export default ReportesPage;