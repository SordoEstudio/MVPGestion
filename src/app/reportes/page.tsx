'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileBarChart, Download, DollarSign, CreditCard, Wallet, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

type PeriodType = 'MONTHLY' | 'ANNUAL';

interface BillingSummary {
  totalSales: number;
  totalTransactions: number;
  byMethod: { method: string; amount: number }[];
  byMonth?: { month: string; total: number }[];
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  QR: 'QR',
  CREDIT_CUSTOMER: 'Fiado'
};

export default function ReportesPage() {
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<PeriodType>('MONTHLY');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [summary, setSummary] = useState<BillingSummary>({
    totalSales: 0,
    totalTransactions: 0,
    byMethod: []
  });

  useEffect(() => {
    fetchReport();
  }, [periodType, selectedYear, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let startDate: string;
      let endDate: string;

      if (periodType === 'MONTHLY') {
        const month = selectedMonth.toString().padStart(2, '0');
        startDate = `${selectedYear}-${month}-01T00:00:00`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        endDate = `${selectedYear}-${month}-${lastDay}T23:59:59`;
      } else {
        startDate = `${selectedYear}-01-01T00:00:00`;
        endDate = `${selectedYear}-12-31T23:59:59`;
      }

      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select(`
          id,
          total_amount,
          created_at,
          payments (method, amount)
        `)
        .eq('type', 'SALE')
        .eq('status', 'COMPLETED')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (txError) throw txError;

      let totalSales = 0;
      const methodMap: Record<string, number> = {};
      const byMonthMap: Record<string, number> = {};

      transactions?.forEach((tx: any) => {
        const amount = parseFloat(tx.total_amount) || 0;
        totalSales += amount;

        const date = new Date(tx.created_at);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        byMonthMap[monthKey] = (byMonthMap[monthKey] || 0) + amount;

        tx.payments?.forEach((p: { method: string; amount: number }) => {
          const amt = parseFloat(String(p.amount)) || 0;
          methodMap[p.method] = (methodMap[p.method] || 0) + amt;
        });
      });

      const byMethod = Object.entries(methodMap).map(([method, amount]) => ({
        method: METHOD_LABELS[method] || method,
        amount
      }));

      const byMonth = periodType === 'ANNUAL'
        ? Object.entries(byMonthMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, total]) => ({
              month: MONTH_NAMES[parseInt(month.split('-')[1], 10) - 1] + ' ' + month.split('-')[0],
              total
            }))
        : undefined;

      setSummary({
        totalSales,
        totalTransactions: transactions?.length || 0,
        byMethod,
        byMonth
      });
    } catch (error: any) {
      console.error(error);
      toast.error('Error al cargar el reporte');
      setSummary({ totalSales: 0, totalTransactions: 0, byMethod: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleExportXls = () => {
    const periodLabel = periodType === 'MONTHLY'
      ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
      : `Año ${selectedYear}`;

    const wsData: (string | number)[][] = [
      ['Resumen General de Facturación'],
      ['Período:', periodLabel],
      [],
      ['Total Ventas', summary.totalSales],
      ['Cantidad de transacciones', summary.totalTransactions],
      [],
      ['Por método de pago'],
      ...summary.byMethod.map(m => [m.method, m.amount])
    ];

    if (summary.byMonth && summary.byMonth.length > 0) {
      wsData.push([]);
      wsData.push(['Desglose mensual']);
      wsData.push(['Mes', 'Total']);
      summary.byMonth.forEach(m => wsData.push([m.month, m.total]));
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Facturación');
    const filename = `facturacion_${periodType === 'MONTHLY' ? `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}` : selectedYear}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success('Reporte exportado');
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 font-medium">Cargando reporte...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 font-medium">
              &larr; Volver
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileBarChart className="w-7 h-7 text-blue-600" />
                Reportes
              </h1>
              <p className="text-sm text-gray-500">Resumen general de facturación</p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Período
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2 p-1.5 bg-gray-100 rounded-xl">
              <button
                onClick={() => setPeriodType('MONTHLY')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${periodType === 'MONTHLY' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setPeriodType('ANNUAL')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${periodType === 'ANNUAL' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                Anual
              </button>
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {periodType === 'MONTHLY' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Ventas</h3>
            </div>
            <p className="text-2xl font-black text-gray-900">${summary.totalSales.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transacciones</h3>
            </div>
            <p className="text-2xl font-black text-gray-900">{summary.totalTransactions}</p>
          </div>

          {summary.byMethod.slice(0, 2).map((m) => (
            <div key={m.method} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  {m.method === 'Efectivo' ? <Wallet className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                </div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{m.method}</h3>
              </div>
              <p className="text-2xl font-black text-gray-900">${m.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {summary.byMethod.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Desglose por método de pago</h3>
            <div className="space-y-3">
              {summary.byMethod.map((m) => (
                <div key={m.method} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="font-medium text-gray-700">{m.method}</span>
                  <span className="font-bold text-gray-900">${m.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.byMonth && summary.byMonth.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Desglose mensual ({selectedYear})</h3>
            <div className="space-y-3">
              {summary.byMonth.map((m) => (
                <div key={m.month} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="font-medium text-gray-700">{m.month}</span>
                  <span className="font-bold text-gray-900">${m.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleExportXls}
          className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
        >
          <Download className="w-5 h-5" />
          Exportar a Excel (.xlsx)
        </button>
      </div>
    </main>
  );
}
