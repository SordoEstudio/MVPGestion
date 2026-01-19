
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    FileText,
    DollarSign,
    CreditCard,
    ShoppingBag,
    Users
} from 'lucide-react';

export default function OwnerDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSales: 0,
        totalPurchases: 0,
        totalCollections: 0,
        cashSales: 0,
        creditSales: 0,
        pendingCollect: 0
    });
    const [dateRange, setDateRange] = useState('MONTH');

    useEffect(() => {
        fetchStats();
    }, [dateRange]);

    const fetchStats = async () => {
        setLoading(true);
        // Simulate fetching stats for the logged-in owner
        setTimeout(() => {
            setStats({
                totalSales: 154200,
                totalPurchases: 92100,
                totalCollections: 12400,
                cashSales: 110000,
                creditSales: 44200,
                pendingCollect: 58000
            });
            setLoading(false);
        }, 800);
    };

    if (loading) return <div className="h-screen flex items-center justify-center">Cargando Dashboard...</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            <div className="w-full max-w-6xl space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mi <span className="text-blue-600">Negocio</span></h1>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Resumen General de Actividad</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border shadow-sm">
                        <button
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dateRange === 'DAY' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}
                            onClick={() => setDateRange('DAY')}
                        >
                            Hoy
                        </button>
                        <button
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dateRange === 'MONTH' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}
                            onClick={() => setDateRange('MONTH')}
                        >
                            Este Mes
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                            <span className="flex items-center gap-1 text-emerald-600 text-sm font-black bg-emerald-50 px-3 py-1 rounded-full">
                                <ArrowUpRight className="w-3 h-3" /> +15%
                            </span>
                        </div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ventas Totales</h3>
                        <p className="text-4xl font-black text-gray-900 mt-2">${stats.totalSales.toLocaleString()}</p>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                                <ShoppingBag className="w-7 h-7" />
                            </div>
                        </div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gastos / Compras</h3>
                        <p className="text-4xl font-black text-gray-900 mt-2">${stats.totalPurchases.toLocaleString()}</p>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <CreditCard className="w-7 h-7" />
                            </div>
                        </div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cobros Recibidos</h3>
                        <p className="text-4xl font-black text-gray-900 mt-2">${stats.totalCollections.toLocaleString()}</p>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Users className="w-7 h-7" />
                            </div>
                        </div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pendiente de Cobro</h3>
                        <p className="text-4xl font-black text-purple-600 mt-2">${stats.pendingCollect.toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-800">Crecimiento Mensual</h3>
                                    <p className="text-base text-gray-400">Ingresos vs Periodo Anterior</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold">
                                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div> Actual
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 rounded-xl text-xs font-bold">
                                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div> Anterior
                                    </div>
                                </div>
                            </div>

                            <div className="h-[350px] w-full flex items-end gap-3 px-2">
                                {[30, 45, 35, 70, 50, 60, 40, 85, 55, 65, 45, 100].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                        <div className="w-full bg-gray-100 rounded-xl overflow-hidden h-full relative flex items-end">
                                            <div className="w-full bg-blue-100/50 absolute bottom-0" style={{ height: `${h * 0.7}%` }}></div>
                                            <div className="w-full bg-blue-600 rounded-xl group-hover:bg-blue-700 transition-all relative z-10" style={{ height: `${h}%` }}>
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-black opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                                    ${(h * 2000).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-300 uppercase">M{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-blue-600 p-10 rounded-[40px] shadow-2xl shadow-blue-200 text-white flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
                            <div className="relative z-10 space-y-4">
                                <h3 className="text-3xl font-black">¿Necesitas un reporte más detallado?</h3>
                                <p className="text-blue-100 font-medium max-w-md">Descarga el balance general en PDF o Excel para compartirlo con tu contador o socios.</p>
                                <button className="px-8 py-4 bg-white text-blue-600 font-black rounded-2xl hover:scale-105 transition-all shadow-xl">
                                    Exportar Reporte
                                </button>
                            </div>
                            <FileText className="w-64 h-64 absolute -right-16 -bottom-16 text-blue-500/30 rotate-12" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                            <h3 className="text-2xl font-black text-gray-800 mb-8">Estado de Caja</h3>
                            <div className="space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center">
                                        <DollarSign className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Efectivo en Caja</p>
                                        <p className="text-3xl font-black text-gray-900">${(stats.totalSales * 0.6).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center">
                                        <CreditCard className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transferencias</p>
                                        <p className="text-3xl font-black text-gray-900">${(stats.totalSales * 0.4).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="my-10 border-gray-50" />

                            <h4 className="text-sm font-black text-gray-800 mb-6 uppercase tracking-widest">Distribución de Pagos</h4>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm font-bold mb-3">
                                        <span className="text-gray-400">EFECTIVO</span>
                                        <span className="text-emerald-600">60%</span>
                                    </div>
                                    <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full" style={{ width: '60%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm font-bold mb-3">
                                        <span className="text-gray-400">OTRO</span>
                                        <span className="text-blue-600">40%</span>
                                    </div>
                                    <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden">
                                        <div className="bg-blue-600 h-full" style={{ width: '40%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900 p-10 rounded-[40px] shadow-xl text-white">
                            <h3 className="text-2xl font-black mb-6">Próximos Cobros</h3>
                            <div className="space-y-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex justify-between items-center group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center font-black group-hover:bg-blue-600 transition-colors">
                                                C{i}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">Cliente Ejemplo {i}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">Vence en 2 días</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-blue-400">${(i * 4500).toLocaleString()}</span>
                                    </div>
                                ))}
                                <button className="w-full py-4 bg-gray-800 text-gray-400 font-bold rounded-2xl hover:text-white transition-all text-xs">
                                    Ver todos los deudores
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
