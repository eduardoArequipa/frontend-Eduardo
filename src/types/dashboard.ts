// src/types/dashboard.ts

export interface KpiCard {
  title: string;
  value: string;
  icon?: string; // Optional icon string, will be mapped to actual icon components
}

export interface SalesOverTimePoint {
  dia: string; // The date will come as a string (e.g., "YYYY-MM-DD")
  total_ventas: number;
}

export interface TopProduct {
  producto: string;
  ingresos_totales: number;
}

export interface InventoryByCategory {
  categoria: string;
  valor_inventario: number;
}

// --- New Interfaces for Additional Charts ---

export interface SalesByCategory {
  categoria: string;
  ingresos: number;
}

export interface PaymentMethodDistribution {
  metodo: string;
  total_ventas: number;
}

export interface TransactionsOverTimePoint {
  dia: string; // Date as string
  num_transacciones: number;
}

export interface ProductsSoldOverTimePoint {
  dia: string; // Date as string
  total_productos_vendidos: number;
}

// --- Main Dashboard Data Interface ---

export interface DashboardData {
  kpi_cards: KpiCard[];
  sales_over_time: SalesOverTimePoint[];
  top_products: TopProduct[];
  inventory_by_category: InventoryByCategory[];
  sales_by_category: SalesByCategory[]; // Data for sales by category pie/bar chart
  payment_methods: PaymentMethodDistribution[]; // Data for payment methods pie chart
  transactions_over_time: TransactionsOverTimePoint[]; // Data for daily transactions chart
  products_sold_over_time: ProductsSoldOverTimePoint[]; // Data for daily products sold chart
}