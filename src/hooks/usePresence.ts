import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';

export const usePresence = (currentUser: Employee | null) => {
  const [onlineEmployees, setOnlineEmployees] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser) {
      // Real-time Presence for Employees
      let presenceChannel: any;
      if (supabase) {
        presenceChannel = supabase.channel('online-users', {
          config: { presence: { key: currentUser.id } }
        });

        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState();
            const onlineIds = Object.keys(state);
            setOnlineEmployees(onlineIds);
          })
          .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
              await presenceChannel.track({ user: currentUser.id, online_at: new Date().toISOString() });
            }
          });
      }

      return () => {
        if (supabase && presenceChannel) {
          presenceChannel.untrack();
          supabase.removeChannel(presenceChannel);
        }
      };
    }
  }, [currentUser]);

  return { onlineEmployees };
};
