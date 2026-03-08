
-- Fix #2: Restrict get_email_by_real_name to authenticated users only
REVOKE EXECUTE ON FUNCTION public.get_email_by_real_name(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_email_by_real_name(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_email_by_real_name(text) TO authenticated;

-- Fix #3: Replace permissive public profile policy to prevent email exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view approved profiles" ON public.profiles;

-- Create a restricted policy: only authenticated users can view approved profiles
CREATE POLICY "Authenticated users can view approved profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (status = 'approved');

-- Fix #4: Lock down email_verification_codes - remove all open policies
DROP POLICY IF EXISTS "Anyone can insert verification codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Anyone can view codes by email" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Anyone can update codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Anyone can delete codes" ON public.email_verification_codes;
