
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/lib/types';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const COLORS = [
    { name: 'Amarillo', value: 'bg-amber-200 text-amber-900' },
    { name: 'Azul', value: 'bg-blue-100 text-blue-900' },
    { name: 'Verde', value: 'bg-green-100 text-green-900' },
    { name: 'Rojo', value: 'bg-red-100 text-red-900' },
    { name: 'Violeta', value: 'bg-purple-100 text-purple-900' },
    { name: 'Gris', value: 'bg-gray-100 text-gray-900' },
    { name: 'Naranja', value: 'bg-orange-100 text-orange-900' },
    { name: 'Rosa', value: 'bg-pink-100 text-pink-900' },
];

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Form
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        color: COLORS[0].value
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        const { data } = await supabase.from('categories').select('*').order('name');
        if (data) setCategories(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { name: formData.name, color: formData.color };

            if (editingId) {
                const { error } = await supabase.from('categories').update(payload).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('categories').insert([payload]);
                if (error) throw error;
            }
            fetchCategories();
            resetForm();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Eliminar categoría? Los productos quedarán sin categoría.')) return;
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (!error) fetchCategories();
    };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setFormData({ name: cat.name, color: cat.color });
        setShowForm(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', color: COLORS[0].value });
        setShowForm(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
            <header className="flex items-center justify-between mb-8 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium">
                        &larr; Volver
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Categorías</h1>
                </div>
                <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-md transition-all active:scale-95">
                    <Plus className="w-5 h-5" /> Nueva
                </button>
            </header>

            <div className="max-w-4xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center text-gray-400">Cargando...</div>
                ) : (
                    categories.map(cat => (
                        <div key={cat.id} className={`p-4 rounded-xl flex items-center justify-between shadow-sm border border-gray-100 bg-white`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full ${cat.color} flex items-center justify-center font-bold text-xs`}>
                                    {cat.name.charAt(0)}
                                </div>
                                <span className="font-semibold text-gray-800">{cat.name}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(cat)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL FORM */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">{editingId ? 'Editar' : 'Nueva'}</h3>
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c.name}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: c.value })}
                                            className={`w-full h-8 rounded-lg border-2 ${c.value} ${formData.color === c.value ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
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
