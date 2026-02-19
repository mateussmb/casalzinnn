
-- Create a security barrier view with only public-safe columns
CREATE VIEW public.public_weddings WITH (security_barrier = true) AS
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

-- Drop the overly permissive public SELECT policy
DROP POLICY "Anyone can view wedding by slug" ON public.weddings;
