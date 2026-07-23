export type View = 'login' | 'dashboard' | 'inventory' | 'orders' | 'calculator' | 'settings' | 'status_tracker';

export type OrderStatus = 'budget' | 'approval' | 'in_progress' | 'ready' | 'finished';

export type Role = 'admin' | 'gestor' | 'funcionario';

export type ChecklistStatus = 'bom' | 'ruim' | 'nao_testado';

export interface ChecklistItem {
  status: ChecklistStatus;
  note?: string;
}

export interface Checklist {
  // ── Hardware ───────────────────────────────────
  ram?:         ChecklistItem;
  hd?:          ChecklistItem;
  cpu?:         ChecklistItem;
  gpu?:         ChecklistItem;
  motherboard?: ChecklistItem;
  psu?:         ChecklistItem;
  display?:     ChecklistItem;
  cooling?:     ChecklistItem;
  battery?:     ChecklistItem;
  ports?:       ChecklistItem;
  audio?:       ChecklistItem;
  network?:     ChecklistItem;
  keyboard?:    ChecklistItem;
  // ── Software & Testes ──────────────────────────
  os_boot?:     ChecklistItem;
  drivers?:     ChecklistItem;
  antivirus?:   ChecklistItem;
  stress_test?: ChecklistItem;
  clean_disk?:  ChecklistItem;
}

export interface BudgetItem {
  id:    string;
  name:  string;
  link:  string;
  price: number;
}

export interface MediaFile {
  url:  string;
  type: 'image' | 'video';
  name: string;
}

export interface Employee {
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

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customerCode: string;
  createdAt: string;
}

export interface CustomerDevice {
  id:           string;
  customerId:   string;
  name:         string;
  serialNumber: string;
  specs:        Record<string, string>;
  notes:        string;
  createdAt:    string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId?: string;
  customer?: Customer;
  device: string;
  serialNumber: string;
  problem: string;
  // ── Novos campos V4 ──────────────────────────
  observationClient?: string;       // Visível ao cliente no link de rastreio
  technicalReport?: string;         // Privado — apenas funcionários
  responsibleEmployeeId?: string;   // Técnico responsável
  deviceId?: string;                // Vínculo com customer_devices
  mediaUrls?: MediaFile[];          // Fotos e vídeos
  budgetItems?: BudgetItem[];       // Orçamento com links
  checklist?: Partial<Checklist>;   // Saúde das peças
  // ─────────────────────────────────────────────
  value: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: Date;
  targetEmployeeId?: string;
  orderId?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  desc: string;
  stock: number;
  location: string;
  category: string;
  iconKey: 'cpu' | 'database' | 'router' | 'cable' | 'flask' | 'package';
}

export interface ServicePrice {
  id: string;
  category: string;
  name: string;
  price: number;
  priceGamer: number;
}
