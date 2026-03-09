import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, BarChart3, User, Package, ChevronRight, Laptop, CheckCircle2, Cpu, Database, Router, Cable, FlaskConical } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { cn } from '../components/ui/utils';
import { Order, InventoryItem } from '../types';
import { supabase } from '../lib/supabase';

const ICON_MAP: Record<string, any> = {
  cpu: Cpu, database: Database, router: Router, cable: Cable, flask: FlaskConical, package: Package,
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
  const activeOrders = orders.filter(o => o.status !== 'finished');
  const inProgressOrders = orders.filter(o => o.status === 'in_progress');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const revenue = orders
    .filter(o => o.status === 'finished' && new Date(o.createdAt) >= thirtyDaysAgo)
    .reduce((acc, o) => acc + o.value, 0);
  const lowStockItems = inventoryItems.filter(i => i.stock <= lowStockThreshold);

  // Realtime Presence tracker
  const [onlineCount, setOnlineCount] = React.useState(1);
  React.useEffect(() => {
    if (!supabase) return;
    const room = supabase.channel('online-dashboard');
    room
      .on('presence', { event: 'sync' }, () => {
        const state = room.presenceState();
        const count = Object.keys(state).length;
        setOnlineCount(Math.max(1, count));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({ online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(room); };
  }, []);

  const kpis = [
    { label: 'Serviços Ativos', value: activeOrders.length.toString(), sub: `${inProgressOrders.length} em reparo`, color: 'from-primary to-violet-600', icon: ClipboardList, action: () => onNavigate('orders') },
    { label: 'Receita (30d)', value: `R$ ${revenue.toFixed(0)}`, sub: 'últimos 30 dias', color: 'from-emerald-500 to-teal-600', icon: BarChart3, action: undefined },
    { label: 'Online Agora', value: onlineCount.toString(), sub: onlineCount === 1 ? 'fucionário' : 'funcionários', color: 'from-sky-500 to-blue-600', icon: User, action: undefined },
    { label: 'Alerta Estoque', value: lowStockItems.length.toString(), sub: `iten${lowStockItems.length !== 1 ? 's' : ''} em baixa`, color: lowStockItems.length > 0 ? 'from-red-500 to-orange-500' : 'from-slate-400 to-slate-500', icon: Package, action: () => onNavigate('inventory') },
  ] as const;

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="pt-1">
        <h2 className="text-2xl font-bold">Visão Geral</h2>
        <p className="text-slate-500 text-sm mt-0.5">Resumo operacional da Bytex</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            onClick={kpi.action}
            className={cn(`bg-gradient-to-br ${kpi.color} rounded-2xl p-4 text-white shadow-lg`,
              kpi.action && 'cursor-pointer hover:scale-[1.02] transition-transform active:scale-95')}
          >
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className="w-5 h-5 opacity-80" />
              {kpi.action && <ChevronRight className="w-4 h-4 opacity-60" />}
            </div>
            <p className="text-3xl font-extrabold leading-none">{kpi.value}</p>
            <p className="text-xs mt-1 opacity-80 font-semibold">{kpi.label}</p>
            <p className="text-[10px] mt-0.5 opacity-60">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {activeOrders.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Ordens Ativas</h3>
            <button onClick={() => onNavigate('orders')} className="text-xs text-primary font-semibold hover:underline">Ver todas</button>
          </div>
          {activeOrders.slice(0, 3).map(o => (
            <Card key={o.id} onClick={() => onNavigate('orders')}
              className="p-4 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors">
              <div className={cn('size-10 rounded-lg flex items-center justify-center shrink-0',
                o.status === 'in_progress' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/20')}>
                <Laptop className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{o.customerName}</p>
                <p className="text-xs text-slate-500 truncate">{o.device}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm">R$ {o.value.toFixed(0)}</p>
                <p className={cn('text-[10px] font-bold uppercase',
                  o.status === 'in_progress' ? 'text-primary' : o.status === 'ready' ? 'text-emerald-500' : 'text-amber-500')}>
                  {o.status === 'budget' ? 'Orçamento' : o.status === 'approval' ? 'Aprovação' : o.status === 'in_progress' ? 'Em reparo' : 'Pronto'}
                </p>
              </div>
            </Card>
          ))}
        </section>
      )}

      {lowStockItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Estoque em Baixa</h3>
            <button onClick={() => onNavigate('inventory')} className="text-xs text-primary font-semibold hover:underline">Ver estoque</button>
          </div>
          {lowStockItems.slice(0, 4).map(item => {
            const Icon = ICON_MAP[item.iconKey] || Package;
            return (
              <Card key={item.id} className="p-4 flex items-center gap-4 border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-900/10">
                <div className="size-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 shrink-0"><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-red-500">{item.stock} un.</p>
                  <p className="text-[10px] text-red-400 font-medium">{item.stock === 0 ? 'Esgotado' : 'Baixo'}</p>
                </div>
              </Card>
            );
          })}
        </section>
      )}

      {activeOrders.length === 0 && lowStockItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <p className="font-bold text-lg">Tudo em ordem!</p>
          <p className="text-sm text-slate-500">Sem ordens ativas e estoque normalizado.</p>
        </div>
      )}
    </div>
  );
};
