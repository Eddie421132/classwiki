import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Generate OAuth2 access token from service account
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(header))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payloadB64 = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(payload))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const signInput = `${headerB64}.${payloadB64}`;

  // Import the private key
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(signInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${signInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    console.error('Token exchange failed:', tokenData);
    throw new Error('Failed to get access token');
  }
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, articleId, articleTitle, actorName, targetUserId } = await req.json();

    console.log('Push notification request:', { type, articleId, articleTitle, actorName, targetUserId });

    const serviceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountJson) {
      throw new Error('FCM_SERVICE_ACCOUNT_KEY not configured');
    }
    const serviceAccount = JSON.parse(serviceAccountJson);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine target user(s) and notification content
    let tokens: string[] = [];
    let title = '';
    let body = '';

    if (type === 'new_article') {
      // Notify all users except the author
      const { data: allTokens } = await supabase
        .from('device_tokens')
        .select('token, user_id')
        .neq('user_id', targetUserId); // targetUserId here is the author
      tokens = (allTokens || []).map(t => t.token);
      title = '📝 新文章发布';
      body = `${actorName} 发布了新文章「${articleTitle}」`;
    } else if (type === 'comment') {
      // Notify the article author
      const { data: userTokens } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', targetUserId);
      tokens = (userTokens || []).map(t => t.token);
      title = '💬 新评论';
      body = `${actorName} 评论了你的文章「${articleTitle}」`;
    } else if (type === 'reply') {
      // Notify the parent comment author
      const { data: userTokens } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', targetUserId);
      tokens = (userTokens || []).map(t => t.token);
      title = '💬 新回复';
      body = `${actorName} 回复了你的评论`;
    } else if (type === 'like') {
      // Notify the article author
      const { data: userTokens } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', targetUserId);
      tokens = (userTokens || []).map(t => t.token);
      title = '❤️ 获得点赞';
      body = `${actorName} 点赞了你的文章「${articleTitle}」`;
    }

    if (tokens.length === 0) {
      console.log('No device tokens found for notification');
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get FCM access token
    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    let sentCount = 0;
    const failedTokens: string[] = [];

    // Send to each device
    for (const token of tokens) {
      try {
        const fcmResponse = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: {
                token,
                notification: { title, body },
                data: {
                  type,
                  articleId: articleId || '',
                },
                android: {
                  priority: 'high',
                  notification: {
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                    channel_id: 'default',
                  },
                },
              },
            }),
          }
        );

        if (fcmResponse.ok) {
          sentCount++;
        } else {
          const errText = await fcmResponse.text();
          console.error('FCM send error for token:', errText);
          // If token is invalid, mark for cleanup
          if (errText.includes('NOT_FOUND') || errText.includes('UNREGISTERED')) {
            failedTokens.push(token);
          }
        }
      } catch (e) {
        console.error('Error sending to token:', e);
      }
    }

    // Clean up invalid tokens
    if (failedTokens.length > 0) {
      await supabase
        .from('device_tokens')
        .delete()
        .in('token', failedTokens);
      console.log(`Cleaned up ${failedTokens.length} invalid tokens`);
    }

    console.log(`Sent ${sentCount}/${tokens.length} notifications`);

    return new Response(JSON.stringify({ success: true, sent: sentCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
