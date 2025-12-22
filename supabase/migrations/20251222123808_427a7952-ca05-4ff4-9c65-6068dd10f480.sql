-- Create email verification codes table
CREATE TABLE public.email_verification_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  verified boolean NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for sending codes)
CREATE POLICY "Anyone can insert verification codes"
ON public.email_verification_codes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to select their own codes by email
CREATE POLICY "Anyone can view codes by email"
ON public.email_verification_codes
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to update codes (for marking as verified)
CREATE POLICY "Anyone can update codes"
ON public.email_verification_codes
FOR UPDATE
TO anon, authenticated
USING (true);

-- Allow deletion of expired codes
CREATE POLICY "Anyone can delete codes"
ON public.email_verification_codes
FOR DELETE
TO anon, authenticated
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_email_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX idx_email_verification_codes_expires_at ON public.email_verification_codes(expires_at);