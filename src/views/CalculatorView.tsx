import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calculator, Cpu, Router, Terminal, Package, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../ui/utils';
import { ServicePrice } from '../types';

export const CalculatorView = ({ onAddOrder, prices }: { 
  onAddOrder: (value: number, clientData: { name: string; device: string; problem: string }) => void,
  prices: ServicePrice[]
}) => {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  
  const categories = Array.from(new Set(prices.map(p => p.category)));
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0]);
    }
  }, [categories, activeTab]);

  const getIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('hard')) return Cpu;
    if (c.includes('rede')) return Router;
    if (c.includes('soft')) return Terminal;
    return Package;
  };

  const services = categories.map(cat => ({
    title: cat,
    label: cat === 'Hardware' ? 'Hardware / Manutenção' : cat === 'Redes' ? 'Redes e Conectividade' : cat === 'Software' ? 'Software e Sistemas' : cat,
    icon: getIcon(cat),
    items: prices.filter(p => p.category === cat).map(p => ({ id: p.id, name: p.name, price: p.price }))
  }));

  if (prices.length === 0) {
    return (
      <div className="p-12 text-center space-y-6">
        <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
          <Calculator className="w-10 h-10 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Nenhum Serviço Encontrado</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">Certifique-se de que a tabela de preços foi configurada no banco de dados.</p>
        </div>
      </div>
    );
  }

  const toggleItem = (id: string) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const total = services.reduce((acc, section) => {
    return acc + section.items.reduce((sAcc, item) => sAcc + (selectedItems[item.id] ? item.price : 0), 0);
  }, 0);

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  const activeSection = services.find(s => s.title === activeTab) || services[0];

  const [pendingTotal, setPendingTotal] = useState<number | null>(null);
  const [clientData, setClientData] = useState({ name: '', device: '', problem: '' });

  const handleFinalize = () => {
    if (total === 0) return;
    setClientData({ name: '', device: '', problem: '' });
    setPendingTotal(total);
  };

  const handleConfirm = () => {
    if (pendingTotal == null) return;
    onAddOrder(pendingTotal, clientData);
    setPendingTotal(null);
    setSelectedItems({});
  };

  return (
    <div className="pb-36">
      <div className="px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark sticky top-0 z-10">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {services.map(s => (
            <button
              key={s.title}
              onClick={() => setActiveTab(s.title)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 border-b-[3px] font-bold text-sm transition-colors whitespace-nowrap",
                activeTab === s.title
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <s.icon className="w-4 h-4" />
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="mx-4 mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">{selectedCount} serviço{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}</span>
          <button onClick={() => setSelectedItems({})} className="text-xs text-slate-500 hover:text-red-500 transition-colors">Limpar tudo</button>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          {activeSection?.icon && <activeSection.icon className="text-primary w-5 h-5" />}
          <h3 className="text-lg font-bold">{activeSection?.label}</h3>
        </div>
        {activeSection?.items.map(item => (
          <label
            key={item.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
              selectedItems[item.id]
                ? "border-primary bg-primary/5 dark:bg-primary/10"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-primary/30"
            )}
          >
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-base font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-primary font-bold">R$ {item.price.toFixed(2)}</span>
              <input
                type="checkbox"
                checked={!!selectedItems[item.id]}
                onChange={() => toggleItem(item.id)}
                className="h-6 w-6 rounded border-slate-300 text-primary focus:ring-primary accent-primary"
              />
            </div>
          </label>
        ))}
      </div>

      <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">Total Estimado</span>
            <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
          </div>
          <Button
            disabled={total === 0}
            onClick={handleFinalize}
            className="px-8 py-3 disabled:opacity-50"
          >
            Finalizar Orçamento
          </Button>
        </div>
      </div>

      {pendingTotal != null && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Dados do Serviço</h3>
                <p className="text-xs text-slate-400 mt-0.5">Total: <span className="text-primary font-bold">R$ {pendingTotal.toFixed(2)}</span></p>
              </div>
              <button onClick={() => setPendingTotal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Nome do Cliente *</label>
                <input type="text" value={clientData.name}
                  onChange={e => setClientData(d => ({ ...d, name: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: João Silva" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Dispositivo *</label>
                <input type="text" value={clientData.device}
                  onChange={e => setClientData(d => ({ ...d, device: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: MacBook Pro M1" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Descrição do Problema *</label>
                <input type="text" value={clientData.problem}
                  onChange={e => setClientData(d => ({ ...d, problem: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Superaquecimento, tela quebrada..." />
              </div>
              <div className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="font-semibold mb-1">Serviços selecionados:</p>
                {services.flatMap(s => s.items.filter(i => selectedItems[i.id])).map(i => (
                  <p key={i.id} className="flex justify-between"><span>{i.name}</span><span className="font-mono text-primary">R$ {i.price.toFixed(0)}</span></p>
                ))}
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <Button variant="secondary" onClick={() => setPendingTotal(null)} className="flex-1">Voltar</Button>
              <Button onClick={handleConfirm} disabled={!clientData.name || !clientData.device || !clientData.problem} className="flex-1 disabled:opacity-50">Criar Ordem</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
