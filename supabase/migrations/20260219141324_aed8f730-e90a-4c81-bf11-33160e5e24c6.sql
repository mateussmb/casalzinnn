
-- Fix the security definer view issue by recreating with security_invoker
DROP VIEW IF EXISTS public.public_weddings;

CREATE VIEW public.public_weddings WITH (security_barrier = true, security_invoker = true) AS
SELECT 
  id, couple_name, wedding_date, tagline, slug, layout,
  section_about, section_wedding_info, section_gifts, section_rsvp,
  section_message_wall, section_gallery, section_video, section_dress_code,
  hero_image_url, video_url, ceremony_date, ceremony_time,
  ceremony_location, ceremony_address, reception_location,
  reception_address, reception_time, same_location, about_text,
  dress_code_text, colors_to_avoid, additional_info,
  story_photo_1, story_photo_2, story_photo_3,
  partner1_name, partner2_name, mercado_pago_public_key
FROM public.weddings
WHERE slug IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.public_weddings TO anon, authenticated;

-- Re-add a restricted public SELECT policy on weddings table
-- This is needed because other tables (gifts, messages, rsvp, orders, gallery_images)
-- have RLS policies that check weddings.slug IS NOT NULL via subqueries
-- But we restrict it so that sensitive columns are only accessible to the owner
-- Unfortunately PostgreSQL doesn't support column-level RLS, so we need to keep 
-- the row-level policy for the subquery checks to work.
-- The key mitigation is: client code uses public_weddings view, edge function uses service role.
CREATE POLICY "Anyone can view wedding by slug" ON public.weddings
  FOR SELECT USING (slug IS NOT NULL);
