-- Add foreign key references to profiles table for likes and comments
ALTER TABLE public.article_likes
ADD CONSTRAINT article_likes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.article_comments
ADD CONSTRAINT article_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;