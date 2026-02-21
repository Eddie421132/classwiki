import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    let cleanup = false;

    const registerPush = async () => {
      try {
        // Dynamically import to avoid errors on web
        const { PushNotifications } = await import('@capacitor/push-notifications');

        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') {
          console.log('Push notification permission denied');
          return;
        }

        // Register for push
        await PushNotifications.register();

        // Listen for registration
        PushNotifications.addListener('registration', async (token) => {
          if (cleanup) return;
          console.log('Push registration token:', token.value);

          // Save token to database
          const { error } = await supabase
            .from('device_tokens')
            .upsert(
              {
                user_id: user.id,
                token: token.value,
                platform: 'android',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,token' }
            );

          if (error) {
            console.error('Error saving device token:', error);
          } else {
            console.log('Device token saved successfully');
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });

        // Handle notification received while app is in foreground
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received:', notification);
        });

        // Handle notification tap
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Push notification action:', action);
          const data = action.notification.data;
          if (data?.articleId) {
            window.location.href = `/article/${data.articleId}`;
          }
        });
      } catch (e) {
        console.log('Push notifications not available:', e);
      }
    };

    registerPush();

    return () => {
      cleanup = true;
    };
  }, [user]);
}
