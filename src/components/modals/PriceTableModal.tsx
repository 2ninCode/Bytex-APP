import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Monitor, Gamepad2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { ServicePrice } from '../../types';
import { cn } from '../ui/utils';

export const PriceTableModal = ({
  prices,
  onSave,
  onClose,
}: {
  prices: ServicePrice[];
  onSave: (id: string, price: number, field?: 'price' | 'price_gamer') => void;
  onClose: () => void;
}) => {
  const [editPrices, setEditPrices] = useState<Record<string, { normal: number; gamer: number }>>(
    Object.fromEntries(prices.map(p => [p.id, { normal: p.price, gamer: p.priceGamer }]))
  );
  const [mode, setMode] = useState<'normal' | 'gamer'>('normal');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleSave = (id: string) => {
    const field = mode === 'gamer' ? 'price_gamer' : 'price';
    const value = mode === 'gamer' ? editPrices[id].gamer : editPrices[id].normal;
    onSave(id, value, field);
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold">Tabela de Preços</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5">
            <button
              onClick={() => setMode('normal')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300',
                mode === 'normal'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              <Monitor className="size-4" />
              Normal
            </button>
            <button
              onClick={() => setMode('gamer')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300',
                mode === 'gamer'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              <Gamepad2 className="size-4" />
              Gamer
            </button>
          </div>
        </div>

        {/* Price List */}
        <div className="p-6 space-y-3 flex-1 overflow-y-auto">
          {prices.map(p => (
            <div key={p.id} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-400 font-medium">{p.category}</p>
                <p className="font-semibold text-sm truncate">{p.name}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={cn('text-sm font-bold', mode === 'gamer' ? 'text-violet-400' : 'text-slate-400')}>R$</span>
                <input
                  type="number"
                  value={mode === 'gamer' ? editPrices[p.id]?.gamer : editPrices[p.id]?.normal}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setEditPrices(prev => ({
                      ...prev,
                      [p.id]: mode === 'gamer'
                        ? { ...prev[p.id], gamer: val }
                        : { ...prev[p.id], normal: val }
                    }));
                  }}
                  className={cn(
                    'w-24 bg-slate-50 dark:bg-slate-800 border rounded h-8 px-2 text-right text-sm outline-none focus:ring-1 font-bold transition-colors',
                    mode === 'gamer'
                      ? 'border-violet-200 dark:border-violet-800/40 focus:ring-violet-500 text-violet-600 dark:text-violet-400'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-primary'
                  )}
                />
                <Button
                  onClick={() => handleSave(p.id)}
                  className={cn('h-8 px-3 text-xs', mode === 'gamer' ? 'bg-violet-600 hover:bg-violet-700' : '')}
                >
                  Salvar
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Button onClick={onClose} className="w-full">Fechar</Button>
        </div>
      </motion.div>
    </div>
  );
};
