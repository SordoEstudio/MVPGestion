
export interface Unit {
    id: number;
    name: string;
    symbol: string;
    created_at?: string;
}

export interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    category_id: number;
    unit_id: number | null;
    created_at?: string;
}

/** Producto con relación de categoría (join desde Supabase) */
export interface ProductWithCategory extends Product {
    categories?: { name: string; color: string } | null;
    units?: { name: string; symbol: string } | null;
}

export interface Category {
    id: number;
    name: string;
    color: string;
}

export type PersonType = 'CLIENT' | 'PROVIDER';

export interface Person {
    id: number;
    name: string;
    phone?: string;
    type: PersonType;
    balance: number;
    created_at?: string;
}
