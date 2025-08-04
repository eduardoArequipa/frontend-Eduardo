import axiosInstance from '../api/axiosInstance'; 
import { DashboardData } from '../types/dashboard';

export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await axiosInstance.get<DashboardData>('/dashboard/');
  return response.data;
};