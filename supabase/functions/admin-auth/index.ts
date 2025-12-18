import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Server-side admin password - never exposed to client
const ADMIN_PASSWORD = "791355admin";
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
    
    console.log('Admin auth attempt received');

    // Validate password server-side
    if (password !== ADMIN_PASSWORD) {
      console.log('Invalid admin password');
      return new Response(JSON.stringify({ 
        success: false, 
        error: '管理员密码错误' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Try to get existing admin user
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const adminUser = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

    let userId: string;

    if (adminUser) {
      userId = adminUser.id;
      console.log('Found existing admin user:', userId);
      
      // Update password to ensure it matches
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
      });
      
      if (updateError) {
        console.error('Error updating admin password:', updateError);
      } else {
        console.log('Admin password updated successfully');
      }
    } else {
      // Create admin user
      console.log('Creating new admin user');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });

      if (createError) {
        console.error('Error creating admin user:', createError);
        throw createError;
      }

      userId = newUser.user.id;

      // Create admin profile
      await supabase.from('profiles').insert({
        user_id: userId,
        real_name: '管理员',
        status: 'approved',
      });

      // Assign admin role
      await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'admin',
      });

      console.log('Admin user created successfully:', userId);
    }

    // Ensure admin role exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!existingRole) {
      console.log('Adding missing admin role');
      await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'admin',
      });
    }

    // Generate sign-in link or return credentials for client
    return new Response(JSON.stringify({ 
      success: true,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
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
