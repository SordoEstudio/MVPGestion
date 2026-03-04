'use client';

import { use, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DataTable } from '@/components/DataTable';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

type ReportRow = {
  id: string;
  type: string;
  period: string;
  generated_at: string;
};

export default function ClientInformesPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      const { data } = await supabase.from('transactions').select('id, type, created_at').eq('store_id', storeId).order('created_at', { ascending: false }).limit(100);
      const byMonth = new Map<string, { sales: number; expenses: number }>();
      (data ?? []).forEach((t: { id: string; type: string; created_at: string }) => {
        const key = t.created_at.slice(0, 7);
        const cur = byMonth.get(key) ?? { sales: 0, expenses: 0 };
        const amt = 0;
        if (t.type === 'SALE') cur.sales += 1;
        if (t.type === 'EXPENSE') cur.expenses += 1;
        byMonth.set(key, cur);
      });
      const rows: ReportRow[] = [
        { id: '1', type: 'Resumen mensual', period: 'Último mes', generated_at: new Date().toISOString().slice(0, 10) },
        { id: '2', type: 'Facturación detallada', period: 'Año en curso', generated_at: new Date().toISOString().slice(0, 10) },
      ];
      setReports(rows);
      setLoading(false);
    })();
  }, [storeId]);

  const handleDownload = (type: string) => {
    const now = new Date();
    const startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endStr = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    if (type === 'Resumen mensual') {
      supabase.from('transactions').select('type, total_amount, created_at').eq('store_id', storeId).gte('created_at', startStr).lte('created_at', endStr).then(({ data }) => {
        const ws = XLSX.utils.json_to_sheet((data ?? []).map((t) => ({ Tipo: t.type, Total: t.total_amount, Fecha: t.created_at?.slice(0, 10) })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
        XLSX.writeFile(wb, `informe-resumen-${now.getFullYear()}-${now.getMonth() + 1}.xlsx`);
      });
    } else {
      supabase.from('transactions').select('type, total_amount, created_at').eq('store_id', storeId).eq('type', 'SALE').then(({ data }) => {
        const ws = XLSX.utils.json_to_sheet((data ?? []).map((t) => ({ Fecha: t.created_at?.slice(0, 10), Total: t.total_amount })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Facturación');
        XLSX.writeFile(wb, `informe-facturacion-${now.getFullYear()}.xlsx`);
      });
    }
  };

  const columns = [
    { key: 'type', label: 'Tipo' },
    { key: 'period', label: 'Período' },
    { key: 'generated_at', label: 'Fecha generación' },
    {
      key: 'actions',
      label: '',
      align: 'right' as const,
      render: (row: ReportRow) => (
        <button
          type="button"
          onClick={() => handleDownload(row.type)}
          className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          <Download className="w-4 h-4" />
          Descargar
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-black text-gray-900">Informes</h2>
      <p className="text-gray-600">Generá o descargá informes por tipo y período.</p>
      <DataTable
        columns={columns}
        data={reports}
        keyExtractor={(r) => r.id}
        emptyMessage="Sin informes generados"
      />
    </div>
  );
}
