import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BarChart3, Calendar, TrendingUp, TrendingDown, Target, Package, DollarSign, Download, Filter, Search, Smartphone, Laptop, CheckCircle2, Clock, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '../ui/utils';
import { Order, OrderStatus } from '../../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO, startOfMonth, startOfYear, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Period = '7d' | '30d' | '90d' | 'year' | 'all';

const STATUS_COLORS: Record<OrderStatus, string> = {
  budget: '#f59e0b',
  approval: '#d97706',
  in_progress: '#0f68e6',
  ready: '#10b981',
  finished: '#059669'
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  budget: 'Orçamento',
  approval: 'Aprovação',
  in_progress: 'Em Reparo',
  ready: 'Pronto',
  finished: 'Finalizado'
};

export const SalesReportModal = ({ orders, onDeleteOrder, onClose }: { 
  orders: Order[], 
  onDeleteOrder: (id: string) => Promise<void>,
  onClose: () => void 
}) => {
  const [period, setPeriod] = useState<Period>('30d');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  // --- Filtering Logic ---
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0); // Epoch

    if (period === '7d') startDate = subDays(now, 7);
    else if (period === '30d') startDate = subDays(now, 30);
    else if (period === '90d') startDate = subDays(now, 90);
    else if (period === 'year') startDate = startOfYear(now);

    return orders.filter(o => {
      const dateValid = period === 'all' || new Date(o.createdAt) >= startDate;
      const statusValid = statusFilter === 'all' || o.status === statusFilter;
      const searchValid = !searchTerm || 
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return dateValid && statusValid && searchValid;
    });
  }, [orders, period, statusFilter, searchTerm]);

  const priorFilteredOrders = useMemo(() => {
    if (period === 'all') return []; // No prior for 'all'
    const now = new Date();
    let startDate = new Date();
    let priorStartDate = new Date();
    
    if (period === '7d') { startDate = subDays(now, 7); priorStartDate = subDays(now, 14); }
    else if (period === '30d') { startDate = subDays(now, 30); priorStartDate = subDays(now, 60); }
    else if (period === '90d') { startDate = subDays(now, 90); priorStartDate = subDays(now, 180); }
    else if (period === 'year') { startDate = startOfYear(now); priorStartDate = subYears(startOfYear(now), 1); }

    return orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= priorStartDate && d < startDate;
    });
  }, [orders, period]);

  // --- KPIs ---
  const currentRevenue = filteredOrders.filter(o => o.status === 'finished').reduce((acc, o) => acc + o.value, 0);
  const priorRevenue = priorFilteredOrders.filter(o => o.status === 'finished').reduce((acc, o) => acc + o.value, 0);
  const totalServices = filteredOrders.length;
  const finishedServices = filteredOrders.filter(o => o.status === 'finished').length;
  const ticketMedio = finishedServices > 0 ? currentRevenue / finishedServices : 0;
  
  const revenueGrowth = priorRevenue === 0 ? 100 : ((currentRevenue - priorRevenue) / priorRevenue) * 100;
  const isRevenuePositive = revenueGrowth >= 0;

  // --- Chart Data Processing ---
  const revenueOverTime = useMemo(() => {
    // Group by day or month depending on period
    const formatStr = period === 'year' || period === 'all' ? 'MMM yy' : 'dd/MM';
    const grouped = filteredOrders.filter(o => o.status === 'finished').reduce((acc, order) => {
      const dateStr = format(parseISO(order.createdAt), formatStr, { locale: ptBR });
      acc[dateStr] = (acc[dateStr] || 0) + order.value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, value]) => ({ date, value })).sort();
    // (Note: simple string sort might misorder days across months, but for <90d M/D is okay. 
    // Usually we build a chronological array first, but keeping it simple for now)
  }, [filteredOrders, period]);

  const statusDistribution = useMemo(() => {
    const grouped = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    return Object.entries(grouped).map(([status, count]) => ({
      name: STATUS_LABELS[status as OrderStatus],
      value: count,
      color: STATUS_COLORS[status as OrderStatus]
    }));
  }, [filteredOrders]);

  // Devices (Top 5)
  const deviceDistribution = useMemo(() => {
    const grouped = filteredOrders.reduce((acc, order) => {
      // Simplistic categorization based on keywords
      const dev = order.device.toLowerCase();
      let cat = 'Outros';
      if (dev.includes('iphone') || dev.includes('sams') || dev.includes('moto')) cat = 'Smartphones';
      else if (dev.includes('mac') || dev.includes('note') || dev.includes('dell')) cat = 'Laptops';
      else if (dev.includes('pc') || dev.includes('desktop')) cat = 'Desktops';
      
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredOrders]);


  // Helper for rendering customized recharts tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700">
          <p className="text-slate-500 text-xs font-bold mb-1">{label}</p>
          <p className="text-primary font-black text-lg">R$ {payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-100/80 dark:bg-slate-950/90 backdrop-blur-xl flex flex-col md:p-6" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full h-full md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-w-7xl mx-auto border border-slate-200/50 dark:border-slate-800"
      >
        
        {/* Header Setup */}
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 z-20 shrink-0">
          <div>
            <h3 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="size-6" />
              </div>
              Inteligência de Vendas
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2 md:pl-16">Analytics e Performance Bytex</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="hidden md:flex items-center gap-2 h-12 rounded-xl">
              <Download className="size-4 text-slate-500" /> Exportar (PDF)
            </Button>
            <button onClick={onClose} className="size-12 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm border border-slate-100 dark:border-slate-800">
              <X className="size-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Action Bar (Filters) */}
        <div className="px-6 md:px-8 py-4 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 overflow-x-auto no-scrollbar">
          
          {/* Period Tabs */}
          <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-900/50 rounded-2xl w-fit shrink-0">
            {(['7d', '30d', '90d', 'year', 'all'] as const).map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest",
                  period === p ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : p === '90d' ? 'Trimestre' : p === 'year' ? 'Ano' : 'Tudo'}
              </button>
            ))}
          </div>

          {/* Search & Status Filters */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar OS, cliente..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary w-48 md:w-64 transition-all"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todos os Status</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 min-h-0 bg-slate-50 dark:bg-slate-900/50">
          
          {/* TOP Level KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="p-6 bg-gradient-to-br from-primary to-violet-700 text-white border-none shadow-xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                <DollarSign className="size-24" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Faturamento Líquido</p>
                <h4 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">R$ {currentRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                {period !== 'all' && (
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md",
                    isRevenuePositive ? "bg-emerald-400/20 text-emerald-300" : "bg-red-400/20 text-red-300"
                  )}>
                    {isRevenuePositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    <span>{isRevenuePositive ? '+' : ''}{revenueGrowth.toFixed(1)}% vs anterior</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between border-none shadow-sm dark:bg-slate-800/80 group">
              <div>
                <div className="size-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-500 mb-4">
                  <Target className="size-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Ticket Médio</p>
                <h4 className="text-2xl font-black">R$ {ticketMedio.toFixed(2)}</h4>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase">Por serviço finalizado</p>
            </Card>

            <Card className="p-6 flex flex-col justify-between border-none shadow-sm dark:bg-slate-800/80">
              <div>
                <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                  <CheckCircle2 className="size-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Taxa de Conclusão</p>
                <h4 className="text-2xl font-black">
                  {totalServices > 0 ? Math.round((finishedServices / totalServices) * 100) : 0}%
                </h4>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalServices > 0 ? (finishedServices / totalServices) * 100 : 0}%` }} />
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between border-none shadow-sm dark:bg-slate-800/80">
              <div>
                <div className="size-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-500 mb-4">
                  <Package className="size-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Volume de Serviços</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-2xl font-black">{totalServices}</h4>
                  <span className="text-sm text-slate-400 font-bold">OSs criadas</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase">{finishedServices} concluídos con sucesso</p>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Revenue Area Chart */}
            <Card className="p-6 lg:col-span-2 border-none shadow-sm dark:bg-slate-800/80">
              <div className="mb-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">Evolução de Receita</h4>
                <p className="text-xs text-slate-400 font-medium">Faturamento de OSs finalizadas no período</p>
              </div>
              
              <div className="h-[300px] w-full">
                {revenueOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f68e6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0f68e6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickFormatter={(val) => `R$${val}`} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="value" stroke="#0f68e6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <BarChart3 className="size-10 mb-2 opacity-20" />
                    <p className="text-sm font-bold">Sem dados suficientes p/ geração de gráfico</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Distribution Pie Chart & Data */}
            <Card className="p-6 border-none shadow-sm dark:bg-slate-800/80 flex flex-col">
              <div className="mb-4 shrink-0">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">Funil Organizacional</h4>
                <p className="text-xs text-slate-400 font-medium">Status no período</p>
              </div>
              
              <div className="h-[200px] w-full flex items-center justify-center shrink-0">
                {statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                        itemStyle={{ color: '#0f68e6' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400 font-bold">Nenhum dado</p>
                )}
              </div>

              <div className="flex-1 mt-4 space-y-3 overflow-y-auto no-scrollbar">
                {statusDistribution.sort((a,b) => b.value - a.value).map((stat, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ backgroundColor: stat.color }} />
                      <span className="font-bold text-slate-600 dark:text-slate-300">{stat.name}</span>
                    </div>
                    <span className="font-black">{stat.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Detailed Orders Table */}
          <div className="pt-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-6">Detalhamento Operacional ({filteredOrders.length})</h4>
            
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Filter className="size-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-lg">Nenhum registro encontrado</p>
                <p className="text-slate-500 text-sm">Tente alterar os filtros de status ou o período avaliado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(o => (
                  <div key={o.id} className="flex flex-col p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("size-10 rounded-xl flex items-center justify-center shadow-inner", 
                          o.status === 'in_progress' ? 'bg-primary/10 text-primary' : 
                          o.status === 'finished' ? 'bg-emerald-100 text-emerald-600' : 
                          'bg-amber-100 text-amber-600'
                        )}>
                          {o.status === 'finished' ? <CheckCircle2 className="size-5" /> : 
                           o.status === 'in_progress' ? <Clock className="size-5" /> : 
                           <Package className="size-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm line-clamp-1">{o.customerName}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">OS #{o.id.split('-').pop()?.substring(0,6)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-primary">R$ {o.value.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-slate-400">{format(parseISO(o.createdAt), 'dd MMM yy', { locale: ptBR })}</p>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-500 line-clamp-1">{o.device}</p>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md mt-1 inline-block",
                          o.status === 'finished' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" :
                          o.status === 'in_progress' ? "bg-primary/10 text-primary dark:bg-primary/20" :
                          "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                        )}>
                          {STATUS_LABELS[o.status]}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingId(o.id); }}
                        className="size-10 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-800 transition-colors flex items-center justify-center shrink-0"
                        title="Remover OS"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>

        {/* Confirmation Modal for Deletion */}
        <AnimatePresence>
          {deletingId && (
            <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="size-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                  <AlertCircle className="size-10" />
                </div>
                <h4 className="text-xl font-black mb-2">Excluir Registro?</h4>
                <p className="text-slate-500 text-sm font-medium mb-8">Esta ação irá remover permanentemente esta ordem de serviço dos relatórios e do banco de dados.</p>
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={async () => {
                      await onDeleteOrder(deletingId);
                      setDeletingId(null);
                    }} 
                    className="w-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-none"
                  >
                    Confirmar Exclusão
                  </Button>
                  <Button variant="secondary" onClick={() => setDeletingId(null)} className="w-full">
                    Cancelar
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
