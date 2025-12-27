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

  const refreshProfile = async () => {
    if (!user) return;
    
    const [adminResult, secondAdminResult, editorResult, profileResult] = await Promise.all([
      checkIsAdmin(user.id),
      checkIsSecondAdmin(user.id),
      checkIsApprovedEditor(user.id),
      getUserProfile(user.id)
    ]);
    
    setIsAdmin(adminResult);
    setIsSecondAdmin(secondAdminResult);
    setIsApprovedEditor(editorResult);
    setProfile(profileResult.profile as Profile | null);
    setIsRegularUser(profileResult.profile?.status === 'user');
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            refreshProfile();
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsSecondAdmin(false);
          setIsApprovedEditor(false);
          setIsRegularUser(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          checkIsAdmin(session.user.id).then(setIsAdmin);
          checkIsSecondAdmin(session.user.id).then(setIsSecondAdmin);
          checkIsApprovedEditor(session.user.id).then(setIsApprovedEditor);
          getUserProfile(session.user.id).then(({ profile }) => {
            setProfile(profile as Profile | null);
          });
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
