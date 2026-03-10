import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Package, ClipboardList, Calculator, Settings, 
  ChevronRight, LogOut, Smartphone, Laptop, Bell, Search, Plus, User, AlertCircle
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
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
import { NotificationCenterModal } from './components/modals/NotificationCenterModal';
import { SplashScreen } from './components/ui/SplashScreen';
import { Toast, ToastProps } from './components/ui/Toast';

// Types
import { View, Employee, Order, OrderStatus, InventoryItem, ServicePrice, Notification } from './types';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>('login');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [activeToasts, setActiveToasts] = useState<ToastProps[]>([]);
  
  const [showOrderModal, setShowOrderModal] = useState<boolean | Order>(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('bytex_theme');
    return saved ? saved === 'dark' : true; 
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);
  
  const [lowStockThreshold, setLowStockThreshold] = useState(5); 
  const lastBackButtonPress = useRef<number>(0);  
  // Theme management
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bytex_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bytex_theme', 'light');
    }
  }, [darkMode]);
  
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
    
    // 3. Handle splash timeout
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800);

    // 4. Request push notification permissions (FCM)
    setupPushNotifications();

    return () => clearTimeout(timer);
  }, []);

  // Setup FCM Push Notifications
  const setupPushNotifications = async () => {
    try {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') {
        console.warn('Push notification permission not granted');
        return;
      }
      await PushNotifications.register();
    } catch (e) {
      console.error('Push setup error (likely running in browser):', e);
    }
  };

  // Save FCM token to Supabase when received
  const savePushToken = async (token: string, employeeId: string) => {
    if (!supabase) return;
    await supabase.from('push_tokens').upsert(
      { employee_id: employeeId, push_token: token, updated_at: new Date().toISOString() },
      { onConflict: 'employee_id' }
    );
  };

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

  // History management for back button
  useEffect(() => {
    if (currentUser && currentView !== 'login') {
      window.history.pushState({ view: currentView }, '', '');
    }
  }, [currentView, currentUser]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Capacitor Hardware Back Button
    const setupBackButton = async () => {
      const listener = await CapApp.addListener('backButton', ({ canGoBack }) => {
        // 1. Close Modals first
        if (showNotificationsModal) {
          setShowNotificationsModal(false);
          return;
        }
        if (showOrderModal) {
          setShowOrderModal(false);
          return;
        }

        // 2. Navigation Logic
        if (currentView === 'status_tracker') {
          setCurrentView(currentUser ? 'dashboard' : 'login');
          return;
        }

        if (currentView === 'orders' && selectedOrderId) {
          setSelectedOrderId(null);
          return;
        }

        if (currentView !== 'dashboard' && currentUser) {
          setCurrentView('dashboard');
          setSelectedOrderId(null);
          return;
        }

        // 3. Exit App Logic (Only if on Dashboard or Login)
        const now = Date.now();
        if (now - lastBackButtonPress.current < 2000) {
          CapApp.exitApp();
        } else {
          lastBackButtonPress.current = now;
          // Trigger a temporary toast
          const toastId = `exit-${now}`;
          setActiveToasts(prev => [...prev, {
            id: toastId,
            title: "Deseja sair?",
            message: "Pressione novamente para fechar o aplicativo",
            type: 'info',
            onClose: (id) => setActiveToasts(current => current.filter(t => t.id !== id))
          }]);
          
          // Auto close the "Double Tap" hint after 2s
          setTimeout(() => {
            setActiveToasts(current => current.filter(t => t.id !== toastId));
          }, 2000);
        }
      });

      return listener;
    };

    const backButtonListener = setupBackButton();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      backButtonListener.then(l => l.remove());
    };
  }, [currentView, currentUser, selectedOrderId, showOrderModal, showNotificationsModal]);

  // Register push token listeners and bind to logged-in user
  useEffect(() => {
    // Listener for when a new FCM token is received or refreshed
    const tokenListener = PushNotifications.addListener('registration', (token) => {
      if (currentUser) {
        savePushToken(token.value, currentUser.id);
      }
    });

    // Listener for push notification received while app is in foreground
    const foregroundListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
      const notif: Notification = {
        id: notification.id || Date.now().toString(),
        title: notification.title || 'Bytex',
        message: notification.body || '',
        type: 'info',
        timestamp: new Date(),
      };
      setNotifications(prev => [notif, ...prev]);
      // Show in-app toast as well
      const toastId = Math.random().toString(36).substring(7);
      setActiveToasts(prev => [...prev, {
        id: toastId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        onClose: (id) => setActiveToasts(current => current.filter(t => t.id !== id))
      }]);
    });

    // Listener for when user taps a notification (app was in background/closed)
    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const notification = action.notification;
      const notif: Notification = {
        id: notification.id || Date.now().toString(),
        title: notification.title || 'Bytex',
        message: notification.body || '',
        type: 'info',
        timestamp: new Date(),
      };
      setNotifications(prev => [notif, ...prev]);
    });

    return () => {
      tokenListener.then(l => l.remove());
      foregroundListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [currentUser]);

  // Handlers
  const handleLogin = (emp: Employee) => {
    setCurrentUser(emp);
    setCurrentView('dashboard');
    // Re-register to bind the token to the newly logged-in user
    PushNotifications.register().catch(() => {});
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

  // No-op sendNotification kept for prop compatibility (actual send goes through Edge Function)
  const sendNotification = (_n: Notification) => {};

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
    { id: 'calculator', icon: Calculator, label: 'Calculadora' },
  ] as const;

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden w-full relative">
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>
      
      {/* Modals */}
      {showOrderModal !== false && (
        <OrderFormModal 
          order={showOrderModal === true ? undefined : showOrderModal}
          onSave={handleSaveOrder}
          onCancel={() => setShowOrderModal(false)}
        />
      )}      {/* Header */}
      <header className="h-20 px-6 flex items-center justify-between sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50">
        <button 
          onClick={() => { setCurrentView('dashboard'); setSelectedOrderId(null); }}
          className="flex items-center gap-4 hover:opacity-80 transition-opacity active:scale-95"
        >
          <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center p-1 shadow-inner overflow-hidden">
            <img src="/pwa-192x192.png" alt="Bytex Logo" className="size-full object-contain" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Bytex</h1>
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNotificationsModal(true)} 
            className="size-12 flex items-center justify-center rounded-2xl text-slate-400 hover:text-primary active:bg-slate-50 dark:active:bg-slate-800 transition-all relative group"
          >
            <Bell className="size-6 transition-transform group-hover:rotate-12" />
            {notifications.length > 0 && (
              <span className="absolute top-3 right-3 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse" />
            )}
          </button>
          <button 
            onClick={() => { setCurrentView('settings'); setSelectedOrderId(null); }} 
            className={cn(
              "size-12 flex items-center justify-center rounded-2xl transition-all relative group",
              currentView === 'settings' ? "text-primary bg-primary/10" : "text-slate-400 hover:text-primary active:bg-slate-50 dark:active:bg-slate-800"
            )}
          >
            <Settings className="size-6 transition-transform group-hover:rotate-45" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full h-full"
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
                darkMode={darkMode}
                onToggleDark={() => setDarkMode(!darkMode)}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                orders={orders}
                lowStockThreshold={lowStockThreshold}
                onChangeLowStock={setLowStockThreshold}
                servicePrices={servicePrices}
                onSavePrice={handleSavePrice}
                onOpenNotifications={() => setShowNotificationsModal(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-around px-4 pb-safe sticky bottom-0 z-30 shadow-lg">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setSelectedOrderId(null); }}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative px-4",
                isActive ? "text-primary transition-transform" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className={cn(
                "p-2.5 rounded-2xl transition-all duration-300 transform",
                isActive ? "bg-primary text-white shadow-lg shadow-primary/30 -translate-y-1 scale-110" : "bg-transparent"
              )}>
                <item.icon className="size-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                isActive ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-1 h-0 overflow-hidden"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotificationsModal && (
          <NotificationCenterModal 
            notifications={notifications}
            onClose={() => setShowNotificationsModal(false)}
            onClear={() => setNotifications([])}
          />
        )}
      </AnimatePresence>

      {/* Toast Overlay */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {activeToasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast {...toast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
