
-- Drop and recreate public_weddings view with security_invoker
DROP VIEW IF EXISTS public.public_weddings CASCADE;

CREATE VIEW public.public_weddings 
WITH (security_invoker = true)
AS
SELECT
  id,
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
  max_installments
FROM public.weddings
WHERE slug IS NOT NULL;

-- Add policy for rate_limit_log
CREATE POLICY "Service role only" ON public.rate_limit_log
FOR ALL TO service_role USING (true) WITH CHECK (true);
