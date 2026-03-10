import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'primary';
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center"
          >
            <div className={`mx-auto size-16 rounded-2xl flex items-center justify-center mb-6 ${
              variant === 'danger' ? 'bg-red-50 text-red-500 dark:bg-red-950/30' :
              variant === 'warning' ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/30' :
              'bg-primary/10 text-primary'
            }`}>
              <AlertTriangle className="size-8" />
            </div>
            
            <h3 className="text-xl font-black mb-2">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
              {message}
            </p>

            <div className="flex flex-col gap-3">
              <Button 
                variant={variant === 'danger' ? 'primary' : 'secondary'} 
                onClick={onConfirm}
                className={`h-12 rounded-xl font-bold uppercase tracking-widest text-xs ${
                  variant === 'danger' ? 'bg-red-500 hover:bg-red-600 border-none text-white' : ''
                }`}
              >
                {confirmLabel}
              </Button>
              <Button 
                variant="ghost" 
                onClick={onCancel}
                className="h-12 rounded-xl font-bold text-slate-400 hover:text-slate-600"
              >
                {cancelLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
