import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { checkIsAdmin, checkIsSecondAdmin, checkIsApprovedEditor, getUserProfile } from '@/lib/auth';

interface Profile {
  id: string;
  user_id: string;
  real_name: string;
  avatar_url: string | null;
  status: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isSecondAdmin: boolean;
  isApprovedEditor: boolean;
  isRegularUser: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSecondAdmin, setIsSecondAdmin] = useState(false);
  const [isApprovedEditor, setIsApprovedEditor] = useState(false);
  const [isRegularUser, setIsRegularUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfileForUserId = async (targetUserId: string) => {
    const [adminResult, secondAdminResult, editorResult, profileResult] = await Promise.all([
      checkIsAdmin(targetUserId),
      checkIsSecondAdmin(targetUserId),
      checkIsApprovedEditor(targetUserId),
      getUserProfile(targetUserId),
    ]);

    setIsAdmin(adminResult);
    setIsSecondAdmin(secondAdminResult);
    setIsApprovedEditor(editorResult);
    setProfile(profileResult.profile as Profile | null);
    setIsRegularUser(profileResult.profile?.status === 'user');
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    await refreshProfileForUserId(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          refreshProfileForUserId(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsSecondAdmin(false);
        setIsApprovedEditor(false);
        setIsRegularUser(false);
      }

      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          refreshProfileForUserId(session.user.id);
        }, 0);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setIsSecondAdmin(false);
    setIsApprovedEditor(false);
    setIsRegularUser(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isAdmin,
      isSecondAdmin,
      isApprovedEditor,
      isRegularUser,
      isLoading,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
