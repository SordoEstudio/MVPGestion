import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { ProductWithCategory } from '@/lib/types';

const product: ProductWithCategory = {
  id: 1,
  name: 'Test Product',
  price: 100,
  stock: 10,
  category_id: 1,
  unit_id: null,
  categories: { name: 'Cat', color: 'bg-blue-100' },
};

describe('ProductCard', () => {
  it('renderiza nombre y precio del producto', () => {
    render(<ProductCard product={product} viewMode="CARDS" />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('renderiza categoría cuando existe', () => {
    render(<ProductCard product={product} viewMode="LIST" />);
    expect(screen.getByText('Cat')).toBeInTheDocument();
  });
});
