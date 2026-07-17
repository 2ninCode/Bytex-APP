import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, BarChart3, User, Package, ChevronRight, Laptop, CheckCircle2, Cpu, Database, Router, Cable, FlaskConical, Wrench, AlertTriangle } from 'lucide-react';
import { cn } from '../components/ui/utils';
import { Order, InventoryItem } from '../types';
import { supabase } from '../lib/supabase';

const ICON_MAP: Record<string, any> = {
  cpu: Cpu, database: Database, router: Router, cable: Cable, flask: FlaskConical, package: Package,
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  budget:      { label: 'Orçamento',  color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  approval:    { label: 'Aprovação',  color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
  in_progress: { label: 'Em Reparo',  color: 'text-primary bg-primary/10' },
  ready:       { label: 'Pronto',     color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  finished:    { label: 'Entregue',   color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
};

export const DashboardView = ({
  orders,
  inventoryItems,
  lowStockThreshold,
  onNavigate,
}: {
  orders: Order[];
  inventoryItems: InventoryItem[];
  lowStockThreshold: number;
  onNavigate: (v: 'orders' | 'inventory' | 'calculator') => void;
}) => {
  const activeOrders     = React.useMemo(() => orders.filter(o => o.status !== 'finished'), [orders]);
  const inProgressOrders = React.useMemo(() => orders.filter(o => o.status === 'in_progress'), [orders]);

  const revenue = React.useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return orders
      .filter(o => o.status === 'finished' && new Date(o.createdAt) >= thirtyDaysAgo)
      .reduce((acc, o) => acc + o.value, 0);
  }, [orders]);

  const lowStockItems = React.useMemo(() => inventoryItems.filter(i => i.stock <= lowStockThreshold), [inventoryItems, lowStockThreshold]);

  const [onlineCount, setOnlineCount] = React.useState(1);
  React.useEffect(() => {
    if (!supabase) return;
    const room = supabase.channel('online-dashboard');
    room
      .on('presence', { event: 'sync' }, () => {
        const state = room.presenceState();
        setOnlineCount(Math.max(1, Object.keys(state).length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await room.track({ online_at: new Date().toISOString() });
      });
    return () => { supabase.removeChannel(room); };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth">
      <div className="p-5 space-y-8 pb-32 max-w-2xl mx-auto">

        {/* Saudação */}
        <div className="pt-2">
          <h2 className="text-2xl font-black tracking-tight">Visão Geral</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Painel operacional da Bytex</p>
        </div>

        {/* KPI Cards — estilo glassmorphism */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: 'Serviços Ativos',
              value: activeOrders.length,
              sub: `${inProgressOrders.length} em reparo`,
              icon: ClipboardList,
              color: 'border-primary/30 bg-primary/5',
              iconBg: 'bg-primary/10 text-primary',
              action: () => onNavigate('orders'),
            },
            {
              label: 'Receita 30d',
              value: `R$ ${revenue >= 1000 ? (revenue / 1000).toFixed(1) + 'k' : revenue.toFixed(0)}`,
              sub: 'últimos 30 dias',
              icon: BarChart3,
              color: 'border-emerald-500/30 bg-emerald-500/5',
              iconBg: 'bg-emerald-500/10 text-emerald-600',
              action: undefined,
            },
            {
              label: 'Online Agora',
              value: onlineCount,
              sub: onlineCount === 1 ? 'funcionário' : 'funcionários',
              icon: User,
              color: 'border-sky-500/30 bg-sky-500/5',
              iconBg: 'bg-sky-500/10 text-sky-600',
              action: undefined,
            },
            {
              label: 'Alerta Estoque',
              value: lowStockItems.length,
              sub: `iten${lowStockItems.length !== 1 ? 's' : ''} em baixa`,
              icon: lowStockItems.length > 0 ? AlertTriangle : Package,
              color: lowStockItems.length > 0 ? 'border-red-400/30 bg-red-400/5' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40',
              iconBg: lowStockItems.length > 0 ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400',
              action: () => onNavigate('inventory'),
            },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              onClick={kpi.action}
              className={cn(
                'rounded-2xl p-4 border-2 backdrop-blur-sm flex flex-col gap-3',
                kpi.color,
                kpi.action && 'cursor-pointer active:scale-[0.97] transition-transform'
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn('size-10 rounded-xl flex items-center justify-center', kpi.iconBg)}>
                  <kpi.icon className="size-5" />
                </div>
                {kpi.action && <ChevronRight className="size-4 text-slate-300" />}
              </div>
              <div>
                <p className="text-2xl font-black leading-none tracking-tight">{kpi.value}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{kpi.label}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{kpi.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Ordens Ativas */}
        {activeOrders.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Ordens Ativas</h3>
              <button onClick={() => onNavigate('orders')} className="text-xs text-primary font-bold hover:underline">Ver todas</button>
            </div>
            <div className="space-y-2.5">
              {activeOrders.slice(0, 4).map((o, i) => {
                const st = STATUS_LABELS[o.status] || STATUS_LABELS.budget;
                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onNavigate('orders')}
                    className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/30 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <div className={cn('size-10 rounded-xl flex items-center justify-center shrink-0', st.color)}>
                      <Laptop className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{o.customerName}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{o.device}</p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className={cn('text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg', st.color)}>
                        {st.label}
                      </span>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">R$ {o.value.toFixed(0)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Alerta de Estoque */}
        {lowStockItems.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <AlertTriangle className="size-3.5 text-red-500" />
                Alerta de Estoque
              </h3>
              <button onClick={() => onNavigate('inventory')} className="text-xs text-primary font-bold hover:underline">Ver estoque</button>
            </div>
            <div className="space-y-2.5">
              {lowStockItems.slice(0, 4).map(item => {
                const Icon = ICON_MAP[item.iconKey] || Package;
                return (
                  <div key={item.id} className="bg-red-50/60 dark:bg-red-900/10 border border-red-200/60 dark:border-red-800/40 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="size-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-500 shrink-0">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{item.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-red-500">{item.stock} un.</p>
                      <p className="text-[9px] text-red-400 font-black uppercase">{item.stock === 0 ? 'Esgotado' : 'Baixo'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Estado vazio */}
        {activeOrders.length === 0 && lowStockItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="size-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border-2 border-emerald-100 dark:border-emerald-800/30">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <div>
              <p className="font-bold text-lg">Tudo em ordem!</p>
              <p className="text-sm text-slate-500 mt-1">Sem ordens ativas e estoque normalizado.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
