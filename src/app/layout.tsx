'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, DollarSign, PieChart, LayoutDashboard, ShoppingCart, Users, Package, ScrollText, Tag, FileBarChart, PanelLeftClose, PanelLeft } from "lucide-react";
import Link from "next/link";
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { StoreProvider } from '@/contexts/StoreContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const navLink = (active: boolean) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-800 hover:bg-gray-100'}`;

const SIDEBAR_ITEMS_OWNER: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: '/ventas', label: 'Ventas', icon: <DollarSign className="w-5 h-5 shrink-0" /> },
  { href: '/compras', label: 'Compras', icon: <ShoppingCart className="w-5 h-5 shrink-0" /> },
  { href: '/caja', label: 'Caja', icon: <PieChart className="w-5 h-5 shrink-0" /> },
  { href: '/personas', label: 'Personas', icon: <Users className="w-5 h-5 shrink-0" /> },
  { href: '/productos', label: 'Productos', icon: <Package className="w-5 h-5 shrink-0" /> },
  { href: '/movimientos', label: 'Movimientos', icon: <ScrollText className="w-5 h-5 shrink-0" /> },
  { href: '/categorias', label: 'Categorías', icon: <Tag className="w-5 h-5 shrink-0" /> },
  { href: '/reportes', label: 'Informes', icon: <FileBarChart className="w-5 h-5 shrink-0" /> },
  { href: '/dashboard', label: 'Panel', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
];

function LayoutContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTooltip, setSidebarTooltip] = useState<{ label: string; x: number; y: number } | null>(null);

  const role = profile?.role === 'accountant' ? 'ACCOUNTANT' : profile?.role === 'store_user' ? 'OWNER' : null;
  const isAccountantArea = pathname?.startsWith('/accountant');
  const showSidebar = user && profile && pathname !== '/' && pathname !== '/login' && !(role === 'ACCOUNTANT' && isAccountantArea);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_open');
    if (saved !== null) setSidebarOpen(saved === '1');
  }, []);

  useEffect(() => {
    if (!authLoading && !user && pathname !== '/' && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, authLoading, pathname, router]);

  const toggleSidebar = () => {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    localStorage.setItem('sidebar_open', next ? '1' : '0');
  };

  const logout = async () => {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
    localStorage.removeItem('selected_client');
    router.replace('/login');
    router.refresh();
  };

  const handleNavItemMouseEnter = (e: React.MouseEvent, label: string) => {
    if (sidebarOpen) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSidebarTooltip({
      label,
      x: rect.right + 8,
      y: rect.top + rect.height / 2,
    });
  };

  const handleNavItemMouseLeave = () => {
    setSidebarTooltip(null);
  };

  if (authLoading) return <html><body><div className="h-screen flex items-center justify-center text-gray-900">Cargando...</div></body></html>;

  if (user && !profile && pathname !== '/' && pathname !== '/login') {
    return (
      <html lang="es">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}>
          <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <p className="text-gray-700 font-medium mb-2">No tenés un perfil asignado.</p>
            <p className="text-sm text-gray-500 mb-4">Contactá al administrador para que te asigne un comercio o rol.</p>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
            >
              Cerrar sesión
            </button>
          </div>
          <Toaster position="bottom-right" />
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}>
        <StoreProvider>
        {showSidebar && (
          <>
            <aside
              className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 flex flex-col transition-[width] duration-200 ${
                sidebarOpen ? 'w-56' : 'w-16'
              }`}
            >
              <div className={`flex h-16 items-center border-b border-gray-100 shrink-0 ${sidebarOpen ? 'justify-between px-3' : 'justify-center gap-1 px-1'}`}>
                <Link href={role === 'OWNER' ? '/ventas' : '/accountant'} className={`flex items-center min-w-0 shrink-0 ${sidebarOpen ? 'gap-2' : ''}`}>
                  <span className={`font-bold text-blue-600 ${sidebarOpen ? 'text-xl' : 'text-base'}`}>GS</span>
                  {sidebarOpen && <span className="font-bold text-gray-900 truncate">Gestion Simple</span>}
                </Link>
                {sidebarOpen && (
                  <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 shrink-0"
                    aria-label="Contraer menú"
                    title="Contraer menú"
                  >
                    <PanelLeftClose className="w-5 h-5" />
                  </button>
                )}
                {!sidebarOpen && (
                  <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 shrink-0"
                    aria-label="Expandir menú"
                    title="Expandir menú"
                  >
                    <PanelLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
              <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
                {role === 'OWNER' ? (
                  SIDEBAR_ITEMS_OWNER.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`${navLink(pathname === item.href)} relative`}
                      onMouseEnter={(e) => handleNavItemMouseEnter(e, item.label)}
                      onMouseLeave={handleNavItemMouseLeave}
                    >
                      {item.icon}
                      {sidebarOpen && item.label}
                    </Link>
                  ))
                ) : (
                  <>
                    <Link
                      href="/accountant"
                      title="Dashboard"
                      className={`${navLink(pathname === '/accountant')} relative`}
                      onMouseEnter={(e) => handleNavItemMouseEnter(e, 'Dashboard')}
                      onMouseLeave={handleNavItemMouseLeave}
                    >
                      <LayoutDashboard className="w-5 h-5 shrink-0" />
                      {sidebarOpen && 'Dashboard'}
                    </Link>
                    <Link
                      href="/accountant/clients"
                      title="Clientes"
                      className={`${navLink(pathname === '/accountant/clients')} relative`}
                      onMouseEnter={(e) => handleNavItemMouseEnter(e, 'Clientes')}
                      onMouseLeave={handleNavItemMouseLeave}
                    >
                      <Users className="w-5 h-5 shrink-0" />
                      {sidebarOpen && 'Clientes'}
                    </Link>
                  </>
                )}
              </nav>
              {typeof document !== 'undefined' && sidebarTooltip && createPortal(
                <div
                  className="fixed z-[100] px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none"
                  style={{
                    left: sidebarTooltip.x,
                    top: sidebarTooltip.y,
                    transform: 'translateY(-50%)',
                  }}
                >
                  {sidebarTooltip.label}
                </div>,
                document.body
              )}
              <div className="p-2 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0 min-h-14">
                <div className="flex items-center gap-2 px-2 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-800 shrink-0 h-9 box-border">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  {sidebarOpen && (role === 'OWNER' ? 'LOCAL' : 'CONTADOR')}
                </div>
                <button onClick={logout} className="flex items-center justify-center shrink-0 h-9 w-9 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cerrar Sesión">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </aside>
          </>
        )}
        <div className={showSidebar ? (sidebarOpen ? 'pl-56' : 'pl-16') + ' min-h-screen transition-[padding] duration-200 print:pl-0' : ''}>
          <CartProvider>
            {children}
          </CartProvider>
        </div>
        </StoreProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}
