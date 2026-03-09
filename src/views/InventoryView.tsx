import React, { useState } from 'react';
import { Search, Plus, Cpu, Database, Router, Cable, FlaskConical, Package, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
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
    <>
      {modalItem !== false && (
        <InventoryItemModal
          item={modalItem}
          onSave={handleSave}
          onClose={() => setModalItem(false)}
        />
      )}

      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                placeholder="Buscar componentes de TI..."
              />
            </div>
            <button
              onClick={() => setModalItem(null)}
              className="shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
              title="Novo Item"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <Button key={cat} variant={category === cat ? 'primary' : 'secondary'}
                className="shrink-0" onClick={() => setCategory(cat)}>
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">ESTOQUE ATUAL</h2>
            <span className="text-xs text-slate-400">{filtered.length} iten{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {filtered.length === 0 ? (
            <Card className="p-10 flex flex-col items-center text-center space-y-3">
              <Search className="w-10 h-10 text-slate-300" />
              <p className="font-semibold text-slate-500">Nenhum item encontrado</p>
              <p className="text-sm text-slate-400">Tente outro termo ou categoria.</p>
            </Card>
          ) : (
            filtered.map(item => {
              const Icon = ICON_MAP[item.iconKey] || Package;
              const color = getStockColor(item.stock);
              return (
                <Card key={item.id} className="p-4 flex items-center gap-4">
                  <div className="size-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-sm text-slate-500 truncate">{item.desc}</p>
                    <span className="text-[11px] font-medium text-slate-400">{item.category}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-bold', color)}>{item.stock} un.</p>
                    <p className={cn('text-xs font-medium', item.stock === 0 ? 'text-red-400' : item.stock <= lowStockThreshold ? 'text-orange-400' : 'text-slate-400')}>
                      {item.stock === 0 ? 'Fora de estoque' : item.stock <= lowStockThreshold ? 'Baixo estoque' : item.location}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => setModalItem(item)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Remover">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
