
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/contexts/StoreContext';
import {
    TrendingUp,
    FileText,
    DollarSign,
    CreditCard,
    ShoppingBag,
    Users,
    LayoutDashboard,
    Wallet,
    Package,
    UserCheck
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ViewMode = 'RESUMEN' | 'VENTAS' | 'COMPRAS' | 'CAJA' | 'PERSONAS' | 'PRODUCTOS';

interface Debtor { id: number; name: string; balance: number; }
interface CajaBalance { cashIn: number; cashOut: number; transferIn: number; transferOut: number; }
interface MovementRow { id: number; amount: number; type: string; created_at: string; }
interface TopSold { product_name: string; quantity: number; total: number; }
interface ByProvider { name: string; total: number; }
interface LastPurchase { id: string; total_amount: number; created_at: string; providerName?: string; }
interface LastSale { id: string; total_amount: number; created_at: string; }

export default function OwnerDashboard({ storeIdOverride }: { storeIdOverride?: string | null } = {}) {
    const { storeId: contextStoreId } = useStore();
    const storeId = storeIdOverride ?? contextStoreId;
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('RESUMEN');
    const [dateRange, setDateRange] = useState<'DAY' | 'MONTH'>('MONTH');
    const [stats, setStats] = useState({
        totalSales: 0,
        totalPurchases: 0,
        totalCollections: 0,
        cashSales: 0,
        creditSales: 0,
        pendingCollect: 0
    });
    const [monthlyData, setMonthlyData] = useState<{ month: string; amount: number }[]>([]);
    const [debtors, setDebtors] = useState<Debtor[]>([]);
    const [cajaBalance, setCajaBalance] = useState<CajaBalance>({ cashIn: 0, cashOut: 0, transferIn: 0, transferOut: 0 });
    const [cajaMovements, setCajaMovements] = useState<MovementRow[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [topSold, setTopSold] = useState<TopSold[]>([]);
    const [purchaseTotal, setPurchaseTotal] = useState(0);
    const [purchaseCount, setPurchaseCount] = useState(0);
    const [byProvider, setByProvider] = useState<ByProvider[]>([]);
    const [lastPurchases, setLastPurchases] = useState<LastPurchase[]>([]);
    const [totalToPay, setTotalToPay] = useState(0);
    const [creditors, setCreditors] = useState<Debtor[]>([]);
    const [debtorsFull, setDebtorsFull] = useState<Debtor[]>([]);
    const [salesTotal, setSalesTotal] = useState(0);
    const [salesCount, setSalesCount] = useState(0);
    const [salesCash, setSalesCash] = useState(0);
    const [salesTransfer, setSalesTransfer] = useState(0);
    const [lastSales, setLastSales] = useState<LastSale[]>([]);
    const [fiscalAnnualSales, setFiscalAnnualSales] = useState(0);
    const [fiscalLimit, setFiscalLimit] = useState<number | null>(null);

    const getDateRange = () => {
        const now = new Date();
        if (dateRange === 'DAY') {
            const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            return { startStr: startDate.toISOString(), endStr: endDate.toISOString() };
        }
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { startStr: startDate.toISOString(), endStr: endDate.toISOString() };
    };

    useEffect(() => {
        if (!storeId) return;
        (async () => {
            const months: { month: string; amount: number }[] = [];
            const now = new Date();
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const start = d.toISOString().slice(0, 10);
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString().slice(0, 19);
                const { data } = await supabase.from('transactions').select('total_amount').eq('store_id', storeId).eq('type', 'SALE').gte('created_at', start).lte('created_at', end);
                const amount = (data ?? []).reduce((s, t) => s + Number(t.total_amount), 0);
                months.push({ month: start.slice(0, 7), amount });
            }
            setMonthlyData(months);
        })();
    }, [storeId]);

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, dateRange, storeId]);

    const fetchAll = async () => {
        if (!storeId) { setLoading(false); return; }
        setLoading(true);
        const { startStr, endStr } = getDateRange();
        try {
            if (viewMode === 'RESUMEN') {
                const [salesRes, purchasesRes, txIdsRes, peopleRes] = await Promise.all([
                    supabase.from('transactions').select('total_amount').eq('store_id', storeId).eq('type', 'SALE').gte('created_at', startStr).lte('created_at', endStr),
                    supabase.from('transactions').select('total_amount').eq('store_id', storeId).eq('type', 'EXPENSE').gte('created_at', startStr).lte('created_at', endStr),
                    supabase.from('transactions').select('id').eq('store_id', storeId),
                    supabase.from('people').select('id, name, balance').eq('store_id', storeId).eq('type', 'CLIENT').gt('balance', 0).order('balance', { ascending: false })
                ]);
                const txIds = (txIdsRes.data ?? []).map((t: { id: string }) => t.id);
                const paymentsRes = txIds.length > 0
                    ? await supabase.from('payments').select('amount, method, transactions(type, created_at)').in('transaction_id', txIds)
                    : { data: [] as Record<string, unknown>[] };
                const totalSales = (salesRes.data ?? []).reduce((s, t) => s + Number(t.total_amount), 0);
                const totalPurchases = (purchasesRes.data ?? []).reduce((s, t) => s + Number(t.total_amount), 0);
                let totalCollections = 0, cashSales = 0, creditSales = 0;
(paymentsRes.data ?? []).forEach((p: Record<string, unknown>) => {
                const tx = Array.isArray(p.transactions) ? p.transactions[0] : p.transactions;
                const type = (tx as { type?: string })?.type;
                const createdAt = (tx as { created_at?: string })?.created_at;
if (!createdAt || createdAt < startStr || createdAt > endStr) return;
                const amt = Number((p as { amount?: number }).amount);
if (type === 'SALE' || type === 'DEBT_COLLECTION') {
                    totalCollections += amt;
                    const method = (p as { method?: string }).method;
                    if (method === 'CASH' || method === 'QR') cashSales += amt;
                    else creditSales += amt;
                }
            });
                const pendingCollect = (peopleRes.data ?? []).reduce((s, p) => s + Number(p.balance ?? 0), 0);
                setStats({ totalSales, totalPurchases, totalCollections, cashSales, creditSales, pendingCollect });
                setDebtors((peopleRes.data ?? []).map((p: { id: number; name: string; balance?: number }) => ({ id: p.id, name: p.name, balance: Number(p.balance ?? 0) })));
                if (storeId) {
                    const currentYear = new Date().getFullYear();
                    const [storeRes, viewRes] = await Promise.all([
                        supabase.from('stores').select('limite_anual').eq('id', storeId).maybeSingle(),
                        supabase.from('view_annual_sales_by_store').select('total_sales').eq('store_id', storeId).eq('year', currentYear).maybeSingle()
                    ]);
                    setFiscalLimit(storeRes.data?.limite_anual ?? null);
                    setFiscalAnnualSales(Number(viewRes.data?.total_sales ?? 0));
                } else {
                    setFiscalLimit(null);
                    setFiscalAnnualSales(0);
                }
            }

            if (viewMode === 'VENTAS') {
                const [txIdsRes, salesRes] = await Promise.all([
                    supabase.from('transactions').select('id').eq('store_id', storeId),
                    supabase.from('transactions').select('id, total_amount, created_at').eq('store_id', storeId).eq('type', 'SALE').gte('created_at', startStr).lte('created_at', endStr).order('created_at', { ascending: false })
                ]);
                const txIds = (txIdsRes.data ?? []).map((t: { id: string }) => t.id);
                const paymentsRes = txIds.length > 0 ? await supabase.from('payments').select('amount, method, transactions(type, created_at)').in('transaction_id', txIds) : { data: [] as Record<string, unknown>[] };
                const sales = salesRes.data ?? [];
                const total = sales.reduce((s, t) => s + Number(t.total_amount), 0);
                setSalesTotal(total);
                setSalesCount(sales.length);
                let cash = 0, transfer = 0;
                (paymentsRes.data ?? []).forEach((p: Record<string, unknown>) => {
                    const tx = Array.isArray(p.transactions) ? p.transactions[0] : p.transactions;
                    const type = (tx as { type?: string })?.type;
                    const createdAt = (tx as { created_at?: string })?.created_at;
                    if (type !== 'SALE' && type !== 'DEBT_COLLECTION') return;
                    if (!createdAt || createdAt < startStr || createdAt > endStr) return;
                    const amt = Number((p as { amount?: number }).amount);
                    const method = (p as { method?: string }).method;
                    if (method === 'CASH' || method === 'QR') cash += amt;
                    else transfer += amt;
                });
                setSalesCash(cash);
                setSalesTransfer(transfer);
                setLastSales(sales.slice(0, 10).map((t: { id: string; total_amount: number; created_at: string }) => ({
                    id: t.id,
                    total_amount: Number(t.total_amount),
                    created_at: t.created_at
                })));
            }

            if (viewMode === 'CAJA') {
                const { data: txList } = await supabase.from('transactions').select('id').eq('store_id', storeId);
                const txIds = (txList ?? []).map((t: { id: string }) => t.id);
                const { data: payments } = txIds.length > 0 ? await supabase.from('payments').select('amount, method, transactions(type, created_at)').in('transaction_id', txIds) : { data: [] };
                const balance = { cashIn: 0, cashOut: 0, transferIn: 0, transferOut: 0 };
                (payments ?? []).forEach((p: Record<string, unknown>) => {
                    const tx = Array.isArray(p.transactions) ? p.transactions[0] : p.transactions;
                    const type = (tx as { type?: string })?.type;
                    const amount = Number((p as { amount?: number }).amount);
                    const method = (p as { method?: string }).method;
                    if (type === 'SALE' || type === 'INCOME' || type === 'DEBT_COLLECTION') {
                        if (method === 'CASH' || method === 'QR') balance.cashIn += amount;
                        else if (method === 'TRANSFER') balance.transferIn += amount;
                    } else if (type === 'EXPENSE' || type === 'DEBT_PAYMENT') {
                        if (method === 'CASH') balance.cashOut += amount;
                        else if (method === 'TRANSFER') balance.transferOut += amount;
                    }
                });
                setCajaBalance(balance);
                const { data: lastPay } = txIds.length > 0 ? await supabase.from('payments').select('id, amount, transactions(type, created_at)').in('transaction_id', txIds).order('created_at', { ascending: false }).limit(10) : { data: [] };
                setCajaMovements((lastPay ?? []).map((p: Record<string, unknown>) => {
                    const tx = Array.isArray(p.transactions) ? p.transactions[0] : p.transactions;
                    return {
                        id: p.id as number,
                        amount: Number((p as { amount?: number }).amount),
                        type: (tx as { type?: string })?.type ?? '',
                        created_at: (tx as { created_at?: string })?.created_at ?? ''
                    };
                }));
            }

            if (viewMode === 'PRODUCTOS') {
                const { data: products } = await supabase.from('products').select('id').eq('store_id', storeId);
                setTotalProducts((products ?? []).length);
                const { data: saleTx } = await supabase.from('transactions').select('id').eq('store_id', storeId).eq('type', 'SALE').gte('created_at', startStr).lte('created_at', endStr);
                const saleIds = (saleTx ?? []).map((t: { id: string }) => t.id);
                let saleItems: { product_name?: string; quantity?: number; total_price?: number }[] = [];
                if (saleIds.length > 0) {
                    const { data: items } = await supabase.from('transaction_items').select('product_name, quantity, total_price').in('transaction_id', saleIds);
                    saleItems = items ?? [];
                }
                const byName: Record<string, { quantity: number; total: number }> = {};
                saleItems.forEach((i) => {
                    const n = i.product_name || 'Sin nombre';
                    if (!byName[n]) byName[n] = { quantity: 0, total: 0 };
                    byName[n].quantity += Number(i.quantity ?? 0);
                    byName[n].total += Number(i.total_price ?? 0);
                });
                setTopSold(Object.entries(byName).map(([product_name, v]) => ({ product_name, ...v })).sort((a, b) => b.total - a.total).slice(0, 8));
            }

            if (viewMode === 'COMPRAS') {
                const { data: expenses } = await supabase.from('transactions').select('id, total_amount, created_at, entity_id').eq('store_id', storeId).eq('type', 'EXPENSE').gte('created_at', startStr).lte('created_at', endStr).order('created_at', { ascending: false });
                const list = expenses ?? [];
                const total = list.reduce((s, t: { total_amount?: number }) => s + Number(t.total_amount), 0);
                setPurchaseTotal(total);
                setPurchaseCount(list.length);
                const providerIds = [...new Set(list.map((t: { entity_id?: number }) => t.entity_id).filter(Boolean))];
                const byProviderMap: Record<number, number> = {};
                list.forEach((t: { entity_id?: number; total_amount?: number }) => {
                    const eid = t.entity_id;
                    if (eid) { byProviderMap[eid] = (byProviderMap[eid] ?? 0) + Number(t.total_amount); }
                });
                if (providerIds.length > 0) {
                    const { data: people } = await supabase.from('people').select('id, name').in('id', providerIds);
                    const names: Record<number, string> = {};
                    (people ?? []).forEach((p: { id: number; name: string }) => { names[p.id] = p.name; });
                    setByProvider(Object.entries(byProviderMap).map(([id, total]) => ({ name: names[Number(id)] ?? `#${id}`, total })).sort((a, b) => b.total - a.total));
                } else setByProvider([]);
                const { data: last } = await supabase.from('transactions').select('id, total_amount, created_at, entity_id').eq('type', 'EXPENSE').order('created_at', { ascending: false }).limit(5);
                const lastList = last ?? [];
                const ids = lastList.map((t: { entity_id?: number }) => t.entity_id).filter(Boolean);
                const { data: peopleLast } = ids.length ? await supabase.from('people').select('id, name').in('id', ids) : { data: [] };
                const namesLast: Record<number, string> = {};
                (peopleLast ?? []).forEach((p: { id: number; name: string }) => { namesLast[p.id] = p.name; });
                setLastPurchases(lastList.map((t: { id: string; total_amount: number; created_at: string; entity_id?: number }) => ({
                    id: t.id,
                    total_amount: Number(t.total_amount),
                    created_at: t.created_at,
                    providerName: t.entity_id ? namesLast[t.entity_id] : undefined
                })));
            }

            if (viewMode === 'PERSONAS') {
                const [clientsRes, providersRes] = await Promise.all([
                    supabase.from('people').select('id, name, balance').eq('store_id', storeId).eq('type', 'CLIENT').order('balance', { ascending: false }),
                    supabase.from('people').select('id, name, balance').eq('store_id', storeId).eq('type', 'PROVIDER').order('balance', { ascending: false })
                ]);
                const clients = clientsRes.data ?? [];
                const providers = providersRes.data ?? [];
                interface PersonRow { id: number; name: string; balance?: number }
                const toCollect = clients.filter((p: PersonRow) => Number(p.balance ?? 0) > 0).reduce((s, p) => s + Number(p.balance ?? 0), 0);
                const toPay = providers.filter((p: PersonRow) => Number(p.balance ?? 0) > 0).reduce((s, p) => s + Number(p.balance ?? 0), 0);
                setStats(prev => ({ ...prev, pendingCollect: toCollect }));
                setTotalToPay(toPay);
                setDebtorsFull(clients.filter((p: PersonRow) => Number(p.balance ?? 0) > 0).map((p: PersonRow) => ({ id: p.id, name: p.name, balance: Number(p.balance ?? 0) })));
                setCreditors(providers.filter((p: PersonRow) => Number(p.balance ?? 0) > 0).map((p: PersonRow) => ({ id: p.id, name: p.name, balance: Number(p.balance ?? 0) })));
            }
        } catch (e) {
            console.error('Dashboard fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const typeLabel: Record<string, string> = { SALE: 'Venta', EXPENSE: 'Gasto', INCOME: 'Ingreso', DEBT_COLLECTION: 'Cobro', DEBT_PAYMENT: 'Pago deuda' };
    const showDateFilter = viewMode !== 'PERSONAS';
    const DASHBOARD_VIEWS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
        { id: 'RESUMEN', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'VENTAS', label: 'Ventas', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'COMPRAS', label: 'Compras', icon: <ShoppingBag className="w-4 h-4" /> },
        { id: 'CAJA', label: 'Caja', icon: <Wallet className="w-4 h-4" /> },
        { id: 'PERSONAS', label: 'Personas', icon: <UserCheck className="w-4 h-4" /> },
        { id: 'PRODUCTOS', label: 'Productos', icon: <Package className="w-4 h-4" /> }
    ];
    const netCash = cajaBalance.cashIn - cajaBalance.cashOut;
    const netTransfer = cajaBalance.transferIn - cajaBalance.transferOut;
    const totalBalance = netCash + netTransfer;

    if (loading) return <div className="h-screen flex items-center justify-center text-gray-600">Cargando...</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            <div className="w-full max-w-6xl space-y-8">
                <header className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Panel</h1>
                            <p className="text-sm text-gray-600 font-bold uppercase tracking-widest">
                                {viewMode === 'RESUMEN' && 'Resumen'}
                                {viewMode === 'VENTAS' && 'Ventas'}
                                {viewMode === 'CAJA' && 'Caja'}
                                {viewMode === 'PRODUCTOS' && 'Productos'}
                                {viewMode === 'COMPRAS' && 'Compras'}
                                {viewMode === 'PERSONAS' && 'Personas'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {showDateFilter && (
                                <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
                                    <button
className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${dateRange === 'DAY' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                    onClick={() => setDateRange('DAY')}
                                    >Hoy</button>
                                    <button
                                        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${dateRange === 'MONTH' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                        onClick={() => setDateRange('MONTH')}
                                    >Este mes</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-2xl border border-gray-200 shadow-sm w-fit">
                        {DASHBOARD_VIEWS.map(({ id, label, icon }) => (
                            <button
                                key={id}
                                onClick={() => setViewMode(id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === id ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                {icon}
                                {label}
                            </button>
                        ))}
                    </div>
                </header>

                {viewMode === 'RESUMEN' && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                        </div>
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Ventas Totales</h3>
                        <p className="text-4xl font-black text-gray-900 mt-2">${stats.totalSales.toLocaleString()}</p>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                                <ShoppingBag className="w-7 h-7" />
                            </div>
                        </div>
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Gastos / Compras</h3>
                        <p className="text-4xl font-black text-gray-900 mt-2">${stats.totalPurchases.toLocaleString()}</p>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <CreditCard className="w-7 h-7" />
                            </div>
                        </div>
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Cobros Recibidos</h3>
                        <p className="text-4xl font-black text-gray-900 mt-2">${stats.totalCollections.toLocaleString()}</p>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Users className="w-7 h-7" />
                            </div>
                        </div>
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Pendiente de Cobro</h3>
                        <p className="text-4xl font-black text-purple-600 mt-2">${stats.pendingCollect.toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                            <h3 className="text-2xl font-black text-gray-800 mb-4">Ventas últimos 12 meses</h3>
                            <div className="h-[300px] w-full">
                                {monthlyData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-gray-600 text-sm font-medium">Cargando datos...</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                                            <Tooltip formatter={(v: number | undefined) => [v != null ? `$${v.toLocaleString()}` : '', 'Ventas']} />
                                            <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        <div className="bg-blue-600 p-10 rounded-[40px] shadow-2xl shadow-blue-200 text-white flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
                            <div className="relative z-10 space-y-4">
                                <h3 className="text-3xl font-black">¿Necesitas un reporte más detallado?</h3>
                                <p className="text-blue-100 font-medium max-w-md">Descarga el balance general en PDF o Excel para compartirlo con tu contador o socios.</p>
                                <Link href="/reportes" className="inline-block px-8 py-4 bg-white text-blue-600 font-black rounded-2xl hover:scale-105 transition-all shadow-xl">
                                    Ir a Informes
                                </Link>
                            </div>
                            <FileText className="w-64 h-64 absolute -right-16 -bottom-16 text-blue-500/30 rotate-12" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black text-gray-800 mb-6">Estado de Caja</h3>
                            {(() => {
                                const total = stats.cashSales + stats.creditSales || 1;
                                const cashPct = Math.round((stats.cashSales / total) * 100);
                                const transferPct = 100 - cashPct;
                                return (
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <DollarSign className="w-6 h-6 text-emerald-600" />
                                                <span className="text-xs font-bold text-gray-700 uppercase">Efectivo</span>
                                            </div>
                                            <p className="text-2xl font-black text-gray-900">${stats.cashSales.toLocaleString()} <span className="text-sm font-bold text-emerald-600">{cashPct}%</span></p>
                                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
                                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${cashPct}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <CreditCard className="w-6 h-6 text-blue-600" />
                                                <span className="text-xs font-bold text-gray-700 uppercase">Transferencias</span>
                                            </div>
                                            <p className="text-2xl font-black text-gray-900">${stats.creditSales.toLocaleString()} <span className="text-sm font-bold text-blue-600">{transferPct}%</span></p>
                                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
                                                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${transferPct}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="bg-gray-900 p-10 rounded-[40px] shadow-xl text-white">
                            <h3 className="text-2xl font-black mb-6">Próximos Cobros</h3>
                            <div className="space-y-4">
                                {debtors.length === 0 ? (
                                    <p className="text-gray-600 text-sm">Sin deudas pendientes de cobro</p>
                                ) : (
                                    debtors.slice(0, 5).map(d => (
                                        <div key={d.id} className="flex justify-between items-center">
                                            <p className="text-sm font-bold truncate pr-2">{d.name}</p>
                                            <span className="text-sm font-black text-blue-400 shrink-0">${d.balance.toLocaleString()}</span>
                                        </div>
                                    ))
                                )}
                                <Link href="/personas" className="block w-full py-4 bg-gray-800 text-gray-300 font-bold rounded-2xl hover:text-white transition-all text-xs text-center">
                                    Ver todas las personas
                                </Link>
                            </div>
                        </div>

                        {fiscalLimit != null && (
                            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                <h3 className="text-xl font-black text-gray-800 mb-4">Monotributo (año en curso)</h3>
                                {(() => {
                                    const limit = fiscalLimit || 1;
                                    const pct = Math.min(100, (fiscalAnnualSales / limit) * 100);
                                    const monthsElapsed = Math.max(1, new Date().getMonth() + 1);
                                    const projection = (fiscalAnnualSales / monthsElapsed) * 12;
                                    const remaining = Math.max(0, limit - fiscalAnnualSales);
                                    const semaphore = pct >= 90 ? 'red' : pct >= 70 ? 'amber' : 'green';
                                    return (
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Facturación acumulada</span>
                                                <span className="font-bold text-gray-900">${fiscalAnnualSales.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Límite anual</span>
                                                <span className="font-bold text-gray-900">${limit.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        semaphore === 'red' ? 'bg-red-500' : semaphore === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`}
                                                    style={{ width: `${Math.min(100, pct)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs font-bold text-gray-600">
                                                <span>% usado: {pct.toFixed(1)}%</span>
                                                {semaphore === 'red' && <span className="text-red-600">Riesgo</span>}
                                                {semaphore === 'amber' && <span className="text-amber-600">Atención</span>}
                                                {semaphore === 'green' && <span className="text-emerald-600">OK</span>}
                                            </div>
                                            <div className="pt-2 border-t border-gray-300 space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Proyección anual</span>
                                                    <span className="font-bold">${projection.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Restante hasta tope</span>
                                                    <span className="font-bold text-gray-900">${remaining.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
                </>
                )}

                {viewMode === 'VENTAS' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total ventas</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">${salesTotal.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cantidad de ventas</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{salesCount}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Efectivo</p>
                                <p className="text-2xl font-black text-emerald-600 mt-1">${salesCash.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Transferencias</p>
                                <p className="text-2xl font-black text-blue-600 mt-1">${salesTransfer.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-black text-gray-800">Últimas ventas</h3>
                                <Link href="/ventas" className="text-sm font-bold text-blue-600 hover:underline">Ir a Ventas</Link>
                            </div>
                            <div className="space-y-2">
                                {lastSales.length === 0 ? <p className="text-gray-800 text-sm">Sin ventas en el período</p> : lastSales.map(s => (
                                    <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-200 text-sm">
                                        <span className="text-gray-800">{new Date(s.created_at).toLocaleString()}</span>
                                        <span className="font-bold tabular-nums text-gray-900">${s.total_amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'CAJA' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Saldo total</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">${totalBalance.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Efectivo entrado</p>
                                <p className="text-2xl font-black text-emerald-600 mt-1">${cajaBalance.cashIn.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Efectivo salido</p>
                                <p className="text-2xl font-black text-red-600 mt-1">${cajaBalance.cashOut.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Transferencias (entrada − salida)</p>
                                <p className="text-2xl font-black text-blue-600 mt-1">${netTransfer.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-black text-gray-800">Últimos movimientos</h3>
                                <Link href="/caja" className="text-sm font-bold text-blue-600 hover:underline">Ver Caja</Link>
                            </div>
                            <div className="space-y-2">
                                {cajaMovements.slice(0, 10).map(m => {
                                    const isEgress = m.type === 'EXPENSE' || m.type === 'DEBT_PAYMENT';
                                    return (
                                        <div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-300 text-sm">
                                            <span className="text-gray-800">{typeLabel[m.type] ?? m.type}</span>
                                            <span className={`font-bold tabular-nums ${isEgress ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {isEgress ? `-$${m.amount.toLocaleString()}` : `$${m.amount.toLocaleString()}`}
                                            </span>
                                        </div>
                                    );
                                })}
                                {cajaMovements.length === 0 && <p className="text-gray-800 text-sm">Sin movimientos</p>}
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'PRODUCTOS' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total productos</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{totalProducts}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-black text-gray-800 mb-4">Más vendidos (período)</h3>
                            <div className="space-y-2">
                                {topSold.length === 0 ? <p className="text-gray-800 text-sm">Sin ventas en el período</p> : topSold.map((t, idx) => (
                                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-200">
                                        <span className="truncate pr-2 text-gray-800">{t.product_name}</span>
                                        <span className="font-bold tabular-nums shrink-0 text-gray-900">${t.total.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <Link href="/productos" className="inline-block mt-4 text-sm font-bold text-blue-600 hover:underline">Ir a Productos</Link>
                        </div>
                    </div>
                )}

                {viewMode === 'COMPRAS' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total compras</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">${purchaseTotal.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cantidad de compras</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{purchaseCount}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Promedio por compra</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">${purchaseCount ? (purchaseTotal / purchaseCount).toLocaleString() : '0'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {byProvider.length > 0 && (
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-black text-gray-800 mb-4">Por proveedor</h3>
                                    <div className="space-y-2">
                                        {byProvider.map((b, i) => (
                                            <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-200">
                                                <span className="truncate pr-2 text-gray-800">{b.name}</span>
                                                <span className="font-bold tabular-nums shrink-0 text-gray-900">${b.total.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-gray-800 mb-4">Últimas compras</h3>
                                <div className="space-y-2">
                                    {lastPurchases.length === 0 ? <p className="text-gray-800 text-sm">Sin compras</p> : lastPurchases.map(p => (
                                        <div key={p.id} className="flex justify-between text-sm py-1 border-b border-gray-200">
                                            <div className="min-w-0">
                                                <span className="text-gray-900 block truncate">{p.providerName ?? 'Sin proveedor'}</span>
                                                <span className="text-xs text-gray-700">{new Date(p.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <span className="font-bold tabular-nums shrink-0 text-gray-900">${p.total_amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/compras" className="inline-block mt-4 text-sm font-bold text-blue-600 hover:underline">Ir a Compras</Link>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'PERSONAS' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total a cobrar (clientes)</p>
                                <p className="text-2xl font-black text-emerald-600 mt-1">${stats.pendingCollect.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total a pagar (proveedores)</p>
                                <p className="text-2xl font-black text-red-600 mt-1">${totalToPay.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Clientes con deuda</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{debtorsFull.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Proveedores con deuda</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{creditors.length}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-gray-800 mb-4">Principales deudores (me deben)</h3>
                                <div className="space-y-2">
                                    {debtorsFull.length === 0 ? <p className="text-gray-800 text-sm">Ninguno</p> : debtorsFull.slice(0, 8).map(d => (
                                        <div key={d.id} className="flex justify-between text-sm py-1 border-b border-gray-200">
                                            <span className="truncate pr-2 text-gray-900">{d.name}</span>
                                            <span className="font-bold text-emerald-600 shrink-0">${d.balance.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-gray-800 mb-4">Principales acreedores (les debo)</h3>
                                <div className="space-y-2">
                                    {creditors.length === 0 ? <p className="text-gray-800 text-sm">Ninguno</p> : creditors.slice(0, 8).map(c => (
                                        <div key={c.id} className="flex justify-between text-sm py-1 border-b border-gray-200">
                                            <span className="truncate pr-2 text-gray-800">{c.name}</span>
                                            <span className="font-bold text-red-600 shrink-0">${c.balance.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Link href="/personas" className="inline-block px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800">Ver todas las personas</Link>
                    </div>
                )}
            </div>
        </main>
    );
}
