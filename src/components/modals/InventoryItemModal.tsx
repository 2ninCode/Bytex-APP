import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { InventoryItem } from '../../types';

const EMPTY_ITEM: Omit<InventoryItem, 'id'> = {
  name: '', desc: '', stock: 0, location: '', category: 'Hardware', iconKey: 'package',
};

const ITEM_CATEGORIES = ['Hardware', 'Armazenamento', 'Consumíveis'];
const ICON_OPTIONS: { key: InventoryItem['iconKey']; label: string }[] = [
  { key: 'cpu', label: 'Processador' },
  { key: 'database', label: 'Armazenamento' },
  { key: 'router', label: 'Rede' },
  { key: 'cable', label: 'Cabo/Periférico' },
  { key: 'flask', label: 'Consumível' },
  { key: 'package', label: 'Geral' },
];

export const InventoryItemModal = ({
  item, onSave, onClose,
}: {
  item: Partial<InventoryItem> | null;
  onSave: (data: Omit<InventoryItem, 'id'>) => void;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<Omit<InventoryItem, 'id'>>(
    item ? {
      name: item.name || '', desc: item.desc || '', stock: item.stock || 0,
      location: item.location || '', category: item.category || 'Hardware',
      iconKey: item.iconKey || 'package'
    }
      : { ...EMPTY_ITEM }
  );
  const isEdit = !!item?.id;

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
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold">{isEdit ? 'Editar Item' : 'Novo Item'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-500">Nome do Item *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Corsair 16GB DDR4" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-500">Descrição</label>
            <input value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Especificações do produto" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Categoria</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary">
                {ITEM_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Ícone</label>
              <select value={form.iconKey} onChange={e => setForm({ ...form, iconKey: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary">
                {ICON_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Qtd. em Estoque</label>
              <input type="number" min={0} value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Localização</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: Shelf A-12" />
            </div>
          </div>
        </div>
        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={() => { if (form.name.trim()) onSave(form); }} className="flex-1">
            {isEdit ? 'Salvar Alterações' : 'Adicionar Item'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
