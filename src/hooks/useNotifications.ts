import { useState, useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabase';
import { Employee, Notification } from '../types';
import { ToastProps } from '../components/ui/Toast';

export const useNotifications = (
  currentUser: Employee | null,
  navigateTo: (view: any, params?: { orderId?: string | null }) => void
) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToasts, setActiveToasts] = useState<ToastProps[]>([]);

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

  useEffect(() => {
    if (!currentUser) return;

    // We bind the token listener. It fires ONCE when PushNotifications.register() is successfully called
    const tokenListener = PushNotifications.addListener('registration', (token) => {
      const savedUserStr = localStorage.getItem('bytex_remember');
      if (savedUserStr) {
        try {
          const emp = JSON.parse(savedUserStr);
          if (emp && emp.id) {
            savePushToken(token.value, emp.id);
          }
        } catch (e) { }
      } else {
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
        orderId: notification.data?.orderId
      };
      setNotifications(prev => [notif, ...prev]);
      
      const toastId = Math.random().toString(36).substring(7);
      setActiveToasts(prev => [...prev, {
        id: toastId,
        title: notification.title || 'Bytex',
        message: notification.body || '',
        type: 'info',
        orderId: notification.data?.orderId,
        notifId: notif.id,
        onClose: (id) => setActiveToasts(current => current.filter(t => t.id !== id))
      }]);
    });

    // Listener for when user taps a notification (app was in background/closed)
    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const notification = action.notification;
      const orderId = notification.data?.orderId;
      
      if (orderId) {
        navigateTo('orders', { orderId });
      } else {
        const notif: Notification = {
          id: notification.id || Date.now().toString(),
          title: notification.title || 'Bytex',
          message: notification.body || '',
          type: 'info',
          timestamp: new Date(),
          orderId: notification.data?.orderId
        };
        setNotifications(prev => [notif, ...prev]);
      }
    });

    return () => {
      tokenListener.then(l => l.remove());
      foregroundListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [currentUser]);

  return {
    notifications,
    activeToasts,
    setNotifications,
    setActiveToasts,
    setupPushNotifications,
  };
};
