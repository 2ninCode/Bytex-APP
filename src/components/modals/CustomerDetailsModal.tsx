import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, User, MapPin, Phone, Mail, Laptop, Calendar, CheckCircle2, Clock, Package } from 'lucide-react';
import { Order } from '../../types';
import { supabase } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../ui/utils';

export const CustomerDetailsModal = ({ customerId, onClose }: {
  customerId: string,
  onClose: () => void
}) => {
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;
      setLoading(true);
      
      const { data: custData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (custData) {
        setCustomer({
          id: custData.id,
          name: custData.name,
          email: custData.email || '',
          phone: custData.phone || '',
          address: custData.address || '',
          customerCode: custData.customer_code
        });
      }

      if (ordersData) {
        setOrders(ordersData.map(o => ({
          id: o.id,
          customerName: o.customer_name,
          customerEmail: o.customer_email || '',
          customerPhone: o.customer_phone || '',
          device: o.device || '',
          serialNumber: o.serial_number || '',
          problem: o.problem || '',
          value: Number(o.value),
          status: o.status,
          createdAt: o.created_at
        })));
      }
      setLoading(false);
    };

    fetchData();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [customerId]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'budget': return 'Orçamento';
      case 'approval': return 'Aprovação';
      case 'in_progress': return 'Em Reparo';
      case 'ready': return 'Pronto';
      case 'finished': return 'Entregue';
      default: return status;
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-[2.5rem] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-8 pb-4 relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10">
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-6 mb-8">
            <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border-2 border-primary/20">
              <User className="size-10" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black truncate">{customer?.name}</h3>
                <span className="text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-widest">#{customer?.customerCode}</span>
              </div>
              <p className="text-slate-500 font-bold mt-1 uppercase text-[10px] tracking-widest">{orders.length} Ordens Registradas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="size-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                <Phone className="size-4" />
              </div>
              <span className="text-sm font-bold">{customer?.phone || 'Não informado'}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="size-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                <Mail className="size-4" />
              </div>
              <span className="text-sm font-bold truncate">{customer?.email || 'Não informado'}</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl md:col-span-2">
              <div className="size-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 shadow-sm mt-0.5">
                <MapPin className="size-4" />
              </div>
              <span className="text-sm font-bold leading-relaxed">{customer?.address || 'Sem endereço cadastrado'}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-4 bg-slate-50/50 dark:bg-slate-900/50">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Histórico de Ordens de Serviço</h4>
          
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Package className="size-12 mx-auto mb-2 opacity-10" />
                <p className="font-bold">Nenhuma ordem para este cliente</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:border-primary/30 transition-all">
                  <div className={cn(
                    "size-12 rounded-xl flex items-center justify-center shrink-0",
                    order.status === 'finished' ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"
                  )}>
                    <Laptop className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{order.device}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Calendar className="size-3" /> {format(parseISO(order.createdAt), 'dd/MM/yy', { locale: ptBR })}
                      </span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                        order.status === 'finished' ? "bg-emerald-50 text-emerald-600" : "bg-primary/5 text-primary"
                      )}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 dark:text-white">R$ {order.value.toFixed(0)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">OS #{order.id.split('-').pop()?.substring(0, 6)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
