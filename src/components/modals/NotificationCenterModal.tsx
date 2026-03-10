import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Notification } from '../../types';
import { Button } from '../ui/Button';
import { cn } from '../ui/utils';

interface NotificationCenterModalProps {
  notifications: Notification[];
  onClose: () => void;
  onClear: () => void;
}

export const NotificationCenterModal = ({ notifications, onClose, onClear }: NotificationCenterModalProps) => {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-end md:p-4">
      <motion.div 
        initial={{ x: '100%' }} 
        animate={{ x: 0 }} 
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md h-full md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Bell className="size-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Notificações</h3>
              <p className="text-xs text-slate-500 font-medium">{notifications.length} mensagens recentes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="size-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <Bell className="size-10" />
              </div>
              <h4 className="font-bold text-slate-400">Nenhuma notificação</h4>
              <p className="text-sm text-slate-500">Tudo limpo por aqui!</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex gap-4 animate-in fade-in slide-in-from-right-4 duration-300"
              >
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center shrink-0",
                  notif.type === 'info' ? "bg-blue-100 text-blue-600" :
                  notif.type === 'success' ? "bg-green-100 text-green-600" :
                  "bg-amber-100 text-amber-600"
                )}>
                  {notif.type === 'info' && <Info className="size-5" />}
                  {notif.type === 'success' && <CheckCircle className="size-5" />}
                  {notif.type === 'warning' && <AlertTriangle className="size-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white truncate">{notif.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-3 leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Clock className="size-3" />
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" className="w-full" onClick={onClear}>
              Limpar Tudo
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
