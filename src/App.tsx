import React, { useState, useEffect } from 'react';
import {
  Settings,
  ClipboardList,
  LayoutDashboard,
  Package,
  Calculator,
  User,
  LogOut,
  ChevronRight,
  Bell,
  ArrowLeft,
  Edit2,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Globe,
  Moon,
  HelpCircle,
  Info,
  Search,
  Plus,
  Cpu,
  Database,
  FlaskConical,
  Router,
  Cable,
  Terminal,
  Check,
  RefreshCw,
  Box,
  CheckCircle2,
  Smartphone,
  Laptop,
  Mail,
  Lock,
  UserPlus,
  X,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Crown,
  Send,
  Users,
  PhoneCall,
  Calendar,
  Pencil,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Supabase Client ---
const getSupabaseClient = () => {
  const url = (import.meta as any).env.VITE_SUPABASE_URL;
  const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'https://your-project-url.supabase.co' || !url.startsWith('http')) {
    return null;
  }

  try {
    return createClient(url, key);
  } catch (e) {
    console.error('Failed to initialize Supabase:', e);
    return null;
  }
};

const supabase = getSupabaseClient();

// --- Types ---
type View = 'login' | 'dashboard' | 'inventory' | 'orders' | 'calculator' | 'settings';

type OrderStatus = 'budget' | 'approval' | 'in_progress' | 'ready' | 'finished';

type Role = 'admin' | 'gestor' | 'funcionario';

interface Employee {
  id: string;
  loginId: string;
  password: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  birthdate: string;
  jobTitle: string;
  role: Role;
  avatarUrl: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  device: string;
  serialNumber: string;
  problem: string;
  value: number;
  status: OrderStatus;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: Date;
}

// --- Bytex X Logo (SVG) ---
const BytexIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className} fill="none">
    <defs>
      <linearGradient id="bx-left" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#9333ea" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>
      <linearGradient id="bx-right" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    {/* Left arm of X – purple */}
    <polygon points="5,8 28,8 50,42 72,8 95,8 62,52 95,96 72,96 50,62 28,96 5,96 38,52" fill="url(#bx-left)" />
    {/* Right overlay arm – blue, clip right half */}
    <clipPath id="bx-right-clip"><rect x="50" y="0" width="50" height="100" /></clipPath>
    <polygon points="5,8 28,8 50,42 72,8 95,8 62,52 95,96 72,96 50,62 28,96 5,96 38,52"
      fill="url(#bx-right)" clipPath="url(#bx-right-clip)" />
    {/* Decorative dots – upper right */}
    {[{ cx: 78, cy: 6, r: 2.5 }, { cx: 85, cy: 10, r: 2 }, { cx: 91, cy: 15, r: 1.6 }, { cx: 82, cy: 2, r: 1.8 },
    { cx: 88, cy: 6, r: 1.4 }, { cx: 93, cy: 10, r: 1.1 }, { cx: 95, cy: 3, r: 1.6 }, { cx: 89, cy: 0, r: 1.2 }]
      .map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="#38bdf8" opacity={0.8 - i * 0.06} />)}
  </svg>
);

// --- Components ---

const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
  const variants: any = {
    primary: 'bg-primary hover:bg-primary/90 text-white',
    secondary: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100',
    danger: 'bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
  };

  return (
    <button
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all active:scale-95',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', ...props }: any) => (
  <div className={cn('bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden', className)} {...props}>
    {children}
  </div>
);

const NotificationToast = ({ notification, onDismiss }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 flex gap-4"
  >
    <div className={cn(
      "size-10 rounded-full flex items-center justify-center shrink-0",
      notification.type === 'success' ? "bg-emerald-100 text-emerald-600" :
        notification.type === 'warning' ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
    )}>
      <Bell className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-bold text-sm truncate">{notification.title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{notification.message}</p>
    </div>
    <button onClick={() => onDismiss(notification.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

// --- Notifications Panel ---
const NotificationsPanel = ({ notifications, onMarkAllRead, onClose, onDismiss }: {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onClose: () => void;
  onDismiss: (id: string) => void;
}) => {
  const TYPE_ICON: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    info: 'bg-primary/10 text-primary',
  };
  const formatTime = (ts: Date) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[110]" onClick={onClose} />
      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.18 }}
        className="fixed top-[68px] right-2 left-2 md:left-auto md:w-96 z-[120] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold">Notificações</h3>
            <p className="text-xs text-slate-400">{notifications.length} {notifications.length === 1 ? 'mensagem' : 'mensagens'}</p>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button onClick={onMarkAllRead}
                className="text-xs text-primary font-semibold hover:underline px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
                Marcar todas como lida
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="size-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Bell className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-500">Nenhuma notificação</p>
              <p className="text-xs text-slate-400">Tudo em dia!</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className={cn('size-9 rounded-full flex items-center justify-center shrink-0 mt-0.5', TYPE_ICON[n.type] || TYPE_ICON.info)}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{formatTime(n.timestamp)}</p>
                </div>
                <button onClick={() => onDismiss(n.id)} className="text-slate-300 hover:text-slate-500 shrink-0 mt-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
};

// --- Views ---

const LoginView = ({ onLogin }: { onLogin: (employee: Employee) => void }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    if (!loginId.trim() || !password.trim()) { setError('Preencha ID e senha.'); return; }
    setLoading(true); setError('');
    try {
      if (!supabase) throw new Error('Sem conexão com banco de dados.');
      const { data, error: dbErr } = await supabase
        .from('employees')
        .select('*')
        .eq('login_id', loginId.trim())
        .single();
      if (dbErr || !data) { setError('ID não encontrado.'); return; }
      if (data.password !== password) { setError('Senha incorreta.'); return; }
      const emp: Employee = {
        id: data.id, loginId: data.login_id, password: data.password,
        name: data.name, cpf: data.cpf || '', phone: data.phone || '',
        email: data.email || '', birthdate: data.birthdate || '',
        jobTitle: data.job_title || '', role: data.role as Role,
        avatarUrl: data.avatar_url || '',
      };
      if (remember) localStorage.setItem('bytex_remember', JSON.stringify(emp));
      onLogin(emp);
    } catch (e: any) {
      setError(e.message || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-slate-900/50 rounded-xl shadow-2xl border border-slate-800 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 mb-4"><BytexIcon className="w-full h-full" /></div>
            <h2 className="text-white text-2xl font-bold tracking-tight">Bytex Systems</h2>
            <p className="text-slate-400 text-sm mt-1">Gerenciamento de Infraestrutura Digital</p>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-white text-2xl font-bold mb-2">Bem-vindo</h1>
              <p className="text-slate-400 text-sm">Faça login com seu ID e senha.</p>
            </div>

            <div className="space-y-4">
              {/* ID */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-300 text-sm font-medium">ID de Acesso</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type="text" value={loginId} onChange={e => { setLoginId(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg h-12 pl-12 pr-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Ex: Login" />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-300 text-sm font-medium">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg h-12 pl-12 pr-12 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* Remember */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setRemember(r => !r)}
                  className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                    remember ? "bg-primary border-primary" : "border-slate-600 bg-transparent hover:border-primary/60")}>
                  {remember && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-slate-300 text-sm">Lembrar de mim</span>
              </label>
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full py-3.5 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> Verificando...</span>
              ) : (
                <>Entrar <LogOut className="w-5 h-5 rotate-180" /></>
              )}
            </Button>
          </div>
        </div>
        <div className="h-1.5 w-full bg-primary/20"><div className="h-full bg-primary w-1/3"></div></div>
      </motion.div>
    </div>
  );
};




