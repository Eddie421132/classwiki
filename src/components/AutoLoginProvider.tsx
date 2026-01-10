import { useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AutoLoginProviderProps {
  children: ReactNode;
}

export function AutoLoginProvider({ children }: AutoLoginProviderProps) {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        // First check if already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsChecking(false);
          return;
        }

        // Check if IP is bound to an account
        const { data, error } = await supabase.functions.invoke('auto-login-by-ip');
        
        if (error) {
          console.warn('Auto-login check failed:', error);
          setIsChecking(false);
          return;
        }

        if (data?.bound && data?.tokenHash) {
          // Verify OTP using the token hash
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: data.tokenHash,
            type: 'magiclink',
          });

          if (verifyError) {
            console.warn('Auto-login verification failed:', verifyError);
          }
        }
      } catch (e) {
        console.warn('Auto-login error:', e);
      } finally {
        setIsChecking(false);
      }
    };

    checkAutoLogin();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">正在检查登录状态...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
