import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Edit2, Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { ServicePrice } from '../../types';
import { supabase } from '../../lib/supabase';
import { cn } from '../ui/utils';

const CATEGORIES = [
  'Hardware / Manutenção',
  'Software',
  'Redes',
  'Telas',
  'Baterias',
  'Carregamento',
  'Limpeza',
  'Placa Mãe',
  'Câmera',
  'Outros',
];

interface EditingService {
  id: string | null; // null = new
  name: string;
  category: string;
  price: string;
  priceGamer: string;
}

const emptyService = (): EditingService => ({
  id: null,
  name: '',
  category: CATEGORIES[0],
  price: '0',
  priceGamer: '0',
});

export const ServiceManagementModal = ({
  prices,
  onClose,
}: {
  prices: ServicePrice[];
  onClose: () => void;
}) => {
  const [services, setServices] = useState<ServicePrice[]>(prices);
  const [editing, setEditing] = useState<EditingService | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  const categories = Array.from(new Set([...CATEGORIES, ...services.map(s => s.category)]));

  const grouped = categories
    .map(cat => ({ cat, items: services.filter(s => s.category === cat) }))
    .filter(g => g.items.length > 0);

  const handleSave = async () => {
    if (!supabase || !editing) return;
    const name = editing.name.trim();
    const category = useCustomCategory ? customCategory.trim() : editing.category;
    const price = parseFloat(editing.price) || 0;
    const priceGamer = parseFloat(editing.priceGamer) || 0;

    if (!name || !category) return;
    setSaving(true);

    if (editing.id) {
      // Update existing
      await supabase.from('service_prices').update({
        name, category, price, price_gamer: priceGamer
      }).eq('id', editing.id);
      setServices(prev => prev.map(s =>
        s.id === editing.id ? { ...s, name, category, price, priceGamer } : s
      ));
    } else {
      // Insert new
      const newId = `svc-${Date.now()}`;
      const { data, error } = await supabase.from('service_prices').insert({
        id: newId, name, category, price, price_gamer: priceGamer
      }).select().single();
      if (data) {
        setServices(prev => [...prev, {
          id: data.id, name, category, price, priceGamer
        }]);
        setExpandedCategory(category);
      }
    }
    setSaving(false);
    setEditing(null);
    setUseCustomCategory(false);
    setCustomCategory('');
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    await supabase.from('service_prices').delete().eq('id', id);
    setServices(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
  };

  const startEdit = (svc: ServicePrice) => {
    setEditing({
      id: svc.id,
      name: svc.name,
      category: svc.category,
      price: svc.price.toString(),
      priceGamer: svc.priceGamer.toString(),
    });
    setUseCustomCategory(false);
    setExpandedCategory(svc.category);
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
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Gerenciar Serviços</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{services.length} serviços cadastrados</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditing(emptyService()); setUseCustomCategory(false); }}
              className="flex items-center gap-2 bg-primary text-white text-xs font-black px-4 py-2.5 rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="size-4" />
              Novo Serviço
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New / Edit Form */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden shrink-0"
            >
              <div className="p-6 bg-primary/[0.04] dark:bg-primary/10 border-b border-primary/10 space-y-4">
                <h4 className="text-sm font-black text-primary uppercase tracking-widest">
                  {editing.id ? '✏️ Editando Serviço' : '➕ Novo Serviço'}
                </h4>
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Serviço</label>
                  <input
                    autoFocus
                    type="text"
                    value={editing.name}
                    onChange={e => setEditing(d => d ? { ...d, name: e.target.value } : null)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-11 px-4 outline-none focus:ring-2 focus:ring-primary font-medium text-sm"
                    placeholder="Ex: Troca de tela"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</label>
                  {!useCustomCategory ? (
                    <div className="flex gap-2">
                      <select
                        value={editing.category}
                        onChange={e => setEditing(d => d ? { ...d, category: e.target.value } : null)}
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-11 px-4 outline-none focus:ring-2 focus:ring-primary font-medium text-sm"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button
                        onClick={() => setUseCustomCategory(true)}
                        className="text-xs text-primary font-bold px-3 py-2 rounded-xl border border-primary/30 hover:bg-primary/5 transition-colors whitespace-nowrap"
                      >
                        + Nova
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-11 px-4 outline-none focus:ring-2 focus:ring-primary font-medium text-sm"
                        placeholder="Nome da categoria..."
                      />
                      <button
                        onClick={() => setUseCustomCategory(false)}
                        className="text-xs text-slate-500 font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Lista
                      </button>
                    </div>
                  )}
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preço Normal</label>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-11 px-3">
                      <span className="text-slate-400 text-sm font-medium">R$</span>
                      <input
                        type="number"
                        value={editing.price}
                        onChange={e => setEditing(d => d ? { ...d, price: e.target.value } : null)}
                        className="flex-1 bg-transparent outline-none font-bold text-sm text-right"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-400">Preço Gamer</label>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-800/40 rounded-xl h-11 px-3">
                      <span className="text-violet-400 text-sm font-medium">R$</span>
                      <input
                        type="number"
                        value={editing.priceGamer}
                        onChange={e => setEditing(d => d ? { ...d, priceGamer: e.target.value } : null)}
                        className="flex-1 bg-transparent outline-none font-bold text-sm text-right text-violet-600 dark:text-violet-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <Button
                    variant="secondary"
                    onClick={() => { setEditing(null); setUseCustomCategory(false); setCustomCategory(''); }}
                    className="flex-1 h-10 text-xs uppercase tracking-widest font-black rounded-xl"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !editing.name.trim() || (useCustomCategory && !customCategory.trim())}
                    className="flex-1 h-10 text-xs uppercase tracking-widest font-black rounded-xl shadow-lg"
                    size="sm"
                  >
                    {saving ? 'Salvando...' : editing.id ? 'Atualizar' : 'Criar Serviço'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {grouped.length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <Plus className="size-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">Nenhum serviço cadastrado</p>
              <p className="text-xs mt-1">Clique em "Novo Serviço" para começar</p>
            </div>
          )}
          {grouped.map(({ cat, items }) => (
            <div key={cat} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{cat}</span>
                  <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                {expandedCategory === cat ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
              </button>

              <AnimatePresence>
                {expandedCategory === cat && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/50">
                      {items.map(svc => (
                        <div key={svc.id} className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-800">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{svc.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[11px] font-medium text-slate-500">R$ {svc.price.toFixed(0)}</span>
                              {svc.priceGamer > 0 && (
                                <span className="text-[11px] font-bold text-violet-500">Gamer: R$ {svc.priceGamer.toFixed(0)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => startEdit(svc)}
                              className="size-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            {deleteConfirm === svc.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(svc.id)}
                                  className="h-8 px-3 rounded-xl bg-red-500 text-white text-[10px] font-black hover:bg-red-600 transition-colors"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="size-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                  <X className="size-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(svc.id)}
                                className="size-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
