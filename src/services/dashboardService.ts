import axiosInstance from '../api/axiosInstance'; // Asumiendo que tienes esto configurado
import { DashboardData } from '../types/dashboard';

export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await axiosInstance.get<DashboardData>('/dashboard/');
  return response.data;
};