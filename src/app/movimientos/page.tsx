
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Ban, AlertTriangle, Eye, ArrowDownRight, ArrowUpRight, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

/* 
  Schema Reminder:
  transactions: id, type, total_amount, created_at, entity_id, status, related_transaction_id, description
  transaction_items: transaction_id, product_name, quantity, total_price, product_id
  payments: transaction_id, amount, method
*/

type Transaction = {
    id: string;
    type: string;
    total_amount: number;
    created_at: string;
    status: string;
    description?: string;
    related_transaction_id?: string;
    entity_id?: string; // Added field to fix build error
    transaction_items: {
        product_name: string;
        quantity: number;
        product_id?: number;
        unit_price?: number;
        total_price?: number;
    }[];
    payments: { method: string; amount: number }[];
    entity?: { name: string };
};

export default function MovementsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('ALL');

    // Cancel Modal
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, [filterType]);

    const fetchTransactions = async () => {
        setLoading(true);
        let query = supabase
            .from('transactions')
            .select(`
                *,
                transaction_items (product_name, quantity, product_id, total_price, unit_price),
                payments (method, amount),
                entity:entity_id (name)
            `)
            .order('created_at', { ascending: false })
            .limit(50); // Pagination for later

        if (filterType !== 'ALL') {
            query = query.eq('type', filterType);
        }

        const { data, error } = await query;
        if (error) {
            console.error(error);
        } else {
            // @ts-ignore
            setTransactions(data || []);
        }
        setLoading(false);
    };

    const handleCancelClick = (tx: Transaction) => {
        setSelectedTx(tx);
        setCancelReason('');
        setShowCancelModal(true);
    };

    const processCancellation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTx || !cancelReason) return;
        setProcessing(true);

        try {
            // 1. Create Reversal Transaction (Contra-asiento)
            // Same type, Negative Amount.
            const reversalAmount = -selectedTx.total_amount;

            const { data: reversalTx, error: txError } = await supabase
                .from('transactions')
                .insert({
                    type: selectedTx.type,
                    total_amount: reversalAmount,
                    status: 'COMPLETED', // Reversal is a completed action
                    related_transaction_id: selectedTx.id,
                    description: `ANULACIÓN: ${cancelReason}`,
                    entity_id: selectedTx.entity_id // Keep link to person
                })
                .select()
                .single();

            if (txError) throw txError;

            // 2. Reversal Items
            // @ts-ignore
            const reversalItems = selectedTx.transaction_items.map(item => ({
                transaction_id: reversalTx.id,
                product_id: item.product_id,
                product_name: `(Anulado) ${item.product_name}`,
                quantity: -item.quantity, // Negative quantity
                unit_price: item.unit_price || 0,
                total_price: -(item.total_price || 0)
            }));

            if (reversalItems.length > 0) {
                const { error: itemsError } = await supabase.from('transaction_items').insert(reversalItems);
                if (itemsError) throw itemsError;
            }

            // 3. Reversal Payments
            const reversalPayments = selectedTx.payments.map(p => ({
                transaction_id: reversalTx.id,
                amount: -p.amount,
                method: p.method
            }));

            if (reversalPayments.length > 0) {
                const { error: payError } = await supabase.from('payments').insert(reversalPayments);
                if (payError) throw payError;
            }

            // 4. Update Stock (If product_id exists)
            // @ts-ignore
            for (const item of selectedTx.transaction_items) {
                // @ts-ignore
                if (item.product_id) {
                    // Sale: stock - 1. Reversal: Stock - (-1) = Stock + 1. CORRECT.
                    // Expense: Stock + 1. Reversal: Stock + (-1) = Stock - 1. CORRECT.
                    // @ts-ignore
                    const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                    if (prod) {
                        // @ts-ignore
                        await supabase.from('products').update({ stock: prod.stock - item.quantity }).eq('id', item.product_id);
                        // Wait: Logic check.
                        // Original Sale: Item Qty = 1. Stock decreases. We didn't store negative stock movement, we just updated stock.
                        // Reversal Item Qty = -1.
                        // If I simply 'add' the item quantity to stock?
                        // Case Sale: Sold 1. Stock was 10 -> 9.
                        // Cancel: Qty -1. 
                        // If I subtract Qty (-1) -> 9 - (-1) = 10. Correct.
                        // Case Expense (Restock): Bought 1. Stock 9 -> 10.
                        // Cancel: Qty -1.
                        // 10 - (-1) = 11. WRONG. It should be 9.
                        // Expense logic in 'compras/page': `stock + quantity`.
                        // So if I cancel expense, I should `stock - quantity` (where quantity is positive in original).
                        // My generic formula above: `stock - item.quantity`.
                        // If Sale (qty 1): Stock - 1. WRONG. Reversal of sale means stock increases.
                        // Sale logic in 'ventas/page': `stock - quantity`.
                        // Let's look at `type`.

                        if (selectedTx.type === 'SALE') {
                            // Reverting a sale: ADD to stock.
                            // @ts-ignore
                            await supabase.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.product_id);
                        } else if (selectedTx.type === 'EXPENSE') {
                            // Reverting an expense: REMOVE from stock
                            // @ts-ignore
                            await supabase.from('products').update({ stock: prod.stock - item.quantity }).eq('id', item.product_id);
                        }
                    }
                }
            }

            // 5. Update Balance (Fiado)
            // @ts-ignore
            if (selectedTx.entity_id) { // Only if linked to a person
                const creditPayments = selectedTx.payments.filter(p => p.method === 'CREDIT_CUSTOMER' || p.method === 'CREDIT_PROVIDER');
                const totalCreditMap = creditPayments.reduce((acc, p) => acc + p.amount, 0);

                if (totalCreditMap > 0) {
                    // We need to fetch current balance and Reverse.
                    // Sale (Fiado): Customer Balance + 1000.
                    // Reversal: Customer Balance - 1000.
                    const { data: person } = await supabase.from('people').select('balance').eq('id', selectedTx.entity_id).single();
                    if (person) {
                        // If Sale: We added to balance. So subtract.
                        if (selectedTx.type === 'SALE') {
                            await supabase.from('people').update({ balance: person.balance - totalCreditMap }).eq('id', selectedTx.entity_id);
                        }
                        // If Expense (Fiado Provider): We added to balance (amount we owe). So subtract.
                        else if (selectedTx.type === 'EXPENSE') {
                            await supabase.from('people').update({ balance: person.balance - totalCreditMap }).eq('id', selectedTx.entity_id);
                        }
                        // Note: Debt Collection/Payment logic is diff, but those usually create separate tx types?
                        // For now, MVP supports mainly Sale/Expense cancellations.
                    }
                }
            }

            toast.success('Movimiento anulado correctamente (Contra-asiento generado).');
            setShowCancelModal(false);
            fetchTransactions();

        } catch (error: any) {
            toast.error('Error al anular: ' + error.message);
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'SALE': return { text: 'Venta', color: 'bg-green-100 text-green-700' };
            case 'EXPENSE': return { text: 'Gasto', color: 'bg-red-100 text-red-700' };
            case 'INCOME': return { text: 'Ingreso', color: 'bg-blue-100 text-blue-700' };
            case 'DEBT_COLLECTION': return { text: 'Cobro Deuda', color: 'bg-emerald-100 text-emerald-800' };
            case 'DEBT_PAYMENT': return { text: 'Pago Deuda', color: 'bg-purple-100 text-purple-800' };
            default: return { text: type, color: 'bg-gray-100' };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
            <header className="flex items-center justify-between mb-8 max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium">
                        &larr; Volver
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Historial de Movimientos</h1>
                </div>
            </header>

            {/* FILTERS */}
            <div className="max-w-5xl mx-auto w-full mb-6">
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit">
                    {['ALL', 'SALE', 'EXPENSE', 'INCOME'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilterType(f)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${filterType === f ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {f === 'ALL' ? 'Todos' : f === 'SALE' ? 'Ventas' : f === 'EXPENSE' ? 'Gastos' : 'Caja'}
                        </button>
                    ))}
                </div>
            </div>

            {/* LIST */}
            <div className="max-w-5xl mx-auto w-full space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Cargando...</div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed text-lg">No hay movimientos.</div>
                ) : (
                    transactions.map(tx => {
                        const label = getTypeLabel(tx.type);
                        const isNegative = tx.total_amount < 0 || tx.type === 'EXPENSE' || tx.type === 'DEBT_PAYMENT';
                        // Keep visual simple: Green for Money IN, Red for Money OUT.
                        // Wait, Sale Cancellation (Negative Sale) means Money OUT (Refund).
                        // Regular Sale = IN (Green).
                        // Expense = OUT (Red).
                        // Negative Expense = IN (Refunded expense).

                        let visualColor = 'text-gray-800';
                        if (tx.type === 'SALE' || tx.type === 'INCOME' || tx.type === 'DEBT_COLLECTION') visualColor = tx.total_amount >= 0 ? 'text-green-600' : 'text-red-600';
                        if (tx.type === 'EXPENSE' || tx.type === 'DEBT_PAYMENT') visualColor = tx.total_amount >= 0 ? 'text-red-600' : 'text-green-600';

                        return (
                            <div key={tx.id} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden ${tx.total_amount < 0 ? 'bg-gray-50' : ''}`}>
                                {tx.related_transaction_id && (
                                    <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg"> CONTRA-ASIENTO </div>
                                )}

                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${label.color}`}>
                                            {tx.total_amount >= 0 ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 text-lg">
                                                    { // @ts-ignore 
                                                        tx.type === 'MANUAL_ENTRY' ? tx.transaction_items[0]?.product_name :
                                                            tx.type === 'SALE' ? 'Venta mostrador' :
                                                                tx.type === 'EXPENSE' ? 'Gasto / Compra' : label.text
                                                    }
                                                </span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${label.color}`}>{label.text}</span>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(tx.created_at).toLocaleString()}
                                                { // @ts-ignore
                                                    tx.entity ? ` • ${tx.entity.name}` : ''}
                                            </div>
                                            {tx.description && <div className="text-xs text-gray-500 mt-1 italic">"{tx.description}"</div>}

                                            {/* ITEMS PREVIEW */}
                                            <div className="mt-2 text-xs text-gray-500">
                                                {tx.transaction_items.slice(0, 3).map((i, idx) => (
                                                    <span key={idx} className="mr-2">• {i.quantity}x {i.product_name}</span>
                                                ))}
                                                {tx.transaction_items.length > 3 && <span>... (+{tx.transaction_items.length - 3})</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`text-2xl font-bold ${visualColor}`}>
                                            ${Math.abs(tx.total_amount).toLocaleString()}
                                        </div>

                                        {/* Only allow cancellation if Positive amount (Not already cancelled) and not a Reversal itself */}
                                        {tx.total_amount > 0 && !tx.related_transaction_id && (
                                            <button
                                                onClick={() => handleCancelClick(tx)}
                                                className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <Ban className="w-3 h-3" /> Anular
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* CANCEL MODAL */}
            {showCancelModal && selectedTx && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-4 border-b bg-red-50 flex justify-between items-center">
                            <h3 className="font-bold text-red-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> Anular Movimiento
                            </h3>
                            <button onClick={() => setShowCancelModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
                        </div>
                        <form onSubmit={processCancellation} className="p-6 space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-sm text-gray-500 mb-1">Vas a generar un contra-asiento para revertir:</p>
                                <div className="text-xl font-bold text-gray-900">${selectedTx.total_amount.toLocaleString()}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Anulación</label>
                                <textarea
                                    required
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                                    rows={3}
                                    placeholder="Ej: Error en el cobro, Devolución de mercadería..."
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                />
                            </div>

                            <div className="text-xs text-gray-400">
                                Esto ajustará el Stock y las Cuentas Corrientes automáticamente.
                            </div>

                            <button type="submit" disabled={processing} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg mt-2">
                                {processing ? 'Procesando...' : 'Confirmar Anulación'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
