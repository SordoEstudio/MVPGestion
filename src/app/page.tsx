'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (profile?.role === 'accountant') {
      router.replace('/accountant');
    } else {
      router.replace('/ventas');
    }
  }, [user, profile?.role, loading, router]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600 font-medium">Cargando...</div>
    </main>
  );
}
