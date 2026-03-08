import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAIL = "admin@class7wiki.local";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    
    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD');
    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD secret not configured');
      return new Response(JSON.stringify({ success: false, error: '服务器配置错误' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate password server-side
    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ success: false, error: '管理员密码错误' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find or create admin user
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const adminUser = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

    let userId: string;

    if (adminUser) {
      userId = adminUser.id;
      await supabase.auth.admin.updateUserById(userId, { password: ADMIN_PASSWORD });
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
      if (createError) throw createError;
      userId = newUser.user.id;

      await supabase.from('profiles').insert({
        user_id: userId,
        real_name: '管理员',
        status: 'approved',
      });
      await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'admin',
      });
    }

    // Ensure admin role exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!existingRole) {
      await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
    }

    // Generate magic link instead of returning password
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: ADMIN_EMAIL,
    });

    if (linkError) throw linkError;

    return new Response(JSON.stringify({ 
      success: true,
      tokenHash: linkData.properties.hashed_token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : '认证失败' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
