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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const ip = getClientIp(req)
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Check if IP is bound to a user
    const { data: binding, error: bindingError } = await adminClient
      .from('ip_user_bindings')
      .select('user_id')
      .eq('ip', ip)
      .maybeSingle()

    if (bindingError) throw bindingError

    if (!binding) {
      return new Response(JSON.stringify({ bound: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user info using admin API
    const { data: { user }, error: userError } = await adminClient.auth.admin.getUserById(binding.user_id)

    if (userError || !user) {
      // User doesn't exist anymore, clean up binding
      await adminClient.from('ip_user_bindings').delete().eq('ip', ip)
      return new Response(JSON.stringify({ bound: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate a magic link / session for the user
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
    })

    if (linkError) throw linkError

    // Extract the token from the link
    const url = new URL(linkData.properties.action_link)
    const token = url.searchParams.get('token')

    return new Response(JSON.stringify({ 
      bound: true, 
      email: user.email,
      token,
      tokenHash: linkData.properties.hashed_token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('auto-login-by-ip error:', error)
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
