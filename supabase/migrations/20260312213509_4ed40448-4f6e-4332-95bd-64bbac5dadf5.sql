
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns to weddings table
ALTER TABLE public.weddings
ADD COLUMN IF NOT EXISTS mp_access_token_encrypted TEXT,
ADD COLUMN IF NOT EXISTS mp_access_token_iv TEXT,
ADD COLUMN IF NOT EXISTS mp_secret_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS mp_secret_key_iv TEXT;

-- Create rate_limit_log table
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_lookup 
ON public.rate_limit_log (identifier, action, created_at);

-- Enable RLS on rate_limit_log (only service role can access)
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Create the wedding_config_safe view (excludes sensitive fields)
CREATE OR REPLACE VIEW public.wedding_config_safe 
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  couple_name,
  partner1_name,
  partner2_name,
  wedding_date,
  tagline,
  slug,
  layout,
  section_about,
  section_wedding_info,
  section_gifts,
  section_rsvp,
  section_message_wall,
  section_gallery,
  section_video,
  section_dress_code,
  hero_image_url,
  video_url,
  ceremony_date,
  ceremony_time,
  ceremony_location,
  ceremony_address,
  reception_location,
  reception_address,
  reception_time,
  same_location,
  about_text,
  dress_code_text,
  colors_to_avoid,
  additional_info,
  story_photo_1,
  story_photo_2,
  story_photo_3,
  mercado_pago_public_key,
  payment_credit_card,
  payment_pix,
  payment_boleto,
  max_installments,
  created_at,
  updated_at
FROM public.weddings;

-- Convert is_public_wedding to SECURITY INVOKER (it only reads public data)
CREATE OR REPLACE FUNCTION public.is_public_wedding(w_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.weddings WHERE id = w_id AND slug IS NOT NULL);
$$;

-- Convert generate_wedding_slug to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.generate_wedding_slug(couple_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(couple_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.weddings WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$;
