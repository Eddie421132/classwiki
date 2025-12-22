import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyRequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "请提供邮箱和验证码" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the verification code
    const { data: codeRecord, error: fetchError } = await supabase
      .from("email_verification_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .eq("verified", false)
      .single();

    if (fetchError || !codeRecord) {
      console.log("Code not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "验证码无效或已使用" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if code is expired
    const expiresAt = new Date(codeRecord.expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: "验证码已过期，请重新获取" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark code as verified
    await supabase
      .from("email_verification_codes")
      .update({ verified: true })
      .eq("id", codeRecord.id);

    return new Response(
      JSON.stringify({ success: true, message: "验证成功" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-email-code:", error);
    return new Response(
      JSON.stringify({ error: error.message || "验证失败" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
