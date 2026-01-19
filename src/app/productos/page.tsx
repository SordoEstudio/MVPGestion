
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/lib/types';
import { Plus, Edit2, Trash2, Save, X, Search, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        category_id: 0,
        stock: 0,
        is_weighable: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
            supabase.from('products').select(`*, categories(name, color)`).order('name'),
            supabase.from('categories').select('*').order('name')
        ]);

        if (prodRes.data) setProducts(prodRes.data);
        if (catRes.data) setCategories(catRes.data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.category_id) {
            toast.error('Selecciona una categoría');
            return;
        }

        try {
            const payload = {
                name: formData.name,
                price: formData.price,
                category_id: formData.category_id,
                stock: formData.stock,
                is_weighable: formData.is_weighable
            };

            if (editingId) {
                // Update
                const { error } = await supabase
                    .from('products')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('products')
                    .insert([payload]);
                if (error) throw error;
            }

            fetchData();
            resetForm();

        } catch (error: any) {
            toast.error('Error al guardar: ' + error.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) toast.error('Error al eliminar: ' + error.message);
        else fetchData();
    };

    const startEdit = (product: Product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            price: product.price,
            category_id: product.category_id,
            stock: product.stock,
            is_weighable: product.is_weighable
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', price: 0, category_id: 0, stock: 0, is_weighable: false });
        setShowForm(false);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
            <header className="flex items-center justify-between mb-8 max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium">
                        &larr; Volver
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
                </div>
                <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-md transition-all active:scale-95">
                    <Plus className="w-5 h-5" /> Nuevo
                </button>
            </header>

            {/* SEARCH */}
            <div className="max-w-5xl mx-auto w-full mb-6 relative">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar producto..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* LIST */}
            <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-gray-500">Cargando...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">No hay productos.</div>
                ) : (
                    filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {(product as any).categories && (
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${(product as any).categories.color || 'bg-gray-100 text-gray-800'}`}>
                                                {(product as any).categories.name}
                                            </span>
                                        )}
                                        {product.is_weighable && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">Pesable (Kg)</span>}
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => startEdit(product)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-end">
                                <div className="text-sm text-gray-500">Stock: {product.stock}</div>
                                <div className="text-2xl font-bold text-gray-800">${product.price.toLocaleString()}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL FORM */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button onClick={resetForm}><X className="w-6 h-6 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={formData.category_id}
                                    onChange={e => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                                >
                                    <option value={0}>Seleccione...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="weighable"
                                    checked={formData.is_weighable}
                                    onChange={e => setFormData({ ...formData, is_weighable: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <label htmlFor="weighable" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Se vende por peso (Kg)
                                </label>
                            </div>

                            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg mt-4 flex justify-center items-center gap-2">
                                <Save className="w-5 h-5" /> Guardar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
