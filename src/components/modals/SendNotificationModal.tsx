import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../ui/utils';
import { Employee } from '../../types';
import { Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string;

export const SendNotificationModal = ({ onClose, employees }: {
  onClose: () => void,
  onSend?: (n: any) => void,
  employees: Employee[]
}) => {
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning'>('info');
  const [targetId, setTargetId] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSend = async () => {
    if (!title.trim() || !msg.trim() || status === 'sending') return;
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          title,
          message: msg,
          type,
          targetEmployeeId: targetId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao enviar notificação');

      setStatus('success');
      setTimeout(() => onClose(), 1500);
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro desconhecido');
      setStatus('error');
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 100 }} 
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2.5rem] md:rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" /> Enviar Notificação
        </h3>

        {status === 'success' ? (
          <div className="py-8 flex flex-col items-center gap-3 text-green-500">
            <CheckCircle2 className="size-14" />
            <p className="font-bold text-lg">Notificação enviada!</p>
            <p className="text-sm text-slate-400 text-center">A mensagem foi entregue via push notification</p>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Destinatário</label>
              <div className="relative">
                <select 
                  value={targetId} 
                  onChange={e => setTargetId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 outline-none appearance-none font-medium"
                >
                  <option value="">Avisar todos da equipe</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Users className="size-4" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Título</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 outline-none" placeholder="Ex: Aviso da Gerência" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Mensagem</label>
              <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 outline-none resize-none" placeholder="Digite a mensagem..." />
            </div>
            <div className="flex gap-2">
              {(['info', 'success', 'warning'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors",
                    type === t ? 'border-primary text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-500')}>
                  {t === 'info' ? 'Aviso' : t === 'success' ? 'Sucesso' : 'Alerta'}
                </button>
              ))}
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={onClose} className="flex-1" disabled={status === 'sending'}>Cancelar</Button>
              <Button onClick={handleSend} className="flex-1" disabled={!title.trim() || !msg.trim() || status === 'sending'}>
                {status === 'sending' ? (
                  <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" />Enviando...</span>
                ) : 'Enviar Push'}
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
