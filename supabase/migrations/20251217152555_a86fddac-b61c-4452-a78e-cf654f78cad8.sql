-- Drop the vulnerable assign_admin_role function
DROP FUNCTION IF EXISTS public.assign_admin_role(uuid);

-- Fix admin_messages INSERT policy to require authentication
DROP POLICY IF EXISTS "System can insert messages" ON public.admin_messages;

CREATE POLICY "Authenticated users can insert messages" ON public.admin_messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);