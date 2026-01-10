import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isUserOnline } from './useOnlineStatus';

interface OnlineUser {
  user_id: string;
  last_seen: string;
}

export function useOnlineUsers() {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch initial online users
    const fetchOnlineUsers = async () => {
      const { data, error } = await supabase
        .from('online_users')
        .select('user_id, last_seen');

      if (error) {
        console.error('Failed to fetch online users:', error);
        return;
      }

      const onlineIds = new Set(
        (data || [])
          .filter((u: OnlineUser) => isUserOnline(u.last_seen))
          .map((u: OnlineUser) => u.user_id)
      );
      setOnlineUserIds(onlineIds);
    };

    fetchOnlineUsers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('online-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'online_users',
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setOnlineUserIds((prev) => {
              const next = new Set(prev);
              next.delete((payload.old as OnlineUser).user_id);
              return next;
            });
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newRecord = payload.new as OnlineUser;
            if (isUserOnline(newRecord.last_seen)) {
              setOnlineUserIds((prev) => new Set(prev).add(newRecord.user_id));
            } else {
              setOnlineUserIds((prev) => {
                const next = new Set(prev);
                next.delete(newRecord.user_id);
                return next;
              });
            }
          }
        }
      )
      .subscribe();

    // Periodically clean up stale entries
    const cleanupInterval = setInterval(fetchOnlineUsers, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
    };
  }, []);

  return onlineUserIds;
}
