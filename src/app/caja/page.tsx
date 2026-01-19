
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowUpCircle, ArrowDownCircle, Wallet, CreditCard, DollarSign, RefreshCw, Plus, X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BalanceSummary {
    cashIn: number;
    cashOut: number;
    transferIn: number;
    transferOut: number;
    creditIn: number;
}

type MovementType = 'INCOME' | 'EXPENSE';
type PaymentMethod = 'CASH' | 'TRANSFER';

export default function CashPage() {
    const [balance, setBalance] = useState<BalanceSummary>({
        cashIn: 0, cashOut: 0,
        transferIn: 0, transferOut: 0,
        creditIn: 0
    });
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [movType, setMovType] = useState<MovementType>('INCOME');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [method, setMethod] = useState<PaymentMethod>('CASH');

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        setLoading(true);
        try {
            const { data: payments, error } = await supabase
                .from('payments')
                .select(`
                  amount,
                  method,
                  transactions (
                    type
                  )
                `);

            if (error) throw error;

            let newBalance = {
                cashIn: 0, cashOut: 0,
                transferIn: 0, transferOut: 0,
                creditIn: 0
            };

            payments?.forEach((p: any) => {
                const type = p.transactions?.type;
                const amount = parseFloat(p.amount);
                const method = p.method;

                // IN
                if (type === 'SALE' || type === 'INCOME' || type === 'DEBT_COLLECTION') {
                    if (method === 'CASH') newBalance.cashIn += amount;
                    if (method === 'TRANSFER' || method === 'QR') newBalance.transferIn += amount;
                }
                // OUT
                else if (type === 'EXPENSE' || type === 'DEBT_PAYMENT') {
                    if (method === 'CASH') newBalance.cashOut += amount;
                    if (method === 'TRANSFER') newBalance.transferOut += amount;
                }
            });

            setBalance(newBalance);

        } catch (error) {
            console.error('Error fetching balance:', error);
            toast.error('Error al calcular caja');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMovement = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const val = parseFloat(amount);
            if (!val || !description) return;

            // 1. Transaction
            const { data: trans, error: transError } = await supabase
                .from('transactions')
                .insert({
                    type: movType, // INCOME or EXPENSE
                    total_amount: val,
                    status: 'COMPLETED'
                })
                .select()
                .single();

            if (transError) throw transError;

            // 2. Transaction Item (Review: Manual entries might not need items or just a dummy one)
            // Let's add a dummy item for consistency/reporting if we query transaction_items
            const { error: itemError } = await supabase.from('transaction_items').insert({
                transaction_id: trans.id,
                product_name: `[MANUAL] ${description}`,
                quantity: 1,
                unit_price: val,
                total_price: val
            });
            if (itemError) throw itemError;

            // 3. Payment
            const { error: payError } = await supabase.from('payments').insert({
                transaction_id: trans.id,
                amount: val,
                method: method
            });
            if (payError) throw payError;

            fetchBalance();
            setShowModal(false);
            setAmount(''); setDescription(''); setMovType('INCOME');
            toast.success('Movimiento registrado');
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    const netCash = balance.cashIn - balance.cashOut;
    const netTransfer = balance.transferIn - balance.transferOut;
    const totalBalance = netCash + netTransfer;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-4">
            <header className="w-full flex items-center justify-between mb-8 max-w-6xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium">
                        &larr; Volver
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">Caja Central</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-gray-800 text-white rounded-xl flex items-center gap-2 font-bold shadow-md hover:bg-gray-700">
                        <Plus className="w-5 h-5" /> Movimiento
                    </button>
                    <button onClick={fetchBalance} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                        <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">

                {/* TOTAL CARD */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 text-white col-span-1 md:col-span-2 lg:col-span-1">
                    <h2 className="text-blue-100 font-medium mb-2">Saldo Total Teórico</h2>
                    <div className="text-5xl font-bold mb-4">${totalBalance.toLocaleString()}</div>
                    <div className="flex gap-4 text-sm text-blue-100">
                        <div className="flex items-center gap-1"><ArrowUpCircle className="w-4 h-4" /> Ingresos: ${(balance.cashIn + balance.transferIn).toLocaleString()}</div>
                        <div className="flex items-center gap-1"><ArrowDownCircle className="w-4 h-4" /> Egresos: ${(balance.cashOut + balance.transferOut).toLocaleString()}</div>
                    </div>
                </div>

                {/* CASH CARD */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${netCash >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            Efectivo
                        </span>
                    </div>

                    <div className="mb-6">
                        <div className="text-gray-500 text-sm">Debería haber en cajón</div>
                        <div className={`text-3xl font-bold ${netCash >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
                            ${netCash.toLocaleString()}
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Entradas:</span>
                            <span className="font-semibold text-emerald-600">+${balance.cashIn.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Salidas:</span>
                            <span className="font-semibold text-red-500">-${balance.cashOut.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* BANK/TRANSFER CARD */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <CreditCard className="w-8 h-8" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${netTransfer >= 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                            Digital
                        </span>
                    </div>

                    <div className="mb-6">
                        <div className="text-gray-500 text-sm">Bancos / Billeteras</div>
                        <div className={`text-3xl font-bold ${netTransfer >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
                            ${netTransfer.toLocaleString()}
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Entradas:</span>
                            <span className="font-semibold text-emerald-600">+${balance.transferIn.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Salidas:</span>
                            <span className="font-semibold text-red-500">-${balance.transferOut.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MANUAL MOVEMENT MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Registrar Movimiento</h3>
                            <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSaveMovement} className="p-6 space-y-4">

                            <div className="flex p-1 bg-gray-100 rounded-lg">
                                <button type="button" onClick={() => setMovType('INCOME')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${movType === 'INCOME' ? 'bg-green-500 text-white shadow' : 'text-gray-500'}`}>Entrada</button>
                                <button type="button" onClick={() => setMovType('EXPENSE')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${movType === 'EXPENSE' ? 'bg-red-500 text-white shadow' : 'text-gray-500'}`}>Salida</button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Descripción</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Ej: Aporte inicial, Retiro personal..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Medio</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-xl bg-white"
                                    value={method}
                                    onChange={e => setMethod(e.target.value as PaymentMethod)}
                                >
                                    <option value="CASH">Efectivo 💵</option>
                                    <option value="TRANSFER">Digital / Banco 💳</option>
                                </select>
                            </div>

                            <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg mt-4 flex justify-center items-center gap-2">
                                <Save className="w-5 h-5" /> Guardar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
