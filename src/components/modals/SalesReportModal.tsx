import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BarChart3, Calendar, TrendingUp, TrendingDown, Target, Package, DollarSign, Download, Filter, Search, Smartphone, Laptop, CheckCircle2, Clock, Trash2, AlertCircle, ArrowLeft } from 'lucide-react';
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

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);

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
    if (period === 'all') return [];
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

  const currentRevenue = filteredOrders.filter(o => o.status === 'finished').reduce((acc, o) => acc + o.value, 0);
  const priorRevenue = priorFilteredOrders.filter(o => o.status === 'finished').reduce((acc, o) => acc + o.value, 0);
  const totalServices = filteredOrders.length;
  const finishedServices = filteredOrders.filter(o => o.status === 'finished').length;
  const ticketMedio = finishedServices > 0 ? currentRevenue / finishedServices : 0;
  
  const revenueGrowth = priorRevenue === 0 ? 100 : ((currentRevenue - priorRevenue) / priorRevenue) * 100;
  const isRevenuePositive = revenueGrowth >= 0;

  const revenueOverTime = useMemo(() => {
    const formatStr = period === 'year' || period === 'all' ? 'MMM yy' : 'dd/MM';
    const grouped = filteredOrders.filter(o => o.status === 'finished').reduce((acc, order) => {
      const dateStr = format(parseISO(order.createdAt), formatStr, { locale: ptBR });
      acc[dateStr] = (acc[dateStr] || 0) + order.value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, value]) => ({ date, value })).sort();
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
        
        {/* Compact Header & Top Filters */}
        <div className="shrink-0 bg-white dark:bg-slate-900 z-20 border-b border-slate-100 dark:border-slate-800">
          {/* Header Bar */}
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose} 
                className="flex items-center gap-2 px-3 py-2 -ml-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all font-bold text-sm group"
              >
                <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
                <span>Voltar</span>
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2">
                <BarChart3 className="size-5 text-primary" />
                <h3 className="text-lg font-black tracking-tight">Relatório de Vendas</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="secondary" className="h-10 px-4 rounded-xl text-xs gap-2">
                <Download className="size-4" /> <span className="hidden md:inline">Exportar PDF</span>
              </Button>
            </div>
          </div>

          {/* New Filter Layout - Combined Period & Stats */}
          <div className="px-4 pb-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
              {(['7d', '30d', '90d', 'year', 'all'] as const).map(p => (
                <button 
                  key={p} 
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest min-w-[50px]",
                    period === p ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  )}
                >
                  {p === '7d' ? '7d' : p === '30d' ? '30d' : p === '90d' ? '90d' : p === 'year' ? 'Ano' : 'Tudo'}
                </button>
              ))}
            </div>

            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filtrar por nome, OS ou dispositivo..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos Status</option>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
          <div className="p-6 md:p-8 space-y-8 pb-20">
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
                    <span className="text-sm text-slate-400 font-bold">OSs</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase">{finishedServices} concluídos</p>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2 border-none shadow-sm dark:bg-slate-800/80">
                <div className="mb-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Evolução de Receita</h4>
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
                      <p className="text-sm font-bold">Sem dados suficientes</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6 border-none shadow-sm dark:bg-slate-800/80 flex flex-col">
                <div className="mb-4 shrink-0">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Status das OSs</h4>
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
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
                        <span className="font-bold text-slate-600 dark:text-slate-300">{stat.name}</span>
                      </div>
                      <span className="font-black">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Detailed Orders Table */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Histórico de Ordens ({filteredOrders.length})</h4>
              </div>
              
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Filter className="size-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-lg">Nenhum registro encontrado</p>
                  <p className="text-slate-500 text-sm">Tente alterar os filtros acima.</p>
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
                          <p className="font-black text-primary text-sm">R$ {o.value.toFixed(2)}</p>
                          <p className="text-[9px] font-bold text-slate-400">{format(parseISO(o.createdAt), 'dd/MM/yy', { locale: ptBR })}</p>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-500 line-clamp-1 truncate">{o.device}</p>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded mt-1 inline-block",
                            o.status === 'finished' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" :
                            o.status === 'in_progress' ? "bg-primary/10 text-primary dark:bg-primary/20" :
                            "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                          )}>
                            {STATUS_LABELS[o.status]}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeletingId(o.id); }}
                          className="size-8 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-800 transition-colors flex items-center justify-center shrink-0"
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
        </div>

        {/* Confirmation Modal for Deletion */}
        <AnimatePresence>
          {deletingId && (
            <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setDeletingId(null)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="size-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                  <AlertCircle className="size-10" />
                </div>
                <h4 className="text-xl font-black mb-2">Excluir Registro?</h4>
                <p className="text-slate-500 text-sm font-medium mb-8">Esta ação irá remover permanentemente esta ordem de serviço dos relatórios.</p>
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={async () => {
                      await onDeleteOrder(deletingId);
                      setDeletingId(null);
                    }} 
                    className="w-full bg-red-500 hover:bg-red-600"
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
