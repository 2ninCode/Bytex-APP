import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Plus, ClipboardList, Laptop, ChevronRight, ArrowLeft, Edit2, X, Check,
  RefreshCw, Box, User, ArrowUpRight, Trash2, Smartphone, DollarSign,
  AlertCircle, MoreVertical, Eye, EyeOff, CheckCircle2, Shield, Cpu,
  HardDrive, Zap, Monitor, Thermometer, Battery, Play, AlertTriangle,
  Copy, ExternalLink, Sparkles, Save, Lock, Terminal, Wifi, Volume2, Disc, Activity, Upload, Search
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { cn } from '../components/ui/utils';
import { Order, OrderStatus, Employee, Checklist, CustomerDevice, ChecklistStatus, BudgetItem, MediaFile } from '../types';
import { CustomerDetailsModal } from '../components/modals/CustomerDetailsModal';
import { CHECKLIST_HARDWARE, CHECKLIST_SOFTWARE, CHECKLIST_COMPONENTS } from '../components/modals/OrderFormModal';
import { uploadOrConvertMedia } from '../lib/mediaStorage';
import { supabase } from '../lib/supabase';

// ── COMPONENTES AUXILIARES LIVE-EDIT (CLICK-TO-EDIT) ────────────────

const InlineText = ({
  value,
  onSave,
  placeholder = 'Clique para editar...',
  className = '',
  inputClassName = ''
}: {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);

  useEffect(() => { setTemp(value); }, [value]);

  const handleBlur = () => {
    setEditing(false);
    if (temp !== value) onSave(temp);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={temp}
        onChange={e => setTemp(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={e => { if (e.key === 'Enter') handleBlur(); }}
        className={cn("bg-white dark:bg-slate-800 border-2 border-primary rounded-lg px-2 py-1 text-xs outline-none shadow-sm font-bold", inputClassName)}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn("cursor-pointer hover:bg-primary/10 hover:text-primary transition-all px-1.5 py-0.5 rounded border border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50", className)}
      title="Clique diretamente para editar"
    >
      {value || <span className="italic text-slate-400">{placeholder}</span>}
    </span>
  );
};

const InlineTextarea = ({
  value,
  onSave,
  placeholder = 'Clique para digitar laudo ou observação...',
  className = ''
}: {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);

  useEffect(() => { setTemp(value); }, [value]);

  const handleBlur = () => {
    setEditing(false);
    if (temp !== value) onSave(temp);
  };

  if (editing) {
    return (
      <textarea
        autoFocus
        rows={4}
        value={temp}
        onChange={e => setTemp(e.target.value)}
        onBlur={handleBlur}
        className="w-full bg-white dark:bg-slate-800 border-2 border-primary rounded-xl p-3 text-xs outline-none shadow-sm font-medium leading-relaxed"
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={cn("cursor-pointer hover:bg-primary/5 transition-all p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/40 min-h-[5rem]", className)}
      title="Clique diretamente para editar o texto"
    >
      {value ? (
        <p className="whitespace-pre-wrap text-xs font-medium leading-relaxed">{value}</p>
      ) : (
        <p className="italic text-slate-400 text-xs">{placeholder}</p>
      )}
    </div>
  );
};

export const OrdersView = ({
  currentUser,
  orders,
  employees,
  customerDevices = [],
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
  customerDevices?: CustomerDevice[],
  selectedOrderId: string | null,
  onSelect: (id: string) => void,
  onBack: () => void,
  onUpdateStatus: (id: string, status: OrderStatus) => void,
  onAdd: () => void,
  onEdit: (order: Order) => void,
  onDelete: (id: string) => void,
  onTrack: (id: string) => void
}) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [viewCustomerId, setViewCustomerId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'budget' | 'media' | 'report'>('overview');
  const [uploading, setUploading] = useState(false);
  const [selectedMediaPreview, setSelectedMediaPreview] = useState<MediaFile | null>(null);
  
  // List Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [listStatusFilter, setListStatusFilter] = useState<'active' | 'finished' | 'all'>('active');

  // Finishing Animation States
  const [finishingCountdown, setFinishingCountdown] = useState<number | null>(null);
  const [isFinishedAnimated, setIsFinishedAnimated] = useState(false);

  // Form para nova peça
  const [newBudgetItem, setNewBudgetItem] = useState({ name: '', link: '', price: '' });

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const linkedDevice = customerDevices.find(d => d.id === selectedOrder?.deviceId || d.name === selectedOrder?.device);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setErrorMessage(null);
  }, [selectedOrderId]);

  const handleCopyTrackingLink = (id: string) => {
    const link = `${window.location.origin}${window.location.pathname}?track=${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }).catch(err => {
      console.error('Falha ao copiar link: ', err);
    });
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (finishingCountdown !== null && finishingCountdown > 0) {
      timer = setTimeout(() => {
        setFinishingCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (finishingCountdown === 0) {
      setFinishingCountdown(null);
      setIsFinishedAnimated(true);
      if (selectedOrder) {
        onUpdateStatus(selectedOrder.id, 'finished');
      }
      setTimeout(() => {
        setIsFinishedAnimated(false);
        onBack();
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [finishingCountdown, selectedOrder, onUpdateStatus, onBack]);

  // Live Update de qualquer campo da Ordem de Serviço
  const handleUpdateOrderField = async (field: string, val: any) => {
    if (!selectedOrder || !supabase) return;
    const { error } = await supabase.from('orders').update({ [field]: val }).eq('id', selectedOrder.id);
    if (error) {
      console.error('Erro ao atualizar campo:', error);
      alert(`Aviso ao atualizar: ${error.message}`);
    } else {
      onUpdateStatus(selectedOrder.id, selectedOrder.status);
    }
  };

  // Live Update das especificações do PC (customer_devices)
  const handleUpdateDeviceSpec = async (specKey: string, val: string) => {
    if (!selectedOrder || !supabase) return;
    const devId = selectedOrder.deviceId || linkedDevice?.id;
    if (!devId) return;

    const currentSpecs = linkedDevice?.specs || {};
    const newSpecs = { ...currentSpecs, [specKey]: val };

    await supabase.from('customer_devices').update({ specs: newSpecs }).eq('id', devId);
    onUpdateStatus(selectedOrder.id, selectedOrder.status);
  };

  // Atualizar Status do Checklist
  const handleUpdateChecklistStatus = async (compKey: keyof Checklist, newStatus: ChecklistStatus) => {
    if (!selectedOrder || !supabase) return;

    const currentChecklist = selectedOrder.checklist || {};
    const currentItem = currentChecklist[compKey] || { status: 'nao_testado' as ChecklistStatus, note: '' };

    const newChecklist = {
      ...currentChecklist,
      [compKey]: { ...currentItem, status: newStatus }
    };

    await supabase.from('orders').update({ checklist: newChecklist }).eq('id', selectedOrder.id);
    onUpdateStatus(selectedOrder.id, selectedOrder.status);
  };

  // Atualizar Observação do Checklist
  const handleUpdateChecklistNote = async (compKey: keyof Checklist, newNote: string) => {
    if (!selectedOrder || !supabase) return;

    const currentChecklist = selectedOrder.checklist || {};
    const currentItem = currentChecklist[compKey] || { status: 'nao_testado' as ChecklistStatus, note: '' };

    const newChecklist = {
      ...currentChecklist,
      [compKey]: { ...currentItem, note: newNote }
    };

    await supabase.from('orders').update({ checklist: newChecklist }).eq('id', selectedOrder.id);
    onUpdateStatus(selectedOrder.id, selectedOrder.status);
  };

  // Adicionar Peça ao Orçamento diretamente
  const handleAddBudgetItemInline = async () => {
    if (!selectedOrder || !newBudgetItem.name.trim() || !supabase) return;

    const item: BudgetItem = {
      id: Math.random().toString(36).substring(2),
      name: newBudgetItem.name.trim(),
      link: newBudgetItem.link.trim(),
      price: parseFloat(newBudgetItem.price) || 0
    };

    const updatedBudget = [...(selectedOrder.budgetItems || []), item];
    await supabase.from('orders').update({ budget_items: updatedBudget }).eq('id', selectedOrder.id);
    setNewBudgetItem({ name: '', link: '', price: '' });
    onUpdateStatus(selectedOrder.id, selectedOrder.status);
  };

  // Remover Peça do Orçamento
  const handleRemoveBudgetItemInline = async (itemId: string) => {
    if (!selectedOrder || !supabase) return;
    const updatedBudget = (selectedOrder.budgetItems || []).filter(i => i.id !== itemId);
    await supabase.from('orders').update({ budget_items: updatedBudget }).eq('id', selectedOrder.id);
    onUpdateStatus(selectedOrder.id, selectedOrder.status);
  };

  // Upload Mídia direto
  const handleDirectFileUpload = async (file: File) => {
    if (!selectedOrder) return;
    setUploading(true);
    try {
      const mediaItem = await uploadOrConvertMedia(file, selectedOrder.id);
      const updatedMedia = [...(selectedOrder.mediaUrls || []), mediaItem];
      await supabase.from('orders').update({ media_urls: updatedMedia }).eq('id', selectedOrder.id);
      onUpdateStatus(selectedOrder.id, selectedOrder.status);
    } catch (err: any) {
      alert(err.message || 'Erro no upload.');
    } finally {
      setUploading(false);
    }
  };

  // Remover Mídia
  const handleRemoveMedia = async (index: number) => {
    if (!selectedOrder || !supabase) return;
    if (!confirm('Tem certeza que deseja remover esta foto/vídeo?')) return;
    
    const updatedMedia = [...(selectedOrder.mediaUrls || [])];
    updatedMedia.splice(index, 1);
    await supabase.from('orders').update({ media_urls: updatedMedia }).eq('id', selectedOrder.id);
    onUpdateStatus(selectedOrder.id, selectedOrder.status);
  };

  if (!selectedOrderId || !selectedOrder) {
    const filteredListOrders = orders.filter(o => {
      const searchMatch = !searchQuery || 
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.device.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (listStatusFilter === 'active') return searchMatch && o.status !== 'finished';
      if (listStatusFilter === 'finished') return searchMatch && o.status === 'finished';
      return searchMatch;
    });

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900">
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Ordens de Serviço</h2>
            {currentUser.role !== 'funcionario' && (
              <Button onClick={onAdd} className="py-2 px-4 text-xs font-bold uppercase tracking-wider">
                <Plus className="w-4 h-4 mr-1" /> Nova Ordem
              </Button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Pesquisar por cliente, dispositivo ou OS..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-transparent rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <select
              value={listStatusFilter}
              onChange={e => setListStatusFilter(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary shrink-0"
            >
              <option value="active">Em Andamento</option>
              <option value="finished">Histórico (Finalizadas)</option>
              <option value="all">Todas as Ordens</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-6 space-y-4 pb-32">
            {filteredListOrders.length === 0 ? (
              <Card className="p-16 flex flex-col items-center justify-center text-center space-y-4">
                <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-slate-500">Nenhuma ordem encontrada</p>
                  <p className="text-xs text-slate-400">Altere os filtros ou adicione uma nova ordem.</p>
                </div>
              </Card>
            ) : (
              filteredListOrders.map((o) => (
                <Card
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className="p-5 cursor-pointer hover:border-primary/50 transition-all group border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                        <Laptop className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-black text-primary">#{o.id}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{o.customerName}</span>
                        </div>
                        <p className="text-sm font-black text-slate-800 dark:text-white truncate">{o.device}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{o.problem}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="font-black text-base text-emerald-600 dark:text-emerald-400">R$ {o.value.toFixed(2)}</p>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{o.status}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  const statusOptions: { value: OrderStatus; label: string; icon: any }[] = [
    { value: 'budget', label: 'Orçamento', icon: ClipboardList },
    { value: 'approval', label: 'Aprovação', icon: Eye },
    { value: 'in_progress', label: 'Em Reparo', icon: RefreshCw },
    { value: 'ready', label: 'Pronto', icon: CheckCircle2 },
    { value: 'finished', label: 'Finalizado', icon: Check },
  ];

  const steps = statusOptions.map((opt, i) => {
    const currentIndex = statusOptions.findIndex((s) => s.value === selectedOrder.status);
    let status: 'done' | 'active' | 'pending' = 'pending';
    if (i < currentIndex) status = 'done';
    else if (i === currentIndex) status = 'active';
    return { ...opt, status };
  });

  const responsibleTech = employees.find((e) => e.id === selectedOrder.responsibleEmployeeId);

  const hasRuimChecklist = selectedOrder.checklist
    ? Object.values(selectedOrder.checklist).some((c) => c?.status === 'ruim')
    : false;

  const badChecklistItems = selectedOrder.checklist
    ? Object.entries(selectedOrder.checklist)
        .filter(([_, c]) => c?.status === 'ruim')
        .map(([k, _]) => CHECKLIST_COMPONENTS.find((c) => c.key === k)?.label || k)
    : [];

  const handleStatusChangeClick = (newStatus: OrderStatus) => {
    const currentIndex = statusOptions.findIndex((s) => s.value === selectedOrder.status);
    const targetIndex = statusOptions.findIndex((s) => s.value === newStatus);

    if (hasRuimChecklist && targetIndex > currentIndex) {
      setErrorMessage(
        `A ordem está travada! Existem peças com problema no checklist (${badChecklistItems.join(
          ', '
        )}). Corrija o checklist antes de avançar a OS.`
      );
      return;
    }
    setErrorMessage(null);
    
    if (newStatus === 'finished') {
      setFinishingCountdown(15);
      return;
    }

    onUpdateStatus(selectedOrder.id, newStatus);
  };

  const deviceSpecs = linkedDevice?.specs || {};

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900">
      {/* Top Bar Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest bg-primary text-white px-2 py-0.5 rounded uppercase">#{selectedOrder.id}</span>
                <InlineText
                  value={selectedOrder.customerName}
                  onSave={(v) => handleUpdateOrderField('customer_name', v)}
                  className="font-black text-sm md:text-base text-slate-800 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <InlineText
                  value={selectedOrder.device}
                  onSave={(v) => handleUpdateOrderField('device', v)}
                  placeholder="Nome do Aparelho..."
                  className="text-xs font-bold text-slate-500 uppercase"
                />
                <span className="text-slate-300">•</span>
                <InlineText
                  value={selectedOrder.serialNumber}
                  onSave={(v) => handleUpdateOrderField('serial_number', v)}
                  placeholder="S/N..."
                  className="text-[10px] font-mono text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const link = `${window.location.origin}${window.location.pathname}?track=${selectedOrder.id}`;
                window.open(link, '_blank');
              }}
              className="p-2 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
              title="Testar Link em Nova Aba"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Rastreio Cliente</span>
            </button>
            <button
              onClick={() => handleCopyTrackingLink(selectedOrder.id)}
              className={cn(
                "p-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 border",
                copiedLinkId === selectedOrder.id
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-primary/5 text-primary border-transparent"
              )}
            >
              {copiedLinkId === selectedOrder.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                {copiedLinkId === selectedOrder.id ? "Copiado!" : "Copiar Link"}
              </span>
            </button>
            {currentUser.role !== 'funcionario' && (
              <button onClick={() => setDeleteId(selectedOrder.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all" title="Excluir">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS ULTRA-LIMPA */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shrink-0",
              activeTab === 'overview' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Laptop className="size-4" /> Visão Geral & PC
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shrink-0",
              activeTab === 'checklist' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <CheckCircle2 className="size-4" /> Checklist ({Object.keys(selectedOrder.checklist || {}).length})
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shrink-0",
              activeTab === 'budget' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Box className="size-4" /> Orçamento ({selectedOrder.budgetItems?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shrink-0",
              activeTab === 'media' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Upload className="size-4" /> Mídias ({selectedOrder.mediaUrls?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shrink-0",
              activeTab === 'report' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Lock className="size-4" /> Laudo & Rastreio
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="p-4 max-w-7xl mx-auto space-y-6 pb-32">

          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/40 rounded-2xl p-4 flex gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="size-5 shrink-0 mt-0.5" />
              <div className="text-sm font-bold leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* ABA 1: VISÃO GERAL & CONFIGURAÇÃO DO COMPUTADOR */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* CARD ESPECIFICAÇÕES LIVE-EDIT */}
              <Card className="p-6 space-y-4 border-2 border-primary/20 bg-white dark:bg-slate-900 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Laptop className="size-4" /> Configuração do Computador (Clique no texto para editar)
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="font-bold text-slate-400 flex items-center gap-1.5"><Laptop className="size-3.5" /> Equipamento</span>
                    <InlineText
                      value={selectedOrder.device}
                      onSave={(v) => handleUpdateOrderField('device', v)}
                      className="font-black text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="font-bold text-slate-400 flex items-center gap-1.5"><Cpu className="size-3.5 text-blue-500" /> Processador (CPU)</span>
                    <InlineText
                      value={deviceSpecs.cpu || ''}
                      onSave={(v) => handleUpdateDeviceSpec('cpu', v)}
                      placeholder="Sem CPU informada"
                      className="font-bold text-slate-700 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="font-bold text-slate-400 flex items-center gap-1.5"><HardDrive className="size-3.5 text-emerald-500" /> Memória RAM</span>
                    <InlineText
                      value={deviceSpecs.ram || ''}
                      onSave={(v) => handleUpdateDeviceSpec('ram', v)}
                      placeholder="Sem RAM informada"
                      className="font-bold text-slate-700 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="font-bold text-slate-400 flex items-center gap-1.5"><Zap className="size-3.5 text-purple-500" /> Placa de Vídeo (GPU)</span>
                    <InlineText
                      value={deviceSpecs.gpu || ''}
                      onSave={(v) => handleUpdateDeviceSpec('gpu', v)}
                      placeholder="Vídeo Integrado"
                      className="font-bold text-slate-700 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="font-bold text-slate-400 flex items-center gap-1.5"><HardDrive className="size-3.5 text-amber-500" /> Armazenamento</span>
                    <InlineText
                      value={deviceSpecs.storage || ''}
                      onSave={(v) => handleUpdateDeviceSpec('storage', v)}
                      placeholder="Sem SSD/HD informado"
                      className="font-bold text-slate-700 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="font-bold text-slate-400 flex items-center gap-1.5"><Shield className="size-3.5 text-indigo-500" /> Placa Mãe</span>
                    <InlineText
                      value={deviceSpecs.motherboard || ''}
                      onSave={(v) => handleUpdateDeviceSpec('motherboard', v)}
                      placeholder="Sem Placa Mãe informada"
                      className="font-bold text-slate-700 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="font-bold text-slate-400 flex items-center gap-1.5"><Terminal className="size-3.5" /> Número de Série (S/N)</span>
                    <InlineText
                      value={selectedOrder.serialNumber || ''}
                      onSave={(v) => handleUpdateOrderField('serial_number', v)}
                      placeholder="Sem S/N"
                      className="font-mono font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </Card>

              {/* CARD CLIENTE & ATENDIMENTO */}
              <Card className="p-6 space-y-4 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Atendimento & Valores</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Cliente</p>
                      <InlineText
                        value={selectedOrder.customerName}
                        onSave={(v) => handleUpdateOrderField('customer_name', v)}
                        className="font-bold text-sm"
                      />
                    </div>
                    {selectedOrder.customerId && (
                      <button onClick={() => setViewCustomerId(selectedOrder.customerId!)} className="text-[10px] font-black text-primary uppercase">Ver Perfil</button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Técnico Responsável</p>
                      <select
                        value={selectedOrder.responsibleEmployeeId || ''}
                        onChange={(e) => handleUpdateOrderField('responsible_employee_id', e.target.value || null)}
                        className="bg-transparent text-xs font-bold outline-none text-slate-700 dark:text-slate-200"
                      >
                        <option value="">Selecione um técnico...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-500 text-white rounded-2xl flex items-center justify-between shadow-lg">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider opacity-80">Valor Total do Serviço</p>
                      <div className="flex items-center text-2xl font-black">
                        <span>R$&nbsp;</span>
                        <InlineText
                          value={String(selectedOrder.value)}
                          onSave={(v) => handleUpdateOrderField('value', parseFloat(v) || 0)}
                          className="font-black text-white hover:bg-white/20"
                        />
                      </div>
                    </div>
                    <DollarSign className="size-8 opacity-40" />
                  </div>
                </div>
              </Card>

            </div>
          )}

          {/* ABA 2: CHECKLIST INTERATIVO (1 CLIQUE) */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Checklist de Inspeção</h4>
                    <p className="text-[10px] text-slate-400">Defina o status e clique para adicionar observações.</p>
                  </div>
                </div>

                {/* Hardware */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Componentes de Hardware</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CHECKLIST_HARDWARE.map(comp => {
                      const item = selectedOrder.checklist?.[comp.key] || { status: 'nao_testado' as ChecklistStatus, note: '' };
                      const isBom = item.status === 'bom';
                      const isRuim = item.status === 'ruim';
                      const isNaoTestado = item.status === 'nao_testado';

                      return (
                        <div key={comp.key} className="flex flex-col p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <comp.icon className="size-4 text-slate-400 shrink-0" />
                              <span className="text-xs font-bold truncate">{comp.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateChecklistStatus(comp.key, 'bom')}
                                className={cn(
                                  'text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all active:scale-95',
                                  isBom ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'
                                )}
                              >
                                OK
                              </button>
                              <button
                                onClick={() => handleUpdateChecklistStatus(comp.key, 'ruim')}
                                className={cn(
                                  'text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all active:scale-95',
                                  isRuim ? 'bg-red-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-red-100 hover:text-red-600'
                                )}
                              >
                                Falha
                              </button>
                              <button
                                onClick={() => handleUpdateChecklistStatus(comp.key, 'nao_testado')}
                                className={cn(
                                  'text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all active:scale-95',
                                  isNaoTestado ? 'bg-slate-400 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-slate-300'
                                )}
                              >
                                N/T
                              </button>
                            </div>
                          </div>
                          <InlineText
                            value={item.note || ''}
                            onSave={(v) => handleUpdateChecklistNote(comp.key, v)}
                            placeholder="Adicionar comentário..."
                            className="text-[10px] text-slate-500 ml-6 block"
                            inputClassName="w-full text-[10px]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Software */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Testes de Software & Sistema</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CHECKLIST_SOFTWARE.map(comp => {
                      const item = selectedOrder.checklist?.[comp.key] || { status: 'nao_testado' as ChecklistStatus, note: '' };
                      const isBom = item.status === 'bom';
                      const isRuim = item.status === 'ruim';
                      const isNaoTestado = item.status === 'nao_testado';

                      return (
                        <div key={comp.key} className="flex flex-col p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <comp.icon className="size-4 text-slate-400 shrink-0" />
                              <span className="text-xs font-bold truncate">{comp.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateChecklistStatus(comp.key, 'bom')}
                                className={cn(
                                  'text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all active:scale-95',
                                  isBom ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'
                                )}
                              >
                                OK
                              </button>
                              <button
                                onClick={() => handleUpdateChecklistStatus(comp.key, 'ruim')}
                                className={cn(
                                  'text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all active:scale-95',
                                  isRuim ? 'bg-red-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-red-100 hover:text-red-600'
                                )}
                              >
                                Falha
                              </button>
                              <button
                                onClick={() => handleUpdateChecklistStatus(comp.key, 'nao_testado')}
                                className={cn(
                                  'text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all active:scale-95',
                                  isNaoTestado ? 'bg-slate-400 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-slate-300'
                                )}
                              >
                                N/T
                              </button>
                            </div>
                          </div>
                          <InlineText
                            value={item.note || ''}
                            onSave={(v) => handleUpdateChecklistNote(comp.key, v)}
                            placeholder="Adicionar comentário..."
                            className="text-[10px] text-slate-500 ml-6 block"
                            inputClassName="w-full text-[10px]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ABA 3: ORÇAMENTO & PEÇAS */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Orçamento de Peças Necessárias</h4>
                  <span className="text-xs font-black text-primary">Total: R$ {(selectedOrder.budgetItems || []).reduce((a, b) => a + b.price, 0).toFixed(2)}</span>
                </div>

                {/* Formulário de Adição Direta */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <input
                    value={newBudgetItem.name}
                    onChange={e => setNewBudgetItem(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nome da Peça (Ex: SSD 500GB)..."
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold outline-none"
                  />
                  <input
                    value={newBudgetItem.link}
                    onChange={e => setNewBudgetItem(f => ({ ...f, link: e.target.value }))}
                    placeholder="Link de compra (privado para técnicos)..."
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-medium outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newBudgetItem.price}
                      onChange={e => setNewBudgetItem(f => ({ ...f, price: e.target.value }))}
                      placeholder="Valor R$..."
                      className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-black text-emerald-600 outline-none"
                    />
                    <Button onClick={handleAddBudgetItemInline} size="sm" className="flex-1">
                      <Plus className="size-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Lista de Peças */}
                <div className="space-y-2">
                  {(selectedOrder.budgetItems || []).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Box className="size-4 text-slate-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs truncate">{item.name}</p>
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline truncate block max-w-md">
                              {item.link}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-black text-xs text-slate-800 dark:text-white">R$ {item.price.toFixed(2)}</span>
                        <button onClick={() => handleRemoveBudgetItemInline(item.id)} className="text-red-500 hover:text-red-700 p-1">
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ABA 4: FOTOS E VÍDEOS */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Galeria de Fotos e Vídeos</h4>
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} size="sm">
                    <Upload className="size-4 mr-1" /> {uploading ? 'Enviando...' : 'Adicionar Mídia'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      Array.from(e.target.files || []).forEach(handleDirectFileUpload);
                      e.target.value = '';
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(selectedOrder.mediaUrls || []).map((m, i) => (
                    <div key={i} className="aspect-video relative rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-slate-700 group">
                      <button 
                        onClick={() => handleRemoveMedia(i)}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-lg z-10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remover Mídia"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      {m.type === 'image' ? (
                        <div onClick={() => setSelectedMediaPreview(m)} className="cursor-pointer w-full h-full">
                          <img src={m.url} alt={m.name || `Foto ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      ) : (
                        <video src={m.url} controls className="w-full h-full object-cover bg-black" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ABA 5: LAUDO TÉCNICO & OBSERVAÇÃO DO CLIENTE */}
          {activeTab === 'report' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-3 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Eye className="size-4" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Informativo para o Cliente (Clique para editar)</h4>
                </div>
                <InlineTextarea
                  value={selectedOrder.observationClient || ''}
                  onSave={(v) => handleUpdateOrderField('observation_client', v)}
                  placeholder="Clique para digitar as observações visíveis para o cliente no link de rastreio..."
                />
              </Card>

              <Card className="p-6 space-y-3 bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-400">
                  <Lock className="size-4 text-amber-500" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Laudo Técnico Interno (Privado - Clique para editar)</h4>
                </div>
                <InlineTextarea
                  value={selectedOrder.technicalReport || ''}
                  onSave={(v) => handleUpdateOrderField('technical_report', v)}
                  placeholder="Clique para digitar anotações privadas apenas para os técnicos..."
                />
              </Card>
            </div>
          )}

          {/* MUDANÇA DE STATUS NO RODAPÉ */}
          <section className="space-y-3 mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Ações de Mudança de Status</h4>
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

      {selectedMediaPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedMediaPreview(null)}>
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button onClick={() => setSelectedMediaPreview(null)} className="absolute -top-12 right-0 text-white hover:text-red-400 p-2">
              <X className="size-8" />
            </button>
            {selectedMediaPreview.type === 'image' ? (
              <img src={selectedMediaPreview.url} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
            ) : (
              <video src={selectedMediaPreview.url} controls autoPlay className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
            )}
          </div>
        </div>
      )}

      {/* Finishing Animation Overlays */}
      {finishingCountdown !== null && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-emerald-900/90 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Finalizando OS...</h3>
            <p className="text-slate-500 mb-6 font-medium">A OS será movida para o histórico.</p>
            
            <div className="relative size-32 mb-8 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-100 dark:text-slate-800" />
                <circle 
                  cx="64" cy="64" r="60" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="none" 
                  className="text-emerald-500 transition-all duration-1000 ease-linear"
                  strokeDasharray="377"
                  strokeDashoffset={377 - (377 * finishingCountdown) / 15}
                />
              </svg>
              <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{finishingCountdown}</span>
            </div>
            
            <Button 
              variant="secondary"
              className="w-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 border-transparent"
              onClick={() => setFinishingCountdown(null)}
            >
              Cancelar Finalização
            </Button>
          </div>
        </div>
      )}

      {isFinishedAnimated && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-emerald-500">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="size-40 bg-white rounded-full flex items-center justify-center shadow-2xl"
          >
            <Check className="size-20 text-emerald-500" strokeWidth={3} />
          </motion.div>
        </div>
      )}
    </div>
  );
};
