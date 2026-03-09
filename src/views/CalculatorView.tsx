import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, Cpu, Router, Terminal, Package, X, Smartphone, Laptop, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { cn } from '../components/ui/utils';
import { ServicePrice } from '../types';

export const CalculatorView = ({ onAddOrder, prices }: { 
  onAddOrder: (value: number, clientData: { name: string; device: string; problem: string }) => void,
  prices: ServicePrice[]
}) => {
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [pendingTotal, setPendingTotal] = useState<number | null>(null);
  const [clientData, setClientData] = useState({ name: '', device: '', problem: '' });

  const categories = Array.from(new Set(prices.map(p => p.category)));
  
  const toggleItem = (id: string) => {
    setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;
  const total = prices.reduce((acc, p) => acc + (selectedIds[p.id] ? p.price : 0), 0);

  const handleFinalize = () => {
    if (total === 0) return;
    setPendingTotal(total);
  };

  const handleConfirm = () => {
    if (pendingTotal == null) return;
    onAddOrder(pendingTotal, clientData);
    setPendingTotal(null);
    setSelectedIds({});
    setClientData({ name: '', device: '', problem: '' });
  };

  if (prices.length === 0) {
    return (
      <div className="p-16 text-center space-y-6">
        <div className="size-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto shadow-inner">
          <Calculator className="w-12 h-12 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black">Configuração Pendente</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">Configure sua tabela de preços nos ajustes para começar a orçar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 pb-44">
      <div className="pt-2">
        <h2 className="text-2xl font-black tracking-tight">Calculadora</h2>
        <p className="text-slate-500 text-sm mt-1 font-medium">Selecione os serviços para o orçamento</p>
      </div>

      <div className="space-y-12">
        {categories.map(cat => (
          <div key={cat} className="space-y-5">
            <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase px-1">{cat}</h3>
            <div className="grid grid-cols-2 gap-4">
              {prices.filter(p => p.category === cat).map(item => {
                const isSelected = !!selectedIds[item.id];
                return (
                  <Card
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "p-6 cursor-pointer transition-all active:scale-[0.98] border-2 flex flex-col items-center text-center gap-4 relative overflow-hidden",
                      isSelected ? "border-primary bg-primary/5 dark:bg-primary/20 shadow-xl shadow-primary/10" : "border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 size-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 text-white" strokeWidth={4} />
                      </div>
                    )}
                    <div className={cn("size-14 rounded-2xl flex items-center justify-center transition-all shadow-sm", 
                      isSelected ? "bg-primary text-white scale-110" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                      {cat.toLowerCase().includes('smart') ? <Smartphone className="w-7 h-7" /> : <Laptop className="w-7 h-7" />}
                    </div>
                    <div>
                      <p className="font-bold text-[15px] leading-tight mb-1.5">{item.name}</p>
                      <p className={cn("font-black text-sm", isSelected ? "text-primary" : "text-slate-500")}>R$ {item.price.toFixed(0)}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Bar */}
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-24 left-6 right-6 z-40"
        >
          <Card className="p-6 bg-primary dark:bg-primary shadow-[0_20px_50px_-12px_rgba(15,104,230,0.5)] border-none text-white relative overflow-hidden rounded-[2rem]">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-blue-600 opacity-90" />
            <div className="absolute -right-8 -top-8 size-40 bg-white opacity-10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] opacity-80 mb-1.5">{selectedCount} {selectedCount === 1 ? 'Serviço' : 'Serviços'} Totais</p>
                <p className="text-3xl font-black">R$ {total.toFixed(0)}</p>
              </div>
              <button
                onClick={handleFinalize}
                className="bg-white text-primary font-black px-7 py-4 rounded-2xl shadow-xl hover:bg-slate-50 hover:scale-[1.03] active:scale-95 transition-all text-xs uppercase tracking-widest whitespace-nowrap"
              >
                Gerar OS
              </button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Modal de Finalização */}
      {pendingTotal != null && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 100 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black">Detalhes da OS</h3>
                <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">Total: <span className="text-primary">R$ {pendingTotal.toFixed(0)}</span></p>
              </div>
              <button onClick={() => setPendingTotal(null)} className="size-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nome do Cliente</label>
                <input type="text" value={clientData.name}
                  onChange={e => setClientData(d => ({ ...d, name: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl h-14 px-5 outline-none focus:ring-2 focus:ring-primary font-medium"
                  placeholder="Ex: João da Silva" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Aparelho / Dispositivo</label>
                <input type="text" value={clientData.device}
                  onChange={e => setClientData(d => ({ ...d, device: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl h-14 px-5 outline-none focus:ring-2 focus:ring-primary font-medium"
                  placeholder="Ex: iPhone 13 Pro Max" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Defeito Relatado</label>
                <textarea value={clientData.problem}
                  onChange={e => setClientData(d => ({ ...d, problem: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-primary font-medium min-h-[100px]"
                  placeholder="Descreva o problema observado..." />
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Serviços Selecionados</p>
                {prices.filter(p => selectedIds[p.id]).map(i => (
                  <div key={i.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm">
                    <span className="text-sm font-bold">{i.name}</span>
                    <span className="text-sm font-black text-primary">R$ {i.price.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 pt-4 flex gap-4 bg-slate-50 dark:bg-slate-800/20">
              <Button variant="secondary" onClick={() => setPendingTotal(null)} className="flex-1 py-4 font-bold text-xs uppercase tracking-widest rounded-2xl">Cancelar</Button>
              <Button onClick={handleConfirm} disabled={!clientData.name || !clientData.device || !clientData.problem} className="flex-1 py-4 font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg disabled:opacity-50">Criar Ordem</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
