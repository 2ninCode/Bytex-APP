import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../ui/utils';
import { Notification, Employee } from '../../types';
import { Users } from 'lucide-react';

export const SendNotificationModal = ({ onClose, onSend, employees }: {
  onClose: () => void,
  onSend: (n: Notification) => void,
  employees: Employee[]
}) => {
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning'>('info');
  const [targetId, setTargetId] = useState<string>('');

  const handleSend = () => {
    if (!title.trim() || !msg.trim()) return;
    onSend({
      id: Date.now().toString(), 
      title, 
      message: msg, 
      type, 
      timestamp: new Date(),
      targetEmployeeId: targetId || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" /> Enviar Notificação
        </h3>
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
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSend} className="flex-1">Enviar</Button>
        </div>
      </motion.div>
    </div>
  );
};
