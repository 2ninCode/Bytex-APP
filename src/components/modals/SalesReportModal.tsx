import React from 'react';
import { motion } from 'motion/react';
import { X, BarChart3 } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../ui/utils';
import { Order } from '../../types';

export const SalesReportModal = ({ orders, onClose }: { orders: Order[], onClose: () => void }) => {
  const total = orders.reduce((acc, o) => acc + o.value, 0);
  const byStatus = {
    budget: orders.filter(o => o.status === 'budget').length,
    approval: orders.filter(o => o.status === 'approval').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    ready: orders.filter(o => o.status === 'ready').length,
    finished: orders.filter(o => o.status === 'finished').length,
  };
  const finished = orders.filter(o => o.status === 'finished');
  const finishedRevenue = finished.reduce((acc, o) => acc + o.value, 0);

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold">Relatório de Vendas</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/10 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-medium">Receita Total</p>
              <p className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-medium">Receita Finalizada</p>
              <p className="text-2xl font-bold text-emerald-600">R$ {finishedRevenue.toFixed(2)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Ordens por Status</p>
            <div className="space-y-2">
              {[
                { label: 'Orçamento', count: byStatus.budget, color: 'bg-amber-400' },
                { label: 'Aprovação', count: byStatus.approval, color: 'bg-orange-400' },
                { label: 'Em Reparo', count: byStatus.in_progress, color: 'bg-primary' },
                { label: 'Pronto', count: byStatus.ready, color: 'bg-blue-400' },
                { label: 'Finalizado', count: byStatus.finished, color: 'bg-emerald-500' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={cn('size-2.5 rounded-full shrink-0', s.color)} />
                  <span className="text-sm flex-1">{s.label}</span>
                  <span className="font-bold text-sm">{s.count} ordem{s.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
          {orders.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Ordens Recentes</p>
              <div className="space-y-2">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{o.customerName}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">#{o.id}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{o.device}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-primary">R$ {o.value.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{o.status === 'finished' ? 'Finalizado' : o.status === 'in_progress' ? 'Em Reparo' : 'Ativo'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
          <Button onClick={onClose} className="w-full">Fechar</Button>
        </div>
      </motion.div>
    </div>
  );
};
