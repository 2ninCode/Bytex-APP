import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, UserPlus, User, Pencil, Trash2, Search, MapPin, Phone, Mail } from 'lucide-react';
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
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleSave = async () => {
    if (!editing?.name) {
      alert('O nome do cliente é obrigatório.');
      return;
    }
    setLoading(true);
    try {
      if (!supabase) throw new Error('Supabase client not available');
      const payload = {
        name: editing.name,
        email: editing.email,
        phone: editing.phone,
        address: editing.address
      };

      if (editing.id) {
        await supabase.from('customers').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('customers').insert(payload);
      }
      fetchCustomers();
      setEditing(null);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    if (supabase) {
      await supabase.from('customers').delete().eq('id', id);
      fetchCustomers();
    }
    setLoading(false);
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
          <h3 className="text-xl font-bold">Gestão de Clientes</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
          {editing ? (
            <div className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold mb-4">{editing.id ? 'Editar Cliente' : 'Novo Cliente'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-500 font-bold uppercase">Nome Completo *</label>
                  <input type="text" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 mt-1 outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold uppercase">Email</label>
                  <input type="email" value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 mt-1 outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold uppercase">Telefone</label>
                  <input type="text" value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 mt-1 outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-500 font-bold uppercase">Endereço Completo</label>
                  <textarea value={editing.address || ''} onChange={e => setEditing({ ...editing, address: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 mt-1 outline-none focus:ring-2 focus:ring-primary min-h-[80px]" />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="secondary" onClick={() => setEditing(null)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSave} disabled={loading} className="flex-1">{loading ? 'Salvando...' : 'Salvar Cliente'}</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar por nome ou código..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button onClick={() => setEditing({})} className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0">
                  <UserPlus className="w-4 h-4 mr-2" /> Novo Cliente
                </Button>
              </div>

              <div className="grid gap-3">
                {filteredCustomers.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <User className="size-12 mx-auto mb-2 opacity-10" />
                    <p className="font-bold">Nenhum cliente encontrado</p>
                  </div>
                ) : (
                  filteredCustomers.map(cust => (
                    <div key={cust.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold truncate">{cust.name}</p>
                          <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">#{cust.customerCode}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          {cust.phone && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Phone className="size-3" /> {cust.phone}</span>}
                          {cust.email && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Mail className="size-3" /> {cust.email}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setEditing(cust)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(cust.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
