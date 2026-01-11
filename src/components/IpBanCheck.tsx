import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ban, AlertCircle } from 'lucide-react';

interface IpBanCheckProps {
  children: React.ReactNode;
}

export function IpBanCheck({ children }: IpBanCheckProps) {
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
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
        setBanReason(data?.reason || null);
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
          <p className="text-muted-foreground mb-4">
            您的IP地址已被封禁，无法访问本网站。
          </p>
          
          {banReason && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">封禁原因</span>
              </div>
              <p className="text-sm text-muted-foreground">{banReason}</p>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground mt-4">
            如有疑问，请联系管理员。
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
