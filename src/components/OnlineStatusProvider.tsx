import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface OnlineStatusProviderProps {
  children: React.ReactNode;
}

export function OnlineStatusProvider({ children }: OnlineStatusProviderProps) {
  // This hook updates the user's online status in the database
  useOnlineStatus();
  
  return <>{children}</>;
}
