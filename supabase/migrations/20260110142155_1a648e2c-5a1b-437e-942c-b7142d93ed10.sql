-- Create IP user bindings table for auto-login
CREATE TABLE public.ip_user_bindings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ip_user_bindings ENABLE ROW LEVEL SECURITY;

-- Policies for ip_user_bindings
CREATE POLICY "Users can view their own IP bindings"
  ON public.ip_user_bindings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all bindings"
  ON public.ip_user_bindings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create daily article views table
CREATE TABLE public.daily_article_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  viewed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id, viewed_date)
);

-- Enable RLS
ALTER TABLE public.daily_article_views ENABLE ROW LEVEL SECURITY;

-- Policies for daily_article_views
CREATE POLICY "Users can view their own daily views"
  ON public.daily_article_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own views"
  ON public.daily_article_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_daily_article_views_user_date ON public.daily_article_views(user_id, viewed_date);
CREATE INDEX idx_ip_user_bindings_ip ON public.ip_user_bindings(ip);