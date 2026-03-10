import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { ServicePrice } from '../../types';

export const PriceTableModal = ({ prices, onSave, onClose }: {
  prices: ServicePrice[],
  onSave: (id: string, price: number) => void,
  onClose: () => void
}) => {
  const [editPrices, setEditPrices] = useState<Record<string, number>>(
    Object.fromEntries(prices.map(p => [p.id, p.price]))
  );
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 100 }} 
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] md:rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold">Tabela de Preços</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {prices.map(p => (
            <div key={p.id} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[11px] text-slate-400 font-medium">{p.category}</p>
                <p className="font-semibold text-sm">{p.name}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-sm">R$</span>
                <input
                  type="number"
                  value={editPrices[p.id]}
                  onChange={e => setEditPrices({ ...editPrices, [p.id]: parseFloat(e.target.value) || 0 })}
                  className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded h-8 px-2 text-right text-sm outline-none focus:ring-1 focus:ring-primary"
                />
                <Button onClick={() => onSave(p.id, editPrices[p.id])} className="h-8 px-3 text-xs">Salvar</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
          <Button onClick={onClose} className="w-full">Fechar</Button>
        </div>
      </motion.div>
    </div>
  );
};
