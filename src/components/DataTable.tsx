'use client';

import { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
  sortKey?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  orderBy,
  orderDir = 'desc',
  onSort,
  emptyMessage = 'Sin datos',
  className = '',
}: DataTableProps<T>) {
  const alignClass = (align?: string) => {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  };

  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-600 font-bold uppercase text-left">
            {columns.map((col) => {
              const sortable = onSort != null && (col.sortKey ?? col.key);
              return (
                <th
                  key={col.key}
                  className={`p-3 ${alignClass(col.align)} ${sortable ? 'cursor-pointer hover:text-gray-900' : ''}`}
                  onClick={
                    sortable
                      ? () => onSort(col.sortKey ?? col.key)
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortable && orderBy === (col.sortKey ?? col.key) && (
                      <span className="text-gray-400">{orderDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="border-t border-gray-100 hover:bg-gray-50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`p-3 text-gray-900 ${alignClass(col.align)}`}
                  >
                    {col.render != null
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
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
