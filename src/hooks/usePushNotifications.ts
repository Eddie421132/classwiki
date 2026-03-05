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
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { Browser } = await import('@capacitor/browser');

        // 首次打开应用时请求通知权限
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') {
          console.log('Push notification permission denied');
        }

        // 注册推送
        await PushNotifications.register();

        // 监听注册成功，保存 token
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

        // 前台收到通知
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received:', notification);
        });

        // 点击通知 → 用默认浏览器打开网站
        PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
          console.log('Push notification action:', action);
          const data = action.notification.data;
          let url = WEBSITE_URL;
          if (data?.articleId) {
            url = `${WEBSITE_URL}/article/${data.articleId}`;
          }
          await Browser.open({ url });
        });

        // 首次打开应用时直接跳转到网站
        await Browser.open({ url: WEBSITE_URL });
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
