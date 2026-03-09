import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Package, ClipboardList, Calculator, Settings, 
  ChevronRight, LogOut, Smartphone, Laptop, Bell, Search, Plus
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './components/ui/utils';
import { BytexIcon } from './components/ui/BytexIcon';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';

// Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { OrdersView } from './views/OrdersView';
import { CalculatorView } from './views/CalculatorView';
import { SettingsView } from './views/SettingsView';
import { StatusTrackerView } from './views/StatusTrackerView';

// Modals
import { OrderFormModal } from './components/modals/OrderFormModal';

// Types
import { View, Employee, Order, OrderStatus, InventoryItem, ServicePrice, Notification } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [showOrderModal, setShowOrderModal] = useState<boolean | Order>(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const lowStockThreshold = 5; // Simplified for now, can be moved to settings state
  
  // Consolidated Mount Logic: Routing & Auth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');
    
    // 1. Check for tracking link first
    if (trackId) {
      setCurrentView('status_tracker');
      setSelectedOrderId(trackId);
      return; // Don't proceed to auto-login if tracking
    }

    // 2. Otherwise handle auto-login
    const saved = localStorage.getItem('bytex_remember');
    if (saved) {
      try {
        const emp = JSON.parse(saved);
        setCurrentUser(emp);
        setCurrentView('dashboard');
      } catch (e) { 
        localStorage.removeItem('bytex_remember'); 
      }
    }
  }, []);

  // Data Fetching
  const refreshEmployees = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('employees').select('*');
    if (data) {
      setEmployees(data.map((d: any) => ({
        id: d.id, loginId: d.login_id, password: d.password, name: d.name,
        cpf: d.cpf, phone: d.phone, email: d.email, birthdate: d.birthdate,
        jobTitle: d.job_title, role: d.role, avatarUrl: d.avatar_url
      })));
    }
  };

  const refreshOrders = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) {
      setOrders(data.map((d: any) => ({
        id: d.id, customerName: d.customer_name, customerEmail: d.customer_email,
        customerPhone: d.customer_phone, device: d.device, serialNumber: d.serial_number,
        problem: d.problem, value: d.value, status: d.status, createdAt: d.created_at
      })));
    }
  };

  const refreshInventory = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('inventory_items').select('*').order('name');
    if (data) {
      setInventoryItems(data.map((d: any) => ({
        id: d.id, name: d.name, desc: d.description, stock: d.stock,
        location: d.location, category: d.category, iconKey: d.icon_key
      })));
    }
  };

  const refreshPrices = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('service_prices').select('*').order('category');
    if (data) {
      setServicePrices(data.map((d: any) => ({
        id: d.id, category: d.category, name: d.name, price: Number(d.price)
      })));
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshEmployees();
      refreshOrders();
      refreshInventory();
      refreshPrices();
    }
  }, [currentUser]);

  // Handlers
  const handleLogin = (emp: Employee) => {
    setCurrentUser(emp);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('bytex_remember');
    setCurrentUser(null);
    setCurrentView('login');
  };

  const handleSaveOrder = async (data: Partial<Order>) => {
    if (!supabase) return;
    if (showOrderModal && (showOrderModal as Order).id) {
      // Edit
      const id = (showOrderModal as Order).id;
      await supabase.from('orders').update({
        customer_name: data.customerName, customer_email: data.customerEmail,
        customer_phone: data.customerPhone, device: data.device,
        serial_number: data.serialNumber, problem: data.problem, value: data.value
      }).eq('id', id);
    } else {
      // New
      const newId = `OS-${Math.floor(100000 + Math.random() * 900000)}`;
      await supabase.from('orders').insert({
        id: newId, customer_name: data.customerName, customer_email: data.customerEmail,
        customer_phone: data.customerPhone, device: data.device,
        serial_number: data.serialNumber, problem: data.problem, value: data.value,
        status: 'budget'
      });
    }
    setShowOrderModal(false);
    refreshOrders();
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    if (!supabase) return;
    await supabase.from('orders').update({ status }).eq('id', id);
    refreshOrders();
  };

  const handleDeleteOrder = async (id: string) => {
    if (!supabase || !window.confirm('Excluir esta ordem permanentemente?')) return;
    await supabase.from('orders').delete().eq('id', id);
    setSelectedOrderId(null);
    refreshOrders();
  };

  const handleCalculatorAddOrder = async (val: number, client: { name: string; device: string; problem: string }) => {
    if (!supabase) return;
    const newId = `OS-${Math.floor(100000 + Math.random() * 900000)}`;
    await supabase.from('orders').insert({
      id: newId, customer_name: client.name, device: client.device, problem: client.problem,
      value: val, status: 'budget'
    });
    refreshOrders();
    setCurrentView('orders');
    setSelectedOrderId(newId);
  };

  const handleSavePrice = async (id: string, price: number) => {
    if (!supabase) return;
    await supabase.from('service_prices').update({ price }).eq('id', id);
    refreshPrices();
  };

  const sendNotification = (n: Notification) => {
    setNotifications(prev => [n, ...prev]);
    // In a real app, this would also push to Supabase realtime or a table
  };

  // Rendering logic
  if (currentView === 'status_tracker') {
    return <StatusTrackerView orderId={selectedOrderId || undefined} onBack={() => {
      window.history.replaceState({}, '', window.location.pathname);
      setCurrentView(currentUser ? 'dashboard' : 'login');
    }} />;
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
    { id: 'inventory', icon: Package, label: 'Estoque' },
    { id: 'orders', icon: ClipboardList, label: 'Ordens' },
    { id: 'calculator', icon: Calculator, label: 'Orçador' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Modals */}
      {showOrderModal !== false && (
        <OrderFormModal 
          order={showOrderModal === true ? undefined : showOrderModal}
          onSave={handleSaveOrder}
          onCancel={() => setShowOrderModal(false)}
        />
      )}

      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <BytexIcon className="size-8" />
          <h1 className="text-xl font-black tracking-tight text-primary">Bytex</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-slate-400 hover:text-primary transition-colors">
            <Bell className="size-6" />
            {notifications.length > 0 && <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />}
          </button>
          <div 
            onClick={() => setCurrentView('settings')}
            className="size-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden cursor-pointer"
          >
            {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover" /> : <Settings className="size-5 text-primary" />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {currentView === 'dashboard' && (
              <DashboardView 
                orders={orders} 
                inventoryItems={inventoryItems} 
                lowStockThreshold={lowStockThreshold} 
                onNavigate={(v) => setCurrentView(v as View)} 
              />
            )}
            {currentView === 'inventory' && (
              <InventoryView 
                currentUser={currentUser} 
                items={inventoryItems} 
                setItems={setInventoryItems} 
                lowStockThreshold={lowStockThreshold} 
              />
            )}
            {currentView === 'orders' && (
              <OrdersView 
                currentUser={currentUser} 
                orders={orders} 
                selectedOrderId={selectedOrderId}
                onSelect={setSelectedOrderId}
                onBack={() => setSelectedOrderId(null)}
                onUpdateStatus={handleUpdateOrderStatus}
                onAdd={() => setShowOrderModal(true)}
                onEdit={(o) => setShowOrderModal(o)}
                onDelete={handleDeleteOrder}
              />
            )}
            {currentView === 'calculator' && (
              <CalculatorView 
                prices={servicePrices} 
                onAddOrder={handleCalculatorAddOrder} 
              />
            )}
            {currentView === 'settings' && (
              <SettingsView 
                currentUser={currentUser}
                employees={employees}
                onRefreshEmployees={refreshEmployees}
                onSendNotification={sendNotification}
                onLogout={handleLogout}
                darkMode={true} // Add logic if needed
                onToggleDark={() => {}}
                soundEnabled={true}
                onToggleSound={() => {}}
                orders={orders}
                lowStockThreshold={lowStockThreshold}
                onChangeLowStock={() => {}}
                servicePrices={servicePrices}
                onSavePrice={handleSavePrice}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 pb-safe sticky bottom-0 z-30">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setSelectedOrderId(null); }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive ? "bg-primary/10" : "bg-transparent"
              )}>
                <item.icon className="size-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn("text-[10px] font-bold uppercase tracking-tighter", isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
