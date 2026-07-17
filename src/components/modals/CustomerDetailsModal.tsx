import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, MapPin, Phone, Mail, Laptop, Calendar, CheckCircle2, Package, Plus, Trash2, RefreshCw, Cpu, HardDrive, Zap } from 'lucide-react';
import { Order, CustomerDevice } from '../../types';
import { supabase } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../ui/utils';
import { Button } from '../ui/Button';

type Tab = 'info' | 'history' | 'devices';

const generateSN = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sn = 'BYX-';
  for (let i = 0; i < 8; i++) sn += chars[Math.floor(Math.random() * chars.length)];
  return sn;
};

export const CustomerDetailsModal = ({ customerId, onClose }: {
  customerId: string,
  onClose: () => void
}) => {
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [devices, setDevices] = useState<CustomerDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [addingDevice, setAddingDevice] = useState(false);
  const [deviceForm, setDeviceForm] = useState({ name: '', serialNumber: generateSN(), specs: { ram: '', storage: '', cpu: '', gpu: '', os: '' }, notes: '' });
  const [savingDevice, setSavingDevice] = useState(false);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);

    const [custRes, ordersRes, devRes] = await Promise.all([
      supabase.from('customers').select('*').eq('id', customerId).single(),
      supabase.from('orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('customer_devices').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
    ]);

    if (custRes.data) {
      setCustomer({
        id: custRes.data.id, name: custRes.data.name,
        email: custRes.data.email || '', phone: custRes.data.phone || '',
        address: custRes.data.address || '', customerCode: custRes.data.customer_code
      });
    }
    if (ordersRes.data) {
      setOrders(ordersRes.data.map((o: any) => ({
        id: o.id, customerName: o.customer_name, customerEmail: o.customer_email || '',
        customerPhone: o.customer_phone || '', device: o.device || '',
        serialNumber: o.serial_number || '', problem: o.problem || '',
        value: Number(o.value), status: o.status, createdAt: o.created_at
      })));
    }
    if (devRes.data) {
      setDevices(devRes.data.map((d: any) => ({
        id: d.id, customerId: d.customer_id, name: d.name,
        serialNumber: d.serial_number || '', specs: d.specs || {},
        notes: d.notes || '', createdAt: d.created_at
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [customerId]);

  const handleAddDevice = async () => {
    if (!supabase || !deviceForm.name.trim()) return;
    setSavingDevice(true);
    const { error } = await supabase.from('customer_devices').insert({
      customer_id: customerId,
      name: deviceForm.name.trim(),
      serial_number: deviceForm.serialNumber.trim() || null,
      specs: deviceForm.specs,
      notes: deviceForm.notes.trim() || null,
    });
    if (!error) {
      setAddingDevice(false);
      setDeviceForm({ name: '', serialNumber: generateSN(), specs: { ram: '', storage: '', cpu: '', gpu: '', os: '' }, notes: '' });
      fetchData();
    }
    setSavingDevice(false);
  };

  const handleDeleteDevice = async (id: string) => {
    if (!supabase) return;
    await supabase.from('customer_devices').delete().eq('id', id);
    fetchData();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'budget': return { label: 'Orçamento', cls: 'bg-amber-50 text-amber-600' };
      case 'approval': return { label: 'Aprovação', cls: 'bg-orange-50 text-orange-600' };
      case 'in_progress': return { label: 'Em Reparo', cls: 'bg-primary/5 text-primary' };
      case 'ready': return { label: 'Pronto', cls: 'bg-emerald-50 text-emerald-600' };
      case 'finished': return { label: 'Entregue', cls: 'bg-slate-100 text-slate-500' };
      default: return { label: status, cls: 'bg-slate-100 text-slate-500' };
    }
  };

  if (loading) return null;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'info', label: 'Informações' },
    { id: 'devices', label: 'PCs', count: devices.length },
    { id: 'history', label: 'Histórico', count: orders.length },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-[2.5rem] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 pb-0 relative">
          <button onClick={onClose} className="absolute top-5 right-5 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4 mb-5">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shrink-0">
              <User className="size-8" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black truncate">{customer?.name}</h3>
                <span className="text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-lg">#{customer?.customerCode}</span>
              </div>
              <p className="text-slate-500 font-medium text-sm mt-0.5">{orders.length} ordens · {devices.length} PC{devices.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-100 dark:border-slate-800">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all flex items-center gap-1.5',
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn('size-4 rounded-full text-[9px] flex items-center justify-center font-black', activeTab === tab.id ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* ── TAB: INFO ─────────────────────────────────── */}
            {activeTab === 'info' && (
              <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: Phone, label: customer?.phone || 'Não informado' },
                  { icon: Mail, label: customer?.email || 'Não informado' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="size-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                      <item.icon className="size-4" />
                    </div>
                    <span className="text-sm font-bold truncate">{item.label}</span>
                  </div>
                ))}
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl md:col-span-2">
                  <div className="size-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm mt-0.5">
                    <MapPin className="size-4" />
                  </div>
                  <span className="text-sm font-bold leading-relaxed">{customer?.address || 'Sem endereço cadastrado'}</span>
                </div>
              </motion.div>
            )}

            {/* ── TAB: DEVICES (PCs) ──────────────────────── */}
            {activeTab === 'devices' && (
              <motion.div key="devices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <Button onClick={() => setAddingDevice(true)} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white">
                  <Plus className="size-4 mr-2" /> Cadastrar Novo PC
                </Button>

                <AnimatePresence>
                  {addingDevice && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/40 p-5 space-y-4"
                    >
                      <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500">Novo Aparelho / PC</h4>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Aparelho *</label>
                        <input
                          value={deviceForm.name}
                          onChange={e => setDeviceForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Ex: Dell Inspiron 15 3000"
                          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Número de Série (S/N)</label>
                        <div className="flex gap-2">
                          <input
                            value={deviceForm.serialNumber}
                            onChange={e => setDeviceForm(f => ({ ...f, serialNumber: e.target.value }))}
                            className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-mono font-bold outline-none focus:border-indigo-400 uppercase"
                          />
                          <button
                            onClick={() => setDeviceForm(f => ({ ...f, serialNumber: generateSN() }))}
                            className="px-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 border-2 border-indigo-200 dark:border-indigo-800/40 rounded-xl text-xs font-black hover:bg-indigo-100"
                          >
                            <RefreshCw className="size-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'ram', label: 'RAM', placeholder: '8GB DDR4' },
                          { key: 'storage', label: 'Armazenamento', placeholder: '256GB SSD' },
                          { key: 'cpu', label: 'Processador', placeholder: 'Intel i5-10th' },
                          { key: 'gpu', label: 'Placa de Vídeo', placeholder: 'GTX 1650' },
                        ].map(field => (
                          <div key={field.key} className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{field.label}</label>
                            <input
                              value={(deviceForm.specs as any)[field.key]}
                              onChange={e => setDeviceForm(f => ({ ...f, specs: { ...f.specs, [field.key]: e.target.value } }))}
                              placeholder={field.placeholder}
                              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium outline-none focus:border-indigo-400"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações</label>
                        <textarea
                          value={deviceForm.notes}
                          onChange={e => setDeviceForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder="Ex: Teclado com tecla quebrada..."
                          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-400 min-h-[80px] resize-none"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setAddingDevice(false)} className="flex-1">Cancelar</Button>
                        <Button onClick={handleAddDevice} disabled={savingDevice || !deviceForm.name.trim()} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white">
                          {savingDevice ? 'Salvando...' : 'Cadastrar PC'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {devices.length === 0 && !addingDevice ? (
                  <div className="py-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed">
                    <Laptop className="size-10 mx-auto mb-2 opacity-20" />
                    <p className="font-bold text-sm">Nenhum PC cadastrado</p>
                    <p className="text-xs mt-1">Cadastre os aparelhos deste cliente.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {devices.map(device => (
                      <div key={device.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                              <Laptop className="size-5" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{device.name}</p>
                              <p className="text-[10px] font-mono text-slate-400 font-bold">S/N: {device.serialNumber || '—'}</p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteDevice(device.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        {Object.entries(device.specs).filter(([, v]) => v).length > 0 && (
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { key: 'ram', icon: HardDrive, label: 'RAM' },
                              { key: 'storage', icon: HardDrive, label: 'Armazenamento' },
                              { key: 'cpu', icon: Cpu, label: 'CPU' },
                              { key: 'gpu', icon: Zap, label: 'GPU' },
                            ].filter(f => (device.specs as any)[f.key]).map(f => (
                              <div key={f.key} className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2 py-1">
                                <f.icon className="size-3 shrink-0" />
                                <span className="truncate">{(device.specs as any)[f.key]}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {device.notes && (
                          <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">{device.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB: HISTORY ──────────────────────────────── */}
            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {orders.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed">
                    <Package className="size-12 mx-auto mb-2 opacity-20" />
                    <p className="font-bold text-sm">Nenhuma ordem para este cliente</p>
                  </div>
                ) : (
                  orders.map(order => {
                    const st = getStatusLabel(order.status);
                    return (
                      <div key={order.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className={cn('size-10 rounded-xl flex items-center justify-center shrink-0', order.status === 'finished' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary')}>
                          <Laptop className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{order.device}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <Calendar className="size-3" /> {format(parseISO(order.createdAt), 'dd/MM/yy', { locale: ptBR })}
                            </span>
                            <span className={cn('text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded', st.cls)}>{st.label}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm">R$ {order.value.toFixed(0)}</p>
                          <p className="text-[10px] font-bold text-slate-400">{order.id}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
