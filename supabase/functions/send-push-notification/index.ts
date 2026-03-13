import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, articleId, articleTitle, actorName, targetUserId } = await req.json();

    console.log('Push notification request:', { type, articleId, articleTitle, actorName, targetUserId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build notification content
    let title = '';
    let body = '';

    if (type === 'new_article') {
      title = '📝 新文章发布';
      body = `${actorName} 发布了新文章「${articleTitle}」`;
    } else if (type === 'comment') {
      title = '💬 新评论';
      body = `${actorName} 评论了你的文章「${articleTitle}」`;
    } else if (type === 'reply') {
      title = '💬 新回复';
      body = `${actorName} 回复了你的评论`;
    } else if (type === 'like') {
      title = '❤️ 获得点赞';
      body = `${actorName} 点赞了你的文章「${articleTitle}」`;
    }

    if (!title) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert in-app notifications
    if (type === 'new_article') {
      // Notify all users except the author
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .neq('user_id', targetUserId);

      if (allProfiles && allProfiles.length > 0) {
        const notifications = allProfiles.map(p => ({
          user_id: p.user_id,
          type,
          title,
          body,
          article_id: articleId || null,
          actor_name: actorName,
        }));
        
        const { error } = await supabase.from('notifications').insert(notifications);
        if (error) console.error('Error inserting notifications:', error);
      }
    } else {
      // Notify specific user
      const { error } = await supabase.from('notifications').insert({
        user_id: targetUserId,
        type,
        title,
        body,
        article_id: articleId || null,
        actor_name: actorName,
      });
      if (error) console.error('Error inserting notification:', error);
    }

    console.log('In-app notifications created');

    return new Response(JSON.stringify({ success: true }), {
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
