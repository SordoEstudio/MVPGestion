
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role === 'OWNER') router.push('/dashboard');
    if (role === 'ACCOUNTANT') router.push('/contador');
    setLoading(false);
  }, [router]);

  const selectRole = (role: 'OWNER' | 'ACCOUNTANT') => {
    localStorage.setItem('user_role', role);
    if (role === 'OWNER') router.push('/dashboard');
    if (role === 'ACCOUNTANT') router.push('/contador');
  };

  if (loading) return null;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block p-4 bg-blue-600 rounded-2xl shadow-xl mb-4">
            <h1 className="text-4xl font-black tracking-tight text-white">KISS</h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Bienvenido de nuevo</h2>
          <p className="text-lg text-gray-500">Selecciona tu perfil de acceso</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => selectRole('OWNER')}
            className="group relative flex items-center gap-6 p-8 bg-white rounded-3xl shadow-sm border-2 border-transparent hover:border-blue-600 hover:shadow-xl transition-all active:scale-95 text-left"
          >
            <div className="h-16 w-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800">Local / Dueño</h3>
              <p className="text-sm text-gray-500">Acceso directo a ventas, caja y stock</p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-300 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => selectRole('ACCOUNTANT')}
            className="group relative flex items-center gap-6 p-8 bg-white rounded-3xl shadow-sm border-2 border-transparent hover:border-indigo-600 hover:shadow-xl transition-all active:scale-95 text-left"
          >
            <div className="h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800">Contador / Administrador</h3>
              <p className="text-sm text-gray-500">Gestión de múltiples clientes y reportes</p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        <div className="text-center text-xs text-gray-400 pt-8 uppercase tracking-widest font-bold">
          Sistema de Gestión Simplificado v2.0
        </div>
      </div>
    </main>
  );
}
