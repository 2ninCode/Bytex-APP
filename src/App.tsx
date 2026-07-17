import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Package, ClipboardList, Calculator, Settings,
  Bell, X
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './lib/supabase';
import { cn } from './components/ui/utils';

// Hooks
import { useSupabaseData } from './hooks/useSupabaseData';
import { usePresence } from './hooks/usePresence';
import { useNotifications } from './hooks/useNotifications';

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
import { OfflineBanner } from './components/ui/OfflineBanner';

// Types
import { View, Employee, Order, OrderStatus, Notification, Role } from './types';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>('login');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState<boolean | Order>(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('bytex_theme');
    return saved ? saved === 'dark' : true;
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastBackButtonPress = useRef<number>(0);

  // Custom Hooks
  const {
    employees, orders, inventoryItems, servicePrices, customerDevices,
    lowStockThreshold,
    setInventoryItems, refreshEmployees, refreshOrders, refreshPrices,
  } = useSupabaseData(currentUser);

  const { onlineEmployees } = usePresence(currentUser);

  const navigateTo = (view: View, params?: { orderId?: string | null }) => {
    window.history.pushState(null, '', window.location.href);
    setCurrentView(view);
    if (params !== undefined && 'orderId' in params) {
      setSelectedOrderId(params.orderId || null);
    }
  };

  const {
    notifications, activeToasts,
    setNotifications, setActiveToasts,
    setupPushNotifications,
  } = useNotifications(currentUser, navigateTo);

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

  // Mount: Routing & Session Restore (SEM delay desnecessário)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');

    if (trackId) {
      setCurrentView('status_tracker');
      setSelectedOrderId(trackId);
      setShowSplash(false);
      return;
    }

    const checkSession = async () => {
      if (!supabase) { setShowSplash(false); return; }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const { data: profile } = await supabase
            .from('employees')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) {
            const mappedEmp: Employee = {
              id: profile.id,
              loginId: profile.login_id,
              password: '',
              name: profile.name,
              cpf: profile.cpf || '',
              phone: profile.phone || '',
              email: profile.email || '',
              birthdate: profile.birthdate || '',
              jobTitle: profile.job_title || '',
              role: profile.role as Role,
              avatarUrl: profile.avatar_url || '',
            };
            setCurrentUser(mappedEmp);
            setCurrentView('dashboard');
            setupPushNotifications();
          }
        }
      } catch (e) {
        console.error('Session restore error:', e);
      } finally {
        setShowSplash(false);
      }
    };

    // Pequeno delay apenas para a splash ter tempo de renderizar
    const timer = setTimeout(() => { checkSession(); }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Back button handling (Browser & Capacitor)
  useEffect(() => {
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      if (showNotificationsModal) { setShowNotificationsModal(false); }
      else if (showOrderModal) { setShowOrderModal(false); }
      else if (currentView === 'status_tracker') { setCurrentView(currentUser ? 'dashboard' : 'login'); }
      else if (currentView === 'orders' && selectedOrderId) { setSelectedOrderId(null); }
      else if (currentView !== 'dashboard' && currentView !== 'login' && currentUser) {
        setCurrentView('dashboard'); setSelectedOrderId(null);
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    const setupBackButton = async () => {
      const listener = await CapApp.addListener('backButton', () => {
        if (showNotificationsModal) { setShowNotificationsModal(false); return; }
        if (showOrderModal) { setShowOrderModal(false); return; }
        if (currentView === 'status_tracker') { setCurrentView(currentUser ? 'dashboard' : 'login'); return; }
        if (currentView === 'orders' && selectedOrderId) { setSelectedOrderId(null); return; }
        if (currentView !== 'dashboard' && currentUser) { setCurrentView('dashboard'); setSelectedOrderId(null); return; }

        const now = Date.now();
        if (now - lastBackButtonPress.current < 2000) {
          CapApp.exitApp();
        } else {
          lastBackButtonPress.current = now;
          const toastId = `exit-${now}`;
          setActiveToasts(prev => [...prev, {
            id: toastId,
            title: 'Deseja sair?',
            message: 'Pressione novamente para fechar o aplicativo',
            type: 'info',
            onClose: (id) => setActiveToasts(c => c.filter(t => t.id !== id))
          }]);
          setTimeout(() => setActiveToasts(c => c.filter(t => t.id !== toastId)), 2000);
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

  // Handlers
  const handleLogin = (emp: Employee) => {
    setCurrentUser(emp);
    setCurrentView('dashboard');
    PushNotifications.register().catch(() => {});
  };

  const handleLogout = async () => {
    localStorage.removeItem('bytex_remember');
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentView('login');
  };

  const sendAutomatedNotification = async (
    title: string, message: string,
    type: 'success' | 'info' | 'warning',
    targetId: string | null = null,
    orderId: string | null = null
  ) => {
    if (!supabase) return;
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ title, message, type, targetEmployeeId: targetId, orderId }),
      });
    } catch (e) { console.error('Automated push error:', e); }
  };

  const handleSaveOrder = async (data: Partial<Order>) => {
    if (!supabase) return;
    const payload = {
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone,
      customer_id: data.customerId,
      device: data.device,
      serial_number: data.serialNumber,
      problem: data.problem,
      value: data.value,
      // Novos campos V4
      responsible_employee_id: data.responsibleEmployeeId || null,
      device_id: data.deviceId || null,
      observation_client: data.observationClient || null,
      technical_report: data.technicalReport || null,
      media_urls: data.mediaUrls || [],
      budget_items: data.budgetItems || [],
      checklist: data.checklist || {},
    };

    if (showOrderModal && (showOrderModal as Order).id) {
      const id = (showOrderModal as Order).id;
      await supabase.from('orders').update(payload).eq('id', id);
      sendAutomatedNotification('Ordem Atualizada', `A ordem #${id} foi atualizada.`, 'info', null, id);
    } else {
      const newId = `OS-${Math.floor(100000 + Math.random() * 900000)}`;
      await supabase.from('orders').insert({ id: newId, ...payload, status: 'budget' });
      sendAutomatedNotification('Nova Ordem de Serviço', `Equipamento ${data.device} de ${data.customerName}`, 'info', null, newId);
    }
    setShowOrderModal(false);
    refreshOrders();
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    if (!supabase) return;
    await supabase.from('orders').update({ status }).eq('id', id);
    refreshOrders();
    const statusMap: Record<OrderStatus, string> = {
      budget: 'Orçamento', approval: 'Aguardando Aprovação',
      in_progress: 'Em Reparo', ready: 'Pronto para Entrega', finished: 'Finalizado'
    };
    sendAutomatedNotification('Status Atualizado', `A ordem #${id} avançou para ${statusMap[status]}!`, 'success', null, id);
  };

  const handleDeleteOrder = async (id: string) => {
    if (!supabase) return;
    await supabase.from('orders').delete().eq('id', id);
    setSelectedOrderId(null);
    refreshOrders();
  };

  const handleCalculatorAddOrder = async (orderData: Partial<Order>) => {
    if (!supabase) return;
    const newId = `OS-${Math.floor(100000 + Math.random() * 900000)}`;
    await supabase.from('orders').insert({
      id: newId, customer_name: orderData.customerName, customer_id: orderData.customerId,
      device: orderData.device, problem: orderData.problem,
      value: orderData.value, status: 'budget'
    });
    sendAutomatedNotification('Nova Ordem via Calculadora', `Equipamento ${orderData.device} de ${orderData.customerName}`, 'info', null, newId);
    refreshOrders();
    navigateTo('orders', { orderId: newId });
  };

  const handleSavePrice = async (id: string, price: number, field: 'price' | 'price_gamer' = 'price') => {
    if (!supabase) return;
    await supabase.from('service_prices').update({ [field]: price }).eq('id', id);
    refreshPrices();
  };

  const handleSaveLowStockThreshold = async (val: number) => {
    if (!supabase) return;
    await supabase.from('settings').upsert({ key: 'low_stock_threshold', value: val, updated_at: new Date().toISOString() });
  };

  const sendNotification = (_n: Notification) => {};

  // ── Render ──────────────────────────────────────────────
  if (currentView === 'status_tracker') {
    return (
      <StatusTrackerView orderId={selectedOrderId || undefined} onBack={() => {
        window.history.replaceState({}, '', window.location.pathname);
        setCurrentView(currentUser ? 'dashboard' : 'login');
      }} />
    );
  }

  if (!currentUser) {
    return (
      <>
        <AnimatePresence>{showSplash && <SplashScreen />}</AnimatePresence>
        {!showSplash && <LoginView onLogin={handleLogin} />}
      </>
    );
  }

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
    { id: 'inventory', icon: Package, label: 'Estoque' },
    { id: 'orders', icon: ClipboardList, label: 'Ordens' },
    { id: 'calculator', icon: Calculator, label: 'Calculadora' },
  ] as const;

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden w-full relative">
      <OfflineBanner />
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      {/* Order Modal */}
      {showOrderModal !== false && (
        <OrderFormModal
          order={showOrderModal === true ? undefined : showOrderModal}
          onSave={handleSaveOrder}
          onCancel={() => setShowOrderModal(false)}
          currentUser={currentUser}
          employees={employees}
          customerDevices={customerDevices}
        />
      )}

      {/* Header */}
      {!(currentView === 'orders' && selectedOrderId) && (
        <header className="h-16 px-6 flex items-center justify-between sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50">
          <button
            onClick={() => { setCurrentView('dashboard'); setSelectedOrderId(null); }}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity active:scale-95"
          >
            <div className="size-8 bg-primary/10 rounded-xl flex items-center justify-center p-1 shadow-inner overflow-hidden">
              <img src="/pwa-192x192.png" alt="Bytex Logo" className="size-full object-contain" />
            </div>
            <h1 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">Bytex</h1>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotificationsModal(true)}
              className="size-10 flex items-center justify-center rounded-2xl text-slate-400 hover:text-primary active:bg-slate-50 dark:active:bg-slate-800 transition-all relative group"
            >
              <Bell className="size-6 transition-transform group-hover:rotate-12" />
              {notifications.length > 0 && (
                <span className="absolute top-3 right-3 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse" />
              )}
            </button>
            <button
              onClick={() => { setCurrentView('settings'); setSelectedOrderId(null); }}
              className={cn(
                'size-10 flex items-center justify-center rounded-2xl transition-all relative group',
                currentView === 'settings' ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-primary active:bg-slate-50 dark:active:bg-slate-800'
              )}
            >
              <Settings className="size-6 transition-transform group-hover:rotate-45" />
            </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-900 pb-safe relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex-1 flex flex-col min-h-0"
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
                employees={employees}
                selectedOrderId={selectedOrderId}
                onSelect={(id) => navigateTo('orders', { orderId: id })}
                onBack={() => navigateTo('orders', { orderId: null })}
                onUpdateStatus={handleUpdateOrderStatus}
                onAdd={() => setShowOrderModal(true)}
                onEdit={(o) => setShowOrderModal(o)}
                onDelete={handleDeleteOrder}
                onTrack={(id) => navigateTo('status_tracker', { orderId: id })}
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
                onlineEmployees={onlineEmployees}
                onRefreshEmployees={refreshEmployees}
                onSendNotification={sendNotification}
                onLogout={handleLogout}
                darkMode={darkMode}
                onToggleDark={() => setDarkMode(!darkMode)}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                orders={orders}
                lowStockThreshold={lowStockThreshold}
                onChangeLowStock={handleSaveLowStockThreshold}
                servicePrices={servicePrices}
                onSavePrice={handleSavePrice}
                onRefreshPrices={refreshPrices}
                onOpenNotifications={() => setShowNotificationsModal(true)}
                onDeleteOrder={handleDeleteOrder}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-around px-4 pb-safe sticky bottom-0 z-30 shadow-lg">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setSelectedOrderId(null); }}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative px-4',
                isActive ? 'text-primary transition-transform' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <div className={cn(
                'p-2 rounded-2xl transition-all duration-300 transform',
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/30 -translate-y-1 scale-110' : 'bg-transparent'
              )}>
                <item.icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                'text-[9px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap',
                isActive ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-1 h-0 overflow-hidden'
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
            onNotificationClick={(orderId, notifId) => {
              if (orderId) navigateTo('orders', { orderId });
              if (notifId) setNotifications(prev => prev.filter(n => n.id !== notifId));
            }}
          />
        )}
      </AnimatePresence>

      {/* Toast Overlay */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {activeToasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.3 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-4 rounded-xl shadow-lg min-w-[280px] max-w-[360px] flex items-start gap-3 relative overflow-hidden"
              >
                <div className="flex items-center gap-3 w-full">
                  <div
                    className={cn('flex-1 mb-1 cursor-pointer', toast.orderId ? 'hover:underline decoration-white/50' : '')}
                    onClick={() => {
                      if (toast.orderId) {
                        navigateTo('orders', { orderId: toast.orderId });
                        if (toast.notifId) setNotifications(prev => prev.filter(n => n.id !== toast.notifId));
                        toast.onClose(toast.id);
                      }
                    }}
                  >
                    <h4 className="font-bold text-white text-sm">{toast.title}</h4>
                    <p className="text-white/80 text-xs line-clamp-2 leading-relaxed">{toast.message}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toast.onClose(toast.id); }}
                    className="text-white/50 hover:text-white transition-colors shrink-0"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