type InventoryItem = {
  id: string;
  name: string;
  desc: string;
  stock: number;
  location: string;
  category: string;
  iconKey: 'cpu' | 'database' | 'router' | 'cable' | 'flask' | 'package';
};

const ICON_MAP: Record<string, any> = {
  cpu: Cpu, database: Database, router: Router, cable: Cable, flask: FlaskConical, package: Package,
};

const INITIAL_ITEMS: InventoryItem[] = []; // Removido dados fictícios

const EMPTY_ITEM: Omit<InventoryItem, 'id'> = {
  name: '', desc: '', stock: 0, location: '', category: 'Hardware', iconKey: 'package',
};

const CATEGORIES = ['Todos os Ativos', 'Hardware', 'Armazenamento', 'Consumíveis'];
const ITEM_CATEGORIES = ['Hardware', 'Armazenamento', 'Consumíveis'];
const ICON_OPTIONS: { key: InventoryItem['iconKey']; label: string }[] = [
  { key: 'cpu', label: 'Processador' },
  { key: 'database', label: 'Armazenamento' },
  { key: 'router', label: 'Rede' },
  { key: 'cable', label: 'Cabo/Periférico' },
  { key: 'flask', label: 'Consumível' },
  { key: 'package', label: 'Geral' },
];

const InventoryItemModal = ({
  item, onSave, onClose,
}: {
  item: Partial<InventoryItem> | null;
  onSave: (data: Omit<InventoryItem, 'id'>) => void;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<Omit<InventoryItem, 'id'>>(
    item ? {
      name: item.name || '', desc: item.desc || '', stock: item.stock || 0,
      location: item.location || '', category: item.category || 'Hardware',
      iconKey: item.iconKey || 'package'
    }
      : { ...EMPTY_ITEM }
  );
  const isEdit = !!item?.id;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold">{isEdit ? 'Editar Item' : 'Novo Item'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-500">Nome do Item *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Corsair 16GB DDR4" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-500">Descrição</label>
            <input value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Especificações do produto" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Categoria</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary">
                {ITEM_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Ícone</label>
              <select value={form.iconKey} onChange={e => setForm({ ...form, iconKey: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary">
                {ICON_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Qtd. em Estoque</label>
              <input type="number" min={0} value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">Localização</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: Shelf A-12" />
            </div>
          </div>
        </div>
        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={() => { if (form.name.trim()) onSave(form); }} className="flex-1">
            {isEdit ? 'Salvar Alterações' : 'Adicionar Item'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const InventoryView = ({ currentUser, items, setItems, lowStockThreshold }: {
  currentUser: Employee; items: InventoryItem[]; setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>; lowStockThreshold: number;
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos os Ativos');
  const [modalItem, setModalItem] = useState<Partial<InventoryItem> | null | false>(false); // false=closed, null=new, obj=edit

  const filtered = items.filter(item => {
    const matchCat = category === 'Todos os Ativos' || item.category === category;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSave = async (data: Omit<InventoryItem, 'id'>) => {
    if (!supabase) return;
    try {
      if (modalItem && (modalItem as InventoryItem).id) {
        // edit
        const id = (modalItem as InventoryItem).id;
        await supabase.from('inventory_items').update({
          name: data.name, description: data.desc, stock: data.stock,
          location: data.location, category: data.category, icon_key: data.iconKey
        }).eq('id', id);
        setItems(prev => prev.map(it => it.id === id ? { ...it, ...data } : it));
      } else {
        // add
        // generate a quick fallback ID locally, though DB uses UUID
        const newId = `INV-${Date.now()}`;
        const newItem: InventoryItem = { ...data, id: newId };
        
        await supabase.from('inventory_items').insert({
          id: newId, name: data.name, description: data.desc, stock: data.stock,
          location: data.location, category: data.category, icon_key: data.iconKey
        });
        setItems(prev => [newItem, ...prev]);
      }
    } catch(e) { console.error('Error saving item', e) }
    setModalItem(false);
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('inventory_items').delete().eq('id', id);
      setItems(prev => prev.filter(it => it.id !== id));
    } catch(e) { console.error('Error deleting item', e) }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-500';
    if (stock <= lowStockThreshold) return 'text-orange-500';
    return 'text-primary';
  };

  return (
    <>
      {modalItem !== false && (
        <InventoryItemModal
          item={modalItem}
          onSave={handleSave}
          onClose={() => setModalItem(false)}
        />
      )}

      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                placeholder="Buscar componentes de TI..."
              />
            </div>
            <button
              onClick={() => setModalItem(null)}
              className="shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
              title="Novo Item"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <Button key={cat} variant={category === cat ? 'primary' : 'secondary'}
                className="shrink-0" onClick={() => setCategory(cat)}>
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">ESTOQUE ATUAL</h2>
            <span className="text-xs text-slate-400">{filtered.length} iten{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {filtered.length === 0 ? (
            <Card className="p-10 flex flex-col items-center text-center space-y-3">
              <Search className="w-10 h-10 text-slate-300" />
              <p className="font-semibold text-slate-500">Nenhum item encontrado</p>
              <p className="text-sm text-slate-400">Tente outro termo ou categoria.</p>
            </Card>
          ) : (
            filtered.map(item => {
              const Icon = ICON_MAP[item.iconKey] || Package;
              const color = getStockColor(item.stock);
              return (
                <Card key={item.id} className="p-4 flex items-center gap-4">
                  <div className="size-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-sm text-slate-500 truncate">{item.desc}</p>
                    <span className="text-[11px] font-medium text-slate-400">{item.category}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-bold', color)}>{item.stock} un.</p>
                    <p className={cn('text-xs font-medium', item.stock === 0 ? 'text-red-400' : item.stock <= lowStockThreshold ? 'text-orange-400' : 'text-slate-400')}>
                      {item.stock === 0 ? 'Fora de estoque' : item.stock <= lowStockThreshold ? 'Baixo estoque' : item.location}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => setModalItem(item)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Remover">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};




// ─── Dashboard ───────────────────────────────────────────────────────────────

const DashboardView = ({
  orders,
  inventoryItems,
  lowStockThreshold,
  onNavigate,
}: {
  orders: Order[];
  inventoryItems: InventoryItem[];
  lowStockThreshold: number;
  onNavigate: (v: 'orders' | 'inventory' | 'calculator') => void;
}) => {
  const activeOrders = orders.filter(o => o.status !== 'finished');
  const inProgressOrders = orders.filter(o => o.status === 'in_progress');
  const revenue = orders.filter(o => o.status === 'finished').reduce((acc, o) => acc + o.value, 0);
  const lowStockItems = inventoryItems.filter(i => i.stock <= lowStockThreshold);

  // Realtime Presence tracker via Supabase
  const [onlineCount, setOnlineCount] = React.useState(1);
  React.useEffect(() => {
    if (!supabase) return;
    
    const room = supabase.channel('online-dashboard');
    
    room
      .on('presence', { event: 'sync' }, () => {
        const state = room.presenceState();
        const count = Object.keys(state).length; // Count unique connected clients
        setOnlineCount(Math.max(1, count));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({
            online_at: new Date().toISOString(),
          });
        }
      });
      
    return () => {
      supabase.removeChannel(room);
    };
  }, []);

  const kpis = [
    { label: 'Serviços Ativos', value: activeOrders.length.toString(), sub: `${inProgressOrders.length} em reparo`, color: 'from-primary to-violet-600', icon: ClipboardList, action: () => onNavigate('orders') },
    { label: 'Receita Total', value: `R$ ${revenue.toFixed(0)}`, sub: 'serviços finalizados', color: 'from-emerald-500 to-teal-600', icon: BarChart3, action: undefined },
    { label: 'Online Agora', value: onlineCount.toString(), sub: onlineCount === 1 ? 'funcionário' : 'funcionários', color: 'from-sky-500 to-blue-600', icon: User, action: undefined },
    { label: 'Alerta Estoque', value: lowStockItems.length.toString(), sub: `iten${lowStockItems.length !== 1 ? 's' : ''} em baixa`, color: lowStockItems.length > 0 ? 'from-red-500 to-orange-500' : 'from-slate-400 to-slate-500', icon: Package, action: () => onNavigate('inventory') },
  ] as const;

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="pt-1">
        <h2 className="text-2xl font-bold">Visão Geral</h2>
        <p className="text-slate-500 text-sm mt-0.5">Resumo operacional da Bytex Systems</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            onClick={kpi.action}
            className={cn(`bg-gradient-to-br ${kpi.color} rounded-2xl p-4 text-white shadow-lg`,
              kpi.action && 'cursor-pointer hover:scale-[1.02] transition-transform active:scale-95')}
          >
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className="w-5 h-5 opacity-80" />
              {kpi.action && <ChevronRight className="w-4 h-4 opacity-60" />}
            </div>
            <p className="text-3xl font-extrabold leading-none">{kpi.value}</p>
            <p className="text-xs mt-1 opacity-80 font-semibold">{kpi.label}</p>
            <p className="text-[10px] mt-0.5 opacity-60">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {activeOrders.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Ordens Ativas</h3>
            <button onClick={() => onNavigate('orders')} className="text-xs text-primary font-semibold hover:underline">Ver todas</button>
          </div>
          {activeOrders.slice(0, 3).map(o => (
            <Card key={o.id} onClick={() => onNavigate('orders')}
              className="p-4 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors">
              <div className={cn('size-10 rounded-lg flex items-center justify-center shrink-0',
                o.status === 'in_progress' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/20')}>
                <Laptop className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{o.customerName}</p>
                <p className="text-xs text-slate-500 truncate">{o.device}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm">R$ {o.value.toFixed(0)}</p>
                <p className={cn('text-[10px] font-bold uppercase',
                  o.status === 'in_progress' ? 'text-primary' : o.status === 'ready' ? 'text-emerald-500' : 'text-amber-500')}>
                  {o.status === 'budget' ? 'Orçamento' : o.status === 'approval' ? 'Aprovação' : o.status === 'in_progress' ? 'Em reparo' : 'Pronto'}
                </p>
              </div>
            </Card>
          ))}
        </section>
      )}

      {lowStockItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Estoque em Baixa</h3>
            <button onClick={() => onNavigate('inventory')} className="text-xs text-primary font-semibold hover:underline">Ver estoque</button>
          </div>
          {lowStockItems.slice(0, 4).map(item => {
            const Icon = ICON_MAP[item.iconKey] || Package;
            return (
              <Card key={item.id} className="p-4 flex items-center gap-4 border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-900/10">
                <div className="size-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 shrink-0"><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-red-500">{item.stock} un.</p>
                  <p className="text-[10px] text-red-400 font-medium">{item.stock === 0 ? 'Esgotado' : 'Baixo'}</p>
                </div>
              </Card>
            );
          })}
        </section>
      )}

      {activeOrders.length === 0 && lowStockItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <p className="font-bold text-lg">Tudo em ordem!</p>
          <p className="text-sm text-slate-500">Sem ordens ativas e estoque normalizado.</p>
        </div>
      )}
    </div>
  );
};

const OrderView = ({
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
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Ordens de Serviço</h2>
          {currentUser.role !== 'funcionario' && (
            <Button onClick={onAdd} className="py-2 px-3 text-sm">
              <Plus className="w-4 h-4" /> Nova Ordem
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {orders.length === 0 ? (
            <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <ClipboardList className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-slate-600 dark:text-slate-300">Nenhuma ordem encontrada</p>
                <p className="text-sm text-slate-500">Comece adicionando uma nova ordem de serviço.</p>
              </div>
            </Card>
          ) : (
            orders.filter(o => o.status !== 'finished').map((order) => (
              <Card
                key={order.id}
                className="p-4 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => onSelect(order.id)}
              >
                <div className={cn(
                  "size-12 rounded-lg flex items-center justify-center shrink-0",
                  order.status === 'finished' ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"
                )}>
                  <Laptop className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate">{order.customerName}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">#{order.id}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{order.device} • {order.problem}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">R$ {order.value.toFixed(2)}</p>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    order.status === 'finished' ? "text-emerald-500" :
                      order.status === 'in_progress' ? "text-primary" : "text-amber-500"
                  )}>
                    {order.status === 'budget' ? 'Orçamento' :
                      order.status === 'approval' ? 'Aprovação' :
                        order.status === 'in_progress' ? 'Em Reparo' :
                          order.status === 'ready' ? 'Pronto' : 'Finalizado'}
                  </span>
                </div>
                <ChevronRight className="text-slate-400 group-hover:text-primary transition-colors w-5 h-5" />
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
                        // Animated checkmark SVG when finalizado
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

      {nextStatus && (
        <div className="pt-4">
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

const OrderForm = ({
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
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

const CalculatorView = ({ onAddOrder }: { onAddOrder: (value: number, clientData: { name: string; device: string; problem: string }) => void }) => {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('Hardware');

  const services = [
    {
      title: 'Hardware', label: 'Hardware / Manutenção', icon: Cpu, items: [
        { id: 'h1', name: 'Limpeza preventiva (pó e oxidação)', price: 150 },
        { id: 'h2', name: 'Troca de tela de notebook', price: 450 },
        { id: 'h3', name: 'Upgrade de RAM ou SSD', price: 200 },
        { id: 'h4', name: 'Troca de bateria', price: 220 },
        { id: 'h5', name: 'Reparo de conector de carga', price: 180 },
        { id: 'h6', name: 'Substituição de teclado / touchpad', price: 280 },
        { id: 'h7', name: 'Reparo de placa-mãe (diagnóstico)', price: 350 },
        { id: 'h8', name: 'Instalação de cooler / pasta térmica', price: 120 },
        { id: 'h9', name: 'Troca de fonte de alimentação', price: 160 },
      ]
    },
    {
      title: 'Redes', label: 'Redes e Conectividade', icon: Router, items: [
        { id: 'r1', name: 'Configuração de roteador Wi-Fi', price: 120 },
        { id: 'r2', name: 'Cabeamento estruturado (por ponto)', price: 80 },
        { id: 'r3', name: 'Instalação de repetidor / mesh', price: 100 },
        { id: 'r4', name: 'Configuração de firewall / VPN', price: 200 },
        { id: 'r5', name: 'Instalação de switch gerenciável', price: 150 },
        { id: 'r6', name: 'Configuração de VLAN', price: 180 },
        { id: 'r7', name: 'Diagnóstico de lentidão de rede', price: 90 },
        { id: 'r8', name: 'Instalação de câmeras IP / CFTV', price: 250 },
        { id: 'r9', name: 'Configuração de servidor NAS', price: 220 },
      ]
    },
    {
      title: 'Software', label: 'Software e Sistemas', icon: Terminal, items: [
        { id: 's1', name: 'Formatação com Backup', price: 180 },
        { id: 's2', name: 'Remoção de vírus / malware', price: 90 },
        { id: 's3', name: 'Instalação Pacote Office / Windows', price: 110 },
        { id: 's4', name: 'Configuração de e-mail corporativo', price: 100 },
        { id: 's5', name: 'Migração de dados / clonagem de HD', price: 160 },
        { id: 's6', name: 'Instalação e config. de ERP/CRM', price: 300 },
        { id: 's7', name: 'Configuração de backup automatizado', price: 140 },
        { id: 's8', name: 'Otimização de desempenho do sistema', price: 80 },
        { id: 's9', name: 'Instalação de antivírus corporativo', price: 120 },
      ]
    },
  ];

  const toggleItem = (id: string) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const total = services.reduce((acc, section) => {
    return acc + section.items.reduce((sAcc, item) => sAcc + (selectedItems[item.id] ? item.price : 0), 0);
  }, 0);

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  const activeSection = services.find(s => s.title === activeTab)!;

  const [pendingTotal, setPendingTotal] = useState<number | null>(null);
  const [clientData, setClientData] = useState({ name: '', device: '', problem: '' });

  const handleFinalize = () => {
    if (total === 0) return;
    setClientData({ name: '', device: '', problem: '' });
    setPendingTotal(total);
  };

  const handleConfirm = () => {
    if (pendingTotal == null) return;
    onAddOrder(pendingTotal, clientData);
    setPendingTotal(null);
    setSelectedItems({});
  };

  return (
    <div className="pb-36">
      {/* Tab header */}
      <div className="px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark sticky top-0 z-10">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {services.map(s => (
            <button
              key={s.title}
              onClick={() => setActiveTab(s.title)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 border-b-[3px] font-bold text-sm transition-colors whitespace-nowrap",
                activeTab === s.title
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <s.icon className="w-4 h-4" />
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Selected summary badge */}
      {selectedCount > 0 && (
        <div className="mx-4 mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">{selectedCount} serviço{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}</span>
          <button onClick={() => setSelectedItems({})} className="text-xs text-slate-500 hover:text-red-500 transition-colors">Limpar tudo</button>
        </div>
      )}

      {/* Service items for active tab */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <activeSection.icon className="text-primary w-5 h-5" />
          <h3 className="text-lg font-bold">{activeSection.label}</h3>
        </div>
        {activeSection.items.map(item => (
          <label
            key={item.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
              selectedItems[item.id]
                ? "border-primary bg-primary/5 dark:bg-primary/10"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-primary/30"
            )}
          >
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-base font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-primary font-bold">R$ {item.price.toFixed(2)}</span>
              <input
                type="checkbox"
                checked={!!selectedItems[item.id]}
                onChange={() => toggleItem(item.id)}
                className="h-6 w-6 rounded border-slate-300 text-primary focus:ring-primary accent-primary"
              />
            </div>
          </label>
        ))}
      </div>

      {/* Finalizar footer */}
      <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">Total Estimado</span>
            <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
          </div>
          <Button
            disabled={total === 0}
            onClick={handleFinalize}
            className="px-8 py-3 disabled:opacity-50"
          >
            Finalizar Orçamento
          </Button>
        </div>
      </div>

      {/* Mini form modal before finalizing */}
      {pendingTotal != null && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Dados do Serviço</h3>
                <p className="text-xs text-slate-400 mt-0.5">Total: <span className="text-primary font-bold">R$ {pendingTotal.toFixed(2)}</span></p>
              </div>
              <button onClick={() => setPendingTotal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Nome do Cliente *</label>
                <input type="text" value={clientData.name}
                  onChange={e => setClientData(d => ({ ...d, name: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: João Silva" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Dispositivo *</label>
                <input type="text" value={clientData.device}
                  onChange={e => setClientData(d => ({ ...d, device: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: MacBook Pro M1" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Descrição do Problema *</label>
                <input type="text" value={clientData.problem}
                  onChange={e => setClientData(d => ({ ...d, problem: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Superaquecimento, tela quebrada..." />
              </div>
              <div className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="font-semibold mb-1">Serviços selecionados:</p>
                {services.flatMap(s => s.items.filter(i => selectedItems[i.id])).map(i => (
                  <p key={i.id} className="flex justify-between"><span>{i.name}</span><span className="font-mono text-primary">R$ {i.price.toFixed(0)}</span></p>
                ))}
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <Button variant="secondary" onClick={() => setPendingTotal(null)} className="flex-1">Voltar</Button>
              <Button onClick={handleConfirm} disabled={!clientData.name || !clientData.device || !clientData.problem} className="flex-1 disabled:opacity-50">Criar Ordem</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};


const ServiceHistoryModal = ({ orders, onClose }: { orders: Order[], onClose: () => void }) => {
  const finished = orders.filter(o => o.status === 'finished');
  const total = finished.reduce((acc, o) => acc + o.value, 0);
  const STATUS_LABELS: Record<string, string> = {
    budget: 'Orçamento', approval: 'Aprovação', in_progress: 'Em Reparo',
    ready: 'Pronto', finished: 'Finalizado',
  };
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Histórico de Serviços</h3>
            <p className="text-xs text-slate-400 mt-0.5">{finished.length} serviço{finished.length !== 1 ? 's' : ''} finalizado{finished.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {finished.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Nenhum serviço finalizado ainda</p>
              <p className="text-sm mt-1">Os serviços concluídos aparecerão aqui.</p>
            </div>
          ) : (
            <>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Receita de Serviços Finalizados</p>
                  <p className="text-2xl font-bold text-emerald-600">R$ {total.toFixed(2)}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-emerald-400 opacity-60" />
              </div>
              <div className="space-y-2">
                {finished.map(o => (
                  <div key={o.id} className="flex items-start gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold truncate">{o.customerName}</p>
                        <p className="font-bold text-emerald-600 shrink-0">R$ {o.value.toFixed(2)}</p>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{o.device}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{o.problem}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">Finalizado</span>
                        <span className="text-[10px] text-slate-400 font-mono">#{o.id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
          <Button onClick={onClose} className="w-full">Fechar</Button>
        </div>
      </motion.div>
    </div>
  );
};

const PriceTableModal = ({ prices, onSave, onClose }: {
  prices: { id: string, category: string, name: string, price: number }[],
  onSave: (id: string, price: number) => void,
  onClose: () => void
}) => {
  const [editPrices, setEditPrices] = useState<Record<string, number>>(
    Object.fromEntries(prices.map(p => [p.id, p.price]))
  );
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold">Tabela de Preços</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {prices.map(p => (
            <div key={p.id} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[11px] text-slate-400 font-medium">{p.category}</p>
                <p className="font-semibold text-sm">{p.name}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-sm">R$</span>
                <input type="number" value={editPrices[p.id] ?? p.price}
                  onChange={e => setEditPrices(prev => ({ ...prev, [p.id]: parseFloat(e.target.value) || 0 }))}
                  className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-9 px-2 text-right font-bold outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={() => { prices.forEach(p => { const v = editPrices[p.id] ?? p.price; if (v !== p.price) onSave(p.id, v); }); onClose(); }} className="flex-1">Salvar</Button>
        </div>
      </motion.div>
    </div>
  );
};

const SalesReportModal = ({ orders, onClose }: { orders: Order[], onClose: () => void }) => {
  const total = orders.reduce((acc, o) => acc + o.value, 0);
  const byStatus = {
    budget: orders.filter(o => o.status === 'budget').length,
    approval: orders.filter(o => o.status === 'approval').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    ready: orders.filter(o => o.status === 'ready').length,
    finished: orders.filter(o => o.status === 'finished').length,
  };
  const finished = orders.filter(o => o.status === 'finished');
  const finishedRevenue = finished.reduce((acc, o) => acc + o.value, 0);
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold">Relatório de Vendas</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/10 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-medium">Receita Total</p>
              <p className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-medium">Receita Finalizada</p>
              <p className="text-2xl font-bold text-emerald-600">R$ {finishedRevenue.toFixed(2)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Ordens por Status</p>
            <div className="space-y-2">
              {[
                { label: 'Orçamento', count: byStatus.budget, color: 'bg-amber-400' },
                { label: 'Aprovação', count: byStatus.approval, color: 'bg-orange-400' },
                { label: 'Em Reparo', count: byStatus.in_progress, color: 'bg-primary' },
                { label: 'Pronto', count: byStatus.ready, color: 'bg-blue-400' },
                { label: 'Finalizado', count: byStatus.finished, color: 'bg-emerald-500' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={cn('size-2.5 rounded-full shrink-0', s.color)} />
                  <span className="text-sm flex-1">{s.label}</span>
                  <span className="font-bold text-sm">{s.count} ordem{s.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
          {orders.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Ordens Recentes</p>
              <div className="space-y-2">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div>
                      <p className="font-semibold text-sm">{o.customerName}</p>
                      <p className="text-xs text-slate-400">{o.device}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary">R$ {o.value.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{o.status === 'finished' ? 'Finalizado' : o.status === 'in_progress' ? 'Em Reparo' : 'Ativo'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {orders.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Nenhuma ordem registrada</p>
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
          <Button onClick={onClose} className="w-full">Fechar</Button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Employee Management Modal ---
const EmployeeManagementModal = ({ employees, onClose, onRefresh }: { employees: Employee[], onClose: () => void, onRefresh: () => void }) => {
  const [editing, setEditing] = useState<Employee | Partial<Employee> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!editing?.name || !editing?.loginId || !editing?.password) { alert('Preencha Nome, ID e Senha.'); return; }
    setLoading(true);
    try {
      if (editing.id) {
        await supabase?.from('employees').update({
          name: editing.name, cpf: editing.cpf, phone: editing.phone, email: editing.email,
          birthdate: editing.birthdate, job_title: editing.jobTitle, role: editing.role,
          avatar_url: editing.avatarUrl, login_id: editing.loginId, password: editing.password
        }).eq('id', editing.id);
      } else {
        await supabase?.from('employees').insert({
          name: editing.name, cpf: editing.cpf, phone: editing.phone, email: editing.email,
          birthdate: editing.birthdate, job_title: editing.jobTitle, role: editing.role || 'funcionario',
          avatar_url: editing.avatarUrl, login_id: editing.loginId, password: editing.password
        });
      }
      onRefresh(); setEditing(null);
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir funcionário?')) return;
    setLoading(true);
    await supabase?.from('employees').delete().eq('id', id);
    onRefresh(); setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold">Gestão de Funcionários</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
          {editing ? (
            <div className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold mb-4">{editing.id ? 'Editar Funcionário' : 'Novo Funcionário'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-slate-500">Nome *</label><input type="text" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1" /></div>
                <div><label className="text-xs text-slate-500">Função (Ex: Técnico)</label><input type="text" value={editing.jobTitle || ''} onChange={e => setEditing({ ...editing, jobTitle: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1" /></div>
                <div>
                  <label className="text-xs text-slate-500">Cargo de Acesso *</label>
                  <select value={editing.role || 'funcionario'} onChange={e => setEditing({ ...editing, role: e.target.value as Role })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1 outline-none">
                    <option value="funcionario">Funcionário (Restrito)</option>
                    <option value="gestor">Gestor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div><label className="text-xs text-slate-500">ID de Login *</label><input type="text" value={editing.loginId || ''} onChange={e => setEditing({ ...editing, loginId: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1" /></div>
                <div><label className="text-xs text-slate-500">Senha *</label><input type="text" value={editing.password || ''} onChange={e => setEditing({ ...editing, password: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1" /></div>
                <div><label className="text-xs text-slate-500">Avatar URL</label><input type="text" value={editing.avatarUrl || ''} onChange={e => setEditing({ ...editing, avatarUrl: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1 placeholder:text-slate-400" placeholder="https://..." /></div>
                <div><label className="text-xs text-slate-500">Email</label><input type="email" value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1" /></div>
                <div><label className="text-xs text-slate-500">Telefone</label><input type="text" value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1" /></div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="secondary" onClick={() => setEditing(null)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSave} disabled={loading} className="flex-1">{loading ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button onClick={() => setEditing({ role: 'funcionario' })} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"><UserPlus className="w-4 h-4 mr-2" /> Adicionar Funcionário</Button>
              <div className="grid gap-3">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {emp.avatarUrl ? <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold truncate">{emp.name}</p>
                        {emp.role === 'admin' && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        {emp.role === 'gestor' && <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{emp.jobTitle || 'Sem função'} • ID: {emp.loginId}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setEditing(emp)} className="p-2 text-slate-400 hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(emp.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Send Notification Modal ---
const SendNotificationModal = ({ employees, onClose, onSend }: { employees: Employee[], onClose: () => void, onSend: (n: Notification) => void }) => {
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning'>('info');

  const handleSend = () => {
    if (!title.trim() || !msg.trim()) return;
    onSend({
      id: Date.now().toString(), title, message: msg, type, timestamp: new Date()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2"><Send className="w-5 h-5 text-primary" /> Enviar Notificação</h3>
        <div><label className="text-xs text-slate-500 mb-1 block">Título</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 outline-none" placeholder="Ex: Aviso da Gerência" /></div>
        <div><label className="text-xs text-slate-500 mb-1 block">Mensagem</label><textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 outline-none resize-none" placeholder="Digite a mensagem..." /></div>
        <div className="flex gap-2">
          {(['info', 'success', 'warning'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} className={cn("flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors", type === t ? 'border-primary text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-500')}>
              {t === 'info' ? 'Aviso' : t === 'success' ? 'Sucesso' : 'Alerta'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSend} className="flex-1">Enviar</Button>
        </div>
      </motion.div>
    </div>
  );
};

const SettingsView = ({ currentUser, employees, onRefreshEmployees, onSendNotification, onLogout, darkMode, onToggleDark, soundEnabled, onToggleSound, orders, lowStockThreshold, onChangeLowStock }: {
  currentUser: Employee, employees: Employee[], onRefreshEmployees: () => void, onSendNotification: (n: Notification) => void,
  onLogout: () => void, darkMode: boolean, onToggleDark: () => void,
  soundEnabled: boolean, onToggleSound: () => void, orders: Order[],
  lowStockThreshold: number, onChangeLowStock: (v: number) => void
}) => {
  const [showPriceTable, setShowPriceTable] = useState(false);
  const [showSalesReport, setShowSalesReport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [servicePrices, setServicePrices] = useState<{ id: string, category: string, name: string, price: number }[]>([]);
  useEffect(() => {
    if (!supabase) return;
    supabase.from('service_prices').select('*').order('id').then(({ data }) => { if (data) setServicePrices(data); });
  }, []);
  const handleSavePrice = async (id: string, price: number) => {
    if (supabase) await supabase.from('service_prices').update({ price }).eq('id', id);
    setServicePrices(prev => prev.map(p => p.id === id ? { ...p, price } : p));
  };
  const baseSections: any[] = [
    {
      title: "Gestão de Negócios", items: [
        { icon: CreditCard, label: "Tabela de Preços", desc: "Configurar valores dos serviços", highlight: true, action: () => setShowPriceTable(true) },
        { icon: BarChart3, label: "Relatórios de Vendas", desc: "Resumo financeiro das ordens", action: () => setShowSalesReport(true) },
        { icon: CheckCircle2, label: "Histórico de Serviços", desc: "Serviços concluídos", action: () => setShowHistory(true) },
      ]
    },
    {
      title: "Perfil do Técnico", items: [
        { icon: User, label: "Dados Pessoais", desc: "" },
        { icon: ShieldCheck, label: "Certificações e Habilidades", desc: "" },
      ]
    },
    {
      title: "Configurações do App", items: [
        { icon: Moon, label: "Modo Escuro", isToggle: true, toggleVal: darkMode, action: onToggleDark, desc: "" },
        { icon: Bell, label: "Notificações Sonoras", isToggle: true, toggleVal: soundEnabled, action: onToggleSound, desc: "" },
        { icon: Globe, label: "Idioma (Português)", desc: "" },
      ], lowStockConfig: true
    },
    {
      title: "Suporte e Sobre", items: [
        { icon: HelpCircle, label: "Central de Ajuda", desc: "" },
        { icon: Info, label: "Sobre a Bytex Systems", desc: "" },
        { icon: LogOut, label: "Sair da Conta", danger: true, action: onLogout },
      ]
    },
  ];

  const sections = (() => {
    let s = [...baseSections];
    if (currentUser.role === 'admin') {
      s.unshift({
        title: "Administração",
        items: [
          { icon: Users, label: "Gestão de Funcionários", desc: "Adicionar, editar e remover", action: () => setShowEmployeeModal(true) },
          { icon: Send, label: "Enviar Notificação", desc: "Avisos para toda a equipe", action: () => setShowNotifModal(true) },
        ]
      } as any);
    }
    if (currentUser.role === 'funcionario') {
      const g = s.find(x => x.title === "Gestão de Negócios");
      if (g) g.items = g.items.filter((i: any) => i.label !== "Relatórios de Vendas");
    }
    return s;
  })();
  return (
    <>
      {showPriceTable && <PriceTableModal prices={servicePrices} onSave={handleSavePrice} onClose={() => setShowPriceTable(false)} />}
      {showSalesReport && <SalesReportModal orders={orders} onClose={() => setShowSalesReport(false)} />}
      {showHistory && <ServiceHistoryModal orders={orders} onClose={() => setShowHistory(false)} />}
      {showEmployeeModal && <EmployeeManagementModal employees={employees} onClose={() => setShowEmployeeModal(false)} onRefresh={onRefreshEmployees} />}
      {showNotifModal && <SendNotificationModal employees={employees} onClose={() => setShowNotifModal(false)} onSend={(n) => { onSendNotification(n); setShowNotifModal(false); }} />}

      <div className="p-6 space-y-8 pb-24">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary overflow-hidden">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full border-2 border-background-dark"><Edit2 className="w-3 h-3" /></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{currentUser.name}</h2>
              {currentUser.role === 'admin' && <Crown className="w-5 h-5 text-amber-500" />}
              {currentUser.role === 'gestor' && <Shield className="w-5 h-5 text-blue-500" />}
            </div>
            <p className="text-slate-500 font-medium">{currentUser.jobTitle || 'Sem função'} • Bytex Systems</p>
            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-primary/10 text-primary">ID: {currentUser.loginId}</span>
          </div>
        </div>
        {sections.map((section, i) => (
          <section key={i}>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">{section.title}</h3>
            <Card>
              {section.items.map((item, j) => (
                <div key={j} onClick={(item as any).action}
                  className={cn("flex items-center gap-4 p-4 transition-colors cursor-pointer border-b border-slate-200 dark:border-slate-800 last:border-0",
                    (item as any).highlight ? 'bg-primary/5 hover:bg-primary/10' :
                      (item as any).danger ? 'hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500' :
                        'hover:bg-slate-50 dark:hover:bg-slate-800')}>
                  <div className={cn("size-10 rounded-lg flex items-center justify-center shrink-0",
                    (item as any).highlight ? 'bg-primary text-white shadow-lg shadow-primary/20' :
                      (item as any).danger ? 'bg-red-100 dark:bg-red-900/20' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={cn("font-bold", (item as any).highlight && 'text-primary')}>{item.label}</p>
                    {(item as any).desc && <p className="text-xs text-slate-500">{(item as any).desc}</p>}
                  </div>
                  {(item as any).isToggle ? (
                    <div onClick={e => { e.stopPropagation(); (item as any).action?.(); }}
                      className={cn("w-12 h-6 rounded-full flex items-center px-1 transition-colors cursor-pointer shrink-0",
                        (item as any).toggleVal ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600')}>
                      <div className={cn("size-4 bg-white rounded-full transition-all duration-200", (item as any).toggleVal ? 'ml-auto' : '')}></div>
                    </div>
                  ) : (
                    <ChevronRight className="text-slate-400 w-5 h-5 shrink-0" />
                  )}
                </div>
              ))}
              {(section as any).lowStockConfig && (
                <div className="flex items-center gap-4 p-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">Limite de Estoque Baixo</p>
                    <p className="text-xs text-slate-500">Marcar em vermelho abaixo deste valor</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => onChangeLowStock(Math.max(0, lowStockThreshold - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-lg hover:bg-primary hover:text-white transition-colors">−</button>
                    <span className="w-10 text-center font-bold text-lg tabular-nums">{lowStockThreshold}</span>
                    <button onClick={() => onChangeLowStock(lowStockThreshold + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-lg hover:bg-primary hover:text-white transition-colors">+</button>
                  </div>
                </div>
              )}
            </Card>
          </section>
        ))}
        <p className="text-center text-xs text-slate-500 pb-8">Versão 2.4.12 - Bytex Systems © 2024</p>
      </div>
    </>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<View>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    try { const s = localStorage.getItem('bytex_remember'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [employees, setEmployees] = useState<Employee[]>([]);

  const fetchEmployees = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('employees').select('*');
    if (data) setEmployees(data.map(d => ({
      id: d.id, loginId: d.login_id, password: d.password,
      name: d.name, cpf: d.cpf || '', phone: d.phone || '',
      email: d.email || '', birthdate: d.birthdate || '',
      jobTitle: d.job_title || '', role: d.role as Role,
      avatarUrl: d.avatar_url || '',
    })));
  };

  useEffect(() => { fetchEmployees(); }, []);

  // Auto-login from remember me
  useEffect(() => {
    if (currentUser) { setIsLoggedIn(true); setView('dashboard'); }
  }, []);

  // --- Orders State ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true; // Default to true if not set
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => parseInt(localStorage.getItem('lowStockThreshold') || '5'));
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(INITIAL_ITEMS);

  // Persist lowStockThreshold
  useEffect(() => { localStorage.setItem('lowStockThreshold', String(lowStockThreshold)); }, [lowStockThreshold]);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  // Notification sound
  const playNotificationSound = (enabled: boolean) => {
    if (!enabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch (e) { console.warn('Audio unavailable'); }
  };

  // Load orders from Supabase
  useEffect(() => {
    if (!supabase) return;
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) {
        setOrders(data.map(o => ({
          id: o.id, customerName: o.customer_name, customerEmail: o.customer_email,
          customerPhone: o.customer_phone, device: o.device, serialNumber: o.serial_number,
          problem: o.problem, value: Number(o.value), status: o.status as OrderStatus,
          createdAt: o.created_at,
        })));
      }
    });

    // Load inventory
    supabase.from('inventory_items').select('*').then(({ data, error }) => {
      if (data && !error && data.length > 0) {
        setInventoryItems(data.map(i => ({
          id: i.id, name: i.name, desc: i.description || '', stock: i.stock || 0,
          location: i.location || '', category: i.category || 'Hardware', iconKey: i.icon_key || 'package'
        })));
      } else if (data && data.length === 0) {
        setInventoryItems([]);
      }
    });
  }, []);

  // --- Supabase Realtime Setup ---
  useEffect(() => {
    if (!supabase) return;

    // Subscribe to orders table changes
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          let title = ''; let message = ''; let type: 'info' | 'success' | 'warning' = 'info';
          if (payload.eventType === 'INSERT') {
            title = 'Novo Pedido';
            message = `Pedido criado para ${payload.new.customer_name || 'cliente'}.`;
            type = 'success';
            setOrders(prev => {
              if (prev.some(o => o.id === payload.new.id)) return prev;
              const o = payload.new;
              return [{ id: o.id, customerName: o.customer_name, customerEmail: o.customer_email, customerPhone: o.customer_phone, device: o.device, serialNumber: o.serial_number, problem: o.problem, value: Number(o.value), status: o.status, createdAt: o.created_at }, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            title = 'Pedido Atualizado';
            message = `Pedido #${payload.new.id} atualizado.`;
            type = 'info';
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, status: payload.new.status } : o));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
          if (title) {
            const n: Notification = { id: Math.random().toString(36).substr(2, 9), title, message, type, timestamp: new Date() };
            setNotifications(prev => [n, ...prev]);
            playNotificationSound(soundEnabled);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [soundEnabled]);


  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogin = (employee: Employee) => {
    setCurrentUser(employee);
    setIsLoggedIn(true);
    setView('dashboard');
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Helper to generate a unique 6-character alphanumeric order code
  const generateOrderCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) i === 0 ? code += chars.slice(0, 26).charAt(Math.floor(Math.random() * 26)) : code += chars.charAt(Math.floor(Math.random() * chars.length));
    return `OS-${code}`;
  };

  // --- Order Actions ---
  const handleSaveOrder = async (data: Partial<Order>) => {
    if (editingOrder) {
      const updatedOrder = { ...editingOrder, ...data } as Order;
      if (supabase) await supabase.from('orders').update({
        customer_name: updatedOrder.customerName, customer_email: updatedOrder.customerEmail,
        customer_phone: updatedOrder.customerPhone, device: updatedOrder.device,
        serial_number: updatedOrder.serialNumber, problem: updatedOrder.problem, value: updatedOrder.value,
      }).eq('id', updatedOrder.id);
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? updatedOrder : o));
      const n: Notification = { id: Date.now().toString(), title: 'Pedido Editado', message: `Pedido #${editingOrder.id} atualizado.`, type: 'info', timestamp: new Date() };
      setNotifications(prev => [n, ...prev]);
      playNotificationSound(soundEnabled);
    } else {
      const newOrder: Order = {
        id: generateOrderCode(),
        customerName: data.customerName || 'Cliente Avulso',
        customerEmail: data.customerEmail || '',
        customerPhone: data.customerPhone || '',
        device: data.device || 'Dispositivo não informado',
        serialNumber: data.serialNumber || 'N/A',
        problem: data.problem || 'Não especificado',
        value: data.value || 0,
        status: 'budget',
        createdAt: new Date().toISOString(),
      };
      if (supabase) await supabase.from('orders').insert({
        id: newOrder.id, customer_name: newOrder.customerName, customer_email: newOrder.customerEmail,
        customer_phone: newOrder.customerPhone, device: newOrder.device, serial_number: newOrder.serialNumber,
        problem: newOrder.problem, value: newOrder.value, status: newOrder.status, created_at: newOrder.createdAt,
      });
      setOrders(prev => [newOrder, ...prev]);
      const n: Notification = { id: Date.now().toString(), title: 'Novo Pedido', message: `Pedido ${newOrder.id} criado para ${newOrder.customerName}.`, type: 'success', timestamp: new Date() };
      setNotifications(prev => [n, ...prev]);
      playNotificationSound(soundEnabled);
    }
    setIsOrderFormOpen(false);
    setEditingOrder(null);
  };

  const handleDeleteOrder = async (id: string) => {
    if (supabase) await supabase.from('orders').delete().eq('id', id);
    setOrders(prev => prev.filter(o => o.id !== id));
    setSelectedOrderId(null);
    const n: Notification = { id: Date.now().toString(), title: 'Pedido Excluído', message: `Pedido #${id} removido.`, type: 'warning', timestamp: new Date() };
    setNotifications(prev => [n, ...prev]);
    playNotificationSound(soundEnabled);
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    if (supabase) await supabase.from('orders').update({ status }).eq('id', id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    const n: Notification = { id: Date.now().toString(), title: 'Status Atualizado', message: `Pedido #${id} avançou de etapa.`, type: 'info', timestamp: new Date() };
    setNotifications(prev => [n, ...prev]);
    playNotificationSound(soundEnabled);
  };

  const handleCalculatorFinish = async (value: number, clientData: { name: string; device: string; problem: string }) => {
    const newOrder: Order = {
      id: generateOrderCode(),
      customerName: clientData.name || 'Cliente Avulso',
      customerEmail: '', customerPhone: '',
      device: clientData.device || 'Dispositivo Orçado',
      serialNumber: 'PENDENTE',
      problem: clientData.problem || 'Serviços da calculadora',
      value, status: currentUser?.role === 'funcionario' ? 'approval' : 'budget', createdAt: new Date().toISOString()
    };
    if (supabase) await supabase.from('orders').insert({
      id: newOrder.id, customer_name: newOrder.customerName, customer_email: newOrder.customerEmail,
      customer_phone: newOrder.customerPhone, device: newOrder.device, serial_number: newOrder.serialNumber,
      problem: newOrder.problem, value: newOrder.value, status: newOrder.status, created_at: newOrder.createdAt,
    });
    setOrders(prev => [newOrder, ...prev]);
    setView('orders');
    setSelectedOrderId(newOrder.id);
    const n: Notification = { id: Date.now().toString(), title: 'Novo Orçamento', message: `Orçamento de R$ ${value.toFixed(2)} gerado.`, type: 'success', timestamp: new Date() };
    setNotifications(prev => [n, ...prev]);
    playNotificationSound(soundEnabled);
  };

  if (!isLoggedIn) return <LoginView onLogin={handleLogin} />;

  const viewTitles: Record<View, string> = {
    login: '', dashboard: 'Dashboard', inventory: 'Estoque Bytex',
    orders: 'Ordem de Serviço', calculator: 'Calculadora', settings: 'Ajustes e Perfil'
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return (
        <DashboardView
          orders={orders}
          inventoryItems={inventoryItems}
          lowStockThreshold={lowStockThreshold}
          onNavigate={(v) => setView(v)}
        />
      );
      case 'inventory': return (
        <InventoryView
          currentUser={currentUser!}
          items={inventoryItems}
          setItems={setInventoryItems}
          lowStockThreshold={lowStockThreshold}
        />
      );
      case 'orders': return (
        <OrderView
          currentUser={currentUser!}
          orders={orders} selectedOrderId={selectedOrderId}
          onSelect={setSelectedOrderId} onBack={() => setSelectedOrderId(null)}
          onUpdateStatus={handleUpdateStatus}
          onAdd={() => { setEditingOrder(null); setIsOrderFormOpen(true); }}
          onEdit={(order) => { setEditingOrder(order); setIsOrderFormOpen(true); }}
          onDelete={handleDeleteOrder}
        />
      );
      case 'calculator': return <CalculatorView onAddOrder={handleCalculatorFinish} />;
      case 'settings': return (
        <SettingsView
          currentUser={currentUser!}
          employees={employees}
          onRefreshEmployees={fetchEmployees}
          onSendNotification={(n) => {
            setNotifications(prev => [n, ...prev]);
            playNotificationSound(soundEnabled);
          }}
          onLogout={() => { setIsLoggedIn(false); setView('login'); }}
          darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)}
          soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled(s => !s)}
          orders={orders}
          lowStockThreshold={lowStockThreshold}
          onChangeLowStock={setLowStockThreshold}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatePresence>
        {notifications.slice(0, 1).map(n => (
          <NotificationToast key={n.id} notification={n} onDismiss={dismissNotification} />
        ))}
        {showNotifications && (
          <NotificationsPanel
            notifications={notifications}
            onMarkAllRead={() => setNotifications([])}
            onClose={() => setShowNotifications(false)}
            onDismiss={dismissNotification}
          />
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center p-4 justify-between max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            {view !== 'dashboard' && (
              <button onClick={() => setView('dashboard')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <BytexIcon className="w-8 h-8" />
              <h1 className="text-xl font-bold tracking-tight">{viewTitles[view]}</h1>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowNotifications(v => !v)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
              <Bell className={cn("w-6 h-6", showNotifications ? 'text-primary' : 'text-slate-500 dark:text-slate-400')} />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-background-dark">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full pb-24">
        {view === 'orders' ? (
          renderView()
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {isOrderFormOpen && (
        <OrderForm
          order={editingOrder || {}}
          onSave={handleSaveOrder}
          onCancel={() => { setIsOrderFormOpen(false); setEditingOrder(null); }}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe shadow-2xl z-50">
        <div className="flex items-center justify-around max-w-2xl mx-auto px-2 py-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'calculator', icon: Calculator, label: 'Orçamento' },
            { id: 'orders', icon: ClipboardList, label: 'Ordens' },
            { id: 'inventory', icon: Package, label: 'Estoque' },
            { id: 'settings', icon: Settings, label: 'Ajustes' },
          ].map((item) => (
            <button key={item.id} onClick={() => setView(item.id as View)}
              className={cn("flex flex-col items-center gap-1 p-2 transition-colors",
                view === item.id ? 'text-primary' : 'text-slate-500 dark:text-slate-400')}>
              <item.icon className={cn("w-6 h-6", view === item.id && 'fill-primary/10')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <style>{`.pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }`}</style>
    </div>
  );
}
