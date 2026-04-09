import React from 'react';
import { Loader2 } from 'lucide-react';

interface TableColumn<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

export function Table<T>({ data, columns, keyExtractor, isLoading, emptyMessage = 'No data available', emptyIcon }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            // Skeleton rows
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  {emptyIcon || (
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                  <p className="text-sm font-medium">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-indigo-50/40 transition-colors duration-100 group"
              >
                {columns.map((col, idx) => (
                  <td key={idx} className={`px-5 py-3.5 text-slate-700 whitespace-nowrap ${col.className || ''}`}>
                    {col.accessor(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
