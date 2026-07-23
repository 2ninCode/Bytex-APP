import React, { useState, useEffect } from 'react';
import {
  Plus, ClipboardList, Laptop, ChevronRight, ArrowLeft, Edit2, X, Check,
  RefreshCw, Box, User, ArrowUpRight, Trash2, Smartphone, DollarSign,
  AlertCircle, MoreVertical, Eye, EyeOff, CheckCircle2, Shield, Cpu,
  HardDrive, Zap, Monitor, Thermometer, Battery, Play, AlertTriangle,
  Copy, ExternalLink, Sparkles, Save, Lock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { cn } from '../components/ui/utils';
import { Order, OrderStatus, Employee, Checklist } from '../types';
import { CustomerDetailsModal } from '../components/modals/CustomerDetailsModal';
import { CHECKLIST_HARDWARE, CHECKLIST_SOFTWARE, CHECKLIST_COMPONENTS } from '../components/modals/OrderFormModal';
import { supabase } from '../lib/supabase';

export const OrdersView = ({
  currentUser,
  orders,
  employees,
  selectedOrderId,
  onSelect,
  onBack,
  onUpdateStatus,
  onAdd,
  onEdit,
  onDelete,
  onTrack
}: {
  currentUser: Employee,
  orders: Order[],
  employees: Employee[],
  selectedOrderId: string | null,
  onSelect: (id: string) => void,
  onBack: () => void,
  onUpdateStatus: (id: string, status: OrderStatus) => void,
  onAdd: () => void,
  onEdit: (order: Order) => void,
  onDelete: (id: string) => void,
  onTrack: (id: string) => void
}) => {
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [showMobileActions, setShowMobileActions] = React.useState(false);
  const [viewCustomerId, setViewCustomerId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = React.useState<string | null>(null);

  // Quick Inline Edit State
  const [isQuickEditing, setIsQuickEditing] = React.useState(false);
  const [quickForm, setQuickForm] = React.useState({
    device: '',
    serialNumber: '',
    value: '',
    observationClient: '',
    technicalReport: '',
    responsibleEmployeeId: ''
  });

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Sincroniza formulário rápido ao selecionar uma OS
  React.useEffect(() => {
    setErrorMessage(null);
    if (selectedOrder) {
      setQuickForm({
        device: selectedOrder.device || '',
        serialNumber: selectedOrder.serialNumber || '',
        value: String(selectedOrder.value || 0),
        observationClient: selectedOrder.observationClient || '',
        technicalReport: selectedOrder.technicalReport || '',
        responsibleEmployeeId: selectedOrder.responsibleEmployeeId || ''
      });
      setIsQuickEditing(false);
    }
  }, [selectedOrderId, selectedOrder]);

  const handleCopyTrackingLink = (id: string) => {
    const link = `${window.location.origin}${window.location.pathname}?track=${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }).catch(err => {
      console.error('Falha ao copiar link: ', err);
    });
  };

  const handleSaveQuickEdit = async () => {
    if (!selectedOrder || !supabase) return;
    const payload = {
      device: quickForm.device,
      serial_number: quickForm.serialNumber,
      value: parseFloat(quickForm.value) || 0,
      observation_client: quickForm.observationClient || null,
      technical_report: quickForm.technicalReport || null,
      responsible_employee_id: quickForm.responsibleEmployeeId || null,
    };

    const { error } = await supabase.from('orders').update(payload).eq('id', selectedOrder.id);
    if (error) {
      alert(`Erro ao salvar edição rápida: ${error.message}`);
    } else {
      setIsQuickEditing(false);
      onUpdateStatus(selectedOrder.id, selectedOrder.status);
    }
  };

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
              orders.map((order) => {
                // Se finalizado e não é admin/gestor, pode ocultar ou não. Mostramos todas para facilitar.
                const isFinished = order.status === 'finished';
                return (
                  <Card
                    key={order.id}
                    className={cn(
                      "p-5 flex items-center gap-5 hover:border-primary/40 transition-all cursor-pointer group active:scale-[0.99]",
                      isFinished && "opacity-75"
                    )}
                    onClick={() => onSelect(order.id)}
                  >
                    <div 
                      className={cn(
                        "size-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-95 group/icon",
                        isFinished ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary",
                        order.customerId ? "cursor-pointer hover:bg-primary hover:text-white" : ""
                      )}
                      onClick={(e) => {
                        if (order.customerId) {
                          e.stopPropagation();
                          setViewCustomerId(order.customerId);
                        }
                      }}
                    >
                      {order.customerId ? <User className="w-7 h-7" /> : <Laptop className="w-7 h-7" />}
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
                        isFinished ? "text-emerald-500" :
                          order.status === 'in_progress' ? "text-primary" : "text-amber-500"
                      )}>
                        {order.status === 'budget' ? 'Orçamento' :
                          order.status === 'approval' ? 'Aprovação' :
                            order.status === 'in_progress' ? 'Em Reparo' :
                              order.status === 'ready' ? 'Pronto' : 'Entregue'}
                      </span>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors w-6 h-6" />
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Bloqueio de Fase por Checklist ──────────────────────────────
  const badChecklistItems = Object.entries(selectedOrder.checklist || {})
    .filter(([_, item]) => item?.status === 'ruim')
    .map(([key]) => CHECKLIST_COMPONENTS.find(c => c.key === key)?.label || key);

  const hasRuimChecklist = badChecklistItems.length > 0;

  const handleStatusChangeClick = (newStatus: OrderStatus) => {
    // Se for mudar para Pronto (ready) ou Entregue (finished) e tiver algum item "Ruim", bloqueia
    if (['ready', 'finished'].includes(newStatus) && hasRuimChecklist) {
      setErrorMessage(`Não é possível finalizar a OS ou marcá-la como Pronto. Componente(s) com defeito no checklist: ${badChecklistItems.join(', ')}. Resolva os problemas no checklist antes de continuar.`);
      return;
    }
    setErrorMessage(null);
    onUpdateStatus(selectedOrder.id, newStatus);
  };

  const steps: { label: string, status: 'done' | 'active' | 'pending' }[] = [
    { label: 'Orçamento', status: selectedOrder.status === 'budget' ? 'active' : 'done' },
    { label: 'Aprovação', status: selectedOrder.status === 'approval' ? 'active' : (['in_progress', 'ready', 'finished'].includes(selectedOrder.status) ? 'done' : 'pending') },
    { label: 'Reparo', status: selectedOrder.status === 'in_progress' ? 'active' : (['ready', 'finished'].includes(selectedOrder.status) ? 'done' : 'pending') },
    { label: 'Pronto', status: selectedOrder.status === 'ready' ? 'active' : (selectedOrder.status === 'finished' ? 'done' : 'pending') },
    { label: 'Entregue', status: selectedOrder.status === 'finished' ? 'done' : 'pending' }
  ];

  const statusOptions: { label: string, value: OrderStatus, icon: any, color: string }[] = [
    { label: 'Orçamento', value: 'budget', icon: ClipboardList, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'Aprovação', value: 'approval', icon: Box, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { label: 'Em Reparo', value: 'in_progress', icon: Laptop, color: 'text-primary bg-primary/5 border-primary/20' },
    { label: 'Pronto', value: 'ready', icon: Check, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Entregue', value: 'finished', icon: Box, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  ];

  const responsibleTech = employees.find(e => e.id === selectedOrder.responsibleEmployeeId);

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
                  <h3 
                    className="text-sm md:text-base font-black text-slate-800 dark:text-white truncate max-w-[120px] md:max-w-xs cursor-pointer hover:text-primary transition-colors"
                    onClick={() => selectedOrder.customerId && setViewCustomerId(selectedOrder.customerId)}
                  >
                    {selectedOrder.customerName}
                  </h3>
                  <span className="text-[9px] md:text-[10px] font-black tracking-widest bg-primary text-white px-1.5 py-0.5 rounded uppercase">#{selectedOrder.id}</span>
                </div>
                <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">{selectedOrder.device}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => setIsQuickEditing(!isQuickEditing)}
                className={cn(
                  "p-2 rounded-xl transition-all active:scale-95 flex items-center gap-2 border font-bold text-[10px] uppercase tracking-wider",
                  isQuickEditing 
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                    : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40"
                )}
                title="Edição Rápida na Tela"
              >
                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                <span>Edição Rápida</span>
              </button>
              <button 
                onClick={() => {
                  const link = `${window.location.origin}${window.location.pathname}?track=${selectedOrder.id}`;
                  window.open(link, '_blank');
                }} 
                className="p-2 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-95 flex items-center gap-2" 
                title="Abrir Rastreio em Nova Aba"
              >
                 <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Aba de Rastreio</span>
              </button>
              <button 
                onClick={() => handleCopyTrackingLink(selectedOrder.id)} 
                className={cn(
                  "p-2 rounded-xl transition-all active:scale-95 flex items-center gap-2 border",
                  copiedLinkId === selectedOrder.id 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30" 
                    : "bg-primary/5 text-primary hover:bg-primary/10 border-transparent"
                )}
                title="Copiar Link de Rastreio"
              >
                 {copiedLinkId === selectedOrder.id ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <Copy className="w-4 h-4 md:w-5 md:h-5" />}
                 <span className="text-[10px] font-bold uppercase tracking-wider">
                   {copiedLinkId === selectedOrder.id ? "Copiado!" : "Copiar Link"}
                 </span>
              </button>
              {currentUser.role !== 'funcionario' && (
                <>
                  <button onClick={() => onEdit(selectedOrder)} className="p-2 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-95 flex items-center gap-2" title="Editar Completo">
                    <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Editar Form</span>
                  </button>
                  <button onClick={() => setDeleteId(selectedOrder.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all active:scale-95 flex items-center gap-2" title="Remover">
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Excluir</span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden relative">
               <button onClick={() => setShowMobileActions(!showMobileActions)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-500 rounded-xl transition-all active:scale-95 relative z-30">
                 <MoreVertical className="w-5 h-5" />
               </button>
               
               {showMobileActions && (
                 <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowMobileActions(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-30 flex flex-col gap-1 px-2">
                      <button 
                        onClick={() => { 
                          setShowMobileActions(false); 
                          setIsQuickEditing(!isQuickEditing);
                        }} 
                        className="w-full text-left px-3 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl flex items-center gap-3"
                      >
                         <Sparkles className="w-4 h-4 text-amber-500" /> Edição Rápida
                      </button>
                      <button 
                        onClick={() => { 
                          setShowMobileActions(false); 
                          const link = `${window.location.origin}${window.location.pathname}?track=${selectedOrder.id}`;
                          window.open(link, '_blank');
                        }} 
                        className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl flex items-center gap-3"
                      >
                         <ExternalLink className="w-4 h-4 text-primary" /> Rastrear (Nova Aba)
                      </button>
                      <button 
                        onClick={() => { 
                          setShowMobileActions(false); 
                          handleCopyTrackingLink(selectedOrder.id);
                        }} 
                        className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl flex items-center gap-3"
                      >
                         <Copy className="w-4 h-4 text-primary" /> Copiar Link
                      </button>
                      {currentUser.role !== 'funcionario' && (
                        <>
                          <button onClick={() => { setShowMobileActions(false); onEdit(selectedOrder); }} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl flex items-center gap-3">
                             <Edit2 className="w-4 h-4 text-primary" /> Editar Completo
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
        <div className="p-4 max-w-5xl mx-auto space-y-6 pb-32">
          
          {/* Alertas / Mensagens de Bloqueio */}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/40 rounded-2xl p-4 flex gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="size-5 shrink-0 mt-0.5" />
              <div className="text-sm font-bold leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Painel de Edição Rápida Inline */}
          {isQuickEditing && (
            <Card className="p-5 border-2 border-amber-400/60 bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900/40 pb-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                  <Sparkles className="size-4" /> Edição Rápida Direta da OS #{selectedOrder.id}
                </h4>
                <button onClick={() => setIsQuickEditing(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Aparelho / Equipamento</label>
                  <input
                    value={quickForm.device}
                    onChange={e => setQuickForm(f => ({ ...f, device: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Número de Série (S/N)</label>
                  <input
                    value={quickForm.serialNumber}
                    onChange={e => setQuickForm(f => ({ ...f, serialNumber: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-mono outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Valor do Serviço (R$)</label>
                  <input
                    type="number"
                    value={quickForm.value}
                    onChange={e => setQuickForm(f => ({ ...f, value: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-black text-emerald-600 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Técnico Responsável</label>
                  <select
                    value={quickForm.responsibleEmployeeId}
                    onChange={e => setQuickForm(f => ({ ...f, responsibleEmployeeId: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold outline-none focus:border-primary"
                  >
                    <option value="">Não designado</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.jobTitle})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-emerald-600 block mb-1 flex items-center gap-1">
                  <Eye className="size-3" /> Observação para o Cliente (Pública no rastreio)
                </label>
                <textarea
                  rows={2}
                  value={quickForm.observationClient}
                  onChange={e => setQuickForm(f => ({ ...f, observationClient: e.target.value }))}
                  placeholder="Informações que o cliente poderá ler no link..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 flex items-center gap-1">
                  <Lock className="size-3" /> Laudo Técnico Interno (Privado)
                </label>
                <textarea
                  rows={2}
                  value={quickForm.technicalReport}
                  onChange={e => setQuickForm(f => ({ ...f, technicalReport: e.target.value }))}
                  placeholder="Apenas para equipe de técnicos..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/30">
                <Button variant="secondary" size="sm" onClick={() => setIsQuickEditing(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleSaveQuickEdit} className="bg-primary text-white">
                  <Save className="size-4 mr-1" /> Salvar Alterações Agora
                </Button>
              </div>
            </Card>
          )}

          {hasRuimChecklist && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 flex gap-3 text-amber-700 dark:text-amber-400">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <div className="text-sm font-bold leading-relaxed">
                Atenção: A OS está travada para avanço operacional de finalização pois existem peças com falha no checklist ({badChecklistItems.join(', ')}).
              </div>
            </div>
          )}

          {/* Timeline */}
          <section className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Progresso do Serviço</h4>
            <Card className="p-5 overflow-x-auto">
              <div className="flex items-center justify-between relative min-w-[320px] py-2">
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
                    <span className={cn("text-[9px] font-black uppercase tracking-wider whitespace-nowrap",
                      step.status === 'pending' ? "text-slate-300" : "text-slate-600 dark:text-slate-400"
                    )}>{step.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Informações Gerais */}
            <section className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Informações Básicas</h4>
              <Card className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                <div 
                  className={cn(
                    "p-4 flex items-center gap-4",
                    selectedOrder.customerId ? "cursor-pointer hover:bg-primary/[0.02] transition-colors" : ""
                  )}
                  onClick={() => selectedOrder.customerId && setViewCustomerId(selectedOrder.customerId)}
                >
                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cliente</p>
                    <p className="font-bold">{selectedOrder.customerName}</p>
                  </div>
                  {selectedOrder.customerId && (
                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Ver Perfil</button>
                  )}
                </div>
                
                <div className="p-4 flex items-center gap-4">
                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Aparelho / Modelo</p>
                    <p className="font-bold">{selectedOrder.device}</p>
                    {selectedOrder.serialNumber && (
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">S/N: {selectedOrder.serialNumber}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 flex items-center gap-4">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Técnico Responsável</p>
                    <p className="font-bold">{responsibleTech ? responsibleTech.name : 'Não designado'}</p>
                  </div>
                </div>

                <div className="p-4 flex items-center gap-4">
                  <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Valor do Serviço</p>
                    <p className="font-black text-lg text-emerald-600 dark:text-emerald-400">R$ {selectedOrder.value.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            </section>

            {/* Diagnóstico & Observações */}
            <section className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Diagnóstico e Comunicação</h4>
              <div className="space-y-3">
                
                {/* Defeito Relatado */}
                <Card className="p-4 bg-amber-50/20 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/40">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-2">Defeito Relatado</p>
                  <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 break-words whitespace-pre-wrap">
                    {selectedOrder.problem}
                  </p>
                </Card>

                {/* Obs Cliente */}
                {selectedOrder.observationClient && (
                  <Card className="p-4 bg-emerald-50/10 dark:bg-emerald-900/5 border-emerald-100 dark:border-emerald-900/20">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1 mb-2">
                      <Eye className="size-3.5" /> Observação para o Cliente (Pública)
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 break-words whitespace-pre-wrap">
                      {selectedOrder.observationClient}
                    </p>
                  </Card>
                )}

                {/* Laudo Técnico */}
                {selectedOrder.technicalReport && (
                  <Card className="p-4 bg-slate-100/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
                      <EyeOff className="size-3.5" /> Laudo Técnico Interno (Privado)
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 break-words whitespace-pre-wrap">
                      {selectedOrder.technicalReport}
                    </p>
                  </Card>
                )}

              </div>
            </section>
          </div>

          {/* Checklist */}
          {selectedOrder.checklist && Object.keys(selectedOrder.checklist).length > 0 && (
            <section className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Checklist de Peças</h4>
              <Card className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {CHECKLIST_COMPONENTS.map(comp => {
                    const item = selectedOrder.checklist?.[comp.key];
                    if (!item || item.status === 'nao_testado') return null;

                    const isBom = item.status === 'bom';
                    return (
                      <div key={comp.key} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', isBom ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500')}>
                          <comp.icon className="size-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-700 dark:text-slate-200 leading-none mb-1">{comp.label}</p>
                          <span className={cn('text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded', isBom ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-red-50 text-red-500 dark:bg-red-950')}>
                            {isBom ? 'Bom' : 'Defeituoso'}
                          </span>
                          {item.note && (
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed break-words">{item.note}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>
          )}

          {/* Orçamento de Peças */}
          {selectedOrder.budgetItems && selectedOrder.budgetItems.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Orçamento de Peças</h4>
              <Card className="p-4 space-y-3">
                <div className="space-y-2">
                  {selectedOrder.budgetItems.map(item => (
                    <div key={item.id} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 flex items-center gap-3">
                      <Box className="size-5 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        {item.link && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Lock className="size-3 text-amber-500 shrink-0" />
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline font-medium truncate block max-w-[200px] md:max-w-md">
                              {item.link}
                            </a>
                            <span className="text-[8px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded shrink-0">
                              Privado
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="font-black text-sm shrink-0">R$ {item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-400">Total do Orçamento</span>
                  <span className="font-black text-lg text-primary">R$ {selectedOrder.budgetItems.reduce((acc, i) => acc + i.price, 0).toFixed(2)}</span>
                </div>
              </Card>
            </section>
          )}

          {/* Fotos e Vídeos */}
          {selectedOrder.mediaUrls && selectedOrder.mediaUrls.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Fotos e Vídeos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedOrder.mediaUrls.map((m, i) => (
                  <Card key={i} className="overflow-hidden aspect-video relative group border border-slate-100 dark:border-slate-800">
                    {m.type === 'image' ? (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                        <img src={m.url} alt={m.name || `Mídia ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </a>
                    ) : (
                      <video src={m.url} controls className="w-full h-full object-cover rounded-xl bg-black" />
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Ações de Status */}
          <section className="space-y-3 mt-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Ações de Status</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChangeClick(opt.value)}
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

      {viewCustomerId && (
        <CustomerDetailsModal 
          customerId={viewCustomerId} 
          onClose={() => setViewCustomerId(null)} 
        />
      )}
    </div>
  );
};
