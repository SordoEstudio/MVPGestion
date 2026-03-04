'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/contexts/StoreContext';
import { Store, ArrowRight } from 'lucide-react';
import { DataTable } from '@/components/DataTable';

type StoreRow = { id: string; name: string };

export default function AccountantClientsPage() {
  const router = useRouter();
  const { stores, setStoreId, loading: storeLoading } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(storeLoading);
  }, [storeLoading]);

  const handleSelect = (id: string) => {
    setStoreId(id);
    router.push(`/accountant/${id}`);
  };

  const columns = [
    { key: 'name', label: 'Comercio', sortKey: 'name' as const },
    {
      key: 'actions',
      label: '',
      align: 'right' as const,
      render: (row: StoreRow) => (
        <button
          type="button"
          onClick={() => handleSelect(row.id)}
          className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          Entrar
          <ArrowRight className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Clientes</h1>
        <p className="text-gray-600 mt-1">Seleccioná un comercio para ver su panel operativo, fiscal e informes.</p>
      </div>

      {stores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-600">
          <Store className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-medium">No tenés comercios asignados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <DataTable
            columns={columns}
            data={stores}
            keyExtractor={(row) => row.id}
            emptyMessage="Sin clientes"
          />
        </div>
      )}
    </div>
  );
}
