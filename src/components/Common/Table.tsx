// src/components/Common/Table.tsx
import React from 'react';

// Define una estructura básica para las columnas
interface Column {
    Header: string;
    accessor?: string; // Hacer el accessor opcional
    Cell?: ({ row }: { row: { original: any } }) => React.ReactNode; // row.original contiene los datos de la fila
}

interface TableProps {
    columns: Column[];
    data: any[]; // Puede ser Persona[], Rol[], Usuario[], etc.
}

const Table: React.FC<TableProps> = ({ columns, data }) => {
    if (!data || data.length === 0) {
        // Este caso ya se maneja en PersonasListPage, pero puede ser un fallback
        return null; // O <p>No hay datos para mostrar.</p>;
    }

    return (
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        {columns.map((column, index) => (
                            <th key={index} scope="col" className="px-6 py-3">
                                {column.Header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            {columns.map((column, colIndex) => (
                                <td key={colIndex} className="px-8 py-4 text-gray-900 dark:text-white">
                                    {/* Si hay un renderizador Cell custom, úsalo */}
                                    {column.Cell ? column.Cell({ row: { original: row } }) : (
                                        // Si no, usa el accessor para mostrar el valor, solo si el accessor existe
                                        column.accessor && (row as any)[column.accessor] !== undefined && (row as any)[column.accessor] !== null
                                            ? String((row as any)[column.accessor!])
                                            : ''
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
