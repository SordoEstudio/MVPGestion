'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LogoutButton() {
  const router = useRouter();
  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };
  return (
    <button
      onClick={logout}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Salir
    </button>
  );
}
