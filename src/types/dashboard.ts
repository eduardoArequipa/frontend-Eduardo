export interface KpiCard {
  title: string;
  value: string;
  icon?: string;
}

export interface SalesDataPoint {
  period: string; // Can be '2023-10-27', '2023-10', or '2023'
  total: number;
}

export interface TopSellingProduct {
  producto: string;
  ingresos_totales: number;
}

export interface InventoryByCategory {
  categoria: string;
  valor_inventario: number;
}

export interface TopSupplier {
  proveedor: string;
  total_compras: number;
}

export interface TopPurchasedProduct {
  producto: string;
  cantidad_comprada: number;
}

export interface LowStockProduct {
  producto_id: number;
  nombre: string;
  stock: number;
  stock_minimo?: number;
}

export interface PurchaseStats {
  top_suppliers: TopSupplier[];
  top_purchased_products: TopPurchasedProduct[];
}

export interface DashboardData {
  kpi_cards: KpiCard[];
  sales_daily: SalesDataPoint[];
  sales_monthly: SalesDataPoint[];
  sales_yearly: SalesDataPoint[];
  top_selling_products: TopSellingProduct[];
  inventory_by_category: InventoryByCategory[];
  purchase_stats: PurchaseStats;
  low_stock_products: LowStockProduct[];
  total_inventory_value: number;
}
