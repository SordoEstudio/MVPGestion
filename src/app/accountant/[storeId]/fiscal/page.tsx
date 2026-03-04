'use client';

import { use, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { KpiCard } from '@/components/KpiCard';
import { BarraProgresoTope } from '@/components/BarraProgresoTope';
import { BadgeRiesgo } from '@/components/BadgeRiesgo';
import { AlertCard } from '@/components/AlertCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ClientFiscalPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const [loading, setLoading] = useState(true);
  const [annualSales, setAnnualSales] = useState(0);
  const [limit, setLimit] = useState<number | null>(null);
  const [ventasMesActual, setVentasMesActual] = useState(0);
  const [ventasMesAnterior, setVentasMesAnterior] = useState(0);
  const [comprasMes, setComprasMes] = useState(0);
  const [resultadoMes, setResultadoMes] = useState(0);
  const [monthlyChart, setMonthlyChart] = useState<{ month: string; ventas: number }[]>([]);
  const [cashPct, setCashPct] = useState(50);
  const [alerts, setAlerts] = useState<{ message: string; severity: 'info' | 'warning' | 'danger' }[]>([]);

  useEffect(() => {
    if (!storeId) return;
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    (async () => {
      const [storeRes, viewRes, salesCur, salesPrev, expensesCur, txIdsRes] = await Promise.all([
        supabase.from('stores').select('limite_anual').eq('id', storeId).maybeSingle(),
        supabase.from('view_annual_sales_by_store').select('total_sales').eq('store_id', storeId).eq('year', currentYear).maybeSingle(),
        supabase.from('transactions').select('total_amount').eq('store_id', storeId).eq('type', 'SALE').eq('status', 'COMPLETED').gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('transactions').select('total_amount').eq('store_id', storeId).eq('type', 'SALE').eq('status', 'COMPLETED').gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
        supabase.from('transactions').select('total_amount').eq('store_id', storeId).eq('type', 'EXPENSE').eq('status', 'COMPLETED').gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('transactions').select('id').eq('store_id', storeId),
      ]);

      const lim = storeRes.data?.limite_anual ?? null;
      const annual = Number(viewRes.data?.total_sales ?? 0);
      setLimit(lim);
      setAnnualSales(annual);

      const vActual = (salesCur.data ?? []).reduce((s, t) => s + Number(t.total_amount), 0);
      const vAnterior = (salesPrev.data ?? []).reduce((s, t) => s + Number(t.total_amount), 0);
      const gastos = (expensesCur.data ?? []).reduce((s, t) => s + Number(t.total_amount), 0);
      setVentasMesActual(vActual);
      setVentasMesAnterior(vAnterior);
      setComprasMes(gastos);
      setResultadoMes(vActual - gastos);

      const variacion = vAnterior > 0 ? ((vActual - vAnterior) / vAnterior) * 100 : 0;
      if (variacion > 40) {
        setAlerts((a) => [...a, { message: `Crecimiento > 40% vs mes anterior (${variacion.toFixed(0)}%)`, severity: 'warning' }]);
      }

      const ids = (txIdsRes.data ?? []).map((t: { id: string }) => t.id);
      if (ids.length > 0) {
        const { data: payments } = await supabase.from('payments').select('amount, method, transactions(type, created_at)').in('transaction_id', ids);
        let cash = 0, transfer = 0;
        (payments ?? []).forEach((p: Record<string, unknown>) => {
          const tx = Array.isArray(p.transactions) ? p.transactions[0] : p.transactions;
          if ((tx as { type?: string })?.type !== 'SALE' && (tx as { type?: string })?.type !== 'DEBT_COLLECTION') return;
          const amt = Number((p as { amount?: number }).amount);
          const method = (p as { method?: string }).method;
          if (method === 'CASH' || method === 'QR') cash += amt;
          else transfer += amt;
        });
        const total = cash + transfer || 1;
        setCashPct((cash / total) * 100);
      }

      const months: { month: string; ventas: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mStart = d.toISOString().slice(0, 10);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const { data } = await supabase.from('transactions').select('total_amount').eq('store_id', storeId).eq('type', 'SALE').eq('status', 'COMPLETED').gte('created_at', mStart).lte('created_at', mEnd);
        months.push({ month: mStart.slice(0, 7), ventas: (data ?? []).reduce((s, t) => s + Number(t.total_amount), 0) });
      }
      setMonthlyChart(months);
      setLoading(false);
    })();
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  const limite = limit ?? 1;
  const pct = (annualSales / limite) * 100;
  const monthsElapsed = Math.max(1, new Date().getMonth() + 1);
  const projection = (annualSales / monthsElapsed) * 12;
  const remaining = Math.max(0, limite - annualSales);
  const variacion = ventasMesAnterior > 0 ? ((ventasMesActual - ventasMesAnterior) / ventasMesAnterior) * 100 : 0;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-black text-gray-900">Fiscal</h2>

      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Monotributo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard title="Facturación anual acumulada" value={`$${annualSales.toLocaleString()}`} />
          <KpiCard title="Límite categoría" value={limit != null ? `$${limit.toLocaleString()}` : '-'} />
          <KpiCard title="% usado" value={pct.toFixed(1) + '%'} severity={pct >= 85 ? 'danger' : pct >= 70 ? 'warning' : 'normal'} />
          <KpiCard title="Proyección anual" value={`$${projection.toLocaleString()}`} />
        </div>
        <div className="mb-2">
          <BarraProgresoTope percentage={pct} showLabel />
        </div>
        <p className="text-sm text-gray-600">Diferencia restante hasta tope: <strong>${remaining.toLocaleString()}</strong></p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number | undefined) => [v != null ? `$${v.toLocaleString()}` : '', 'Ventas']} />
              <Line type="monotone" dataKey="ventas" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Control mensual</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Ventas mes actual" value={`$${ventasMesActual.toLocaleString()}`} />
          <KpiCard title="Ventas mes anterior" value={`$${ventasMesAnterior.toLocaleString()}`} />
          <KpiCard title="Variación %" value={`${variacion >= 0 ? '+' : ''}${variacion.toFixed(1)}%`} trend={variacion} />
          <KpiCard title="Compras mes" value={`$${comprasMes.toLocaleString()}`} />
          <KpiCard title="Resultado mes" value={`$${resultadoMes.toLocaleString()}`} severity={resultadoMes < 0 ? 'danger' : 'normal'} />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Riesgo fiscal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase">Efectivo vs transferencia (ventas)</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{cashPct.toFixed(0)}% efectivo / {(100 - cashPct).toFixed(0)}% transfer.</p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: `${cashPct}%` }} />
              <div className="bg-blue-500 h-full" style={{ width: `${100 - cashPct}%` }} />
            </div>
          </div>
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <AlertCard key={i} message={a.message} severity={a.severity} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
