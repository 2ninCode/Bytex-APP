import React from 'react';
import { Plus, ClipboardList, Laptop, ChevronRight, ArrowLeft, Edit2, X, Check, RefreshCw, Box, User, ArrowUpRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { cn } from '../components/ui/utils';
import { Order, OrderStatus, Employee } from '../types';

export const OrdersView = ({
  currentUser,
  orders,
  onSelect,
  selectedOrderId,
  onBack,
  onUpdateStatus,
  onAdd,
  onEdit,
  onDelete
}: {
  currentUser: Employee,
  orders: Order[],
  onSelect: (id: string) => void,
  selectedOrderId: string | null,
  onBack: () => void,
  onUpdateStatus: (id: string, status: OrderStatus) => void,
  onAdd: () => void,
  onEdit: (order: Order) => void,
  onDelete: (id: string) => void
}) => {
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  if (!selectedOrderId || !selectedOrder) {
    return (
      <div className="p-6 space-y-8 pb-32">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Ordens de Serviço</h2>
          {currentUser.role !== 'funcionario' && (
            <Button onClick={onAdd} className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider">
              <Plus className="w-4 h-4 mr-1" /> Nova Ordem
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card className="p-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                <ClipboardList className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-slate-500">Nenhuma ordem encontrada</p>
                <p className="text-xs text-slate-400">Comece adicionando uma nova ordem.</p>
              </div>
            </Card>
          ) : (
            orders.filter(o => o.status !== 'finished').map((order) => (
              <Card
                key={order.id}
                className="p-5 flex items-center gap-5 hover:border-primary/40 transition-all cursor-pointer group active:scale-[0.99]"
                onClick={() => onSelect(order.id)}
              >
                <div className={cn(
                  "size-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  order.status === 'finished' ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"
                )}>
                  <Laptop className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-base truncate">{order.customerName}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-black tracking-widest leading-none">#{order.id}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate">{order.device} • {order.problem}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-sm mb-0.5">R$ {order.value.toFixed(0)}</p>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-tighter leading-none",
                    order.status === 'finished' ? "text-emerald-500" :
                      order.status === 'in_progress' ? "text-primary" : "text-amber-500"
                  )}>
                    {order.status === 'budget' ? 'Orçamento' :
                      order.status === 'approval' ? 'Aprovação' :
                        order.status === 'in_progress' ? 'Em Reparo' :
                          order.status === 'ready' ? 'Pronto' : 'Finalizado'}
                  </span>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors w-6 h-6" />
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  const steps: { label: string, status: 'done' | 'active' | 'pending' }[] = [
    { label: "Orçamento", status: selectedOrder.status === 'budget' ? 'active' : 'done' },
    { label: "Aprovação", status: selectedOrder.status === 'approval' ? 'active' : (['in_progress', 'ready', 'finished'].includes(selectedOrder.status) ? 'done' : 'pending') },
    { label: "Em Andamento", status: selectedOrder.status === 'in_progress' ? 'active' : (['ready', 'finished'].includes(selectedOrder.status) ? 'done' : 'pending') },
    { label: "Pronto para Entrega", status: selectedOrder.status === 'ready' ? 'active' : (selectedOrder.status === 'finished' ? 'done' : 'pending') },
    { label: "Finalizado", status: selectedOrder.status === 'finished' ? 'active' : 'pending' },
  ];

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    const sequence: OrderStatus[] = ['budget', 'approval', 'in_progress', 'ready', 'finished'];
    const idx = sequence.indexOf(current);
    return idx < sequence.length - 1 ? sequence[idx + 1] : null;
  };

  const nextStatus = getNextStatus(selectedOrder.status);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> Voltar para lista
        </button>
        <div className="flex gap-2">
          {currentUser.role !== 'funcionario' && (
            <>
              <Button variant="secondary" onClick={() => onEdit(selectedOrder)} className="p-2">
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="danger" onClick={() => onDelete(selectedOrder.id)} className="p-2">
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-6">Status do Reparo</h3>
        <div className="space-y-0">
          {steps.map((step, i, arr) => {
            const isFinishedStep = step.label === 'Finalizado';
            return (
              <div key={i} className="flex gap-4 relative">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
                    step.status === 'done' ? 'bg-primary border-primary text-white' :
                      step.status === 'active' && isFinishedStep ? 'bg-emerald-500 border-emerald-500 text-white' :
                        step.status === 'active' ? 'bg-primary/10 border-primary text-primary' :
                          'bg-transparent border-slate-300 dark:border-slate-700 text-slate-400'
                  )}>
                    {step.status === 'done' ? <Check className="w-5 h-5" /> :
                      step.status === 'active' && isFinishedStep ? (
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <style>{`
                         @keyframes draw-check {
                           0% { stroke-dashoffset: 50; opacity: 0; }
                           30% { opacity: 1; }
                           100% { stroke-dashoffset: 0; opacity: 1; }
                         }
                         .check-path {
                           stroke-dasharray: 50;
                           stroke-dashoffset: 50;
                           animation: draw-check 0.6s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
                         }
                       `}</style>
                          <polyline points="4,13 9,18 20,6" className="check-path" />
                        </svg>
                      ) :
                        step.status === 'active' ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) :
                          <Box className="w-5 h-5" />}
                  </div>
                  {i < arr.length - 1 && (
                    <div className={cn("w-0.5 h-10", step.status === 'done' ? 'bg-primary' : 'border-l-2 border-dashed border-slate-300 dark:border-slate-700')}></div>
                  )}
                </div>
                <div className="pb-6">
                  <p className={cn("font-semibold",
                    step.status === 'active' && isFinishedStep ? 'text-emerald-600 dark:text-emerald-400' :
                      step.status === 'active' ? 'text-primary' : ''
                  )}>{step.label}</p>
                  <p className="text-sm text-slate-500">
                    {step.status === 'done' ? 'Concluído' :
                      step.status === 'active' && isFinishedStep ? '✅ Serviço finalizado!' :
                        step.status === 'active' ? 'Em andamento' : 'Pendente'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <User className="text-primary w-5 h-5" />
            <h4 className="font-bold">Cliente</h4>
          </div>
          <p className="text-lg font-semibold">{selectedOrder.customerName}</p>
          <p className="text-sm text-slate-500 mb-2">{selectedOrder.customerEmail}</p>
          <p className="text-sm text-slate-500">{selectedOrder.customerPhone}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Laptop className="text-primary w-5 h-5" />
            <h4 className="font-bold">Dispositivo</h4>
          </div>
          <p className="text-lg font-semibold">{selectedOrder.device}</p>
          <p className="text-sm text-slate-500 mb-2">S/N: {selectedOrder.serialNumber}</p>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Problema: {selectedOrder.problem}
          </span>
        </Card>
      </div>

      <div className="pt-2 flex gap-2">
         <Button variant="ghost" onClick={() => {
           const url = `${window.location.origin}${window.location.pathname}?track=${selectedOrder.id}`;
           navigator.clipboard.writeText(url);
           alert('Link de rastreio copiado!');
         }} className="flex-1 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary">
           <ArrowUpRight className="w-4 h-4 mr-2" /> Copiar Link
         </Button>
         <Button variant="secondary" onClick={() => {
           const url = `${window.location.origin}${window.location.pathname}?track=${selectedOrder.id}`;
           window.open(url, '_blank');
         }} className="flex-1">
           Visualizar Rastreio
         </Button>
      </div>

      {nextStatus && (
        <div className="pt-2">
          <Button onClick={() => onUpdateStatus(selectedOrder.id, nextStatus)} className="w-full py-4 text-lg shadow-lg shadow-primary/20">
            Avançar Etapa: {
              nextStatus === 'approval' ? 'Aprovar Orçamento' :
                nextStatus === 'in_progress' ? 'Iniciar Reparo' :
                  nextStatus === 'ready' ? 'Concluir Reparo' : 'Finalizar Entrega'
            }
          </Button>
        </div>
      )}
    </div>
  );
};
