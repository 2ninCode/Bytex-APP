import React, { useState } from 'react';
import { CreditCard, BarChart3, CheckCircle2, User, ShieldCheck, Moon, Bell, Globe, Info, LogOut, Crown, Shield, Edit2, Users, Send, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '../ui/utils';
import { Employee, Order, Notification, ServicePrice } from '../types';
import { PriceTableModal } from '../components/modals/PriceTableModal';
import { SalesReportModal } from '../components/modals/SalesReportModal';
import { ServiceHistoryModal } from '../components/modals/ServiceHistoryModal';
import { EmployeeManagementModal } from '../components/modals/EmployeeManagementModal';
import { SendNotificationModal } from '../components/modals/SendNotificationModal';

export const SettingsView = ({
  currentUser, employees, onRefreshEmployees, onSendNotification, onLogout,
  darkMode, onToggleDark, soundEnabled, onToggleSound, orders,
  lowStockThreshold, onChangeLowStock, servicePrices, onSavePrice
}: {
  currentUser: Employee, employees: Employee[], onRefreshEmployees: () => void, onSendNotification: (n: Notification) => void,
  onLogout: () => void, darkMode: boolean, onToggleDark: () => void,
  soundEnabled: boolean, onToggleSound: () => void, orders: Order[],
  lowStockThreshold: number, onChangeLowStock: (v: number) => void,
  servicePrices: ServicePrice[], onSavePrice: (id: string, price: number) => void
}) => {
  const [showPriceTable, setShowPriceTable] = useState(false);
  const [showSalesReport, setShowSalesReport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

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
        { icon: Info, label: "Sobre a Bytex", desc: "" },
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
      {showPriceTable && <PriceTableModal prices={servicePrices} onSave={onSavePrice} onClose={() => setShowPriceTable(false)} />}
      {showSalesReport && <SalesReportModal orders={orders} onClose={() => setShowSalesReport(false)} />}
      {showHistory && <ServiceHistoryModal orders={orders} onClose={() => setShowHistory(false)} />}
      {showEmployeeModal && <EmployeeManagementModal employees={employees} onClose={() => setShowEmployeeModal(false)} onRefresh={onRefreshEmployees} />}
      {showNotifModal && <SendNotificationModal onClose={() => setShowNotifModal(false)} onSend={(n) => { onSendNotification(n); setShowNotifModal(false); }} />}

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
            <p className="text-slate-500 font-medium">{currentUser.jobTitle || 'Sem função'} • Bytex</p>
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
                  {(item as any).action && !(item as any).danger && !(item as any).isToggle && (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                  {(item as any).isToggle && (
                     <div className={cn("w-12 h-6 rounded-full relative transition-colors bg-slate-200 dark:bg-slate-700", (item as any).toggleVal && 'bg-primary')}>
                       <div className={cn("absolute top-1 left-1 size-4 rounded-full bg-white transition-all transform", (item as any).toggleVal && 'translate-x-6')} />
                     </div>
                  )}
                </div>
              ))}
              {section.lowStockConfig && (
                <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-orange-800 dark:text-orange-400">Alerta de Estoque Baixo</p>
                    <p className="text-xs text-slate-500">Avisar quando houver menos de:</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" value={lowStockThreshold} onChange={e => onChangeLowStock(parseInt(e.target.value) || 0)}
                      className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-10 px-3 text-center font-bold outline-none focus:ring-2 focus:ring-primary" />
                    <span className="text-sm font-medium text-slate-500">itens</span>
                  </div>
                </div>
              )}
            </Card>
          </section>
        ))}
      </div>
    </>
  );
};
