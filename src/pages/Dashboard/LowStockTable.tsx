
import { LowStockProduct } from '../../types/dashboard';
import { Link } from 'react-router-dom';

interface LowStockTableProps {
  products: LowStockProduct[];
}

export const LowStockTable = ({ products }: LowStockTableProps) => {
  if (products.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">No hay productos con bajo stock.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Producto</th>
            <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300">Stock Actual</th>
            <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300">Stock Mínimo</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.producto_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200">
                <Link to={`/producto/edit/${product.producto_id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  {product.nombre}
                </Link>
              </td>
              <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-center text-red-500 font-bold">{product.stock}</td>
              <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-center text-sm text-gray-800 dark:text-gray-200">{product.stock_minimo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
