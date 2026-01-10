-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage all bindings" ON public.ip_user_bindings;

-- The ip_user_bindings table will be managed via edge functions with service role key
-- No direct user access needed for insert/update/delete - only through edge functions