import { supabase } from "@/integrations/supabase/client";

export const ADMIN_PASSWORD = "791355admin";

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  
  return !!data && !error;
}

export async function checkIsApprovedEditor(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data?.status === 'approved' && !error;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  return { profile: data, error };
}

export async function getRegistrationRequest(userId: string) {
  const { data, error } = await supabase
    .from('registration_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  return { request: data, error };
}
