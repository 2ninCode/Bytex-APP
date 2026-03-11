import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, ShoppingCart, Trash2, ChevronRight, 
  Smartphone, Laptop, Tablet, Watch, Cpu, Database, 
  Router, Cable, FlaskConical, X, AlertCircle, ShoppingBag,
  DollarSign, Package, CheckCircle2, User, MapPin
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../components/ui/utils';
import { ServicePrice, Order, Customer } from '../types';
import { supabase } from '../lib/supabase';

const CATEGORY_ICONS: Record<string, any> = {
  "Telas": Smartphone,
  "Baterias": Cpu,
  "Carregamento": Cable,
  "Software": Database,
  "Limpeza": FlaskConical,
  "Placa Mãe": Cpu,
  "Câmera": Laptop,
  "Outros": Package
};

export const CalculatorView = ({ 
  prices, 
  onAddOrder 
}: { 
  prices: ServicePrice[],
  onAddOrder: (order: Partial<Order>) => void 
}) => {
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingTotal, setPendingTotal] = useState<number | null>(null);
  const [clientData, setClientData] = useState({ 
    customerId: '', 
    customerName: '', 
    device: '', 
    problem: '' 
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!supabase) return;
      const { data } = await supabase.from('customers').select('*').order('name');
      if (data) {
        setCustomers(data.map(d => ({
          id: d.id,
          name: d.name,
          email: d.email || '',
          phone: d.phone || '',
          address: d.address || '',
          customerCode: d.customer_code,
          createdAt: d.created_at
        })));
      }
    };
    fetchCustomers();
  }, [pendingTotal]);

  const filteredPrices = useMemo(() => {
    return prices.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [prices, searchTerm]);

  const total = useMemo(() => {
    return prices.reduce((acc, p) => selectedIds[p.id] ? acc + p.price : acc, 0);
  }, [prices, selectedIds]);

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const toggleService = (id: string) => {
    setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFinalize = () => {
    setPendingTotal(total);
  };

  const handleConfirm = () => {
    const selectedServices = prices.filter(p => selectedIds[p.id]);
    const problemDescription = `[CALCULADORA] ${clientData.problem}\nServiços: ${selectedServices.map(s => s.name).join(', ')}`;
    
    onAddOrder({
      customerName: clientData.customerName,
      customerId: clientData.customerId || undefined,
      device: clientData.device,
      problem: problemDescription,
      value: total,
      status: 'budget'
    });
    
    setPendingTotal(null);
    setSelectedIds({});
    setClientData({ customerId: '', customerName: '', device: '', problem: '' });
    setCustomerSearch('');
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.customerCode.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="p-6 space-y-8 pb-48 max-w-2xl mx-auto">
          <div className="pt-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Calculadora</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">Selecione os serviços para gerar uma nova OS</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
            <input 
              type="text" 
              placeholder="Buscar serviço ou categoria..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl h-14 pl-12 pr-6 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium text-slate-700 dark:text-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredPrices.map((price, i) => {
              const Icon = CATEGORY_ICONS[price.category] || Package;
              const isSelected = selectedIds[price.id];
              
              return (
                <motion.div
                  key={price.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card 
                    onClick={() => toggleService(price.id)}
                    className={cn(
                      "p-5 flex items-center gap-5 cursor-pointer transition-all duration-300 border-2",
                      isSelected 
                        ? "border-primary bg-primary/[0.03] shadow-xl shadow-primary/10" 
                        : "border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-800"
                    )}
                  >
                    <div className={cn(
                      "size-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                      isSelected ? "bg-primary text-white rotate-6 scale-110" : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                    )}>
                      <Icon className="size-7" />
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{price.category}</p>
                       <h4 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100 leading-tight break-words">{price.name}</h4>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1 shrink-0">
                      <p className={cn("text-lg sm:text-xl font-black whitespace-nowrap", isSelected ? "text-primary" : "text-slate-600 dark:text-slate-300")}>
                        R$ {price.price.toFixed(0)}
                      </p>
                      {isSelected && (
                        <div className="size-6 bg-primary text-white rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                          <CheckCircle2 className="size-4" />
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {filteredPrices.length === 0 && (
            <div className="py-20 text-center">
              <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="size-10 text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold">Nenhum serviço encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {total > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-6 left-6 right-6 z-40"
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
      </AnimatePresence>

      {/* Modal de Finalização */}
      <AnimatePresence>
        {pendingTotal != null && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setPendingTotal(null)}>
            <motion.div 
              initial={{ opacity: 0, y: 100 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-2xl font-black">Detalhes da OS</h3>
                  <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">Total: <span className="text-primary">R$ {pendingTotal.toFixed(0)}</span></p>
                </div>
                <button onClick={() => setPendingTotal(null)} className="size-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Buscar Cliente Cadastrado</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                    <input 
                      type="text" 
                      value={customerSearch}
                      onChange={e => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerResults(true);
                        setClientData(d => ({ ...d, customerName: e.target.value, customerId: '' }));
                      }}
                      onFocus={() => setShowCustomerResults(true)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl h-14 pl-12 pr-5 outline-none focus:ring-2 focus:ring-primary font-medium"
                      placeholder="Busque por nome ou código..." 
                    />
                    
                    <AnimatePresence>
                      {showCustomerResults && customerSearch.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden"
                        >
                          {filteredCustomers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500 font-bold italic">Nenhum cliente encontrado</div>
                          ) : (
                            filteredCustomers.slice(0, 5).map(c => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setClientData(d => ({ ...d, customerId: c.id, customerName: c.name }));
                                  setCustomerSearch(c.name);
                                  setShowCustomerResults(false);
                                }}
                                className="w-full text-left p-4 hover:bg-primary/5 flex items-center justify-between group transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <User className="size-4" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm">{c.name}</p>
                                    <p className="text-[10px] text-slate-400 font-black">#{c.customerCode}</p>
                                  </div>
                                </div>
                                <ChevronRight className="size-4 text-slate-300 group-hover:text-primary" />
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {clientData.customerId && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex items-center gap-3"
                    >
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600">Cliente selecionado no banco</span>
                    </motion.div>
                  )}
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
                    placeholder="Descreva o problem observado..." />
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Serviços Selecionados</p>
                  {prices.filter(p => selectedIds[p.id]).map(i => (
                    <div key={i.id} className="flex justify-between items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm">
                      <span className="text-xs sm:text-sm font-bold leading-tight break-words">{i.name}</span>
                      <span className="text-xs sm:text-sm font-black text-primary shrink-0 whitespace-nowrap">R$ {i.price.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 pt-4 flex gap-4 bg-slate-50 dark:bg-slate-800/20 shrink-0">
                <Button variant="secondary" onClick={() => setPendingTotal(null)} className="flex-1 py-4 font-bold text-xs uppercase tracking-widest rounded-2xl">Cancelar</Button>
                <Button onClick={handleConfirm} disabled={!clientData.customerName || !clientData.device || !clientData.problem} className="flex-1 py-4 font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg disabled:opacity-50">Criar Ordem</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
