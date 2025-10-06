import axiosInstance from '../api/axiosInstance';
import { DashboardData, DashboardFilters, DrillDownData, ProductDetail } from '../types/dashboard';

export const getDashboardData = async (filters?: DashboardFilters): Promise<DashboardData> => {
  const params = new URLSearchParams();

  if (filters?.startDate) params.append('start_date', filters.startDate);
  if (filters?.endDate) params.append('end_date', filters.endDate);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.supplier) params.append('supplier', filters.supplier);
  if (filters?.compareWithPrevious) params.append('compare_with_previous', 'true');

  const url = params.toString() ? `/dashboard/?${params.toString()}` : '/dashboard/';
  const response = await axiosInstance.get<DashboardData>(url);
  return response.data;
};

export const getDrillDownData = async (period: string, type: 'sales' | 'products' = 'sales'): Promise<DrillDownData> => {
  const response = await axiosInstance.get<DrillDownData>(`/dashboard/drill-down/?period=${period}&type=${type}`);
  return response.data;
};

export const getProductDetail = async (productName: string): Promise<ProductDetail> => {
  const response = await axiosInstance.get<ProductDetail>(`/dashboard/product/${encodeURIComponent(productName)}/`);
  return response.data;
};