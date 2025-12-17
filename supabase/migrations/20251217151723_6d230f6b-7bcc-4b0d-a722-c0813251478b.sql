-- Add foreign key constraint from articles to profiles
ALTER TABLE public.articles 
ADD CONSTRAINT articles_author_id_profiles_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;