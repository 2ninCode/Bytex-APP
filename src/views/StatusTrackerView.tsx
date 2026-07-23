import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  RefreshCw, Box, ArrowLeft, Smartphone, CheckCircle2, Eye, Play, Check,
  Laptop, Cpu, HardDrive, Zap, Monitor, Thermometer, Battery, Shield,
  ExternalLink, ImageIcon, AlertCircle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../components/ui/utils';
import { Order, OrderStatus, Checklist } from '../types';
import { supabase } from '../lib/supabase';
import { CHECKLIST_HARDWARE, CHECKLIST_SOFTWARE, CHECKLIST_COMPONENTS } from '../components/modals/OrderFormModal';

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
      if (!supabase) throw new Error('Conexão perdida com o banco de dados');
      const { data, error: dbErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id.trim())
        .single();

      if (dbErr) {
        if (dbErr.code === 'PGRST116') {
          setError('Ordem não encontrada. Verifique o código e tente novamente.');
        } else {
          setError(`Erro de acesso: ${dbErr.message}`);
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
          observationClient: data.observation_client || '', // Observação do cliente (pública)
          // Laudo técnico excluído intencionalmente para privacidade
          mediaUrls: data.media_urls || [],
          budgetItems: data.budget_items || [],
          checklist: data.checklist || {},
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
    { label: "Pronto", status: order.status === 'ready' ? 'active' : (order.status === 'finished' ? 'done' : 'pending') },
    { label: "Entregue", status: order.status === 'finished' ? 'active' : 'pending' },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-12 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col items-center text-center py-4 space-y-4">
          <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center p-2 shadow-inner">
            <img src="/pwa-192x192.png" alt="Bytex Logo" className="size-full object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Bytex</h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[9px] mt-1">Acompanhamento de Serviço</p>
          </div>
        </header>

        {loading && orderId && !order ? (
          <div className="max-w-md mx-auto py-16 text-center space-y-4">
            <div className="relative inline-flex">
              <RefreshCw className="animate-spin size-10 text-primary" />
              <div className="absolute inset-0 size-10 bg-primary/10 blur-md rounded-full -z-10 animate-pulse" />
            </div>
            <p className="text-sm font-bold text-slate-500 animate-pulse">Carregando relatório de serviço...</p>
          </div>
        ) : !order ? (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 space-y-6 text-slate-900 dark:text-slate-100 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-black tracking-tight">Consulte seu Aparelho</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Insira o código localizador (ex: OS-XXXXXX) enviado pelo técnico.</p>
              </div>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={searchId} 
                  onChange={e => setSearchId(e.target.value)}
                  placeholder="Ex: OS-542194"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl h-14 px-4 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-mono font-bold text-center text-lg uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-medium"
                />
                <Button onClick={() => fetchOrder(searchId)} disabled={loading} className="w-full h-14 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  {loading ? <RefreshCw className="animate-spin size-5" /> : "Rastrear Aparelho"}
                </Button>
              </div>
              {error && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3.5 rounded-xl text-red-500 text-xs font-bold text-center">
                  {error}
                </motion.div>
              )}
              <button onClick={onBack} className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors pt-2">
                Voltar ao painel
              </button>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 text-slate-900 dark:text-slate-100">
            
            <div className="flex justify-between items-center px-1">
              <Button variant="ghost" onClick={() => setOrder(null)} className="text-slate-400 font-bold hover:text-slate-600 active:scale-95 transition-all">
                <ArrowLeft className="size-4 mr-2" /> Outra OS
              </Button>
              <button 
                onClick={() => fetchOrder(order.id)} 
                className="size-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Progresso Card (Coluna Esquerda) */}
              <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
                <Card className="p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Localizador OS</p>
                      <p className="text-2xl font-black text-primary font-mono">#{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entrada</p>
                      <p className="font-bold text-base">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="space-y-2 px-1">
                    {steps.map((step, i, arr) => {
                      const isActive = step.status === 'active';
                      const isDone = step.status === 'done';

                      return (
                        <div key={i} className="flex gap-6 relative">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              "z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-300 shrink-0",
                              isDone ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' :
                                isActive ? 'bg-white dark:bg-slate-900 border-primary text-primary scale-105 shadow-md' :
                                  'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-300'
                            )}>
                              {isDone ? <Check className="size-5" /> :
                                isActive ? <RefreshCw className="size-5 animate-spin" /> :
                                  <div className="size-2 rounded-full bg-current" />}
                            </div>
                            {i < arr.length - 1 && (
                              <div className={cn("w-0.5 h-10 my-1 transition-colors duration-300", isDone ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800')}></div>
                            )}
                          </div>
                          <div className="pb-6 pt-1 flex-1 min-w-0">
                            <p className={cn("text-base font-black tracking-tight",
                              isActive ? 'text-primary' : isDone ? 'text-slate-800 dark:text-white' : 'text-slate-400'
                            )}>{step.label}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                              {isDone ? 'Concluído' : isActive ? 'Fase Atual' : 'Aguardando'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Informações e Detalhes (Coluna Direita) */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                
                {/* CARD OBRIGATÓRIO: ESPECIFICAÇÕES DO COMPUTADOR */}
                <Card className="p-5 border-2 border-primary/20 bg-white dark:bg-slate-900 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Laptop className="size-4" /> Configuração do Computador
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">S/N: {order.serialNumber || 'N/A'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="font-bold text-slate-400 flex items-center gap-1.5"><Laptop className="size-3.5" /> Equipamento</span>
                      <span className="font-black text-slate-800 dark:text-slate-100">{order.device}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="font-bold text-slate-400 flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> Cliente</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{order.customerName}</span>
                    </div>
                  </div>
                </Card>

                {/* Grid Lado a Lado para Detalhes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Lado Esquerdo: Informativo & Orçamento */}
                  <div className="space-y-6">
                    {/* Observações da Assistência (Público) */}
                    {order.observationClient && (
                      <Card className="p-5 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                        <div className="flex gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                          <Eye className="size-4 shrink-0 mt-0.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Informativo da Assistência</span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {order.observationClient}
                        </p>
                      </Card>
                    )}

                    {/* Peças e Orçamento */}
                    {order.budgetItems && order.budgetItems.length > 0 && (
                      <Card className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Peças / Orçamento Necessário</p>
                        <div className="space-y-3">
                          {order.budgetItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                              <div className="min-w-0 flex-1 pr-4">
                                <p className="text-xs font-bold truncate">{item.name}</p>
                              </div>
                              <span className="text-xs font-black text-slate-700 dark:text-slate-200">R$ {item.price.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-bold text-slate-400">Total das Peças</span>
                            <span className="font-black text-base text-primary">R$ {order.budgetItems.reduce((acc, i) => acc + i.price, 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Lado Direito: Checklist & Mídias */}
                  <div className="space-y-6">
                    {/* Checklist */}
                    {order.checklist && Object.keys(order.checklist).length > 0 && (
                      <Card className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checklist de Verificação</p>
                        <div className="grid grid-cols-1 gap-2">
                          {CHECKLIST_COMPONENTS.map(comp => {
                            const item = order.checklist?.[comp.key];
                            if (!item || item.status === 'nao_testado') return null;

                            const isBom = item.status === 'bom';
                            return (
                              <div key={comp.key} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="flex items-center gap-2 min-w-0">
                                  <comp.icon className="size-3.5 text-slate-400 shrink-0" />
                                  <span className="text-xs font-bold truncate">{comp.label}</span>
                                </div>
                                <span className={cn('text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg shrink-0', isBom ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-red-50 text-red-500 dark:bg-red-950/40')}>
                                  {isBom ? 'Testado OK' : 'Defeito'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    )}

                    {/* Mídia (Evidência visual para o cliente) */}
                    {order.mediaUrls && order.mediaUrls.length > 0 && (
                      <Card className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Galeria de Fotos e Vídeos</p>
                        <div className="grid grid-cols-2 gap-2">
                          {order.mediaUrls.map((m, i) => (
                            <div key={i} className="aspect-video relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 group">
                              {m.type === 'image' ? (
                                <a href={m.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                  <img src={m.url} alt={m.name || `Foto ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                </a>
                              ) : (
                                <video src={m.url} controls className="w-full h-full object-cover rounded-xl bg-black" />
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                </div>

                <div className="bg-primary/5 dark:bg-primary/5 rounded-[2rem] p-6 text-center border-2 border-dashed border-primary/20">
                  <p className="text-slate-600 dark:text-slate-400 font-bold text-xs leading-relaxed">
                    Tem alguma dúvida ou precisa aprovar o orçamento?<br/>
                    Entre em contato com nossa equipe.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};
