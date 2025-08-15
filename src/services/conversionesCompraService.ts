
import axiosInstance from '../api/axiosInstance';
import { ConversionCompra, CreateConversionCompraDto, UpdateConversionCompraDto } from '../types/conversionesCompra';

export const getConversionesCompra = async (): Promise<ConversionCompra[]> => {
  const response = await axiosInstance.get('/conversiones-compra/');
  return response.data;
};

export const createConversionCompra = async (conversionData: CreateConversionCompraDto): Promise<ConversionCompra> => {
  const response = await axiosInstance.post('/conversiones-compra/', conversionData);
  return response.data;
};

export const updateConversionCompra = async (id: number, conversionData: UpdateConversionCompraDto): Promise<ConversionCompra> => {
  const response = await axiosInstance.put(`/conversiones-compra/${id}`, conversionData);
  return response.data;
};

export const deleteConversionCompra = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/conversiones-compra/${id}`);
};
