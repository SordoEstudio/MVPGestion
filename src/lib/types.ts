
export interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    category_id: number;
    is_weighable: boolean;
    created_at?: string;
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
