'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { KpiCard } from '@/components/KpiCard';
import { DataTable } from '@/components/DataTable';
import { BarraProgresoTope } from '@/components/BarraProgresoTope';
import { BadgeRiesgo } from '@/components/BadgeRiesgo';
import { AlertCard } from '@/components/AlertCard';

interface FiscalRow {
  id: string;
  name: string;
  total_sales: number;
  limite_anual: number | null;
  pct: number;
  projection: number;
  resultado_mes: number;
  risk: 'alto' | 'medio' | 'bajo';
}

export default function AccountantDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [fiscalRows, setFiscalRows] = useState<FiscalRow[]>([]);
  const [orderBy, setOrderBy] = useState<string>('pct');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('desc');
  const [alerts, setAlerts] = useState<{ message: string; severity: 'info' | 'warning' | 'danger'; storeId?: string }[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    const currentYear = new Date().getFullYear();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: stores } = await supabase.from('stores').select('id, name, limite_anual').order('name');
    const { data: viewData } = await supabase.from('view_annual_sales_by_store').select('store_id, total_sales').eq('year', currentYear);

    const byStore = new Map<string, number>();
    (viewData ?? []).forEach((r: { store_id: string; total_sales: number }) => {
      byStore.set(r.store_id, Number(r.total_sales ?? 0));
    });

    const { data: salesMonth } = await supabase
      .from('transactions')
      .select('store_id, total_amount')
      .eq('type', 'SALE')
      .eq('status', 'COMPLETED')
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd);
    const { data: expensesMonth } = await supabase
      .from('transactions')
      .select('store_id, total_amount')
      .eq('type', 'EXPENSE')
      .eq('status', 'COMPLETED')
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd);

    const ventasPorStore = new Map<string, number>();
    (salesMonth ?? []).forEach((r: { store_id: string; total_amount: number }) => {
      ventasPorStore.set(r.store_id, (ventasPorStore.get(r.store_id) ?? 0) + Number(r.total_amount));
    });
    const gastosPorStore = new Map<string, number>();
    (expensesMonth ?? []).forEach((r: { store_id: string; total_amount: number }) => {
      gastosPorStore.set(r.store_id, (gastosPorStore.get(r.store_id) ?? 0) + Number(r.total_amount));
    });

    const monthsElapsed = Math.max(1, now.getMonth() + 1);
    const rows: FiscalRow[] = (stores ?? []).map((s: { id: string; name: string; limite_anual: number | null }) => {
      const total_sales = byStore.get(s.id) ?? 0;
      const limit = s.limite_anual ?? 1;
      const pct = (total_sales / limit) * 100;
      const projection = (total_sales / monthsElapsed) * 12;
      const ventasMes = ventasPorStore.get(s.id) ?? 0;
      const gastosMes = gastosPorStore.get(s.id) ?? 0;
      const resultado_mes = ventasMes - gastosMes;
      const risk: FiscalRow['risk'] = pct >= 90 ? 'alto' : pct >= 80 ? 'medio' : 'bajo';
      return {
        id: s.id,
        name: s.name,
        total_sales,
        limite_anual: s.limite_anual,
        pct,
        projection,
        resultado_mes,
        risk,
      };
    });

    setFiscalRows(rows);

    const totalFacturacion = rows.reduce((s, r) => s + r.total_sales, 0);
    const avgPct = rows.length ? rows.reduce((s, r) => s + r.pct, 0) / rows.length : 0;
    const enRiesgo = rows.filter((r) => r.pct >= 85).length;
    const conPerdida = rows.filter((r) => r.resultado_mes < 0).length;

    setKpis({ totalFacturacion, avgPct, enRiesgo, conPerdida });

    const alertList: { message: string; severity: 'info' | 'warning' | 'danger'; storeId?: string }[] = [];
    rows.forEach((r) => {
      if (r.pct >= 90) {
        alertList.push({ message: `${r.name} superó 90% del tope`, severity: 'danger', storeId: r.id });
      } else if (r.pct >= 85) {
        alertList.push({ message: `${r.name} se acerca al tope (${r.pct.toFixed(0)}%)`, severity: 'warning', storeId: r.id });
      }
      if (r.resultado_mes < 0) {
        alertList.push({ message: `${r.name} con pérdida mensual ($${Math.abs(r.resultado_mes).toLocaleString()})`, severity: 'warning', storeId: r.id });
      }
    });
    setAlerts(alertList);
    setLoading(false);
  };

  const [kpis, setKpis] = useState({
    totalFacturacion: 0,
    avgPct: 0,
    enRiesgo: 0,
    conPerdida: 0,
  });

  const sortedRows = [...fiscalRows].sort((a, b) => {
    const key = orderBy as keyof FiscalRow;
    const va = a[key];
    const vb = b[key];
    if (typeof va === 'number' && typeof vb === 'number') return orderDir === 'desc' ? vb - va : va - vb;
    if (typeof va === 'string' && typeof vb === 'string') return orderDir === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb);
    return 0;
  });

  const handleSort = (key: string) => {
    if (orderBy === key) setOrderDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else setOrderBy(key);
  };

  const columns = [
    { key: 'name', label: 'Comercio', sortKey: 'name', render: (r: FiscalRow) => <Link href={`/accountant/${r.id}`} className="font-medium text-blue-600 hover:underline">{r.name}</Link> },
    { key: 'total_sales', label: 'Facturación', align: 'right' as const, sortKey: 'total_sales', render: (r: FiscalRow) => `$${r.total_sales.toLocaleString()}` },
    { key: 'limite_anual', label: 'Límite', align: 'right' as const, render: (r: FiscalRow) => r.limite_anual != null ? `$${r.limite_anual.toLocaleString()}` : '-' },
    { key: 'pct', label: '% Tope', align: 'right' as const, sortKey: 'pct', render: (r: FiscalRow) => <BarraProgresoTope percentage={r.pct} showLabel={true} /> },
    { key: 'projection', label: 'Proyección', align: 'right' as const, sortKey: 'projection', render: (r: FiscalRow) => `$${r.projection.toLocaleString()}` },
    { key: 'resultado_mes', label: 'Resultado mes', align: 'right' as const, sortKey: 'resultado_mes', render: (r: FiscalRow) => <span className={r.resultado_mes < 0 ? 'text-red-600 font-bold' : ''}>${r.resultado_mes.toLocaleString()}</span> },
    { key: 'risk', label: 'Riesgo', align: 'center' as const, sortKey: 'pct', render: (r: FiscalRow) => <BadgeRiesgo percentage={r.pct} /> },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-black text-gray-900">Dashboard estudio</h1>
        <p className="text-gray-600 mt-1">Priorización y control global de clientes.</p>
      </header>

      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">KPIs globales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Facturación acumulada (año)" value={`$${kpis.totalFacturacion.toLocaleString()}`} />
          <KpiCard title="Promedio % uso tope" value={kpis.avgPct.toFixed(1) + '%'} severity={kpis.avgPct >= 85 ? 'danger' : kpis.avgPct >= 70 ? 'warning' : 'normal'} />
          <KpiCard title="Clientes en riesgo (≥85%)" value={kpis.enRiesgo} severity={kpis.enRiesgo > 0 ? 'danger' : 'normal'} />
          <KpiCard title="Clientes con pérdida mensual" value={kpis.conPerdida} severity={kpis.conPerdida > 0 ? 'warning' : 'normal'} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Tabla prioridad fiscal</h2>
        <DataTable
          columns={columns}
          data={sortedRows}
          keyExtractor={(r) => r.id}
          orderBy={orderBy}
          orderDir={orderDir}
          onSort={handleSort}
          emptyMessage="Sin datos de comercios"
        />
      </section>

      {alerts.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Alertas globales</h2>
          <div className="space-y-3">
            {alerts.slice(0, 10).map((a, i) => (
              <AlertCard
                key={i}
                message={a.message}
                severity={a.severity}
                href={a.storeId ? `/accountant/${a.storeId}/fiscal` : undefined}
                linkLabel="Ver fiscal"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
