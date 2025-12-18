-- Add email column to profiles for login lookup
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Create index for faster email lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_real_name ON public.profiles(real_name);