
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category, Unit, type ProductWithCategory } from '@/lib/types';
import { Plus, Edit2, Trash2, Save, X, Package, Grid, List } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';
import { ProductCard } from '@/components/ProductCard';
import { toast } from 'react-hot-toast';
import { useStore } from '@/contexts/StoreContext';

export default function ProductsPage() {
    const { storeId } = useStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>(() => {
        if (typeof window === 'undefined') return 'GRID';
        return localStorage.getItem('productos_view') === 'LIST' ? 'LIST' : 'GRID';
    });

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState<{ name?: string; category?: string; price?: string }>({});
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        category_id: 0,
        stock: 0,
        unit_id: null as number | null
    });

    const validateForm = (): boolean => {
        const err: typeof formErrors = {};
        if (!formData.name.trim()) err.name = 'El nombre es obligatorio';
        if (!formData.category_id) err.category = 'Selecciona una categoría';
        if (formData.price < 0) err.price = 'El precio no puede ser negativo';
        setFormErrors(err);
        return Object.keys(err).length === 0;
    };

    const isFormValid = formData.name.trim() !== '' && formData.category_id > 0 && formData.price >= 0;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [prodRes, catRes, unitsRes] = await Promise.all([
            supabase.from('products').select(`*, categories(name, color), units(name, symbol)`).order('name'),
            supabase.from('categories').select('*').order('name'),
            supabase.from('units').select('*').order('name')
        ]);

        if (prodRes.data) setProducts(prodRes.data);
        if (catRes.data) setCategories(catRes.data);
        if (unitsRes.data) setUnits(unitsRes.data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                price: formData.price,
                category_id: formData.category_id,
                stock: formData.stock,
                unit_id: formData.unit_id,
                store_id: storeId!
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
            toast.success(editingId ? 'Producto actualizado' : 'Producto creado');
        } catch (error: any) {
            toast.error('Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
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
            unit_id: product.unit_id ?? null
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', price: 0, category_id: 0, stock: 0, unit_id: null });
        setFormErrors({});
        setShowForm(false);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
            <header className="flex items-center justify-between mb-8 max-w-5xl mx-auto w-full">
                <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
                <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-md transition-all active:scale-95">
                    <Plus className="w-5 h-5" /> Nuevo
                </button>
            </header>

            <div className="max-w-5xl mx-auto w-full mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar producto..."
                    />
                </div>
                <div className="flex bg-white p-0.5 rounded-xl shadow-sm border border-gray-200 h-fit">
                    <button
                        onClick={() => { setViewMode('GRID'); typeof window !== 'undefined' && localStorage.setItem('productos_view', 'GRID'); }}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
                        title="Vista grid"
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => { setViewMode('LIST'); typeof window !== 'undefined' && localStorage.setItem('productos_view', 'LIST'); }}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
                        title="Vista lista"
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* GRID / LIST */}
            <div className={`max-w-5xl mx-auto w-full ${viewMode === 'GRID' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col gap-2'}`}>
                {loading ? (
                    <div className="col-span-full text-center py-10 text-gray-500">Cargando...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">No hay productos.</div>
                ) : (
                    filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product as ProductWithCategory}
                            viewMode={viewMode}
                            showStock
                            actions={
                                <>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); startEdit(product); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"><Edit2 className="w-4 h-4" /></button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="w-4 h-4" /></button>
                                </>
                            }
                        />
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
                                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 ${formErrors.name ? 'border-red-500' : 'border-gray-200'}`}
                                    value={formData.name}
                                    onChange={e => { setFormData({ ...formData, name: e.target.value }); setFormErrors(prev => ({ ...prev, name: undefined })); }}
                                    placeholder="Nombre del producto"
                                />
                                {formErrors.name && <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 ${formErrors.price ? 'border-red-500' : 'border-gray-200'}`}
                                        value={formData.price}
                                        onChange={e => { setFormData({ ...formData, price: parseFloat(e.target.value) || 0 }); setFormErrors(prev => ({ ...prev, price: undefined })); }}
                                    />
                                    {formErrors.price && <p className="text-red-600 text-sm mt-1">{formErrors.price}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        min={0}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <select
                                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 ${formErrors.category ? 'border-red-500' : 'border-gray-200'}`}
                                    value={formData.category_id}
                                    onChange={e => { setFormData({ ...formData, category_id: parseInt(e.target.value) }); setFormErrors(prev => ({ ...prev, category: undefined })); }}
                                >
                                    <option value={0}>Seleccione...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {formErrors.category && <p className="text-red-600 text-sm mt-1">{formErrors.category}</p>}
                            </div>

                            <div>
                                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">Unidad de venta</label>
                                <select
                                    id="unit"
                                    value={formData.unit_id ?? ''}
                                    onChange={e => setFormData({ ...formData, unit_id: e.target.value ? Number(e.target.value) : null })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Unidad (pieza)</option>
                                    {units.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" disabled={!isFormValid || saving} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg mt-4 flex justify-center items-center gap-2 transition-colors">
                                {saving ? 'Guardando...' : <><Save className="w-5 h-5" /> Guardar</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
