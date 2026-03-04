'use client';

import { use } from 'react';
import OwnerDashboard from '@/app/dashboard/page';

export default function ClientResumenPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  return <OwnerDashboard storeIdOverride={storeId} />;
}
