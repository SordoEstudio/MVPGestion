'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/contexts/StoreContext';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  TrendingUp,
  FileBarChart,
  ArrowLeft,
} from 'lucide-react';
import { BadgeRiesgo } from '@/components/BadgeRiesgo';

const navLink = (active: boolean) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`;

export default function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const pathname = usePathname();
  const { setStoreId } = useStore();
  const { storeId } = use(params);
  const [storeName, setStoreName] = useState<string>('');
  const [riskPct, setRiskPct] = useState<number>(0);

  useEffect(() => {
    setStoreId(storeId);
  }, [storeId, setStoreId]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('stores').select('name, limite_anual').eq('id', storeId).maybeSingle();
      setStoreName(data?.name ?? 'Comercio');
      const year = new Date().getFullYear();
      const { data: view } = await supabase.from('view_annual_sales_by_store').select('total_sales').eq('store_id', storeId).eq('year', year).maybeSingle();
      const total = Number(view?.total_sales ?? 0);
      const limit = Number(data?.limite_anual ?? 1);
      setRiskPct(limit > 0 ? (total / limit) * 100 : 0);
    })();
  }, [storeId]);

  const base = `/accountant/${storeId}`;
  const links = [
    { href: base, label: 'Resumen', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    { href: `${base}/fiscal`, label: 'Fiscal', icon: <Receipt className="w-5 h-5 shrink-0" /> },
    { href: `${base}/impositivo`, label: 'Impositivo', icon: <FileText className="w-5 h-5 shrink-0" /> },
    { href: `${base}/negocio`, label: 'Negocio', icon: <TrendingUp className="w-5 h-5 shrink-0" /> },
    { href: `${base}/informes`, label: 'Informes', icon: <FileBarChart className="w-5 h-5 shrink-0" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/accountant/clients"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 shrink-0"
              title="Cambiar cliente"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 truncate">{storeName}</h1>
              <p className="text-xs text-gray-500">Cliente activo</p>
            </div>
            <BadgeRiesgo percentage={riskPct} className="shrink-0" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-52 shrink-0 border-r border-gray-200 bg-white py-4 px-2">
          <nav className="space-y-0.5">
            {links.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={navLink(pathname === href)}
              >
                {icon}
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
