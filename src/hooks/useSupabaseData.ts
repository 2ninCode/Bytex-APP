import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Order, InventoryItem, ServicePrice, Employee, CustomerDevice } from '../types';

// ── Mapping Helpers ──────────────────────────────────────────────

const mapOrder = (d: any): Order => ({
  id: d.id,
  customerName: d.customer_name,
  customerEmail: d.customer_email || '',
  customerPhone: d.customer_phone || '',
  customerId: d.customer_id,
  customer: d.customer ? {
    id: d.customer.id,
    name: d.customer.name,
    email: d.customer.email || '',
    phone: d.customer.phone || '',
    address: d.customer.address || '',
    customerCode: d.customer.customer_code,
    createdAt: d.customer.created_at
  } : undefined,
  device: d.device,
  serialNumber: d.serial_number || '',
  problem: d.problem,
  observationClient: d.observation_client || '',
  technicalReport: d.technical_report || '',
  responsibleEmployeeId: d.responsible_employee_id || undefined,
  deviceId: d.device_id || undefined,
  mediaUrls: d.media_urls || [],
  budgetItems: d.budget_items || [],
  checklist: d.checklist || {},
  value: d.value,
  status: d.status,
  createdAt: d.created_at,
});

const mapInventory = (d: any): InventoryItem => ({
  id: d.id, name: d.name, desc: d.description, stock: d.stock,
  location: d.location, category: d.category, iconKey: d.icon_key
});

const mapDevice = (d: any): CustomerDevice => ({
  id: d.id,
  customerId: d.customer_id,
  name: d.name,
  serialNumber: d.serial_number || '',
  specs: d.specs || {},
  notes: d.notes || '',
  createdAt: d.created_at,
});

// ── Fetch Functions ──────────────────────────────────────────────

const fetchEmployees = async (): Promise<Employee[]> => {
  if (!supabase) return [];
  const { data } = await supabase.from('employees').select('*');
  return (data ?? []).map((d: any) => ({
    id: d.id, loginId: d.login_id, password: '', name: d.name,
    cpf: d.cpf, phone: d.phone, email: d.email, birthdate: d.birthdate,
    jobTitle: d.job_title, role: d.role, avatarUrl: d.avatar_url
  }));
};

const fetchOrders = async (): Promise<Order[]> => {
  if (!supabase) return [];
  const { data } = await supabase
    .from('orders')
    .select('*, customer:customers(*)')
    .order('created_at', { ascending: false });
  return (data ?? []).map(mapOrder);
};

const fetchInventory = async (): Promise<InventoryItem[]> => {
  if (!supabase) return [];
  const { data } = await supabase.from('inventory_items').select('*').order('name');
  return (data ?? []).map(mapInventory);
};

const fetchPrices = async (): Promise<ServicePrice[]> => {
  if (!supabase) return [];
  const { data } = await supabase.from('service_prices').select('*').order('category');
  return (data ?? []).map((d: any) => ({
    id: d.id, category: d.category, name: d.name,
    price: Number(d.price), priceGamer: Number(d.price_gamer ?? 0)
  }));
};

const fetchCustomerDevices = async (): Promise<CustomerDevice[]> => {
  if (!supabase) return [];
  const { data } = await supabase.from('customer_devices').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapDevice);
};

const fetchLowStockThreshold = async (): Promise<number> => {
  if (!supabase) return 5;
  const { data } = await supabase.from('settings').select('value').eq('key', 'low_stock_threshold').single();
  return data ? Number(data.value) : 5;
};

// ── Hook ─────────────────────────────────────────────────────────

export const useSupabaseData = (currentUser: Employee | null) => {
  const qc = useQueryClient();
  const enabled = !!currentUser;

  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
    enabled,
  });

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    enabled,
  });

  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
    enabled,
  });

  const pricesQuery = useQuery({
    queryKey: ['prices'],
    queryFn: fetchPrices,
    enabled,
  });

  const devicesQuery = useQuery({
    queryKey: ['customer_devices'],
    queryFn: fetchCustomerDevices,
    enabled,
  });

  const settingsQuery = useQuery({
    queryKey: ['settings_low_stock'],
    queryFn: fetchLowStockThreshold,
    enabled,
    staleTime: 30_000,
  });

  // ── Supabase Realtime Subscriptions ─────────────────────────
  useEffect(() => {
    if (!currentUser || !supabase) return;

    const orderSub = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        qc.invalidateQueries({ queryKey: ['orders'] });
      })
      .subscribe();

    const inventorySub = supabase
      .channel('public:inventory_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
        qc.invalidateQueries({ queryKey: ['inventory'] });
      })
      .subscribe();

    const devicesSub = supabase
      .channel('public:customer_devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_devices' }, () => {
        qc.invalidateQueries({ queryKey: ['customer_devices'] });
      })
      .subscribe();

    const settingsSub = supabase
      .channel('public:settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        qc.invalidateQueries({ queryKey: ['settings_low_stock'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderSub);
      supabase.removeChannel(inventorySub);
      supabase.removeChannel(devicesSub);
      supabase.removeChannel(settingsSub);
    };
  }, [currentUser, qc]);

  // ── Refresh Helpers ──────────────────────────────────────────
  const refreshEmployees  = () => qc.invalidateQueries({ queryKey: ['employees'] });
  const refreshOrders     = () => qc.invalidateQueries({ queryKey: ['orders'] });
  const refreshInventory  = () => qc.invalidateQueries({ queryKey: ['inventory'] });
  const refreshPrices     = () => qc.invalidateQueries({ queryKey: ['prices'] });
  const refreshDevices    = () => qc.invalidateQueries({ queryKey: ['customer_devices'] });

  return {
    employees:       employeesQuery.data  ?? [],
    orders:          ordersQuery.data     ?? [],
    inventoryItems:  inventoryQuery.data  ?? [],
    servicePrices:   pricesQuery.data     ?? [],
    customerDevices: devicesQuery.data    ?? [],
    lowStockThreshold: settingsQuery.data ?? 5,
    // No-ops para compatibilidade
    setEmployees:      () => {},
    setOrders:         () => {},
    setInventoryItems: () => {},
    setServicePrices:  () => {},
    refreshEmployees,
    refreshOrders,
    refreshInventory,
    refreshPrices,
    refreshDevices,
  };
};
