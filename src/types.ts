export type View = 'login' | 'dashboard' | 'inventory' | 'orders' | 'calculator' | 'settings' | 'status_tracker';

export type OrderStatus = 'budget' | 'approval' | 'in_progress' | 'ready' | 'finished';

export type Role = 'admin' | 'gestor' | 'funcionario';

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

export interface Order {
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

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: Date;
  targetEmployeeId?: string;
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
}
