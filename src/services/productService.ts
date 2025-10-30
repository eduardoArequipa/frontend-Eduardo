import axiosInstance from '../api/axiosInstance';
import { ProductoNested } from '../types/producto';

// Define un tipo para las opciones que react-select usa
export interface ProductOptionType {
  value: number;
  label: string;
  stock?: number; // Opcional: para mostrar el stock en el desplegable
}

export const searchProductSuggestions = async (
  inputValue: string
): Promise<ProductOptionType[]> => {
  if (!inputValue) {
    return [];
  }
  try {
    const response = await axiosInstance.get<ProductoNested[]>('/productos/search/suggestions', {
      params: { q: inputValue },
    });
    // Transforma la respuesta de la API al formato que react-select espera
    return response.data.map((product) => ({
      value: product.producto_id,
      label: `${product.nombre} (${product.codigo}) - Stock: ${product.stock}`,
      stock: parseFloat(product.stock),
    }));
  } catch (error) {
    console.error('Error fetching product suggestions:', error);
    return []; // Devuelve un array vacío en caso de error
  }
};
