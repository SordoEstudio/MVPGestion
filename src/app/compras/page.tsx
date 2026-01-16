
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Wallet, CreditCard, Search, Plus, Trash, User, X } from 'lucide-react';
import { Person, Product } from '@/lib/types';

type PaymentMethod = 'CASH' | 'TRANSFER' | 'CREDIT_PROVIDER';

interface ExpenseItem {
    id: string; // Temporary ID for UI
    product_id?: number;
    description: string;
    amount: number;
    quantity: number;
}

interface PartialPayment {
    method: PaymentMethod;
    amount: number;
}

const EXPENSE_CATEGORIES = [
    'Reposición Mercadería',
    'Alquiler',
    'Servicios',
    'Viáticos',
    'Limpieza',
    'Otros'
];

export default function ExpensesPage() {
    const router = useRouter();

    // Data
    const [providers, setProviders] = useState<Person[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Cart State
    const [cart, setCart] = useState<ExpenseItem[]>([]);

    // Selection State
    const [selectedProviderId, setSelectedProviderId] = useState<string>('');

    // Add Item State
    const [itemMode, setItemMode] = useState<'MANUAL' | 'PRODUCT'>('MANUAL');
    const [manualDesc, setManualDesc] = useState('');
    const [manualAmount, setManualAmount] = useState('');
    const [manualCategory, setManualCategory] = useState(EXPENSE_CATEGORIES[0]);
    const [productSearch, setProductSearch] = useState('');

    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [payments, setPayments] = useState<PartialPayment[]>([]);
    const [currentAmountInput, setCurrentAmountInput] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [provRes, prodRes] = await Promise.all([
            supabase.from('people').select('*').eq('type', 'PROVIDER').order('name'),
            supabase.from('products').select('*').order('name')
        ]);
        if (provRes.data) setProviders(provRes.data);
        if (prodRes.data) setProducts(prodRes.data);
    };

    const addManualItem = () => {
        if (!manualDesc || !manualAmount) return;
        const newItem: ExpenseItem = {
            id: Math.random().toString(36).substr(2, 9),
            description: `${manualCategory}: ${manualDesc}`,
            amount: parseFloat(manualAmount),
            quantity: 1
        };
        setCart([...cart, newItem]);
        setManualDesc('');
        setManualAmount('');
    };

    const addProductItem = (product: Product) => {
        // Check if exists to just add quantity? For expenses, usually we input cost manually as it may change.
        // Let's ask for Cost when adding a product. 
        // Simplify: Just add as item with current price default, user can edit?
        // KISS: Add as item, assume 1 unit, use product price as default cost but allow override? 
        // Better: Just add to cart with Name and Price.
        const newItem: ExpenseItem = {
            id: Math.random().toString(36).substr(2, 9),
            product_id: product.id,
            description: `Reposición: ${product.name}`,
            amount: product.price, // Default to selling price? Probably buying price is different. 
            // For MVP, since we don't have "Cost Price" in DB yet, we just use 0 or let user type it?
            // Let's use 0 and force user to edit? Or use Current Price as placeholder.
            // Let's make a prompt or simple input.
            quantity: 1
        };
        setCart([...cart, newItem]);
    };

    const removeItem = (id: string) => {
        setCart(cart.filter(i => i.id !== id));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.amount * item.quantity, 0);
    };

    const calculatePaid = () => {
        return payments.reduce((sum, p) => sum + p.amount, 0);
    };

    const calculateRemaining = () => {
        return calculateTotal() - calculatePaid();
    };

    // Payment Logic
    const initiateCheckout = () => {
        if (cart.length === 0) return;
        setPayments([]);
        setCurrentAmountInput(calculateTotal().toString());
        setShowPaymentModal(true);
    };

    const addPayment = (method: PaymentMethod) => {
        const amountToAdd = parseFloat(currentAmountInput);
        if (!amountToAdd || amountToAdd <= 0) return;
        if (amountToAdd > calculateRemaining() + 0.1) {
            alert(`Excede el total restante ($${calculateRemaining()})`);
            return;
        }
        setPayments([...payments, { method, amount: amountToAdd }]);
        setCurrentAmountInput(Math.max(0, calculateRemaining() - amountToAdd).toString());
    };

    const removePayment = (index: number) => {
        const removed = payments[index].amount;
        setPayments(payments.filter((_, i) => i !== index));
        setCurrentAmountInput((parseFloat(currentAmountInput || '0') + removed).toString());
    };

    const finalizeExpense = async () => {
        setProcessing(true);
        try {
            if (Math.abs(calculateRemaining()) > 1) {
                alert('El total pagado debe cubrir el gasto.');
                setProcessing(false);
                return;
            }

            const totalAmount = calculateTotal();

            // 1. Transaction
            const { data: transaction, error: transError } = await supabase
                .from('transactions')
                .insert({
                    type: 'EXPENSE',
                    total_amount: totalAmount,
                    status: 'COMPLETED',
                    entity_id: selectedProviderId || null
                })
                .select()
                .single();
            if (transError) throw transError;

            // 2. Items
            const itemsToInsert = cart.map(item => ({
                transaction_id: transaction.id,
                product_id: item.product_id || null,
                product_name: item.description,
                quantity: item.quantity,
                unit_price: item.amount,
                total_price: item.amount * item.quantity
            }));
            const { error: itemsError } = await supabase.from('transaction_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            // 3. Payments
            const paymentsToInsert = payments.map(p => ({
                transaction_id: transaction.id,
                amount: p.amount,
                method: p.method
            }));
            const { error: paymentError } = await supabase.from('payments').insert(paymentsToInsert);
            if (paymentError) throw paymentError;

            // 4. Update Stock (If product_id exists)
            for (const item of cart) {
                if (item.product_id) {
                    const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                    if (prod) {
                        await supabase.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.product_id);
                    }
                }
            }

            // 5. Update Provider Balance (If Fiado)
            const creditTotal = payments.filter(p => p.method === 'CREDIT_PROVIDER').reduce((sum, p) => sum + p.amount, 0);
            if (creditTotal > 0 && selectedProviderId) {
                const { data: prov } = await supabase.from('people').select('balance').eq('id', selectedProviderId).single();
                if (prov) {
                    // Start debt for provider: Should be positive or negative?
                    // In People table: Balance > 0 usually means "They owe us".
                    // But for providers, if we owe them...
                    // Let's standardise: Balance is "My favor".
                    // If Client has Balance 100 -> They owe me 100.
                    // If Provider has Balance 100 -> I owe them 100? Or they owe me?
                    // Let's keep it simple: Balance = Deuda. 
                    // Client Balance > 0 = Client Debt.
                    // Provider Balance > 0 = My Debt to Provider? Or Provider Debt to me?
                    // Context: "Saldar Deudas".
                    // Let's say: Balance always "Deuda de la Persona hacia el Negocio".
                    // So if I buy Fiado from Provider -> I owe them. So his balance should be NEGATIVE?
                    // Or let's say "Balance" on Provider = "Cuánto le debo". (Positive = I owe him).
                    // If I buy Fiado -> I owe him more -> Balance INCREASES.
                    // Let's check Sales logic. `update({ balance: currentPerson.balance + totalCredit })`.
                    // Sales: Customer buys Fiado -> Increases Balance. So Balance = Amount they owe me.
                    // Expenses: I buy Fiado -> I owe them. So Balance = Amount I owe them.
                    // This creates a semantic difference but keeps numbers positive.
                    // Let's assume Balance is always "How much is pending".

                    await supabase.from('people').update({ balance: prov.balance + creditTotal }).eq('id', selectedProviderId);
                }
            }

            setCart([]);
            setShowPaymentModal(false);
            setManualDesc(''); setManualAmount(''); setSelectedProviderId('');
            alert('Gasto registrado exitosamente.');

        } catch (error: any) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row p-4 gap-4 h-screen overflow-hidden">

            {/* LEFT: INPUT AREA */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium">&larr; Volver</Link>
                    <h1 className="text-xl font-bold text-gray-800">Registrar Compra / Gasto</h1>
                </div>

                <div className="p-4 bg-gray-50 border-b">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PROVEEDOR</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <select
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white"
                            value={selectedProviderId}
                            onChange={e => setSelectedProviderId(e.target.value)}
                        >
                            <option value="">-- Seleccionar o Anónimo --</option>
                            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* TABS */}
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                        <button onClick={() => setItemMode('MANUAL')} className={`flex-1 py-1 rounded-md font-medium text-sm transition-all ${itemMode === 'MANUAL' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Manual / Gasto</button>
                        <button onClick={() => setItemMode('PRODUCT')} className={`flex-1 py-1 rounded-md font-medium text-sm transition-all ${itemMode === 'PRODUCT' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Reposición Productos</button>
                    </div>

                    {itemMode === 'MANUAL' ? (
                        <div className="space-y-4 animate-in fade-in">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                                <select
                                    className="w-full p-2 border rounded-lg bg-white"
                                    value={manualCategory}
                                    onChange={e => setManualCategory(e.target.value)}
                                >
                                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="Ej: Factura Luz"
                                    value={manualDesc}
                                    onChange={e => setManualDesc(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Total ($)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="0.00"
                                    value={manualAmount}
                                    onChange={e => setManualAmount(e.target.value)}
                                />
                            </div>
                            <button onClick={addManualItem} className="w-full py-2 bg-gray-800 text-white rounded-lg font-bold">Agregar Item</button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in">
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                className="w-full p-2 border rounded-lg"
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                            />
                            <div className="max-h-60 overflow-y-auto border rounded-lg">
                                {filteredProducts.map(p => (
                                    <button key={p.id} onClick={() => addProductItem(p)} className="w-full text-left p-2 hover:bg-blue-50 border-b flex justify-between items-center group">
                                        <span className="font-medium text-gray-800">{p.name}</span>
                                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 text-center">Toca un producto para agregarlo. Luego edita su costo.</p>
                        </div>
                    )}

                </div>
            </div>

            {/* RIGHT: CART & CHECKOUT */}
            <div className="w-full md:w-96 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <h2 className="font-bold text-gray-700">Detalle</h2>
                    <span className="text-sm text-gray-400">{cart.length} items</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 && <div className="text-center text-gray-400 py-10">Lista vacía</div>}
                    {cart.map(item => (
                        <div key={item.id} className="flex flex-col border-b border-gray-100 pb-2">
                            <div className="flex justify-between">
                                <span className="font-medium text-sm text-gray-800">{item.description}</span>
                                <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash className="w-4 h-4" /></button>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-400">Costo:</label>
                                    <input
                                        type="number"
                                        className="w-20 p-1 text-sm border rounded bg-gray-50"
                                        value={item.amount}
                                        onChange={(e) => {
                                            const newAmount = parseFloat(e.target.value) || 0;
                                            setCart(cart.map(i => i.id === item.id ? { ...i, amount: newAmount } : i));
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-400">Cant:</label>
                                    <input
                                        type="number"
                                        className="w-12 p-1 text-sm border rounded bg-gray-50"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const newQty = parseInt(e.target.value) || 1;
                                            setCart(cart.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-gray-50 border-t space-y-4">
                    <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                        <span>Total</span>
                        <span>${calculateTotal().toLocaleString()}</span>
                    </div>
                    <button onClick={initiateCheckout} disabled={cart.length === 0} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:bg-gray-300">
                        Pagar y Guardar
                    </button>
                </div>
            </div>

            {/* PAYMENT MODAL (Simplified version of Sales Modal) */}
            {showPaymentModal && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-5">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-700">Registrar Salida de Dinero</h3>
                            <button onClick={() => setShowPaymentModal(false)}><X className="text-gray-500" /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="text-center">
                                <div className="text-sm text-gray-500">Total a Pagar</div>
                                <div className="text-3xl font-extrabold text-gray-900">${calculateTotal().toLocaleString()}</div>
                            </div>

                            <div className="space-y-2">
                                {payments.map((p, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <span className="text-sm font-medium">
                                            {p.method === 'CASH' ? 'Efectivo' : p.method === 'TRANSFER' ? 'Transferencia' : 'Deuda/Fiado'}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold">${p.amount.toLocaleString()}</span>
                                            <button onClick={() => removePayment(idx)} className="text-red-400"><Trash className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {calculateRemaining() > 0 && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold">Agregar Pago:</span>
                                        <span className="text-xs text-gray-400">Resta: ${calculateRemaining().toLocaleString()}</span>
                                    </div>
                                    <input type="number" className="w-full p-2 border rounded-lg mb-2 font-bold" value={currentAmountInput} onChange={e => setCurrentAmountInput(e.target.value)} />
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => addPayment('CASH')} className="py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg hover:bg-emerald-200">Efectivo</button>
                                        <button onClick={() => addPayment('TRANSFER')} className="py-2 bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200">Transf</button>
                                        <button onClick={() => addPayment('CREDIT_PROVIDER')} className="py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200">Fiado</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50">
                            <button
                                onClick={finalizeExpense}
                                disabled={calculateRemaining() > 1 || processing}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg"
                            >
                                {processing ? 'Guardando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
