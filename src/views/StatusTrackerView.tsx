import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Box, ArrowLeft, Smartphone, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../components/ui/utils';
import { Order, OrderStatus } from '../types';
import { supabase } from '../lib/supabase';
import { BytexIcon } from '../components/ui/BytexIcon';

export const StatusTrackerView = ({ orderId, onBack }: { orderId?: string, onBack: () => void }) => {
  const [searchId, setSearchId] = useState(orderId || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError('');
    try {
      if (!supabase) throw new Error('Conexão perdida');
      const { data, error: dbErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id.trim())
        .single();

      if (dbErr) {
        if (dbErr.code === 'PGRST116') {
          setError('Ordem não encontrada. Verique o código enviado pelo técnico.');
        } else {
          setError(`Erro de acesso: Verifique as políticas de RLS.`);
        }
        setOrder(null);
      } else {
        setOrder({
          id: data.id,
          customerName: data.customer_name,
          customerEmail: data.customer_email || '',
          customerPhone: data.customer_phone || '',
          device: data.device,
          serialNumber: data.serial_number || '',
          problem: data.problem || '',
          value: data.value,
          status: data.status as OrderStatus,
          createdAt: data.created_at
        });
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const steps: { label: string, status: 'done' | 'active' | 'pending' }[] = order ? [
    { label: "Orçamento", status: order.status === 'budget' ? 'active' : 'done' },
    { label: "Aprovação", status: order.status === 'approval' ? 'active' : (['in_progress', 'ready', 'finished'].includes(order.status) ? 'done' : 'pending') },
    { label: "Manutenção", status: order.status === 'in_progress' ? 'active' : (['ready', 'finished'].includes(order.status) ? 'done' : 'pending') },
    { label: "Fase Final", status: order.status === 'ready' ? 'active' : (order.status === 'finished' ? 'done' : 'pending') },
    { label: "Finalizado", status: order.status === 'finished' ? 'active' : 'pending' },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-12">
        <header className="flex flex-col items-center text-center space-y-6">
          <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center p-4 shadow-inner">
            <BytexIcon className="size-full" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">Bytex</h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Rastreamento Inteligente</p>
          </div>
        </header>

        {!order ? (
          <Card className="p-10 space-y-8 text-slate-900 dark:text-slate-100 rounded-[2.5rem] shadow-2xl border-none">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-black tracking-tight">Consulte seu aparelho</h2>
              <p className="text-sm text-slate-500 font-medium">Insira o código da OS fornecido pela assistência.</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                value={searchId} 
                onChange={e => setSearchId(e.target.value)}
                placeholder="Ex: OS-123456"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl h-16 px-6 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-center text-xl uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-400"
              />
              <Button onClick={() => fetchOrder(searchId)} disabled={loading} className="w-full h-16 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                {loading ? <RefreshCw className="animate-spin size-6" /> : "Localizar Ordem"}
              </Button>
            </div>
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl text-red-500 text-xs font-bold text-center">
                {error}
              </motion.div>
            )}
          </Card>
        ) : (
          <div className="space-y-8 text-slate-900 dark:text-slate-100">
            <Button variant="ghost" onClick={() => setOrder(null)} className="text-slate-400 font-bold hover:text-slate-600 active:scale-95 transition-all">
              <ArrowLeft className="size-4 mr-2" /> Voltar
            </Button>

            <Card className="p-8 rounded-[2.5rem] shadow-2xl border-none">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Código Identificador</p>
                  <p className="text-3xl font-black text-primary">#{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Entrada</p>
                  <p className="font-black text-lg">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-2 px-2">
                {steps.map((step, i, arr) => {
                  const isActive = step.status === 'active';
                  const isDone = step.status === 'done';

                  return (
                    <div key={i} className="flex gap-8 relative text-slate-900 dark:text-slate-100">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "z-10 flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all duration-500",
                          isDone ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' :
                            isActive ? 'bg-white dark:bg-slate-900 border-primary text-primary scale-110 shadow-xl shadow-primary/20' :
                              'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-300'
                        )}>
                          {isDone ? <CheckCircle2 className="size-7" /> :
                            isActive ? <RefreshCw className="size-7 animate-spin" /> :
                              <div className="size-3 rounded-full bg-current" />}
                        </div>
                        {i < arr.length - 1 && (
                          <div className={cn("w-1 h-12 my-1.5 transition-colors duration-500", isDone ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800')}></div>
                        )}
                      </div>
                      <div className="pb-8 pt-1">
                        <p className={cn("text-xl font-black tracking-tight",
                          isActive ? 'text-primary' : isDone ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                        )}>{step.label}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-70">
                          {isDone ? 'Concluído' : isActive ? 'Em andamento' : 'Aguardando'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 flex items-start gap-5 rounded-[2rem] border-none shadow-xl">
                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Smartphone className="size-7" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Dispositivo</p>
                  <p className="font-black text-xl leading-snug">{order.device}</p>
                </div>
              </Card>
              <Card className="p-6 flex items-start gap-5 rounded-[2rem] border-none shadow-xl">
                <div className="size-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 shrink-0"><CheckCircle2 className="size-7" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Proprietário</p>
                  <p className="font-black text-xl leading-snug">{order.customerName}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-primary/5 rounded-[2rem] p-8 text-center space-y-2 border-2 border-dashed border-primary/20">
              <p className="text-slate-600 dark:text-slate-400 font-bold text-sm leading-relaxed">Sua satisfação é nossa prioridade.<br/>Qualquer dúvida, entre em contato.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
