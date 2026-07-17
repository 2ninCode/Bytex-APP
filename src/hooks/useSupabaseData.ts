import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Order, InventoryItem, ServicePrice, Employee } from '../types';

export const useSupabaseData = (currentUser: Employee | null) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);

  // Mapping Helpers
  const mapOrder = (d: any): Order => ({
    id: d.id, customerName: d.customer_name, customerEmail: d.customer_email || '',
    customerPhone: d.customer_phone || '', customerId: d.customer_id,
    customer: d.customer ? {
      id: d.customer.id,
      name: d.customer.name,
      email: d.customer.email || '',
      phone: d.customer.phone || '',
      address: d.customer.address || '',
      customerCode: d.customer.customer_code,
      createdAt: d.customer.created_at
    } : undefined,
    device: d.device, serialNumber: d.serial_number || '',
    problem: d.problem, value: d.value, status: d.status, createdAt: d.created_at
  });
  
  const mapInventory = (d: any): InventoryItem => ({
    id: d.id, name: d.name, desc: d.description, stock: d.stock,
    location: d.location, category: d.category, iconKey: d.icon_key
  });

  const refreshEmployees = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('employees').select('*');
    if (data) {
      setEmployees(data.map((d: any) => ({
        id: d.id, loginId: d.login_id, password: '', name: d.name,
        cpf: d.cpf, phone: d.phone, email: d.email, birthdate: d.birthdate,
        jobTitle: d.job_title, role: d.role, avatarUrl: d.avatar_url
      })));
    }
  };

  const refreshOrders = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('orders').select('*, customer:customers(*)').order('created_at', { ascending: false });
    if (data) setOrders(data.map(mapOrder));
  };

  const refreshInventory = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('inventory_items').select('*').order('name');
    if (data) setInventoryItems(data.map(mapInventory));
  };

  const refreshPrices = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('service_prices').select('*').order('category');
    if (data) {
      setServicePrices(data.map((d: any) => ({
        id: d.id, category: d.category, name: d.name,
        price: Number(d.price), priceGamer: Number(d.price_gamer ?? 0)
      })));
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshEmployees();
      refreshPrices();
      refreshOrders();
      refreshInventory();

      // Real-time listener for Orders
      let orderSubscription: any;
      if (supabase) {
        orderSubscription = supabase.channel('public:orders')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            console.log('Orders realtime change received!', payload);
            if (payload.eventType === 'INSERT') {
              setOrders(prev => [mapOrder(payload.new), ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            } else if (payload.eventType === 'UPDATE') {
              setOrders(prev => prev.map(o => o.id === payload.new.id ? mapOrder(payload.new) : o));
            } else if (payload.eventType === 'DELETE') {
              setOrders(prev => prev.filter(o => o.id !== payload.old.id));
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') refreshOrders();
          });
      }

      // Real-time listener for Inventory
      let inventorySubscription: any;
      if (supabase) {
        inventorySubscription = supabase.channel('public:inventory_items')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, (payload) => {
            console.log('Inventory realtime change received!', payload);
            if (payload.eventType === 'INSERT') {
              setInventoryItems(prev => [...prev, mapInventory(payload.new)].sort((a,b) => a.name.localeCompare(b.name)));
            } else if (payload.eventType === 'UPDATE') {
              setInventoryItems(prev => prev.map(i => i.id === payload.new.id ? mapInventory(payload.new) : i).sort((a,b) => a.name.localeCompare(b.name)));
            } else if (payload.eventType === 'DELETE') {
              setInventoryItems(prev => prev.filter(i => i.id !== payload.old.id));
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') refreshInventory();
          });
      }

      return () => {
        if (supabase) {
          if (orderSubscription) supabase.removeChannel(orderSubscription);
          if (inventorySubscription) supabase.removeChannel(inventorySubscription);
        }
      };
    }
  }, [currentUser]);

  return {
    employees,
    orders,
    inventoryItems,
    servicePrices,
    setEmployees,
    setOrders,
    setInventoryItems,
    setServicePrices,
    refreshEmployees,
    refreshOrders,
    refreshInventory,
    refreshPrices,
  };
};
