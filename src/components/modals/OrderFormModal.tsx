import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Order } from '../../types';

export const OrderFormModal = ({
  order,
  onSave,
  onCancel
}: {
  order?: Partial<Order>,
  onSave: (data: Partial<Order>) => void,
  onCancel: () => void
}) => {
  const [formData, setFormData] = useState({
    customerName: order?.customerName || '',
    customerEmail: order?.customerEmail || '',
    customerPhone: order?.customerPhone || '',
    device: order?.device || '',
    serialNumber: order?.serialNumber || '',
    problem: order?.problem || '',
    value: order?.value || 0,
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] md:rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold">{order?.id ? 'Editar Ordem' : 'Nova Ordem de Serviço'}</h3>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Nome do Cliente</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">E-mail</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="joao@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">Telefone</label>
                <input
                  type="text"
                  value={formData.customerPhone}
                  onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Dispositivo</label>
              <input
                type="text"
                value={formData.device}
                onChange={e => setFormData({ ...formData, device: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: MacBook Pro M1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">Nº de Série</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="S/N"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">Valor (R$)</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Descrição do Problema</label>
              <textarea
                value={formData.problem}
                onChange={e => setFormData({ ...formData, problem: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                placeholder="Descreva o problema..."
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
          <Button onClick={() => onSave(formData)} className="flex-1">Salvar Ordem</Button>
        </div>
      </motion.div>
    </div>
  );
};
