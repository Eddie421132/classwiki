import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const WEBSITE_URL = 'https://classwiki.lovable.app';

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup = false;

    const setup = async () => {
      // 先尝试请求通知权限（失败不影响后续流程）
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

          PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
            console.log('Push notification action:', action);
            const { Browser } = await import('@capacitor/browser');
            const data = action.notification.data;
            let url = WEBSITE_URL;
            if (data?.articleId) {
              url = `${WEBSITE_URL}/article/${data.articleId}`;
            }
            await Browser.open({ url });
          });
        } else {
          console.log('Push notification permission denied');
        }
      } catch (e) {
        console.log('Push notifications not available:', e);
      }

      // 无论推送是否成功，都跳转到网站
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: WEBSITE_URL });
      } catch (e) {
        console.log('Browser open failed:', e);
      }
    };

    setup();

    return () => {
      cleanup = true;
    };
  }, [user]);
}
