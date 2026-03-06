
-- Add payment method toggles and installment config to weddings table
ALTER TABLE public.weddings 
  ADD COLUMN IF NOT EXISTS payment_credit_card boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_pix boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_boleto boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_installments integer NOT NULL DEFAULT 12;

-- Recreate the public_weddings view to include the new columns
DROP VIEW IF EXISTS public.public_weddings;

CREATE VIEW public.public_weddings WITH (security_barrier = true) AS
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
  mercado_pago_public_key,
  story_photo_1,
  story_photo_2,
  story_photo_3,
  payment_credit_card,
  payment_pix,
  payment_boleto,
  max_installments
FROM public.weddings
WHERE slug IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.public_weddings TO anon;
GRANT SELECT ON public.public_weddings TO authenticated;
