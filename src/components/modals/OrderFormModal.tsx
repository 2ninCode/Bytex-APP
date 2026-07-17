import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Search, ChevronDown, Plus, Trash2, RefreshCw, Upload, Link,
  Laptop, User, Users, Eye, EyeOff, ImageIcon, Video, Package,
  CheckCircle2, AlertCircle, HelpCircle, Cpu, HardDrive, Zap,
  Monitor, Thermometer, Battery, Shield
} from 'lucide-react';
import { Order, Employee, CustomerDevice, Customer, Checklist, ChecklistItem, ChecklistStatus, BudgetItem, MediaFile } from '../../types';
import { supabase } from '../../lib/supabase';
import { cn } from '../ui/utils';
import { Button } from '../ui/Button';

// ── Constants ────────────────────────────────────────────────────
const CHECKLIST_COMPONENTS: { key: keyof Checklist; label: string; icon: any }[] = [
  { key: 'ram',         label: 'Memória RAM',         icon: HardDrive },
  { key: 'hd',          label: 'HD / SSD',             icon: HardDrive },
  { key: 'cpu',         label: 'Processador',          icon: Cpu },
  { key: 'gpu',         label: 'Placa de Vídeo',       icon: Zap },
  { key: 'motherboard', label: 'Placa Mãe',            icon: Shield },
  { key: 'psu',         label: 'Fonte de Alimentação', icon: Zap },
  { key: 'display',     label: 'Display / Tela',       icon: Monitor },
  { key: 'cooling',     label: 'Cooling / Ventoinha',  icon: Thermometer },
  { key: 'battery',     label: 'Bateria',              icon: Battery },
];

const STATUS_OPTIONS = { bom: 'Bom', ruim: 'Ruim', nao_testado: 'Não Testado' } as const;

const generateId = () => Math.random().toString(36).slice(2);

// ── Types ────────────────────────────────────────────────────────
interface Props {
  order?: Partial<Order>;
  onSave: (data: Partial<Order>) => void;
  onCancel: () => void;
  currentUser: Employee;
  employees: Employee[];
  customerDevices: CustomerDevice[];
}

