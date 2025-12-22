import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: VerificationRequest = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "请提供有效的邮箱地址" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete any existing codes for this email
    await supabase
      .from("email_verification_codes")
      .delete()
      .eq("email", email.toLowerCase());

    // Insert new verification code
    const { error: insertError } = await supabase
      .from("email_verification_codes")
      .insert({
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error("保存验证码失败");
    }

    // Send email with Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("Resend API key not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "7班Wiki <onboarding@resend.dev>",
        to: [email],
        subject: "您的注册验证码 - 7班Wiki",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; }
              .code { 
                font-size: 32px; 
                font-weight: bold; 
                letter-spacing: 8px; 
                color: #3b82f6; 
                background: #f0f9ff; 
                padding: 16px 24px; 
                border-radius: 8px; 
                display: inline-block;
                margin: 20px 0;
              }
              .footer { color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>欢迎注册 7班Wiki</h2>
              <p>您的邮箱验证码是：</p>
              <div class="code">${code}</div>
              <p>验证码有效期为 <strong>10分钟</strong>，请尽快完成注册。</p>
              <p>如果这不是您本人的操作，请忽略此邮件。</p>
              <div class="footer">
                <p>此邮件由系统自动发送，请勿回复。</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      throw new Error(emailResult.message || "发送邮件失败");
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, message: "验证码已发送" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-verification-code:", error);
    return new Response(
      JSON.stringify({ error: error.message || "发送验证码失败" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
