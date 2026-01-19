
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Person } from '@/lib/types';
import {
    Users,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Calendar,
    Filter,
    FileText,
    DollarSign,
    CreditCard
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';

export default function AccountantDashboard() {
    const [clients, setClients] = useState<Person[]>([]);
    const [selectedClient, setSelectedClient] = useState<Person | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSales: 0,
        totalPurchases: 0,
        totalCollections: 0,
        cashSales: 0,
        creditSales: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('LAST_30_DAYS');

    useEffect(() => {
        fetchClients();
        const savedClientId = localStorage.getItem('selected_client_id');
        if (savedClientId) {
            // Restore selection
        }
    }, []);

    const fetchClients = async () => {
        const { data } = await supabase.from('people').select('*').eq('type', 'CLIENT').order('name');
        if (data) setClients(data);
        setLoading(false);
    };

    const handleSelectClient = (client: Person) => {
        setSelectedClient(client);
        localStorage.setItem('selected_client_id', client.id.toString());
        // In a real app, we'd fetch transaction data for this specific client or workspace
        // For MVP, we'll show simulated stats for the accountant view
        setStats({
            totalSales: 125400,
            totalPurchases: 82300,
            totalCollections: 15400,
            cashSales: 95000,
            creditSales: 30400
        });
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;

    if (!selectedClient) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
                <div className="w-full max-w-4xl space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-black text-gray-900">Panel del <span className="text-blue-600">Contador</span></h1>
                        <p className="text-gray-500">Selecciona un cliente para ver sus informes y movimientos.</p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border p-8">
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar cliente por nombre..."
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredClients.map(client => (
                                <button
                                    key={client.id}
                                    onClick={() => handleSelectClient(client)}
                                    className="flex items-center gap-4 p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all text-left active:scale-95 group"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{client.name}</h3>
                                        <p className="text-xs text-gray-400">Ver Dashboard &rarr;</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            <div className="w-full max-w-6xl space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedClient(null)}
                            className="p-3 bg-white border rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                        >
                            <Users className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{selectedClient.name}</h1>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Workspace de Contador</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border shadow-sm">
                        <button
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dateRange === 'TODAY' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                            onClick={() => setDateRange('TODAY')}
                        >
                            Hoy
                        </button>
                        <button
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dateRange === 'LAST_30_DAYS' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                            onClick={() => setDateRange('LAST_30_DAYS')}
                        >
                            Mes
                        </button>
                        <button
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dateRange === 'YEAR' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                            onClick={() => setDateRange('YEAR')}
                        >
                            Año
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1 text-emerald-600 text-xs font-black">
                                <ArrowUpRight className="w-3 h-3" /> 12%
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ventas Totales</h3>
                        <p className="text-3xl font-black text-gray-900 mt-1">${stats.totalSales.toLocaleString()}</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                                <TrendingUp className="w-6 h-6 rotate-180" />
                            </div>
                            <span className="flex items-center gap-1 text-red-600 text-xs font-black">
                                <ArrowUpRight className="w-3 h-3" /> 5%
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Gastos / Compras</h3>
                        <p className="text-3xl font-black text-gray-900 mt-1">${stats.totalPurchases.toLocaleString()}</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <CreditCard className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Cobros Realizados</h3>
                        <p className="text-3xl font-black text-gray-900 mt-1">${stats.totalCollections.toLocaleString()}</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Utilidad Estimada</h3>
                        <p className="text-3xl font-black text-gray-900 mt-1">${(stats.totalSales - stats.totalPurchases).toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-gray-800">Evolución de Ventas</h3>
                                <p className="text-sm text-gray-400">Comparativa mensual de ingresos</p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all border">
                                <Calendar className="w-4 h-4" /> Exportar PDF
                            </button>
                        </div>
                        <div className="h-[300px] w-full">
                            {/* Recharts fallback or simulated visualization */}
                            <div className="flex h-full items-end gap-2 px-2">
                                {[40, 60, 45, 90, 65, 80, 55, 95, 70, 85, 50, 75].map((h, i) => (
                                    <div key={i} className="flex-1 bg-blue-100 rounded-t-lg group relative hover:bg-blue-600 transition-colors" style={{ height: `${h}%` }}>
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            ${(h * 1000).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                <span>Ene</span>
                                <span>Mar</span>
                                <span>May</span>
                                <span>Jul</span>
                                <span>Sep</span>
                                <span>Nov</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-black text-gray-800 mb-6">Tipos de Venta</h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-gray-500">EFECTIVO</span>
                                    <span className="text-blue-600">${stats.cashSales.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full" style={{ width: `${(stats.cashSales / stats.totalSales) * 100}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-gray-500">AL FIADO</span>
                                    <span className="text-purple-600">${stats.creditSales.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                    <div className="bg-purple-600 h-full" style={{ width: `${(stats.creditSales / stats.totalSales) * 100}%` }}></div>
                                </div>
                            </div>

                            <div className="pt-8 space-y-3">
                                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-2xl group transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg group-hover:bg-blue-100 transition-colors">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">Informe de Deudores</span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600" />
                                </button>
                                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-emerald-50 rounded-2xl group transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg group-hover:bg-emerald-100 transition-colors">
                                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">Rentabilidad Mensual</span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
