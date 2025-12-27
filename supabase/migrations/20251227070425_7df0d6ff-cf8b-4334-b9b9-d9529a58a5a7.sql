-- Expose only admin + second_admin roles for safe public display (e.g. badges)
CREATE OR REPLACE FUNCTION public.get_admin_and_second_admin_roles()
RETURNS TABLE(user_id uuid, role public.app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, role
  FROM public.user_roles
  WHERE role IN ('admin', 'second_admin');
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_and_second_admin_roles() TO anon, authenticated;

-- =========================
-- profiles: allow second_admin to manage like admin, but never touch main admins
-- =========================
DROP POLICY IF EXISTS "Second admins can view all profiles" ON public.profiles;
CREATE POLICY "Second admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'second_admin'::public.app_role));

DROP POLICY IF EXISTS "Second admins can update non-admin profiles" ON public.profiles;
CREATE POLICY "Second admins can update non-admin profiles"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'second_admin'::public.app_role)
  AND NOT has_role(user_id, 'admin'::public.app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'second_admin'::public.app_role)
  AND NOT has_role(user_id, 'admin'::public.app_role)
);

-- =========================
-- registration_requests: allow second_admin to review like admin, but never touch main admins
-- =========================
DROP POLICY IF EXISTS "Second admins can view all requests" ON public.registration_requests;
CREATE POLICY "Second admins can view all requests"
ON public.registration_requests
FOR SELECT
USING (has_role(auth.uid(), 'second_admin'::public.app_role));

DROP POLICY IF EXISTS "Second admins can update non-admin requests" ON public.registration_requests;
CREATE POLICY "Second admins can update non-admin requests"
ON public.registration_requests
FOR UPDATE
USING (
  has_role(auth.uid(), 'second_admin'::public.app_role)
  AND NOT has_role(user_id, 'admin'::public.app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'second_admin'::public.app_role)
  AND NOT has_role(user_id, 'admin'::public.app_role)
);

-- =========================
-- articles: allow second_admin to moderate like admin, but never modify/delete main admins' articles
-- =========================
DROP POLICY IF EXISTS "Second admins can view all articles" ON public.articles;
CREATE POLICY "Second admins can view all articles"
ON public.articles
FOR SELECT
USING (has_role(auth.uid(), 'second_admin'::public.app_role));

DROP POLICY IF EXISTS "Second admins can update non-admin articles" ON public.articles;
CREATE POLICY "Second admins can update non-admin articles"
ON public.articles
FOR UPDATE
USING (
  has_role(auth.uid(), 'second_admin'::public.app_role)
  AND NOT has_role(author_id, 'admin'::public.app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'second_admin'::public.app_role)
  AND NOT has_role(author_id, 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Second admins can delete non-admin articles" ON public.articles;
CREATE POLICY "Second admins can delete non-admin articles"
ON public.articles
FOR DELETE
USING (
  has_role(auth.uid(), 'second_admin'::public.app_role)
  AND NOT has_role(author_id, 'admin'::public.app_role)
);

-- Allow second_admin to create articles like admin (still must be the author_id)
ALTER POLICY "Approved users can create articles" ON public.articles
WITH CHECK (
  (auth.uid() = author_id)
  AND (
    is_approved_user(auth.uid())
    OR has_role(auth.uid(), 'admin'::public.app_role)
    OR has_role(auth.uid(), 'second_admin'::public.app_role)
  )
);
