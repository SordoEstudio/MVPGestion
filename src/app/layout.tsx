'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, DollarSign, PieChart, LayoutDashboard, ShoppingCart, Users, Package, ScrollText, Tag } from "lucide-react";
import Link from "next/link";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem('user_role');
    setRole(savedRole);
    setLoading(false);

    // Redirect to login if no role and not on login page
    if (!savedRole && pathname !== '/') {
      router.push('/');
    }
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('selected_client');
    setRole(null);
    router.push('/');
  };

  if (loading) return <html><body><div className="h-screen flex items-center justify-center">Cargando...</div></body></html>;

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {role && pathname !== '/' && (
          <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40">
            <div className="flex items-center gap-8">
              <Link href={role === 'OWNER' ? '/ventas' : '/contador'} className="text-xl font-bold text-blue-600">
                KISS <span className="text-gray-800">Gestión</span>
              </Link>

              <div className="hidden md:flex items-center gap-4">
                {role === 'OWNER' ? (
                  <>
                    <Link href="/dashboard" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/ventas" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/ventas' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <DollarSign className="w-4 h-4" /> Ventas
                    </Link>
                    <Link href="/compras" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/compras' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <ShoppingCart className="w-4 h-4" /> Compras
                    </Link>
                    <Link href="/caja" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/caja' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <PieChart className="w-4 h-4" /> Caja
                    </Link>
                    <Link href="/personas" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/personas' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <Users className="w-4 h-4" /> Personas
                    </Link>
                    <Link href="/productos" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/productos' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <Package className="w-4 h-4" /> Productos
                    </Link>
                    <Link href="/movimientos" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/movimientos' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <ScrollText className="w-4 h-4" /> Movimientos
                    </Link>
                    <Link href="/categorias" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/categorias' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <Tag className="w-4 h-4" /> Categorías
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/contador" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/contador' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <LayoutDashboard className="w-4 h-4" /> Tablero
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                <User className="w-3 h-3" />
                {role === 'OWNER' ? 'LOCAL' : 'CONTADOR'}
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </nav>
        )}
        <div className={role && pathname !== '/' ? 'pt-16' : ''}>
          {children}
        </div>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
