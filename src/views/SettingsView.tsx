import React, { useState } from 'react';
import { 
  CreditCard, BarChart3, CheckCircle2, User, ShieldCheck, 
  Moon, Bell, Globe, Info, LogOut, Crown, Shield, 
  Edit2, Users, Send, ChevronRight, HelpCircle, Laptop, Smartphone
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { cn } from '../components/ui/utils';
import { Employee, Order, Notification, ServicePrice } from '../types';
import { PriceTableModal } from '../components/modals/PriceTableModal';
import { SalesReportModal } from '../components/modals/SalesReportModal';
import { ServiceHistoryModal } from '../components/modals/ServiceHistoryModal';
import { EmployeeManagementModal } from '../components/modals/EmployeeManagementModal';
import { SendNotificationModal } from '../components/modals/SendNotificationModal';

export const SettingsView = ({
  currentUser, employees, onRefreshEmployees, onSendNotification, onLogout,
  darkMode, onToggleDark, soundEnabled, onToggleSound, orders,
  lowStockThreshold, onChangeLowStock, servicePrices, onSavePrice,
  onOpenNotifications, onDeleteOrder
}: {
  currentUser: Employee, employees: Employee[], onRefreshEmployees: () => void, onSendNotification: (n: Notification) => void,
  onLogout: () => void, darkMode: boolean, onToggleDark: () => void,
  soundEnabled: boolean, onToggleSound: () => void, orders: Order[],
  lowStockThreshold: number, onChangeLowStock: (v: number) => void,
  servicePrices: ServicePrice[], onSavePrice: (id: string, price: number) => void,
  onOpenNotifications?: () => void,
  onDeleteOrder: (id: string) => Promise<void>
}) => {
  const [showPriceTable, setShowPriceTable] = useState(false);
  const [showSalesReport, setShowSalesReport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [localLowStock, setLocalLowStock] = useState(lowStockThreshold.toString());

  const handleSaveStockThreshold = () => {
    const val = parseInt(localLowStock) || 0;
    onChangeLowStock(val);
  };

  const sections = [
    {
      title: "Administração",
      show: currentUser.role === 'admin',
      items: [
        { icon: Users, label: "Gestão de Funcionários", desc: "Equipe e acessos", action: () => setShowEmployeeModal(true) },
        { icon: Send, label: "Avisos da Equipe", desc: "Notificar todos", action: () => setShowNotifModal(true) },
      ]
    },
    {
      title: "Gestão de Negócios",
      show: true,
      items: [
        { icon: CreditCard, label: "Tabela de Preços", desc: "Valores dos serviços", highlight: true, action: () => setShowPriceTable(true) },
        { icon: BarChart3, label: "Relatórios de Vendas", desc: "Resumo financeiro", action: () => setShowSalesReport(true), hide: currentUser.role === 'funcionario' },
        { icon: CheckCircle2, label: "Histórico de Serviços", desc: "Ordens concluídas", action: () => setShowHistory(true) },
      ].filter(i => !i.hide)
    },
    {
      title: "Configurações do App",
      show: true,
      isSettings: true,
      items: [
        { icon: Moon, label: "Modo Escuro", desc: "Interface noturna", isToggle: true, toggleVal: darkMode, action: onToggleDark },
        { icon: Bell, label: "Ver Notificações", desc: "Histórico de avisos", action: onOpenNotifications },
        { icon: Bell, label: "Sons do Sistema", desc: "Alertas sonoros", isToggle: true, toggleVal: soundEnabled, action: onToggleSound },
      ],
      lowStockConfig: true
    },
    {
      title: "Suporte e Sistema",
      show: true,
      items: [
        { icon: HelpCircle, label: "Suporte Bytex", desc: "Precisa de ajuda?" },
        { icon: Info, label: "Versão do App", desc: "V3.1" },
        { icon: LogOut, label: "Sair da Conta", desc: "Encerrar sessão", danger: true, action: onLogout },
      ]
    }
  ].filter(s => s.show);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {showPriceTable && <PriceTableModal prices={servicePrices} onSave={onSavePrice} onClose={() => setShowPriceTable(false)} />}
      {showSalesReport && <SalesReportModal orders={orders} onDeleteOrder={onDeleteOrder} onClose={() => setShowSalesReport(false)} />}
      {showHistory && <ServiceHistoryModal orders={orders} onClose={() => setShowHistory(false)} />}
      {showEmployeeModal && <EmployeeManagementModal employees={employees} onClose={() => setShowEmployeeModal(false)} onRefresh={onRefreshEmployees} />}
      {showNotifModal && <SendNotificationModal employees={employees} onClose={() => setShowNotifModal(false)} onSend={(n) => { onSendNotification(n); setShowNotifModal(false); }} />}

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto">
          <div className="pt-2">
            <h2 className="text-2xl font-black tracking-tight">Ajustes</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Gerencie o sistema e seu perfil</p>
          </div>

          {/* Profile Card */}
          <Card className="p-6 flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="size-24 rotate-12" />
            </div>
            <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden shadow-inner relative z-10">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} className="w-full h-full object-cover" />
              ) : (
                <User className="size-10 text-primary opacity-60" />
              )}
            </div>
            <div className="flex-1 min-w-0 relative z-10">
              <h4 className="text-xl font-black truncate">{currentUser.name}</h4>
              <p className="text-sm text-slate-500 font-bold truncate mb-3">{currentUser.jobTitle || 'Técnico Especialista'}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                {currentUser.role === 'admin' ? <Crown className="size-3" /> : <Shield className="size-3" />}
                {currentUser.role === 'admin' ? 'Administrador' : 'Membro da Equipe'}
              </div>
            </div>
          </Card>

          {sections.map((section, i) => (
            <section key={i} className="space-y-4">
              <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase px-1">{section.title}</h3>
              <Card className="overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {section.items.map((item, j) => (
                  <div 
                    key={j} 
                    onClick={item.action}
                    className={cn(
                      "flex items-center justify-between p-5 transition-all text-left w-full group",
                      item.action && !item.isToggle ? "cursor-pointer active:bg-slate-50 dark:active:bg-slate-800" : "",
                      item.highlight ? "bg-primary/[0.02]" : ""
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "size-12 rounded-xl flex items-center justify-center transition-all shadow-sm",
                        item.highlight ? "bg-primary text-white" : 
                        item.danger ? "bg-red-50 dark:bg-red-950/20 text-red-500" :
                        "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}>
                        <item.icon className="size-6" />
                      </div>
                      <div>
                        <p className={cn("font-bold text-base", item.danger ? "text-red-500" : item.highlight ? "text-primary" : "")}>{item.label}</p>
                        <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                      </div>
                    </div>
                    
                    {item.isToggle ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); item.action?.(); }}
                        className={cn(
                          "w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner shrink-0",
                          item.toggleVal ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "size-6 bg-white rounded-full shadow-lg absolute top-1 transition-all duration-300",
                          item.toggleVal ? "translate-x-7" : "translate-x-1"
                        )} />
                      </button>
                    ) : item.action ? (
                      <ChevronRight className="size-5 text-slate-300 group-hover:text-primary transition-colors" />
                    ) : null}
                  </div>
                ))}
                
                {section.lowStockConfig && (
                  <div className="p-6 bg-amber-50/30 dark:bg-amber-900/10 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-black text-amber-700 dark:text-amber-400">Alerta de Estoque</p>
                        <p className="text-xs text-slate-500 font-medium">Avisar com disponibilidade menor que:</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <input 
                          type="text"
                          inputMode="numeric"
                          value={localLowStock} 
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setLocalLowStock(val);
                          }}
                          className="w-16 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-900/40 rounded-xl h-12 text-center font-black text-amber-700 dark:text-amber-400 outline-none focus:ring-2 focus:ring-amber-500" 
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">unid.</span>
                      </div>
                    </div>
                    <Button onClick={handleSaveStockThreshold} className="w-full bg-amber-500 hover:bg-amber-600 shadow-amber-200/50" size="sm">
                      Salvar Alerta
                    </Button>
                  </div>
                )}
              </Card>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
