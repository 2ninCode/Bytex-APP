import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from './utils';

export interface ToastProps {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
  orderId?: string;
  onClose: (id: string) => void;
}

export const Toast = ({ id, title, message, type = 'info', orderId, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "p-4 rounded-2xl shadow-2xl border flex items-center gap-4 min-w-[300px] max-w-md",
        "bg-white dark:bg-slate-900",
        type === 'info' ? "border-blue-100 dark:border-blue-900/30" :
        type === 'success' ? "border-green-100 dark:border-green-900/30" :
        "border-amber-100 dark:border-amber-900/30"
      )}
    >
      <div className={cn(
        "size-10 rounded-xl flex items-center justify-center shrink-0",
        type === 'info' ? "bg-blue-100 text-blue-600" :
        type === 'success' ? "bg-green-100 text-green-600" :
        "bg-amber-100 text-amber-600"
      )}>
        {type === 'info' && <Info className="size-5" />}
        {type === 'success' && <CheckCircle className="size-5" />}
        {type === 'warning' && <AlertTriangle className="size-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="font-bold text-slate-900 dark:text-white truncate">{title}</h5>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{message}</p>
      </div>
      <button 
        onClick={() => onClose(id)}
        className="size-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-slate-500"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
};
