import React from 'react';
import { Plus, ClipboardList, Laptop, ChevronRight, ArrowLeft, Edit2, X, Check, RefreshCw, Box, User, ArrowUpRight, Trash2, Smartphone, DollarSign, AlertCircle, MoreVertical } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
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
  onDelete,
  onTrack
}: {
  currentUser: Employee,
  orders: Order[],
  onSelect: (id: string) => void,
  selectedOrderId: string | null,
  onBack: () => void,
  onUpdateStatus: (id: string, status: OrderStatus) => void,
  onAdd: () => void,
  onEdit: (order: Order) => void,
  onDelete: (id: string) => void,
  onTrack: (id: string) => void
}) => {
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [showMobileActions, setShowMobileActions] = React.useState(false);
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  if (!selectedOrderId || !selectedOrder) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900">
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Ordens de Serviço</h2>
          {currentUser.role !== 'funcionario' && (
            <Button onClick={onAdd} className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider">
              <Plus className="w-4 h-4 mr-1" /> Nova Ordem
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-6 space-y-4 pb-32">
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
      </div>
    );
  }

  const steps: { label: string, status: 'done' | 'active' | 'pending' }[] = [
    { label: 'Entrada', status: 'done' },
    { label: 'Orçamento', status: selectedOrder.status === 'budget' ? 'active' : 'done' },
    { label: 'Reparo', status: selectedOrder.status === 'in_progress' ? 'active' : (['ready', 'finished'].includes(selectedOrder.status) ? 'done' : 'pending') },
    { label: 'Finalizado', status: selectedOrder.status === 'finished' ? 'done' : 'pending' }
  ];

  const statusOptions: { label: string, value: OrderStatus, icon: any, color: string }[] = [
    { label: 'Orçamento', value: 'budget', icon: ClipboardList, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'Aprovação', value: 'approval', icon: Box, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { label: 'Em Reparo', value: 'in_progress', icon: Laptop, color: 'text-primary bg-primary/5 border-primary/20' },
    { label: 'Pronto', value: 'ready', icon: Check, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Entregue', value: 'finished', icon: Box, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900">
      {/* Detail Header - Pinned */}
      <div className="p-3 pt-safe border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-950 z-20 shadow-sm relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            <button onClick={onBack} className="p-2 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90">
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="size-8 md:size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                <Laptop className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2">
                    <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white truncate max-w-[120px] md:max-w-xs">{selectedOrder.customerName}</h3>
                    <span className="text-[9px] md:text-[10px] font-black tracking-widest bg-primary text-white px-1.5 py-0.5 rounded uppercase hidden sm:inline-block">#{selectedOrder.id}</span>
                 </div>
                 <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">{selectedOrder.device}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => onTrack(selectedOrder.id)} className="p-2 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-95 flex items-center gap-2" title="Rastrear">
                 <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                 <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline-block">Rastrear</span>
              </button>
              {currentUser.role !== 'funcionario' && (
                <>
                  <button onClick={() => onEdit(selectedOrder)} className="p-2 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-95 flex items-center gap-2" title="Editar">
                    <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline-block">Editar</span>
                  </button>
                  <button onClick={() => setDeleteId(selectedOrder.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all active:scale-95 flex items-center gap-2" title="Remover">
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline-block">Excluir</span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile Actions Dropdown Toggle */}
            <div className="md:hidden relative">
               <button onClick={() => setShowMobileActions(!showMobileActions)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-500 rounded-xl transition-all active:scale-95 relative z-30">
                 <MoreVertical className="w-5 h-5" />
               </button>
               
               {/* Dropdown Menu */}
               {showMobileActions && (
                 <>
                   <div className="fixed inset-0 z-20" onClick={() => setShowMobileActions(false)} />
                   <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-30 flex flex-col gap-1 px-2 animate-in fade-in slide-in-from-top-2">
                     <button onClick={() => { setShowMobileActions(false); onTrack(selectedOrder.id); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl flex items-center gap-3">
                        <ArrowUpRight className="w-4 h-4 text-primary" /> Rastrear
                     </button>
                     {currentUser.role !== 'funcionario' && (
                       <>
                        <button onClick={() => { setShowMobileActions(false); onEdit(selectedOrder); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl flex items-center gap-3">
                           <Edit2 className="w-4 h-4 text-primary" /> Editar
                        </button>
                        <hr className="border-slate-100 dark:border-slate-700 my-1 mx-2" />
                        <button onClick={() => { setShowMobileActions(false); setDeleteId(selectedOrder.id); }} className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3">
                           <Trash2 className="w-4 h-4" /> Excluir
                        </button>
                       </>
                     )}
                   </div>
                 </>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="p-4 max-w-4xl mx-auto space-y-6 pb-32">
          {/* Timeline */}
          <section className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Progresso do Serviço</h4>
            <Card className="p-5">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0" />
                {steps.map((step, i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={cn(
                      "size-8 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                      step.status === 'done' ? "bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/30" :
                      step.status === 'active' ? "bg-white border-primary text-primary animate-pulse shadow-md" :
                      "bg-white border-slate-100 text-slate-300 dark:bg-slate-900 dark:border-slate-800"
                    )}>
                      {step.status === 'done' ? <Check className="w-4 h-4" /> : <span className="text-[10px] font-black">{i + 1}</span>}
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-wider",
                      step.status === 'pending' ? "text-slate-300" : "text-slate-600 dark:text-slate-400"
                    )}>{step.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Informações Básicas</h4>
              <Card className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cliente</p>
                    <p className="font-bold">{selectedOrder.customerName}</p>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-4">
                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Aparelho</p>
                    <p className="font-bold">{selectedOrder.device}</p>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-4">
                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Valor Estimado</p>
                    <p className="font-bold text-lg text-primary">R$ {selectedOrder.value.toFixed(0)}</p>
                  </div>
                </div>
              </Card>
            </section>

            <section className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Defeito Relatado</h4>
              <Card className="p-5 bg-amber-50/20 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/40 h-full">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                    {selectedOrder.problem}
                  </p>
                </div>
              </Card>
            </section>
          </div>

          <section className="space-y-3 mt-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Ações de Status</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateStatus(selectedOrder.id, opt.value)}
                  className={cn(
                    "p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all active:scale-95 group relative border-2",
                    selectedOrder.status === opt.value
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105 z-10"
                      : "bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  )}
                >
                  <opt.icon className={cn("size-5 transition-transform group-hover:rotate-6",
                    selectedOrder.status === opt.value ? "text-white" : "text-slate-400"
                  )} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{opt.label}</span>
                  {selectedOrder.status === opt.value && (
                    <div className="absolute -top-2 -right-2 size-6 bg-white text-primary rounded-full flex items-center justify-center shadow-lg border-2 border-primary">
                      <Check className="size-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Excluir Ordem?"
        message="Tem certeza que deseja remover esta ordem de serviço? Esta ação é irreversível."
        confirmLabel="Excluir Agora"
        onConfirm={() => {
          if (deleteId) onDelete(deleteId);
          setDeleteId(null);
          onBack();
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