// ── Component ────────────────────────────────────────────────────
export const OrderFormModal = ({ order, onSave, onCancel, currentUser, employees, customerDevices }: Props) => {
  const isEdit = !!order?.id;

  // ── Customer ─────────────────────────────────────────────────
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<CustomerDevice | null>(null);
  const [showDeviceList, setShowDeviceList] = useState(false);

  // ── Form State ───────────────────────────────────────────────
  const [device, setDevice] = useState(order?.device || '');
  const [serialNumber, setSerialNumber] = useState(order?.serialNumber || '');
  const [problem, setProblem] = useState(order?.problem || '');
  const [observationClient, setObservationClient] = useState(order?.observationClient || '');
  const [technicalReport, setTechnicalReport] = useState(order?.technicalReport || '');
  const [value, setValue] = useState(order?.value?.toString() || '');
  const [responsibleId, setResponsibleId] = useState(order?.responsibleEmployeeId || currentUser.id);
  const [showReportPreview, setShowReportPreview] = useState(false);

  // ── Checklist ────────────────────────────────────────────────
  const [checklist, setChecklist] = useState<Partial<Checklist>>(order?.checklist || {});

  // ── Media ────────────────────────────────────────────────────
  const [media, setMedia] = useState<MediaFile[]>(order?.mediaUrls || []);
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Budget ───────────────────────────────────────────────────
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(order?.budgetItems || []);
  const [budgetForm, setBudgetForm] = useState({ name: '', link: '', price: '' });

  // ── Sections ─────────────────────────────────────────────────
  const [openSection, setOpenSection] = useState<string>('basic');

  // ── Effects ──────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    if (!supabase) return;
    supabase.from('customers').select('*').order('name').then(({ data }) => {
      if (data) setCustomers(data.map((c: any) => ({
        id: c.id, name: c.name, email: c.email || '', phone: c.phone || '',
        address: c.address || '', customerCode: c.customer_code, createdAt: c.created_at
      })));
    });

    if (order?.customerId && !order.customer) {
      supabase.from('customers').select('*').eq('id', order.customerId).single().then(({ data }) => {
        if (data) setSelectedCustomer({
          id: data.id, name: data.name, email: data.email || '', phone: data.phone || '',
          address: data.address || '', customerCode: data.customer_code, createdAt: data.created_at
        });
      });
    } else if (order?.customer) {
      setSelectedCustomer(order.customer);
    }

    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  // ── Derived ──────────────────────────────────────────────────
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || '').includes(customerSearch) ||
    c.customerCode.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const customerDevicesForSelected = customerDevices.filter(
    d => selectedCustomer && d.customerId === selectedCustomer.id
  );

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setSelectedDevice(null);
    setShowCustomerList(false);
    setCustomerSearch('');
  };

  const handleSelectDevice = (dev: CustomerDevice) => {
    setSelectedDevice(dev);
    if (!device) setDevice(dev.name);
    if (!serialNumber) setSerialNumber(dev.serialNumber);
    setShowDeviceList(false);
  };

  // ── Checklist ────────────────────────────────────────────────
  const setChecklistItem = (key: keyof Checklist, field: keyof ChecklistItem, val: string) => {
    setChecklist(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { status: 'nao_testado' }), [field]: val }
    }));
  };

  // ── Media Upload ─────────────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    if (!supabase) { alert('Sem conexão com banco.'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const fileName = `${order?.id || 'new'}_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('os-media')
      .upload(fileName, file, { upsert: true, contentType: file.type });

    if (error) {
      console.error('Upload error:', error);
      setUploading(false);
      const confirmed = confirm('Erro ao fazer upload. Deseja colar o link manualmente?');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('os-media').getPublicUrl(fileName);
    const isVideo = ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
    setMedia(prev => [...prev, { url: publicUrl, type: isVideo ? 'video' : 'image', name: file.name }]);
    setUploading(false);
  };

  const handleAddMediaUrl = () => {
    const url = mediaUrl.trim();
    if (!url) return;
    const isVideo = url.match(/\.(mp4|webm|mov|avi|mkv)(\?|$)/i);
    setMedia(prev => [...prev, { url, type: isVideo ? 'video' : 'image', name: `Mídia ${prev.length + 1}` }]);
    setMediaUrl('');
  };

  // ── Budget ───────────────────────────────────────────────────
  const handleAddBudgetItem = () => {
    if (!budgetForm.name.trim()) return;
    setBudgetItems(prev => [...prev, { id: generateId(), name: budgetForm.name.trim(), link: budgetForm.link.trim(), price: parseFloat(budgetForm.price) || 0 }]);
    setBudgetForm({ name: '', link: '', price: '' });
  };

  const totalBudget = budgetItems.reduce((acc, i) => acc + i.price, 0);

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = () => {
    onSave({
      ...order,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || '',
      customerEmail: selectedCustomer?.email || '',
      customerPhone: selectedCustomer?.phone || '',
      deviceId: selectedDevice?.id,
      device,
      serialNumber,
      problem,
      observationClient,
      technicalReport,
      value: parseFloat(value) || 0,
      responsibleEmployeeId: responsibleId || undefined,
      checklist,
      mediaUrls: media,
      budgetItems,
    });
  };

  const hasRuimChecklist = Object.values(checklist).some(c => c?.status === 'ruim');

  // ── Section Accordion ────────────────────────────────────────
  const Section = ({ id, title, subtitle, icon: Icon, badge, children }: { id: string; title: string; subtitle?: string; icon: any; badge?: React.ReactNode; children: React.ReactNode }) => (
    <div className={cn('border-2 rounded-2xl overflow-hidden transition-all', openSection === id ? 'border-primary/30 bg-primary/5 dark:bg-primary/5' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900')}>
      <button
        onClick={() => setOpenSection(openSection === id ? '' : id)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left"
      >
        <div className={cn('size-9 rounded-xl flex items-center justify-center shrink-0 transition-all', openSection === id ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-black text-sm', openSection === id ? 'text-primary' : 'text-slate-700 dark:text-slate-200')}>{title}</p>
          {subtitle && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{subtitle}</p>}
        </div>
        {badge}
        <ChevronDown className={cn('size-4 text-slate-400 transition-transform shrink-0', openSection === id && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {openSection === id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-primary/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-slate-50 dark:bg-slate-950 w-full max-w-2xl rounded-t-[2.5rem] md:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="p-6 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
              <Laptop className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black tracking-tight">{isEdit ? 'Editar Ordem' : 'Nova Ordem de Serviço'}</h2>
              {order?.id && <p className="text-xs text-slate-400 font-bold font-mono mt-0.5">#{order.id}</p>}
            </div>
            <button onClick={onCancel} className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Form ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* ── SEÇÃO 1: CLIENTE & APARELHO ──────────────────── */}
          <Section id="basic" title="Cliente & Aparelho" subtitle={selectedCustomer?.name || 'Selecione o cliente'} icon={User}>
            {/* Customer picker */}
            <div className="space-y-1 pt-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente *</label>
              <div className="relative">
                <button
                  onClick={() => setShowCustomerList(!showCustomerList)}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-2 text-left focus:border-primary outline-none"
                >
                  <User className="size-4 text-slate-400 shrink-0" />
                  <span className={cn('flex-1 text-sm font-bold', !selectedCustomer && 'text-slate-400')}>
                    {selectedCustomer ? selectedCustomer.name : 'Toque para selecionar...'}
                  </span>
                  <ChevronDown className="size-4 text-slate-400 shrink-0" />
                </button>
                <AnimatePresence>
                  {showCustomerList && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute z-50 w-full top-full mt-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <input
                            autoFocus
                            placeholder="Nome, telefone ou código..."
                            value={customerSearch}
                            onChange={e => setCustomerSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary font-medium"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCustomers.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-4 font-medium">Nenhum cliente encontrado</p>
                        ) : filteredCustomers.map(c => (
                          <button key={c.id} onClick={() => handleSelectCustomer(c)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-primary/5 text-left transition-colors">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black shrink-0">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{c.name}</p>
                              <p className="text-xs text-slate-400 font-medium">{c.phone || c.email || c.customerCode}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Device picker for customer */}
            {selectedCustomer && customerDevicesForSelected.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">PC Cadastrado do Cliente</label>
                <div className="relative">
                  <button
                    onClick={() => setShowDeviceList(!showDeviceList)}
                    className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-2 text-left outline-none"
                  >
                    <Laptop className="size-4 text-indigo-400 shrink-0" />
                    <span className={cn('flex-1 text-sm font-bold', !selectedDevice && 'text-slate-400')}>
                      {selectedDevice ? selectedDevice.name : 'Escolher PC cadastrado (opcional)'}
                    </span>
                    {selectedDevice && (
                      <span className="text-[10px] font-mono text-slate-400">{selectedDevice.serialNumber}</span>
                    )}
                    <ChevronDown className="size-4 text-slate-400 shrink-0" />
                  </button>
                  <AnimatePresence>
                    {showDeviceList && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute z-50 w-full top-full mt-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                          <button
                            onClick={() => { setSelectedDevice(null); setShowDeviceList(false); }}
                            className="w-full px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-left font-medium"
                          >
                            Nenhum (digitar manualmente)
                          </button>
                          {customerDevicesForSelected.map(dev => (
                            <button key={dev.id} onClick={() => handleSelectDevice(dev)} className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors">
                              <Laptop className="size-4 text-indigo-400 shrink-0" />
                              <div className="text-left">
                                <p className="font-bold text-sm">{dev.name}</p>
                                {dev.serialNumber && <p className="text-[10px] text-slate-400 font-mono">S/N: {dev.serialNumber}</p>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Device & SN */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aparelho *</label>
                <input
                  value={device}
                  onChange={e => setDevice(e.target.value)}
                  placeholder="Notebook Dell..."
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Número de Série</label>
                <input
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  placeholder="S/N..."
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-mono font-bold outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Value */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor do Serviço (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">R$</span>
                <input
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-9 text-sm font-black outline-none focus:border-primary"
                />
              </div>
            </div>
          </Section>

          {/* ── SEÇÃO 2: RESPONSÁVEL ────────────────────────── */}
          <Section id="responsible" title="Técnico Responsável" subtitle={employees.find(e => e.id === responsibleId)?.name || 'Selecione'} icon={Users}>
            <div className="space-y-2 pt-4">
              <div className="grid grid-cols-1 gap-2">
                {employees.filter(e => e.role !== 'admin' || employees.length <= 3).map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => setResponsibleId(emp.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                      responsibleId === emp.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                    )}
                  >
                    <div className={cn('size-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0', responsibleId === emp.id ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt={emp.name} className="size-full object-cover rounded-xl" />
                      ) : emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium capitalize">{emp.jobTitle || emp.role}</p>
                    </div>
                    {responsibleId === emp.id && <CheckCircle2 className="size-5 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* ── SEÇÃO 3: PROBLEMA & OBSERVAÇÕES ─────────────── */}
          <Section id="observations" title="Problema & Observações" subtitle="Diagnóstico e comunicação com cliente" icon={AlertCircle}>
            <div className="space-y-4 pt-4">
              {/* Problem (sempre interno) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição do Problema *</label>
                <textarea
                  value={problem}
                  onChange={e => setProblem(e.target.value)}
                  placeholder="Descreva o problema relatado pelo cliente..."
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-primary min-h-[90px] resize-none leading-relaxed"
                />
              </div>

              {/* Observation for client — PUBLIC */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                    <Eye className="size-3" /> Observação para o Cliente
                  </label>
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-0.5 rounded-lg font-black">🌐 Visível no link</span>
                </div>
                <textarea
                  value={observationClient}
                  onChange={e => setObservationClient(e.target.value)}
                  placeholder="Ex: Seu notebook está em diagnóstico. Identificamos um problema na memória..."
                  className="w-full bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-400 min-h-[90px] resize-none leading-relaxed"
                />
              </div>

              {/* Technical Report — PRIVATE */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <EyeOff className="size-3" /> Laudo Técnico
                  </label>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-lg font-black">🔒 Privado</span>
                </div>
                <textarea
                  value={technicalReport}
                  onChange={e => setTechnicalReport(e.target.value)}
                  placeholder="Diagnóstico técnico detalhado, procedimentos realizados, partes trocadas..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-slate-400 min-h-[90px] resize-none leading-relaxed"
                />
              </div>
            </div>
          </Section>

          {/* ── SEÇÃO 4: CHECKLIST ──────────────────────────── */}
          <Section
            id="checklist"
            title="Checklist de Peças"
            subtitle="Saúde dos componentes"
            icon={CheckCircle2}
            badge={
              hasRuimChecklist ? (
                <span className="text-[9px] bg-red-50 dark:bg-red-900/20 text-red-500 px-2 py-0.5 rounded-lg font-black flex items-center gap-1">
                  <AlertCircle className="size-2.5" /> Atenção
                </span>
              ) : Object.keys(checklist).length > 0 ? (
                <span className="text-[9px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-0.5 rounded-lg font-black">
                  {Object.values(checklist).filter(c => c?.status === 'bom').length}/{CHECKLIST_COMPONENTS.length} OK
                </span>
              ) : undefined
            }
          >
            <div className="space-y-2 pt-4">
              {CHECKLIST_COMPONENTS.map(comp => {
                const item = checklist[comp.key] || { status: 'nao_testado' as ChecklistStatus, note: '' };
                return (
                  <div key={comp.key} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <comp.icon className="size-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-bold flex-1">{comp.label}</span>
                      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        {(Object.entries(STATUS_OPTIONS) as [ChecklistStatus, string][]).map(([val, lbl]) => (
                          <button
                            key={val}
                            onClick={() => setChecklistItem(comp.key, 'status', val)}
                            className={cn(
                              'px-2.5 py-1.5 text-[9px] font-black uppercase transition-all',
                              item.status === val
                                ? val === 'bom' ? 'bg-emerald-500 text-white' : val === 'ruim' ? 'bg-red-500 text-white' : 'bg-slate-400 text-white'
                                : 'bg-transparent text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            )}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                    {item.status !== 'nao_testado' && (
                      <input
                        value={item.note || ''}
                        onChange={e => setChecklistItem(comp.key, 'note', e.target.value)}
                        placeholder={item.status === 'ruim' ? 'Descreva o problema...' : 'Observação (opcional)'}
                        className="w-full bg-slate-50 dark:bg-slate-700 rounded-lg p-2 text-xs font-medium outline-none border border-slate-200 dark:border-slate-600 focus:border-primary"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── SEÇÃO 5: FOTOS E VÍDEOS ─────────────────────── */}
          <Section
            id="media"
            title="Fotos e Vídeos"
            subtitle="Documentação visual"
            icon={ImageIcon}
            badge={media.length > 0 ? <span className="size-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center">{media.length}</span> : undefined}
          >
            <div className="space-y-4 pt-4">
              {/* Upload from device */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={e => {
                    Array.from(e.target.files || []).forEach(handleFileUpload);
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="text-xs text-slate-400 font-medium">Enviando...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-8 text-slate-300" />
                      <p className="text-sm font-bold text-slate-500">Toque para fazer upload</p>
                      <p className="text-xs text-slate-400">Fotos ou vídeos do dispositivo</p>
                    </>
                  )}
                </button>

                {/* URL input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      value={mediaUrl}
                      onChange={e => setMediaUrl(e.target.value)}
                      placeholder="Ou cole o link de uma foto/vídeo..."
                      className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    onClick={handleAddMediaUrl}
                    disabled={!mediaUrl.trim()}
                    className="px-4 bg-primary text-white rounded-xl text-sm font-black disabled:opacity-40"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              {/* Media gallery */}
              {media.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {media.map((m, i) => (
                    <div key={i} className="relative group aspect-square">
                      {m.type === 'image' ? (
                        <img src={m.url} alt={m.name} className="w-full h-full object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                          <Video className="size-8 text-white/50" />
                        </div>
                      )}
                      <button
                        onClick={() => setMedia(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 size-6 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* ── SEÇÃO 6: ORÇAMENTO ──────────────────────────── */}
          <Section
            id="budget"
            title="Orçamento de Peças"
            subtitle="Itens e links de compra"
            icon={Package}
            badge={budgetItems.length > 0 ? <span className="text-[10px] font-black text-primary">R$ {totalBudget.toFixed(0)}</span> : undefined}
          >
            <div className="space-y-3 pt-4">
              {/* Add budget item */}
              <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nova Peça</p>
                <input
                  value={budgetForm.name}
                  onChange={e => setBudgetForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nome da peça (Ex: SSD 480GB)"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  <input
                    value={budgetForm.link}
                    onChange={e => setBudgetForm(f => ({ ...f, link: e.target.value }))}
                    placeholder="Link de compra (opcional)"
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium outline-none focus:border-primary"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">R$</span>
                    <input
                      type="number"
                      value={budgetForm.price}
                      onChange={e => setBudgetForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="0,00"
                      className="w-24 pl-7 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-black outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <Button onClick={handleAddBudgetItem} disabled={!budgetForm.name.trim()} className="w-full" size="sm">
                  <Plus className="size-4 mr-1" /> Adicionar Peça
                </Button>
              </div>

              {/* Budget list */}
              {budgetItems.length > 0 && (
                <div className="space-y-2">
                  {budgetItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-3">
                      <Package className="size-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline font-medium truncate block">
                            {item.link}
                          </a>
                        )}
                      </div>
                      <p className="font-black text-sm shrink-0">R$ {item.price.toFixed(0)}</p>
                      <button onClick={() => setBudgetItems(prev => prev.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-1 pt-1">
                    <span className="text-xs font-bold text-slate-400">Total do Orçamento</span>
                    <span className="font-black text-primary">R$ {totalBudget.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedCustomer || !device.trim() || !problem.trim()}
            className="flex-2 bg-primary hover:bg-primary/90 text-white"
          >
            {isEdit ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
