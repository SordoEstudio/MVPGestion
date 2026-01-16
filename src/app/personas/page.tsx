
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Person, PersonType } from '@/lib/types';
import { Plus, Edit2, Trash2, Save, X, Search, DollarSign } from 'lucide-react';

export default function PeoplePage() {
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter
    const [filterType, setFilterType] = useState<'ALL' | PersonType>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Form State (New/Edit)
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        type: 'CLIENT' as PersonType,
        balance: 0
    });

    // Debt Modal State
    const [showDebtModal, setShowDebtModal] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [debtAmount, setDebtAmount] = useState('');
    const [debtMethod, setDebtMethod] = useState('CASH');
    const [processingDebt, setProcessingDebt] = useState(false);

    useEffect(() => {
        fetchPeople();
    }, []);

    const fetchPeople = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('people')
            .select('*')
            .order('name');

        if (!error && data) setPeople(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('people')
                    .update({
                        name: formData.name,
                        phone: formData.phone,
                        type: formData.type
                    })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('people')
                    .insert([{
                        name: formData.name,
                        phone: formData.phone,
                        type: formData.type,
                        balance: 0
                    }]);
                if (error) throw error;
            }

            fetchPeople();
            resetForm();

        } catch (error: any) {
            alert('Error al guardar: ' + error.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Seguro que quieres eliminar a esta persona?')) return;
        const { error } = await supabase.from('people').delete().eq('id', id);
        if (error) alert('Error al eliminar: ' + error.message);
        else fetchPeople();
    };

    const startEdit = (person: Person) => {
        setEditingId(person.id);
        setFormData({
            name: person.name,
            phone: person.phone || '',
            type: person.type,
            balance: person.balance
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', phone: '', type: 'CLIENT', balance: 0 });
        setShowForm(false);
    };

    const openDebtModal = (person: Person) => {
        setSelectedPerson(person);
        setDebtAmount(person.balance.toString()); // Default to full payment
        setShowDebtModal(true);
    };

    const handleSettleDebt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPerson || !debtAmount) return;

        setProcessingDebt(true);
        const amount = parseFloat(debtAmount);

        try {
            // If Client: We are Collecting Debt -> IN
            // If Provider: We are Paying Debt -> OUT
            const isClient = selectedPerson.type === 'CLIENT';
            const transactionType = isClient ? 'DEBT_COLLECTION' : 'DEBT_PAYMENT';

            // 1. Transaction
            const { data: trans, error: transError } = await supabase
                .from('transactions')
                .insert({
                    type: transactionType,
                    total_amount: amount,
                    status: 'COMPLETED',
                    entity_id: selectedPerson.id
                })
                .select()
                .single();
            if (transError) throw transError;

            // 2. Trans Item (Description)
            await supabase.from('transaction_items').insert({
                transaction_id: trans.id,
                product_name: isClient ? `Cobro deuda: ${selectedPerson.name}` : `Pago deuda: ${selectedPerson.name}`,
                quantity: 1,
                unit_price: amount,
                total_price: amount
            });

            // 3. Payment
            await supabase.from('payments').insert({
                transaction_id: trans.id,
                amount: amount,
                method: debtMethod
            });

            // 4. Update Person Balance (Subtract amount)
            // Balance is always POSITIVE meaning "Pending Amount".
            // If Client Pays 100, Balance reduces by 100.
            // If We Pay Provider 100, Balance reduces by 100.
            const newBalance = selectedPerson.balance - amount;
            await supabase.from('people').update({ balance: newBalance }).eq('id', selectedPerson.id);

            alert('Deuda actualizada correctamente.');
            setShowDebtModal(false);
            fetchPeople();

        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setProcessingDebt(false);
        }
    };

    const filteredPeople = people.filter(p => {
        const matchesType = filterType === 'ALL' || p.type === filterType;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
            <header className="flex items-center justify-between mb-8 max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium">
                        &larr; Volver
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Personas</h1>
                </div>
                <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-md transition-all active:scale-95">
                    <Plus className="w-5 h-5" /> Nuevo
                </button>
            </header>

            {/* FILTERS */}
            <div className="max-w-5xl mx-auto w-full mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    <button onClick={() => setFilterType('ALL')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterType === 'ALL' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>Todos</button>
                    <button onClick={() => setFilterType('CLIENT')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterType === 'CLIENT' ? 'bg-blue-100 text-blue-800' : 'text-gray-500 hover:bg-gray-50'}`}>Clientes</button>
                    <button onClick={() => setFilterType('PROVIDER')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterType === 'PROVIDER' ? 'bg-purple-100 text-purple-800' : 'text-gray-500 hover:bg-gray-50'}`}>Proveedores</button>
                </div>
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* LIST */}
            <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-gray-500">Cargando...</div>
                ) : filteredPeople.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">No hay personas registradas.</div>
                ) : (
                    filteredPeople.map(person => (
                        <div key={person.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{person.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${person.type === 'CLIENT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {person.type === 'CLIENT' ? 'CLIENTE' : 'PROVEEDOR'}
                                        </span>
                                        {person.phone && <span className="text-gray-400 text-sm">📞 {person.phone}</span>}
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => startEdit(person)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(person.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase font-bold">Saldo Pendiente</div>
                                        <div className={`font-bold text-xl ${person.balance > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                            ${person.balance.toLocaleString()}
                                        </div>
                                    </div>
                                    {person.balance > 0 && (
                                        <button
                                            onClick={() => openDebtModal(person)}
                                            className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                                        >
                                            <DollarSign className="w-4 h-4" />
                                            {person.type === 'CLIENT' ? 'Cobrar' : 'Pagar'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* NEW/EDIT MODAL */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">{editingId ? 'Editar Persona' : 'Nueva Persona'}</h3>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            checked={formData.type === 'CLIENT'}
                                            onChange={() => setFormData({ ...formData, type: 'CLIENT' })}
                                            className="w-5 h-5 text-blue-600"
                                        />
                                        <span className={formData.type === 'CLIENT' ? 'font-bold text-gray-800' : 'text-gray-600'}>Cliente</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            checked={formData.type === 'PROVIDER'}
                                            onChange={() => setFormData({ ...formData, type: 'PROVIDER' })}
                                            className="w-5 h-5 text-purple-600"
                                        />
                                        <span className={formData.type === 'PROVIDER' ? 'font-bold text-gray-800' : 'text-gray-600'}>Proveedor</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg mt-4 flex justify-center items-center gap-2">
                                <Save className="w-5 h-5" /> Guardar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* DEBT SETTLEMENT MODAL */}
            {showDebtModal && selectedPerson && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">
                                {selectedPerson.type === 'CLIENT' ? 'Cobrar Deuda' : 'Pagar Deuda'}
                            </h3>
                            <button onClick={() => setShowDebtModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSettleDebt} className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl text-center mb-4">
                                <div className="text-xs text-gray-500 uppercase">Saldo Actual</div>
                                <div className="text-3xl font-extrabold text-gray-800">${selectedPerson.balance.toLocaleString()}</div>
                                <div className="text-sm text-gray-500 mt-1">{selectedPerson.name}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Saldar</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold"
                                    value={debtAmount}
                                    onChange={e => setDebtAmount(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Medio de Pago</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setDebtMethod('CASH')} className={`py-2 rounded-lg font-bold border-2 ${debtMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-400'}`}>Efectivo</button>
                                    <button type="button" onClick={() => setDebtMethod('TRANSFER')} className={`py-2 rounded-lg font-bold border-2 ${debtMethod === 'TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-400'}`}>Transferencia</button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processingDebt}
                                className={`w-full py-3 text-white font-bold rounded-xl shadow-lg mt-4 flex justify-center items-center gap-2 ${selectedPerson.type === 'CLIENT' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {processingDebt ? 'Procesando...' : 'Confirmar Operación'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
