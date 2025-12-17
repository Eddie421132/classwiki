-- Create a function to assign admin role (called during admin bootstrap)
CREATE OR REPLACE FUNCTION public.assign_admin_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if user has the admin profile name
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND real_name = '管理员'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;