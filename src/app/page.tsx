
'use client';

import Link from "next/link";
import { ShoppingCart, ShoppingBag, Wallet, Users, Package, Tag, ArrowRight, ScrollText } from 'lucide-react';

export default function Home() {
  const modules = [
    { name: 'Ventas', href: '/ventas', icon: ShoppingCart, color: 'bg-blue-600', desc: 'POS y Cobros' },
    { name: 'Compras', href: '/compras', icon: ShoppingBag, color: 'bg-emerald-600', desc: 'Gastos y Reposición' },
    { name: 'Caja', href: '/caja', icon: Wallet, color: 'bg-amber-500', desc: 'Balance y Saldos' },
    { name: 'Personas', href: '/personas', icon: Users, color: 'bg-purple-600', desc: 'Clientes y Proveedores' },
    { name: 'Productos', href: '/productos', icon: Package, color: 'bg-orange-500', desc: 'Inventario y Precios' },
    { name: 'Categorías', href: '/categorias', icon: Tag, color: 'bg-pink-500', desc: 'Organización' },
    { name: 'Historial', href: '/movimientos', icon: ScrollText, color: 'bg-gray-700', desc: 'Movimientos y Anulaciones' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Gestión <span className="text-blue-600">KISS</span></h1>
          <p className="text-lg text-gray-500">Sistema Administrativo Simple v1.0.1</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <Link
              key={mod.name}
              href={mod.href}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all group active:scale-95"
            >
              <div className={`h-14 w-14 rounded-xl ${mod.color} text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <mod.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">{mod.name}</h3>
              <p className="text-xs text-center text-gray-400 mt-1">{mod.desc}</p>
            </Link>
          ))}
        </div>

        <div className="text-center text-xs text-gray-400 pt-8">
          v1.0.0 - Fase de Expansión
        </div>
      </div>
    </main>
  );
}
