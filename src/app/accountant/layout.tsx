'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, User, LogOut } from 'lucide-react';

const headerLink = (active: boolean) =>
  `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`;

export default function AccountantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAuth();

  if (profile?.role !== 'accountant') {
    router.replace('/dashboard');
    return null;
  }

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-30 shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/accountant" className="font-bold text-blue-600 text-lg whitespace-nowrap">
              Estudio
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/accountant"
                className={headerLink(pathname === '/accountant')}
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                Dashboard
              </Link>
              <Link
                href="/accountant/clients"
                className={headerLink(pathname === '/accountant/clients')}
              >
                <Users className="w-5 h-5 shrink-0" />
                Clientes
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-700">
              <User className="w-4 h-4" />
              Contador
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 min-h-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
