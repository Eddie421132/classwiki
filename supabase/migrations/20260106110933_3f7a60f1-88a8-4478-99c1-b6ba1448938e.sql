-- Add background_music_url field to articles and article_drafts
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS background_music_url TEXT;
ALTER TABLE public.article_drafts ADD COLUMN IF NOT EXISTS background_music_url TEXT;