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
          setError('Ordem não encontrada. Verifique o código enviado pelo técnico.');
        } else {
          setError(`Erro de acesso: Certifique-se de que as políticas de segurança (RLS) foram configuradas no Supabase.`);
          console.error('Supabase Error:', dbErr);
        }
        setOrder(null);
      } else if (!data) {
        setError('Ordem não encontrada.');
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
    { label: "Em Andamento", status: order.status === 'in_progress' ? 'active' : (['ready', 'finished'].includes(order.status) ? 'done' : 'pending') },
    { label: "Pronto para Entrega", status: order.status === 'ready' ? 'active' : (order.status === 'finished' ? 'done' : 'pending') },
    { label: "Finalizado", status: order.status === 'finished' ? 'active' : 'pending' },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex flex-col items-center text-center space-y-4">
          <BytexIcon className="size-16" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Bytex</h1>
            <p className="text-slate-500 font-medium">Rastreamento de Ordem de Serviço</p>
          </div>
        </header>

        {!order ? (
          <Card className="p-8 space-y-6 text-slate-900 dark:text-slate-100">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Consulte o status do seu aparelho</h2>
              <p className="text-sm text-slate-500">Insira o código da OS fornecido pelo técnico.</p>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={searchId} 
                onChange={e => setSearchId(e.target.value)}
                placeholder="Ex: OS-123456"
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl h-12 px-4 outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={() => fetchOrder(searchId)} disabled={loading} className="px-6 h-12">
                {loading ? <RefreshCw className="animate-spin" /> : "Consultar"}
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </Card>
        ) : (
          <div className="space-y-6 text-slate-900 dark:text-slate-100">
            <Button variant="ghost" onClick={() => setOrder(null)} className="text-slate-500">
              <ArrowLeft className="size-4" /> Nova consulta
            </Button>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Código da OS</p>
                  <p className="text-2xl font-mono font-bold text-primary">#{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data de Entrada</p>
                  <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-0">
                {steps.map((step, i, arr) => {
                  const isFinishedStep = step.label === 'Finalizado';
                  return (
                    <div key={i} className="flex gap-6 relative text-slate-900 dark:text-slate-100">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "z-10 flex h-10 w-10 items-center justify-center rounded-full border-2",
                          step.status === 'done' ? 'bg-primary border-primary text-white' :
                            step.status === 'active' && isFinishedStep ? 'bg-emerald-500 border-emerald-500 text-white' :
                              step.status === 'active' ? 'bg-primary/10 border-primary text-primary' :
                                'bg-transparent border-slate-300 dark:border-slate-800 text-slate-400'
                        )}>
                          {step.status === 'done' ? <CheckCircle2 className="w-6 h-6" /> :
                            step.status === 'active' && isFinishedStep ? <CheckCircle2 className="w-6 h-6" /> :
                              step.status === 'active' ? <RefreshCw className="w-6 h-6 animate-spin" /> :
                                <Box className="w-6 h-6" />}
                        </div>
                        {i < arr.length - 1 && (
                          <div className={cn("w-1 h-12 my-1", step.status === 'done' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800')}></div>
                        )}
                      </div>
                      <div className="pb-8">
                        <p className={cn("text-lg font-bold",
                          step.status === 'active' && isFinishedStep ? 'text-emerald-600' :
                            step.status === 'active' ? 'text-primary' : 'text-slate-500'
                        )}>{step.label}</p>
                        <p className="text-sm text-slate-400 font-medium">
                          {step.status === 'done' ? 'Etapa concluída' :
                            step.status === 'active' ? 'Fase atual do reparo' : 'Aguardando'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5 flex items-start gap-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Smartphone className="size-6" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dispositivo</p>
                  <p className="font-bold text-lg">{order.device}</p>
                </div>
              </Card>
              <Card className="p-5 flex items-start gap-4">
                <div className="size-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shrink-0"><CheckCircle2 className="size-6" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome do Cliente</p>
                  <p className="font-bold text-lg">{order.customerName}</p>
                </div>
              </Card>
            </div>
            
            <p className="text-center text-slate-400 text-xs">Para dúvidas, entre em contato com o suporte da Bytex.</p>
          </div>
        )}
      </div>
    </div>
  );
};
