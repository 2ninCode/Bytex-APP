import React, { useState } from 'react';
import { Search, Plus, Cpu, Database, Router, Cable, FlaskConical, Package, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { cn } from '../components/ui/utils';
import { InventoryItem, Employee } from '../types';
import { InventoryItemModal } from '../components/modals/InventoryItemModal';
import { supabase } from '../lib/supabase';

const ICON_MAP: Record<string, any> = {
  cpu: Cpu, database: Database, router: Router, cable: Cable, flask: FlaskConical, package: Package,
};

const CATEGORIES = ['Todos os Ativos', 'Hardware', 'Armazenamento', 'Consumíveis'];

export const InventoryView = ({ currentUser, items, setItems, lowStockThreshold }: {
  currentUser: Employee; items: InventoryItem[]; setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>; lowStockThreshold: number;
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos os Ativos');
  const [modalItem, setModalItem] = useState<Partial<InventoryItem> | null | false>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null); 

  const filtered = items.filter(item => {
    const matchCat = category === 'Todos os Ativos' || item.category === category;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSave = async (data: Omit<InventoryItem, 'id'>) => {
    if (!supabase) return;
    try {
      if (modalItem && (modalItem as InventoryItem).id) {
        const id = (modalItem as InventoryItem).id;
        await supabase.from('inventory_items').update({
          name: data.name, description: data.desc, stock: data.stock,
          location: data.location, category: data.category, icon_key: data.iconKey
        }).eq('id', id);
        setItems(prev => prev.map(it => it.id === id ? { ...it, ...data } : it));
      } else {
        const newId = `INV-${Date.now()}`;
        const newItem: InventoryItem = { ...data, id: newId };
        
        await supabase.from('inventory_items').insert({
          id: newId, name: data.name, description: data.desc, stock: data.stock,
          location: data.location, category: data.category, icon_key: data.iconKey
        });
        setItems(prev => [newItem, ...prev]);
      }
    } catch(e) { console.error('Error saving item', e) }
    setModalItem(false);
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('inventory_items').delete().eq('id', id);
      setItems(prev => prev.filter(it => it.id !== id));
    } catch(e) { console.error('Error deleting item', e) }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-500';
    if (stock <= lowStockThreshold) return 'text-orange-500';
    return 'text-primary';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-slate-50 dark:bg-slate-900">
      {modalItem !== false && (
        <InventoryItemModal
          item={modalItem || {}}
          onSave={handleSave}
          onClose={() => setModalItem(false)}
        />
      )}
      
      {/* Search Header - Pinned */}
      <div className="p-6 pb-2 space-y-6 shrink-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800">
        <div className="flex gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-500 font-medium"
              placeholder="Buscar componentes..."
            />
          </div>
          <button
            onClick={() => setModalItem(null)}
            className="shrink-0 h-14 w-14 flex items-center justify-center rounded-2xl bg-primary text-white hover:bg-primary/90 transition-all shadow-lg active:scale-95"
            title="Novo Item"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategory(cat)}
              className={cn(
                "shrink-0 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
                category === cat 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="p-6 space-y-4 pb-32">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">ESTOQUE ATUAL</h2>
            <span className="text-xs font-bold text-slate-400">{filtered.length} {filtered.length !== 1 ? 'ITENS' : 'ITEM'}</span>
          </div>

          {filtered.length === 0 ? (
            <Card className="p-16 flex flex-col items-center text-center space-y-4">
              <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-slate-500">Nenhum item encontrado</p>
                <p className="text-xs text-slate-400">Tente outro termo ou categoria.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(item => {
                const Icon = ICON_MAP[item.iconKey] || Package;
                const color = getStockColor(item.stock);
                return (
                  <Card key={item.id} className="p-5 flex items-center gap-5 hover:border-primary/30 transition-all active:scale-[0.99]">
                    <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm">
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate">{item.name}</h3>
                      <p className="text-xs text-slate-500 font-medium truncate mb-1">{item.desc}</p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{item.category}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('font-black text-lg leading-none', color)}>{item.stock}</p>
                      <p className={cn('text-[10px] font-black uppercase mt-1', item.stock === 0 ? 'text-red-400' : item.stock <= lowStockThreshold ? 'text-orange-400' : 'text-slate-400')}>
                        {item.stock === 0 ? 'Esgotado' : item.stock <= lowStockThreshold ? 'Baixo' : item.location}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 ml-2">
                      <button onClick={() => setModalItem(item)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Editar">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => setDeleteId(item.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Remover">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        title="Remover do Estoque?"
        message="Você deseja remover permanentemente este item do inventário?"
        confirmLabel="Confirmar Remoção"
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
