import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, User, CheckCircle2, ChevronRight, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Order, Customer } from '../../types';
import { supabase } from '../../lib/supabase';

// Modals
import { CustomerManagementModal } from './CustomerManagementModal';

export const OrderFormModal = ({
  order,
  onSave,
  onCancel,
  currentUserRole
}: {
  order?: Partial<Order>,
  onSave: (data: Partial<Order>) => void,
  onCancel: () => void,
  currentUserRole?: string
}) => {
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [formData, setFormData] = useState({
    customerId: order?.customerId || '',
    customerName: order?.customerName || '',
    customerEmail: order?.customerEmail || '',
    customerPhone: order?.customerPhone || '',
    device: order?.device || '',
    serialNumber: order?.serialNumber || '',
    problem: order?.problem || '',
    value: order?.value === 0 ? '' : (order?.value || ''),
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState(order?.customerName || '');
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

    // Real-time listener for customers
    let subscription: any;
    if (supabase) {
      subscription = supabase.channel('order-form-customers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
          fetchCustomers();
        })
        .subscribe();
    }

    return () => {
      if (subscription) supabase?.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.customerCode.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  const handleSave = () => {
    onSave({ 
      ...formData, 
      value: Number(formData.value) || 0 
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold">{order?.id ? 'Editar Ordem' : 'Nova Ordem de Serviço'}</h3>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-1 gap-5">
            {/* Customer Picker */}
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Selecione o Cliente</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                <input 
                  type="text" 
                  value={customerSearch}
                  onChange={e => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerResults(true);
                    setFormData(d => ({ ...d, customerName: e.target.value, customerId: '', customerEmail: '', customerPhone: '' }));
                  }}
                  onFocus={() => setShowCustomerResults(true)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl h-14 pl-12 pr-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                  placeholder="Nome ou código do cliente..." 
                />
                
                <AnimatePresence>
                  {showCustomerResults && customerSearch.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      {filteredCustomers.length === 0 ? (
                        <div className="p-6 text-center space-y-3">
                          <UserPlus className="size-8 text-slate-300 mx-auto" />
                          <p className="text-xs text-slate-500 font-bold">Cliente não encontrado.</p>
                          {(currentUserRole === 'admin' || currentUserRole === 'gestor') ? (
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => setShowNewCustomerModal(true)}
                              className="mt-2 text-[10px] font-black uppercase tracking-widest"
                            >
                              Cadastrar Novo Cliente
                            </Button>
                          ) : (
                            <p className="text-[10px] text-slate-400">Por favor, peça a um administrador para cadastrar o cliente.</p>
                          )}
                        </div>
                      ) : (
                        filteredCustomers.slice(0, 5).map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setFormData(d => ({ 
                                ...d, 
                                customerId: c.id, 
                                customerName: c.name,
                                customerEmail: c.email,
                                customerPhone: c.phone
                              }));
                              setCustomerSearch(c.name);
                              setShowCustomerResults(false);
                            }}
                            className="w-full text-left p-4 hover:bg-primary/5 flex items-center justify-between group transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <User className="size-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{c.name}</p>
                                <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">#{c.customerCode}</p>
                              </div>
                            </div>
                            <ChevronRight className="size-5 text-slate-300 group-hover:text-primary transition-colors" />
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {formData.customerId ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3"
                >
                  <div className="size-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">Cliente Validado</p>
                    {formData.customerPhone && <p className="text-[10px] text-emerald-500/70 font-bold">{formData.customerPhone}</p>}
                  </div>
                </motion.div>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="size-5 text-amber-500" />
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Selecione um cliente para continuar</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Aparelho / Dispositivo</label>
              <input
                type="text"
                value={formData.device}
                onChange={e => setFormData({ ...formData, device: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl h-14 px-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                placeholder="Ex: iPhone 13 Pro Max"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nº de Série</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl h-14 px-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                  placeholder="S/N"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Valor do Serviço (R$)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.value}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, value: val });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl h-14 px-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-black text-primary text-lg"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Descrição do Problema</label>
              <textarea
                value={formData.problem}
                onChange={e => setFormData({ ...formData, problem: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium min-h-[120px]"
                placeholder="Descreva detalhadamente o problema..."
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-4 shrink-0">
          <Button variant="secondary" onClick={onCancel} className="flex-1 py-4 font-bold text-xs uppercase tracking-widest rounded-2xl">Cancelar</Button>
          <Button 
            onClick={handleSave} 
            disabled={!formData.customerId || !formData.device || !formData.problem}
            className="flex-1 py-4 font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl disabled:opacity-50"
          >
            Salvar Ordem
          </Button>
        </div>

        {showNewCustomerModal && (
          <CustomerManagementModal onClose={() => {
            setShowNewCustomerModal(false);
            // Refresh customer list would happen via realtime in the fetch hook if implemented
            // Otherwise we might need a refresh callback
          }} />
        )}
      </motion.div>
    </div>
  );
};

// Mock standard icons if not used
const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
