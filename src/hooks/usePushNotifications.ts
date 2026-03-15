import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!user) return;

    let cleanup = false;

    const setup = async () => {
      try {
        // JPush plugin - set alias to user_id for targeted push
        const jpush = (window as any).JPush;
        if (jpush) {
          jpush.setAlias({ sequence: 1, alias: user.id });
          console.log('JPush alias set to:', user.id);
        } else {
          console.log('JPush plugin not available (native SDK not integrated)');
        }
      } catch (e) {
        console.log('JPush setup error:', e);
      }
    };

    setup();

    return () => {
      cleanup = true;
    };
  }, [user]);
}
