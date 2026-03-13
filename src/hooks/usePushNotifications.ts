import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup = false;

    const setup = async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');

        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive === 'granted') {
          await PushNotifications.register();

          PushNotifications.addListener('registration', async (token) => {
            if (cleanup || !user) return;
            console.log('Push registration token:', token.value);

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
            }
          });

          PushNotifications.addListener('registrationError', (error) => {
            console.error('Push registration error:', error);
          });

          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push notification received:', notification);
          });

          // When user taps a notification, navigate within the app's webview
          PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('Push notification action:', action);
            const data = action.notification.data;
            if (data?.articleId) {
              window.location.href = `/article/${data.articleId}`;
            }
          });
        } else {
          console.log('Push notification permission denied');
        }
      } catch (e) {
        console.log('Push notifications not available:', e);
      }
    };

    setup();

    return () => {
      cleanup = true;
    };
  }, [user]);
}
