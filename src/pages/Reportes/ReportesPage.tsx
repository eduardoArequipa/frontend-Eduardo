import React, { useState, useEffect } from 'react';
import { Button, DatePicker, Select as AntdSelect, Spin, notification } from 'antd';
import Card from 'antd/es/card';
import Space from 'antd/es/space';
import Typography from 'antd/es/typography';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { DefaultOptionType } from 'antd/es/select';
import { DownloadOutlined } from '@ant-design/icons';

// Importaciones de servicios
import { getProductos } from '../../services/productoService';
import { getCategorias } from '../../services/categoriaService';
import { getUsers } from '../../services/userService';
import { generarReporteVentasPDF } from '../../services/reportesService';

// Tipos de Ant Design
// RangePickerProps is now imported from 'antd/es/date-picker'

// Tipos de datos
interface Producto {
  producto_id: number;
  nombre: string;
}

interface Categoria {
  categoria_id: number;
  nombre_categoria: string;
}

interface Usuario {
  usuario_id: number;
  nombre_usuario: string;
}

const { Title, Text } = Typography;

const ReportesPage: React.FC = () => {
  // Estados para los filtros
  const [fechas, setFechas] = useState<RangePickerProps['value']>(null);
  const [productoIds, setProductoIds] = useState<number[]>([]);
  const [categoriaIds, setCategoriaIds] = useState<number[]>([]);
  const [empleadoIds, setEmpleadoIds] = useState<number[]>([]);

  // Estados para cargar los datos de los selects
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [empleados, setEmpleados] = useState<Usuario[]>([]);

  // Estado de carga
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Cargar datos para los filtros
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        const [productosRes, categoriasRes, usuariosRes] = await Promise.all([
          getProductos(),
          getCategorias(),
          getUsers(),
        ]);
        setProductos(productosRes || []);
        setCategorias(categoriasRes || []);
        setEmpleados(usuariosRes || []);
      } catch (error) {
        console.error("Error al cargar datos para filtros:", error);
        notification.error({ message: 'Error al Cargar Datos', description: 'No se pudieron obtener los datos para los filtros.' });
      } finally {
        setLoadingData(false);
      }
    };
    cargarDatos();
  }, []);

  const handleGenerarReporte = async () => {
    setLoading(true);
    try {
      const params = {
        fecha_desde: fechas ? fechas[0]?.format('YYYY-MM-DD') : undefined,
        fecha_hasta: fechas ? fechas[1]?.format('YYYY-MM-DD') : undefined,
        producto_ids: productoIds.length > 0 ? productoIds : undefined,
        categoria_ids: categoriaIds.length > 0 ? categoriaIds : undefined,
        empleado_ids: empleadoIds.length > 0 ? empleadoIds : undefined,
      };
      await generarReporteVentasPDF(params);
    } catch (error) {
      // La notificación de error ya se maneja en el servicio
      console.error("Error en componente al generar el reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text>Cargando filtros...</Text>
        </Space>
      </div>
    );
  }

  return (
    <Card>
      <Title level={2}>Generador de Reportes de Ventas</Title>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <DatePicker.RangePicker style={{ width: '100%' }} onChange={setFechas} />
        
        <AntdSelect
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Filtrar por productos"
          onChange={setProductoIds}
          options={productos.map(p => ({ label: p.nombre, value: p.producto_id }))}
          filterOption={(input: string, option?: DefaultOptionType) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        />

        <AntdSelect
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Filtrar por categorías"
          onChange={setCategoriaIds}
          options={categorias.map(c => ({ label: c.nombre_categoria, value: c.categoria_id }))}
        />

        <AntdSelect
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Filtrar por empleados"
          onChange={setEmpleadoIds}
          options={empleados.map(e => ({ label: e.nombre_usuario, value: e.usuario_id }))}
        />

        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleGenerarReporte}
            loading={loading}
          >
            Generar PDF
          </Button>
        </div>
      </Space>
    </Card>
  );
};

export default ReportesPage;