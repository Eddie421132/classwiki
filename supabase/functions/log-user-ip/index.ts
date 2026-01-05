import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  const candidates = [
    req.headers.get('cf-connecting-ip'),
    req.headers.get('x-real-ip'),
    req.headers.get('true-client-ip'),
  ].filter(Boolean) as string[]

  return candidates[0] || 'unknown'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: '无法验证用户' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // ignore empty body
    }

    const ip = getClientIp(req)
    const event_type = typeof body?.event_type === 'string' ? body.event_type : 'login'

    const { error: insertError } = await supabase
      .from('user_ip_logs')
      .insert({ user_id: user.id, ip, event_type })

    if (insertError) throw insertError

    // Best-effort: keep the latest IP on profile for quick display
    await supabase
      .from('profiles')
      .update({ last_login_ip: ip })
      .eq('user_id', user.id)

    return new Response(JSON.stringify({ success: true, ip }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('log-user-ip error:', error)
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
