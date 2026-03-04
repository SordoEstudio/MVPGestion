
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Person, type ProductWithCategory } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Wallet, CreditCard, User, X, Plus, Trash, Grid, List, TrendingDown, DollarSign } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';
import { ProductCard } from '@/components/ProductCard';
import { useCart, type CartItem } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';

type PaymentMethod = 'CASH' | 'TRANSFER' | 'QR' | 'CREDIT_CUSTOMER';

interface PartialPayment {
    method: PaymentMethod;
    amount: number;
}

export default function SalesPage() {
    const router = useRouter();
    const { cart, setCart, clearCart } = useCart();
    const { storeId } = useStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Capture Modal (Price 0 / Weighable)
    const [showCaptureModal, setShowCaptureModal] = useState(false);
    const [selectedCaptureProduct, setSelectedCaptureProduct] = useState<Product | null>(null);
    const [captureValue, setCaptureValue] = useState('');
    const [secondCaptureValue, setSecondCaptureValue] = useState(''); // For dual case

    // Split Payment State
    const [payments, setPayments] = useState<PartialPayment[]>([]);
    const [currentAmountInput, setCurrentAmountInput] = useState('');

    // Customer Selection State
    const [showCustomerSelection, setShowCustomerSelection] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Person | null>(null);
    const [viewMode, setViewMode] = useState<'CARDS' | 'LIST'>(() => {
        if (typeof window === 'undefined') return 'CARDS';
        return (localStorage.getItem('ventas_view') === 'LIST' ? 'LIST' : 'CARDS') as 'CARDS' | 'LIST';
    });
    const [productSearch, setProductSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL');
    const [showNewPersonModal, setShowNewPersonModal] = useState(false);
    const [newPersonName, setNewPersonName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsResponse, customersResponse] = await Promise.all([
                supabase.from('products').select(`*, categories(name, color), units(name, symbol)`).order('name'),
                supabase.from('people').select('*').eq('type', 'CLIENT').order('name')
            ]);

            if (productsResponse.data) setProducts(productsResponse.data);
            if (customersResponse.data) setCustomers(customersResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetCapture = () => {
        setShowCaptureModal(false);
        setSelectedCaptureProduct(null);
        setCaptureValue('');
        setSecondCaptureValue('');
    };

    const confirmCapture = () => {
        if (!selectedCaptureProduct || !captureValue) return;

        const val1 = parseFloat(captureValue);
        const val2 = parseFloat(secondCaptureValue);

        let finalProduct = { ...selectedCaptureProduct };
        let finalQty = 1;

        const hasUnit = selectedCaptureProduct.unit_id != null;
        const unitSymbol = (selectedCaptureProduct as ProductWithCategory).units?.symbol;
        const isKg = unitSymbol === 'kg';
        if (selectedCaptureProduct.price === 0 && hasUnit) {
            if (!secondCaptureValue) return;
            finalProduct.price = val1;
            finalQty = isKg ? val2 / 1000 : val2;
        } else if (selectedCaptureProduct.price === 0) {
            finalProduct.price = val1;
        } else if (hasUnit) {
            finalQty = isKg ? val1 / 1000 : val1;
        }

        setCart((prev) => {
            const existing = prev.find((item) => item.id === finalProduct.id && item.price === finalProduct.price);
            if (existing) {
                return prev.map((item) =>
                    item.id === finalProduct.id && item.price === finalProduct.price
                        ? { ...item, quantity: item.quantity + finalQty }
                        : item
                );
            }
            return [...prev, { ...finalProduct, quantity: finalQty }];
        });

        resetCapture();
    };

    const addToCart = (product: Product) => {
        const needsCapture = product.price === 0 || (product.unit_id != null);
        if (needsCapture) {
            setSelectedCaptureProduct(product);
            setCaptureValue('');
            setSecondCaptureValue(product.price === 0 && product.unit_id != null ? '1000' : '');
            setShowCaptureModal(true);
            return;
        }

        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (index: number) => {
        if (!confirm('¿Seguro que quieres quitar este producto?')) return;
        setCart((prev) => prev.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const calculatePaid = () => {
        return payments.reduce((sum, p) => sum + p.amount, 0);
    };

    const calculateRemaining = () => {
        return calculateTotal() - calculatePaid();
    };

    const initiateCheckout = () => {
        if (cart.length === 0) return;
        setPayments([]);
        setCurrentAmountInput(calculateTotal().toString());
        setSelectedCustomer(null);
        setShowPaymentModal(true);
        setShowCustomerSelection(false);
    };

    const addPayment = (method: PaymentMethod) => {
        const amountToAdd = parseFloat(currentAmountInput);
        if (!amountToAdd || amountToAdd <= 0) return;

        if (amountToAdd > calculateRemaining() + 0.1) {
            toast.error(`No puedes pagar más del total restante ($${calculateRemaining()})`);
            return;
        }

        if (method === 'CREDIT_CUSTOMER' && !selectedCustomer) {
            setShowCustomerSelection(true);
            return;
        }

        setPayments([...payments, { method, amount: amountToAdd }]);
        const newRemaining = calculateRemaining() - amountToAdd;
        setCurrentAmountInput(Math.max(0, newRemaining).toString());
    };

    const removePayment = (index: number) => {
        if (!confirm('¿Quitar este pago?')) return;
        const removedAmount = payments[index].amount;
        setPayments(payments.filter((_, i) => i !== index));
        setCurrentAmountInput((parseFloat(currentAmountInput || '0') + removedAmount).toString());
    };

    const finalizeSale = async () => {
        setProcessing(true);
        try {
            if (Math.abs(calculateRemaining()) > 1) {
                toast.error('El total pagado no coincide con el total de la venta.');
                setProcessing(false);
                return;
            }

            const totalAmount = calculateTotal();
            const { data: transaction, error: transError } = await supabase
                .from('transactions')
                .insert({
                    type: 'SALE',
                    total_amount: totalAmount,
                    status: 'COMPLETED',
                    entity_id: selectedCustomer?.id || null,
                    store_id: storeId!
                })
                .select()
                .single();
            if (transError) throw transError;

            const itemsToInsert = cart.map(item => ({
                transaction_id: transaction.id,
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity
            }));
            const { error: itemsError } = await supabase.from('transaction_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            const paymentsToInsert = payments.map(p => ({
                transaction_id: transaction.id,
                amount: p.amount,
                method: p.method
            }));
            const { error: paymentError } = await supabase.from('payments').insert(paymentsToInsert);
            if (paymentError) throw paymentError;

            const creditPayment = payments.find(p => p.method === 'CREDIT_CUSTOMER');
            if (creditPayment && selectedCustomer) {
                const totalCredit = payments
                    .filter(p => p.method === 'CREDIT_CUSTOMER')
                    .reduce((sum, p) => sum + p.amount, 0);

                const { data: currentPerson } = await supabase.from('people').select('balance').eq('id', selectedCustomer.id).single();
                if (currentPerson) {
                    await supabase.from('people').update({ balance: currentPerson.balance + totalCredit }).eq('id', selectedCustomer.id);
                }
            }

            clearCart();
            setShowPaymentModal(false);
            toast.success('¡Venta registrada con éxito!');
        } catch (error: any) {
            console.error('Checkout error:', error);
            toast.error('Error: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || p.category_id === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const uniqueCategories = products.length ? Array.from(new Map(products.map(p => {
        const cat = (p as any).categories;
        const id = p.category_id;
        return [id, { id, name: cat?.name ?? 'Sin categoría', color: cat?.color ?? 'bg-gray-100' }];
    })).values()) : [];

    const handleCreatePerson = async () => {
        if (!newPersonName) return;
        try {
            const { data, error } = await supabase
                .from('people')
                .insert({ name: newPersonName, type: 'CLIENT', balance: 0, store_id: storeId! })
                .select()
                .single();
            if (error) throw error;
            setCustomers([data, ...customers]);
            setSelectedCustomer(data);
            setShowNewPersonModal(false);
            setNewPersonName('');
            setShowCustomerSelection(false);
        } catch (error: any) {
            toast.error('Error al crear persona: ' + error.message);
        }
    };

    return (
        <div className="flex h-screen flex-col md:flex-row bg-gray-100 relative overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 p-3 overflow-hidden">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">VENTAS</h1>
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Operativa Diaria</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/personas?accion=cobrar" className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-bold hover:bg-green-200 transition-all">
                            <DollarSign className="w-4 h-4" /> Cobrar fiado
                        </Link>
                        <Link href="/personas?accion=pagar" className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-200 transition-all">
                            <CreditCard className="w-4 h-4" /> Pagar deuda
                        </Link>
                        <Link href="/compras" className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all">
                            <TrendingDown className="w-4 h-4" /> Nuevo Gasto
                        </Link>
                    </div>
                </header>

                <div className="flex flex-col md:flex-row gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                        <SearchInput
                            value={productSearch}
                            onChange={setProductSearch}
                            placeholder="Buscar producto..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && filteredProducts.length === 1) {
                                    addToCart(filteredProducts[0]);
                                    setProductSearch('');
                                }
                            }}
                        />
                    </div>
                    <div className="flex bg-white p-0.5 rounded-xl shadow-sm border h-fit flex-shrink-0">
                        <button
                            onClick={() => { setViewMode('CARDS'); typeof window !== 'undefined' && localStorage.setItem('ventas_view', 'CARDS'); }}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'CARDS' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => { setViewMode('LIST'); typeof window !== 'undefined' && localStorage.setItem('ventas_view', 'LIST'); }}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {uniqueCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        <button
                            onClick={() => setCategoryFilter('ALL')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${categoryFilter === 'ALL' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Todas
                        </button>
                        {uniqueCategories.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setCategoryFilter(c.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${categoryFilter === c.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className={`flex-1 min-h-0 overflow-auto p-0.5 ${viewMode === 'CARDS' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2' : 'flex flex-col gap-1'}`}>
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product as ProductWithCategory}
                                viewMode={viewMode}
                                onClick={() => addToCart(product)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="w-full md:w-80 bg-white shadow-xl z-10 flex flex-col h-[35vh] md:h-screen border-t md:border-l border-gray-200 flex-shrink-0">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-gray-800">Ticket</h2>
                    {cart.length > 0 && (
                        <button onClick={() => { if (confirm('¿Vaciar todo el carrito?')) clearCart(); }} className="text-xs font-bold text-red-600 hover:text-red-700">Limpiar</button>
                    )}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1.5 space-y-1.5">
                    {cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center gap-2 text-sm py-1 border-b border-gray-50">
                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-800 truncate text-xs">{item.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <button type="button" onClick={() => { const step = item.quantity >= 1 ? 1 : 0.001; const next = item.quantity - step; if (next <= 0) setCart(prev => prev.filter((_, i) => i !== idx)); else setCart(prev => prev.map((it, i) => i === idx ? { ...it, quantity: next } : it)); }} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold leading-none text-sm">−</button>
                                    <span className="text-xs text-gray-700 tabular-nums min-w-[2ch]">
                                        {item.quantity >= 1 ? Math.round(item.quantity) : item.quantity}
                                        {(item as ProductWithCategory).units?.symbol && (
                                            <span className="text-gray-500 ml-0.5">{(item as ProductWithCategory).units!.symbol}</span>
                                        )}
                                    </span>
                                    <button type="button" onClick={() => setCart(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + (it.quantity >= 1 ? 1 : 0.001) } : it))} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold leading-none text-sm">+</button>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="font-semibold text-gray-900 text-xs">${(item.price * item.quantity).toLocaleString()}</span>
                                <button type="button" onClick={() => removeFromCart(idx)} className="text-red-500 hover:text-red-600 p-0.5" aria-label="Quitar">&times;</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between items-center text-base font-bold text-gray-900">
                        <span>Total</span>
                        <span>${calculateTotal().toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-0.5">
                        <button type="button" onClick={() => { const t = calculateTotal(); if (cart.length === 0) return; setPayments([{ method: 'CASH', amount: t }]); setCurrentAmountInput('0'); setSelectedCustomer(null); setShowCustomerSelection(false); setShowPaymentModal(true); }} disabled={cart.length === 0} className="col-span-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-l-xl transition-all" title="Cobrar todo en efectivo">Efectivo</button>
                        <button type="button" onClick={() => { const t = calculateTotal(); if (cart.length === 0) return; setPayments([{ method: 'TRANSFER', amount: t }]); setCurrentAmountInput('0'); setSelectedCustomer(null); setShowCustomerSelection(false); setShowPaymentModal(true); }} disabled={cart.length === 0} className="col-span-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-none transition-all" title="Cobrar todo en transferencia">Transf.</button>
                        <button onClick={initiateCheckout} disabled={cart.length === 0} className="py-2.5 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-bold rounded-r-xl transition-all" title="Dividir pago / Otros">+</button>
                    </div>
                </div>
            </div>

            {/* PAYMENT MODAL */}
            {showPaymentModal && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    {showCustomerSelection ? (
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 flex flex-col max-h-[80vh] relative z-[60]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-black text-gray-800">Seleccionar Cliente</h3>
                                <button onClick={() => setShowNewPersonModal(true)} className="flex items-center gap-1 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                                    <Plus className="w-4 h-4" /> Nuevo
                                </button>
                            </div>
                            <div className="mb-4">
                                <SearchInput
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                    placeholder="Buscar por nombre..."
                                    className="[&_input]:py-3 [&_input]:rounded-xl [&_input]:pl-10"
                                />
                            </div>
                            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                                {filteredCustomers.map(c => (
                                    <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerSelection(false); }} className="w-full text-left p-4 hover:bg-blue-50 border rounded-xl flex justify-between group transition-all">
                                        <span className="font-bold text-gray-700 group-hover:text-blue-700">{c.name}</span>
                                        <span className="text-gray-600 text-sm font-medium">Debe: ${c.balance?.toLocaleString() || 0}</span>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowCustomerSelection(false)} className="mt-4 text-center text-gray-600 font-bold text-sm uppercase tracking-widest w-full py-2 hover:text-gray-900">Cerrar</button>
                        </div>
                    ) : showNewPersonModal ? (
                        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 flex flex-col relative z-[60]">
                            <h3 className="text-2xl font-black text-gray-800 mb-2">Nuevo Cliente</h3>
                            <p className="text-sm text-gray-500 mb-6">Agrégalo rápido para esta venta.</p>
                            <input
                                type="text"
                                placeholder="Nombre completo"
                                className="w-full p-4 border-2 border-gray-200 focus:border-blue-500 rounded-2xl mb-6 outline-none text-lg font-bold text-gray-900 placeholder-gray-500"
                                value={newPersonName}
                                onChange={e => setNewPersonName(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreatePerson()}
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setShowNewPersonModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl">Cancelar</button>
                                <button onClick={handleCreatePerson} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200">Guardar</button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-gray-600 uppercase font-bold tracking-wider">Total a pagar</div>
                                    <div className="text-3xl font-extrabold text-gray-900 tabular-nums">${calculateTotal().toLocaleString()}</div>
                                </div>
                                <button onClick={() => setShowPaymentModal(false)}><X className="text-gray-600 hover:text-gray-900" /></button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto">
                                <div className="mb-6 flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <User className="text-blue-500" />
                                        <div>
                                            <div className="text-xs text-blue-500 font-bold uppercase">Cliente Asignado</div>
                                            <div className="font-semibold text-blue-900">{selectedCustomer ? selectedCustomer.name : 'Venta Anónima'}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowCustomerSelection(true)} className="text-sm text-blue-600 hover:underline">Cambiar</button>
                                </div>

                                <div className="space-y-2 mb-6">
                                    {payments.length === 0 && <div className="text-center text-gray-500 py-2">Aún no hay pagos agregados</div>}
                                    {payments.map((p, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-2">
                                                {p.method === 'CASH' && <Wallet className="w-4 h-4 text-green-600" />}
                                                {p.method === 'TRANSFER' && <CreditCard className="w-4 h-4 text-blue-600" />}
                                                {p.method === 'CREDIT_CUSTOMER' && <User className="w-4 h-4 text-purple-600" />}
                                                <span className="font-medium text-gray-800">
                                                    {p.method === 'CASH' ? 'Efectivo' : p.method === 'TRANSFER' ? 'Transferencia' : 'Fiado'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-gray-900 tabular-nums">${p.amount.toLocaleString()}</span>
                                                <button onClick={() => removePayment(idx)} className="text-red-500 hover:text-red-600"><Trash className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {calculateRemaining() > 0 && (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-bold text-gray-700">Monto a agregar</label>
                                            <span className="text-sm font-semibold text-gray-800">Resta: <span className="tabular-nums">${calculateRemaining().toLocaleString()}</span></span>
                                        </div>
                                        <div className="flex gap-2 mb-4">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-3 text-gray-600 font-medium">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-lg text-gray-900 placeholder-gray-500"
                                                    value={currentAmountInput}
                                                    onChange={e => setCurrentAmountInput(e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button onClick={() => addPayment('CASH')} className="py-2 bg-green-100 text-green-700 font-bold rounded-lg hover:bg-green-200">Efvo</button>
                                            <button onClick={() => addPayment('TRANSFER')} className="py-2 bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200">Transf</button>
                                            <button onClick={() => addPayment('CREDIT_CUSTOMER')} className="py-2 bg-purple-100 text-purple-700 font-bold rounded-lg hover:bg-purple-200">Fiado</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t bg-gray-50">
                                {calculateRemaining() <= 1 ? (
                                    <button onClick={finalizeSale} disabled={processing} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-xl shadow-lg">
                                        {processing ? 'Procesando...' : 'Confirmar Venta'}
                                    </button>
                                ) : (
                                    <div className="w-full py-3 bg-gray-200 text-gray-700 font-bold text-center rounded-xl cursor-not-allowed tabular-nums">
                                        Resta cubrir ${calculateRemaining().toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PRODUCT CAPTURE MODAL (Price 0 or Weight) */}
            {showCaptureModal && selectedCaptureProduct && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">{selectedCaptureProduct.name}</h3>
                            <button onClick={resetCapture} className="text-gray-400 hover:text-gray-600"><X /></button>
                        </div>

                        {selectedCaptureProduct.price === 0 && selectedCaptureProduct.unit_id != null ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Precio por KG</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">$</span>
                                        <input
                                            type="number"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none text-2xl font-bold text-gray-800"
                                            value={captureValue}
                                            onChange={e => setCaptureValue(e.target.value)}
                                            autoFocus
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gramaje</label>
                                    <div className="relative mb-3">
                                        <input
                                            type="number"
                                            className="w-full pr-12 pl-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none text-2xl font-bold text-gray-800"
                                            value={secondCaptureValue}
                                            onChange={e => setSecondCaptureValue(e.target.value)}
                                            placeholder="0"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">gr</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[250, 500, 1000].map(val => (
                                            <div key={val} className="flex rounded-lg overflow-hidden border border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() => setSecondCaptureValue(val.toString())}
                                                    className="flex-1 py-2 bg-gray-50 font-bold text-gray-700 hover:bg-blue-50 text-xs transition-colors"
                                                >
                                                    {val < 1000 ? `${val}g` : '1kg'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSecondCaptureValue(String((parseFloat(secondCaptureValue) || 0) + val))}
                                                    className="w-8 py-2 bg-gray-200 text-gray-900 hover:bg-blue-500 hover:text-white font-bold text-sm transition-colors"
                                                    title="Sumar"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {captureValue && secondCaptureValue && (
                                    <div className="text-center p-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold">
                                        Subtotal: ${((parseFloat(captureValue) * parseFloat(secondCaptureValue)) / 1000).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        ) : selectedCaptureProduct.price === 0 ? (
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider">Ingresar Precio</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
                                    <input
                                        type="number"
                                        className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none text-3xl font-extrabold text-gray-800"
                                        value={captureValue}
                                        onChange={e => setCaptureValue(e.target.value)}
                                        autoFocus
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider">Indicar Gramaje</label>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Precio/kg: ${selectedCaptureProduct.price}</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full pr-12 pl-4 py-4 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none text-3xl font-extrabold text-gray-800"
                                        value={captureValue}
                                        onChange={e => setCaptureValue(e.target.value)}
                                        autoFocus
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">gr</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[250, 500, 1000].map(val => (
                                        <div key={val} className="flex rounded-xl overflow-hidden border border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => setCaptureValue(val.toString())}
                                                className="flex-1 py-3 bg-gray-50 font-bold text-gray-700 hover:bg-blue-50 transition-colors"
                                            >
                                                {val < 1000 ? `${val}g` : '1kg'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCaptureValue(String((parseFloat(captureValue) || 0) + val))}
                                                className="w-9 py-3 bg-gray-200 text-gray-900 hover:bg-blue-500 hover:text-white font-bold transition-colors"
                                                title="Sumar"
                                            >
                                                +
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {captureValue && (
                                    <div className="text-center p-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold">
                                        Subtotal: ${((selectedCaptureProduct.price * parseFloat(captureValue)) / 1000).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={confirmCapture}
                            disabled={
                                !captureValue || parseFloat(captureValue) <= 0 ||
                                (selectedCaptureProduct.price === 0 && selectedCaptureProduct.unit_id != null && (!secondCaptureValue || parseFloat(secondCaptureValue) <= 0))
                            }
                            className="w-full mt-6 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg disabled:bg-gray-200"
                        >
                            Agregar al Carrito
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
