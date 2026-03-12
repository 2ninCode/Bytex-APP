import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, User, Pencil, Trash2, Search, MapPin, Phone, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Customer } from '../../types';
import { supabase } from '../../lib/supabase';

export const CustomerManagementModal = ({ onClose }: {
  onClose: () => void
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<Customer | Partial<Customer> | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCustomers = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    
    if (!error && data) {
      const formatted = data.map(d => ({
        id: d.id,
        name: d.name,
        email: d.email || '',
        phone: d.phone || '',
        address: d.address || '',
        customerCode: d.customer_code,
        createdAt: d.created_at
      }));
      setCustomers(formatted);
    }
  };

  useEffect(() => {
    fetchCustomers();
    
    // Real-time listener for customers
    let subscription: any;
    if (supabase) {
      subscription = supabase.channel('public:customers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
          fetchCustomers();
        })
        .subscribe();
    }

    document.body.style.overflow = 'hidden';
    return () => { 
      document.body.style.overflow = 'unset';
      if (subscription) supabase?.removeChannel(subscription);
    };
  }, []);

  const handleSave = async () => {
    if (!editing?.name) {
      setError('O nome do cliente é obrigatório.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!supabase) throw new Error('Conexão com o banco de dados não disponível.');
      
      const payload = {
        name: editing.name,
        email: editing.email || null,
        phone: editing.phone || null,
        address: editing.address || null
      };

      const { error: saveError } = editing.id 
        ? await supabase.from('customers').update(payload).eq('id', editing.id)
        : await supabase.from('customers').insert(payload);

      if (saveError) throw saveError;

      setSuccess(editing.id ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
      setTimeout(() => {
        setEditing(null);
        setSuccess(null);
      }, 1500);
      
    } catch (e: any) {
      console.error('Error saving customer:', e);
      setError(e.message || 'Erro ao salvar cliente. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      if (!supabase) throw new Error('Conexão não disponível.');
      const { error: delError } = await supabase.from('customers').delete().eq('id', id);
      if (delError) throw delError;
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 100 }} 
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-[2.5rem] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold">Gestão de Clientes</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Base de dados centralizada</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div 
                key="edit-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] text-primary">
                    {editing.id ? 'Editar Cadastro' : 'Novo Cadastro'}
                  </h4>
                  {editing.customerCode && (
                    <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg text-slate-500">
                      #{editing.customerCode}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nome Completo *</label>
                    <input type="text" value={editing.name || ''} 
                      onChange={e => setEditing({ ...editing, name: e.target.value })} 
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium" 
                      placeholder="Ex: João Silva da Costa"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email de Contato</label>
                    <input type="email" value={editing.email || ''} 
                      onChange={e => setEditing({ ...editing, email: e.target.value })} 
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium" 
                      placeholder="joao@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Telefone / WhatsApp</label>
                    <input type="text" value={editing.phone || ''} 
                      onChange={e => setEditing({ ...editing, phone: e.target.value })} 
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium" 
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Endereço Completo</label>
                    <textarea value={editing.address || ''} 
                      onChange={e => setEditing({ ...editing, address: e.target.value })} 
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium min-h-[100px]" 
                      placeholder="Rua, Número, Bairro, Cidade..."
                    />
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="size-4 shrink-0" />
                    {success}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" onClick={() => { setEditing(null); setError(null); }} className="flex-1 py-3 font-bold text-xs uppercase tracking-widest rounded-xl">Cancelar</Button>
                  <Button onClick={handleSave} disabled={loading} className="flex-1 py-3 font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg">
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Salvando...
                      </div>
                    ) : 'Salvar Cadastro'}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome ou código..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                    />
                  </div>
                  <Button onClick={() => setEditing({})} className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0 py-3 px-6 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-emerald-500/20">
                    <UserPlus className="w-4 h-4 mr-2" /> Novo Cliente
                  </Button>
                </div>

                <div className="grid gap-4">
                  {filteredCustomers.length === 0 ? (
                    <div className="py-20 text-center bg-white dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                      <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-100 dark:border-slate-700">
                        <User className="size-10 text-slate-200" />
                      </div>
                      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Nenhum cliente na base</p>
                    </div>
                  ) : (
                    filteredCustomers.map(cust => (
                      <motion.div 
                        layout
                        key={cust.id} 
                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-50 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
                      >
                        <div className="size-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 transition-all group-hover:bg-primary group-hover:text-white group-hover:rotate-6">
                          <User className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-black text-slate-800 dark:text-slate-100 truncate">{cust.name}</p>
                            <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-lg text-slate-500 tracking-wider">#{cust.customerCode}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {cust.phone && (
                              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                                <Phone className="size-3 text-emerald-500" /> {cust.phone}
                              </span>
                            )}
                            {cust.email && (
                              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                                <Mail className="size-3 text-primary" /> {cust.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => setEditing(cust)} className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button onClick={() => setDeleteId(cust.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <ConfirmModal 
        isOpen={!!deleteId}
        title="Excluir Cliente?"
        message="Deseja remover este cliente? As ordens de serviço permanecerão no sistema, mas perderão o vínculo."
        confirmLabel="Sim, Excluir"
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
