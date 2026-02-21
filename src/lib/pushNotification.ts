import { supabase } from '@/integrations/supabase/client';

interface SendNotificationParams {
  type: 'new_article' | 'comment' | 'reply' | 'like';
  articleId?: string;
  articleTitle?: string;
  actorName: string;
  targetUserId: string; // For new_article, this is the author (excluded); for others, the recipient
}

export async function sendPushNotification(params: SendNotificationParams) {
  try {
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: params,
    });

    if (error) {
      console.error('Failed to send push notification:', error);
    }
  } catch (e) {
    // Don't let notification failures affect main flow
    console.error('Push notification error:', e);
  }
}
