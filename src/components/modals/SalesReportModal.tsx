import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, BarChart3, Calendar, TrendingUp, TrendingDown, Target, User, ChevronRight, Package, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '../ui/utils';
import { Order } from '../../types';

type Period = '7d' | '30d' | '90d';

export const SalesReportModal = ({ orders, onClose }: { orders: Order[], onClose: () => void }) => {
  const [period, setPeriod] = useState<Period>('30d');

  const getFilteredOrders = (p: Period) => {
    const now = new Date();
    const startDate = new Date();
    if (p === '7d') startDate.setDate(now.getDate() - 7);
    else if (p === '30d') startDate.setDate(now.getDate() - 30);
    else if (p === '90d') startDate.setDate(now.getDate() - 90);
    
    return orders.filter(o => new Date(o.createdAt) >= startDate);
  };

  const getPreviousPeriodOrders = (p: Period) => {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date();
    
    if (p === '7d') {
      startDate.setDate(now.getDate() - 14);
      endDate.setDate(now.getDate() - 7);
    } else if (p === '30d') {
      startDate.setDate(now.getDate() - 60);
      endDate.setDate(now.getDate() - 30);
    } else if (p === '90d') {
      startDate.setDate(now.getDate() - 180);
      endDate.setDate(now.getDate() - 90);
    }
    
    return orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= startDate && d < endDate;
    });
  };

  const currentOrders = getFilteredOrders(period);
  const prevOrders = getPreviousPeriodOrders(period);

  const currentRevenue = currentOrders
    .filter(o => o.status === 'finished')
    .reduce((acc, o) => acc + o.value, 0);
    
  const prevRevenue = prevOrders
    .filter(o => o.status === 'finished')
    .reduce((acc, o) => acc + o.value, 0);

  const growth = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;
  const isPositive = growth >= 0;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const stats = [
    { label: 'Serviços', val: currentOrders.length, sub: 'total no período', icon: Package, color: 'text-primary bg-primary/10' },
    { label: 'Ticket Médio', val: `R$ ${(currentRevenue / (currentOrders.filter(o => o.status === 'finished').length || 1)).toFixed(0)}`, sub: 'por serviço concluído', icon: Target, color: 'text-violet-500 bg-violet-50' },
  ];

  const statusMetrics = [
    { label: 'Finalizado', count: currentOrders.filter(o => o.status === 'finished').length, color: 'bg-emerald-500' },
    { label: 'Em Reparo', count: currentOrders.filter(o => o.status === 'in_progress').length, color: 'bg-primary' },
    { label: 'Aguardando', count: currentOrders.filter(o => ['budget', 'approval', 'ready'].includes(o.status)).length, color: 'bg-amber-400' },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 100 }} 
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-20">
          <div>
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <BarChart3 className="size-8 text-primary" /> Relatório Estratégico
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Inteligência Financeira Bytex</p>
          </div>
          <button onClick={onClose} className="size-12 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm border border-slate-100 dark:border-slate-800">
            <X className="size-6 text-slate-400" />
          </button>
        </div>

        {/* Period Selector - Fixed below header */}
        <div className="px-8 py-4 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-10 flex justify-center shadow-sm">
          <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-900/50 rounded-2xl w-fit">
            {(['7d', '30d', '90d'] as const).map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-black transition-all lowercase tracking-widest",
                  period === p ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Últimos {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {/* Revenue Card */}
          <Card className="p-8 bg-gradient-to-br from-primary to-violet-700 text-white border-none shadow-2xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <TrendingUp className="size-32 rotate-12" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Faturamento Líquido</p>
              <div className="flex items-end gap-3 mb-6">
                <h4 className="text-5xl font-black tracking-tighter">R$ {currentRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              </div>
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-md",
                isPositive ? "bg-emerald-400/20 text-emerald-300" : "bg-red-400/20 text-red-300"
              )}>
                {isPositive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                <span>{isPositive ? '+' : ''}{growth.toFixed(1)}% em relação ao período anterior</span>
              </div>
            </div>
          </Card>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <Card key={i} className="p-5 flex items-start gap-4 border-none bg-slate-50 dark:bg-slate-800/40">
                <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", s.color)}>
                  <s.icon className="size-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="font-black text-xl">{s.val}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{s.sub}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Status Breakdown */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Distribuição de Status</h5>
            <div className="grid grid-cols-3 gap-3">
              {statusMetrics.map((m, i) => (
                <Card key={i} className="p-4 text-center border-none bg-slate-50 dark:bg-slate-800/40 relative group overflow-hidden">
                  <div className={cn("absolute bottom-0 left-0 h-1 transition-all group-hover:h-full group-hover:opacity-5", m.color)} style={{ width: '100%' }} />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">{m.label}</p>
                  <p className="text-2xl font-black">{m.count}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Performance List */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Últimos Lançamentos</h5>
            <div className="space-y-3">
              {currentOrders.slice(0, 4).map(o => (
                <div key={o.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="size-11 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                      <Calendar className="size-5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-sm truncate">{o.customerName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-primary">R$ {o.value.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">OS #{o.id.split('-').pop()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={onClose} className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20">
            Concluir Análise
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
