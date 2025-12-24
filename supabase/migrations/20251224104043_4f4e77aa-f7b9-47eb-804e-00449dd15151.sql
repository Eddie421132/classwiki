-- Add last_login_ip column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN last_login_ip text DEFAULT NULL;

-- Create a table for article drafts
CREATE TABLE public.article_drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_image_url text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on article_drafts
ALTER TABLE public.article_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only view their own drafts
CREATE POLICY "Users can view their own drafts" 
ON public.article_drafts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own drafts
CREATE POLICY "Users can create their own drafts" 
ON public.article_drafts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own drafts
CREATE POLICY "Users can update their own drafts" 
ON public.article_drafts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own drafts
CREATE POLICY "Users can delete their own drafts" 
ON public.article_drafts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_article_drafts_updated_at
BEFORE UPDATE ON public.article_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();