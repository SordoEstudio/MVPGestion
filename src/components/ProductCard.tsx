'use client';

import type { ProductWithCategory } from '@/lib/types';

interface ProductCardProps {
  product: ProductWithCategory;
  viewMode: 'CARDS' | 'LIST' | 'GRID';
  onClick?: () => void;
  /** Contenido extra (ej. botones editar/eliminar) */
  actions?: React.ReactNode;
  /** Mostrar fila de stock y precio (p. ej. en página Productos) */
  showStock?: boolean;
}

const isCards = (v: string) => v === 'CARDS' || v === 'GRID';

export function ProductCard({ product, viewMode, onClick, actions, showStock }: ProductCardProps) {
  const cardsView = isCards(viewMode);
  const content = (
    <>
      <div className={`shrink-0 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold transition-colors
        ${onClick ? 'group-hover:bg-blue-600 group-hover:text-white' : ''}
        ${cardsView ? 'h-9 w-9 mb-1.5 text-sm' : 'h-8 w-8 text-sm'}
        ${viewMode === 'GRID' ? 'h-10 w-10 mb-2 text-base' : ''}`}>
        {product.name.charAt(0)}
      </div>
      <div className="flex-1 overflow-hidden min-w-0">
        <div className={`font-bold text-gray-800 truncate ${viewMode === 'GRID' ? '' : 'text-sm'}`}>{product.name}</div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {product.categories && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${product.categories.color || 'bg-gray-100 text-gray-800'}`}>
              {product.categories.name}
            </span>
          )}
          {!showStock && (
            <span className="text-blue-600 font-black text-xs">{product.price === 0 ? 'M' : `$${product.price}`}</span>
          )}
          {product.unit_id != null && product.units && (
            <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-bold uppercase">{product.units.symbol}</span>
          )}
        </div>
        {showStock && (
          <div className={`flex justify-between items-center ${cardsView ? 'mt-3 pt-3 border-t border-gray-50' : 'mt-1'}`}>
            <span className="text-sm text-gray-500">Stock: {product.stock}</span>
            <span className="text-xl font-bold text-gray-800">${product.price.toLocaleString()}</span>
          </div>
        )}
      </div>
      {actions && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">{actions}</div>
      )}
    </>
  );

  const baseClass = `flex items-center bg-white rounded-xl shadow-sm border border-gray-100 transition-all text-left group
    ${cardsView ? 'flex-col justify-center p-3 text-center' : 'p-2 gap-2'}
    ${viewMode === 'GRID' ? 'rounded-2xl p-4' : ''}
    ${onClick ? 'hover:shadow hover:bg-blue-50/50 active:scale-[0.98] cursor-pointer' : ''} relative`;

  if (onClick) {
    return <button type="button" onClick={onClick} className={baseClass}>{content}</button>;
  }
  return <div className={baseClass}>{content}</div>;
}
