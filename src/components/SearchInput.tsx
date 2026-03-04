'use client';

import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  inputClassName?: string;
  'aria-label'?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  onKeyDown,
  className = '',
  inputClassName = '',
  'aria-label': ariaLabel = 'Buscar',
}: SearchInputProps) {
  return (
    <div className={`relative group ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" aria-hidden />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`w-full pl-12 pr-10 py-3 bg-white border-2 border-gray-200 focus:border-blue-500 rounded-2xl shadow-sm outline-none font-medium transition-all text-gray-900 placeholder-gray-500 ${inputClassName}`}
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Limpiar búsqueda"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
