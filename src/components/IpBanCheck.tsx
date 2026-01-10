import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ban } from 'lucide-react';

interface IpBanCheckProps {
  children: React.ReactNode;
}

export function IpBanCheck({ children }: IpBanCheckProps) {
  const [isBanned, setIsBanned] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkBan = async () => {
      try {
        // Get user's IP from edge function
        const { data, error } = await supabase.functions.invoke('check-ip-ban');
        
        if (error) {
          console.error('Failed to check IP ban:', error);
          setIsChecking(false);
          return;
        }

        setIsBanned(data?.banned === true);
      } catch (err) {
        console.error('IP ban check error:', err);
      } finally {
        setIsChecking(false);
      }
    };

    checkBan();
  }, []);

  if (isChecking) {
    return null; // Don't block while checking
  }

  if (isBanned) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <Ban className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">访问被拒绝</h1>
          <p className="text-muted-foreground">
            您的IP地址已被封禁，无法访问本网站。如有疑问，请联系管理员。
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
