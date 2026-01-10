import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const ONLINE_THRESHOLD = 60000; // 60 seconds - if last_seen is older, user is offline

export function useOnlineStatus() {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updatePresence = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('online_users')
        .upsert({
          user_id: user.id,
          last_seen: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Failed to update presence:', error);
      }
    } catch (err) {
      console.error('Presence update error:', err);
    }
  }, [user?.id]);

  const removePresence = useCallback(async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('online_users')
        .delete()
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Failed to remove presence:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Update presence immediately
    updatePresence();

    // Set up heartbeat interval
    intervalRef.current = setInterval(updatePresence, HEARTBEAT_INTERVAL);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
      }
    };

    // Handle before unload
    const handleBeforeUnload = () => {
      removePresence();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      removePresence();
    };
  }, [user?.id, updatePresence, removePresence]);
}

export function isUserOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  const lastSeenTime = new Date(lastSeen).getTime();
  const now = Date.now();
  return now - lastSeenTime < ONLINE_THRESHOLD;
}
