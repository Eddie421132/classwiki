-- Allow second admins to view IP logs for non-admin users
-- (Main admins already have full access via existing policies)

CREATE POLICY "Second admins can view non-admin ip logs"
ON public.user_ip_logs
FOR SELECT
USING (
  has_role(auth.uid(), 'second_admin'::app_role)
  AND NOT has_role(user_id, 'admin'::app_role)
);
