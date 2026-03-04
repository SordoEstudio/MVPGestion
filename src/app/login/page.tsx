'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, ArrowRight, User, Briefcase } from 'lucide-react';

const DEMO_CONTADOR = { email: 'contador@demo.com', password: 'contador123$' };
const DEMO_COMERCIANTE = { email: 'user@demo.com', password: 'user123$' };

export default function LoginPage() {
  const router = useRouter();
  const { signIn, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (!err) {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block p-4 bg-blue-600 rounded-2xl shadow-xl mb-4">
            <span className="text-4xl font-black tracking-tight text-white">GS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
          <p className="text-sm text-gray-600">Email y contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="tu@email.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Acceso demo</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setEmail(DEMO_CONTADOR.email); setPassword(DEMO_CONTADOR.password); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Rellenar contador
            </button>
            <button
              type="button"
              onClick={() => { setEmail(DEMO_COMERCIANTE.email); setPassword(DEMO_COMERCIANTE.password); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <User className="w-4 h-4 text-blue-600" />
              Rellenar comerciante
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Contador: {DEMO_CONTADOR.email} / Comerciante: {DEMO_COMERCIANTE.email}
          </p>
        </div>

        <p className="text-center text-xs text-gray-500">
          Sistema de Gestión SIMPLE
        </p>
      </div>
    </main>
  );
}
