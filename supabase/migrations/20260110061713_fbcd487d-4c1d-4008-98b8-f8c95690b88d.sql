-- Create banned_ips table for IP banning feature
CREATE TABLE public.banned_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT NOT NULL UNIQUE,
  banned_by UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;

-- Only admins can manage banned IPs
CREATE POLICY "Admins can manage banned IPs"
ON public.banned_ips
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'second_admin'::app_role));

-- Anyone can check if IP is banned (for access check)
CREATE POLICY "Anyone can check banned IPs"
ON public.banned_ips
FOR SELECT
USING (true);

-- Create online_users table for presence tracking
CREATE TABLE public.online_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.online_users ENABLE ROW LEVEL SECURITY;

-- Anyone can view online users
CREATE POLICY "Anyone can view online users"
ON public.online_users
FOR SELECT
USING (true);

-- Users can insert/update their own presence
CREATE POLICY "Users can manage own presence"
ON public.online_users
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for online_users
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_users;