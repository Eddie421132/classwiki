import { supabase } from "@/integrations/supabase/client";

export type EventType = 'login' | 'publish' | 'comment' | 'other';

export async function logUserIP(userId: string, eventType: EventType = 'other') {
  try {
    // Fetch user's public IP
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const ip = data.ip;

    if (!ip) return;

    // Insert IP log
    await supabase.from('user_ip_logs').insert({
      user_id: userId,
      ip,
      event_type: eventType,
    });

    // Also update last_login_ip in profiles for login events
    if (eventType === 'login') {
      await supabase
        .from('profiles')
        .update({ last_login_ip: ip })
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Failed to log IP:', error);
  }
}
