'use client';

import { use, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ClientImpositivoPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const [period, setPeriod] = useState<{ month: number; year: number }>(() => {
    const d = new Date();
    return { month: d.getMonth(), year: d.getFullYear() };
  });
  const [loading, setLoading] = useState(false);

  const startStr = new Date(period.year, period.month, 1).toISOString();
  const endStr = new Date(period.year, period.month + 1, 0, 23, 59, 59).toISOString();

  const downloadFacturacion = async () => {
    setLoading(true);
    const { data } = await supabase.from('transactions').select('id, total_amount, created_at, type').eq('store_id', storeId).eq('type', 'SALE').gte('created_at', startStr).lte('created_at', endStr).order('created_at');
    const rows = (data ?? []).map((t) => ({ Fecha: t.created_at?.slice(0, 10), Total: t.total_amount, Tipo: t.type }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Facturación');
    XLSX.writeFile(wb, `facturacion-${period.year}-${period.month + 1}.xlsx`);
    setLoading(false);
  };

  const downloadResumenMensual = async () => {
    setLoading(true);
    const [sales, expenses] = await Promise.all([
      supabase.from('transactions').select('total_amount').eq('store_id', storeId).eq('type', 'SALE').gte('created_at', startStr).lte('created_at', endStr),
      supabase.from('transactions').select('total_amount').eq('store_id', storeId).eq('type', 'EXPENSE').gte('created_at', startStr).lte('created_at', endStr),
    ]);
    const ventas = (sales.data ?? []).reduce((s, t) => s + Number(t.total_amount), 0);
    const gastos = (expenses.data ?? []).reduce((s, t) => s + Number(t.total_amount), 0);
    const ws = XLSX.utils.json_to_sheet([{ Período: `${period.year}-${period.month + 1}`, Ventas: ventas, Gastos: gastos, Resultado: ventas - gastos }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
    XLSX.writeFile(wb, `resumen-${period.year}-${period.month + 1}.xlsx`);
    setLoading(false);
  };

  const downloadLibroIngresos = async () => {
    setLoading(true);
    const { data } = await supabase.from('transactions').select('id, total_amount, created_at').eq('store_id', storeId).eq('type', 'SALE').gte('created_at', startStr).lte('created_at', endStr).order('created_at');
    const rows = (data ?? []).map((t, i) => ({ Número: i + 1, Fecha: t.created_at?.slice(0, 10), Importe: t.total_amount }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ingresos');
    XLSX.writeFile(wb, `libro-ingresos-${period.year}-${period.month + 1}.xlsx`);
    setLoading(false);
  };

  const downloadCuentas = async () => {
    setLoading(true);
    const { data } = await supabase.from('people').select('name, type, balance').eq('store_id', storeId).order('balance', { ascending: false });
    const rows = (data ?? []).map((p) => ({ Nombre: p.name, Tipo: p.type, Saldo: p.balance }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cuentas');
    XLSX.writeFile(wb, `cobrar-pagar-${period.year}-${period.month + 1}.xlsx`);
    setLoading(false);
  };

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const cards = [
    { title: 'Facturación detallada', desc: 'Detalle de ventas del período.', onDownload: downloadFacturacion },
    { title: 'Resumen mensual', desc: 'Ventas, gastos y resultado del mes.', onDownload: downloadResumenMensual },
    { title: 'Libro ingresos', desc: 'Registro de ingresos para impositivo.', onDownload: downloadLibroIngresos },
    { title: 'Estado cuentas cobrar/pagar', desc: 'Clientes y proveedores con saldo.', onDownload: downloadCuentas },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-black text-gray-900">Impositivo</h2>

      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Período</h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Mes</label>
            <select
              value={period.month}
              onChange={(e) => setPeriod((p) => ({ ...p, month: Number(e.target.value) }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            >
              {months.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Año</label>
            <select
              value={period.year}
              onChange={(e) => setPeriod((p) => ({ ...p, year: Number(e.target.value) }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.title} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-10 h-10 text-blue-600 shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">{c.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{c.desc}</p>
                <button
                  type="button"
                  onClick={c.onDownload}
                  disabled={loading}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Descargar Excel
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
