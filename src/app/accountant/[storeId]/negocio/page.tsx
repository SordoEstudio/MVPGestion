'use client';

import { use, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { KpiCard } from '@/components/KpiCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function ClientNegocioPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const [loading, setLoading] = useState(true);
  const [resultadoMes, setResultadoMes] = useState(0);
  const [ventasMes, setVentasMes] = useState(0);
  const [margenPct, setMargenPct] = useState(0);
  const [ticketPromedio, setTicketPromedio] = useState(0);
  const [cantidadVentas, setCantidadVentas] = useState(0);
  const [gastosFijosMes, setGastosFijosMes] = useState(0);
  const [tendenciaResultado, setTendenciaResultado] = useState<{ month: string; resultado: number }[]>([]);
  const [ventasVsGastos, setVentasVsGastos] = useState<{ month: string; ventas: number; gastos: number }[]>([]);

  useEffect(() => {
    if (!storeId) return;
    const now = new Date();

    (async () => {
      const months: { month: string; resultado: number; ventas: number; gastos: number; countSales: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mStart = d.toISOString().slice(0, 10);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const [sales, expenses] = await Promise.all([
          supabase.from('transactions').select('total_amount').eq('store_id', storeId).eq('type', 'SALE').gte('created_at', mStart).lte('created_at', mEnd),
          supabase.from('transactions').select('total_amount').eq('store_id', storeId).eq('type', 'EXPENSE').gte('created_at', mStart).lte('created_at', mEnd),
        ]);
        const v = (sales.data ?? []).reduce((s, t) => s + Number(t.total_amount), 0);
        const g = (expenses.data ?? []).reduce((s, t) => s + Number(t.total_amount), 0);
        months.push({ month: mStart.slice(0, 7), resultado: v - g, ventas: v, gastos: g, countSales: (sales.data ?? []).length });
      }

      setTendenciaResultado(months.map((m) => ({ month: m.month, resultado: m.resultado })));
      setVentasVsGastos(months.map((m) => ({ month: m.month, ventas: m.ventas, gastos: m.gastos })));

      const current = months[months.length - 1];
      const ventas = current.ventas;
      const gastos = current.gastos;
      const resultado = ventas - gastos;
      const countSales = current.countSales;

      setResultadoMes(resultado);
      setVentasMes(ventas);
      setMargenPct(ventas > 0 ? (resultado / ventas) * 100 : 0);
      setTicketPromedio(countSales > 0 ? ventas / countSales : 0);
      setCantidadVentas(countSales);
      setGastosFijosMes(gastos);
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

  const pe = gastosFijosMes;
  const diferenciaVsPE = ventasMes - pe;
  const peCumplidoPct = pe > 0 ? (ventasMes / pe) * 100 : 0;

  const analisisText =
    pe > 0
      ? `Las ventas del mes ${peCumplidoPct >= 100 ? 'cubren' : 'no cubren'} el punto de equilibrio en un ${peCumplidoPct.toFixed(0)}%. ${ventasMes > 0 ? `Margen promedio ${margenPct.toFixed(0)}%.` : ''}`
      : 'Sin gastos fijos cargados para el período.';

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-black text-gray-900">Negocio</h2>

      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">KPIs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard title="Resultado mensual" value={`$${resultadoMes.toLocaleString()}`} severity={resultadoMes < 0 ? 'danger' : 'normal'} />
          <KpiCard title="Margen %" value={margenPct.toFixed(1) + '%'} />
          <KpiCard title="Ticket promedio" value={`$${ticketPromedio.toLocaleString()}`} subtitle={`${cantidadVentas} ventas`} />
          <KpiCard title="Punto equilibrio (gastos fijos mes)" value={`$${pe.toLocaleString()}`} />
          <KpiCard title="Diferencia vs PE" value={`$${diferenciaVsPE.toLocaleString()}`} severity={diferenciaVsPE < 0 ? 'danger' : 'normal'} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Tendencia resultado (6 meses)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendenciaResultado}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number | undefined) => [v != null ? `$${v.toLocaleString()}` : '', 'Resultado']} />
                <Line type="monotone" dataKey="resultado" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Ventas vs gastos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasVsGastos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number | undefined) => [v != null ? `$${v.toLocaleString()}` : '', '']} />
                <Bar dataKey="ventas" fill="#2563eb" name="Ventas" />
                <Bar dataKey="gastos" fill="#dc2626" name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="font-bold text-gray-800 mb-2">Análisis</h3>
        <p className="text-gray-700">{analisisText}</p>
      </section>
    </div>
  );
}
