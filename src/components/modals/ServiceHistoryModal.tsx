import React from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Order } from '../../types';

export const ServiceHistoryModal = ({ orders, onClose }: { orders: Order[], onClose: () => void }) => {
  const finished = orders.filter(o => o.status === 'finished');
  const total = finished.reduce((acc, o) => acc + o.value, 0);
  
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Histórico de Serviços</h3>
            <p className="text-xs text-slate-400 mt-0.5">{finished.length} serviço{finished.length !== 1 ? 's' : ''} finalizado{finished.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {finished.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Nenhum serviço finalizado ainda</p>
              <p className="text-sm mt-1">Os serviços concluídos aparecerão aqui.</p>
            </div>
          ) : (
            <>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Receita de Serviços Finalizados</p>
                  <p className="text-2xl font-bold text-emerald-600">R$ {total.toFixed(2)}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-emerald-400 opacity-60" />
              </div>
              <div className="space-y-2">
                {finished.map(o => (
                  <div key={o.id} className="flex items-start gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold truncate">{o.customerName}</p>
                        <p className="font-bold text-emerald-600 shrink-0">R$ {o.value.toFixed(2)}</p>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{o.device}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{o.problem}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">Finalizado</span>
                        <span className="text-[10px] text-slate-400 font-mono">#{o.id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
          <Button onClick={onClose} className="w-full">Fechar</Button>
        </div>
      </motion.div>
    </div>
  );
};
