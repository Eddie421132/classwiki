import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the requesting user from the JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !requestingUser) {
      return new Response(JSON.stringify({ error: '无法验证用户' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { targetUserId } = await req.json()

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: '缺少目标用户ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if requesting user is admin
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .maybeSingle()

    const isAdmin = !!adminRole

    // Users can only delete themselves unless they are admin
    if (!isAdmin && requestingUser.id !== targetUserId) {
      return new Response(JSON.stringify({ error: '无权限删除其他用户' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Prevent admin from deleting themselves through this function (safety measure)
    if (isAdmin && requestingUser.id === targetUserId) {
      return new Response(JSON.stringify({ error: '管理员不能删除自己的账户' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Delete user's related data first
    await supabaseAdmin.from('article_likes').delete().eq('user_id', targetUserId)
    await supabaseAdmin.from('article_comments').delete().eq('user_id', targetUserId)
    await supabaseAdmin.from('articles').delete().eq('author_id', targetUserId)
    await supabaseAdmin.from('registration_requests').delete().eq('user_id', targetUserId)
    await supabaseAdmin.from('user_roles').delete().eq('user_id', targetUserId)
    await supabaseAdmin.from('profiles').delete().eq('user_id', targetUserId)

    // Delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (deleteError) {
      console.error('Delete user error:', deleteError)
      return new Response(JSON.stringify({ error: '删除用户失败' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
