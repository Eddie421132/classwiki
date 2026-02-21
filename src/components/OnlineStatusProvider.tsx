import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface OnlineStatusProviderProps {
  children: React.ReactNode;
}

export function OnlineStatusProvider({ children }: OnlineStatusProviderProps) {
  useOnlineStatus();
  usePushNotifications();
  
  return <>{children}</>;
}
