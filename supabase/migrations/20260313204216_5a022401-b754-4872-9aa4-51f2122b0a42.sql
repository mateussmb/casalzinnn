
DROP VIEW IF EXISTS public.wedding_config_safe;

CREATE VIEW public.wedding_config_safe WITH (security_invoker = true) AS
  SELECT
    id, user_id, wedding_date,
    section_about, section_wedding_info, section_gifts, section_rsvp,
    section_message_wall, section_gallery, section_video, section_dress_code,
    same_location, payment_credit_card, payment_pix, payment_boleto,
    max_installments, created_at, updated_at,
    ceremony_date, ceremony_time, ceremony_location, ceremony_address,
    reception_location, reception_address, reception_time,
    about_text, dress_code_text, colors_to_avoid, additional_info,
    story_photo_1, story_photo_2, story_photo_3,
    mercado_pago_public_key,
    couple_name, partner1_name, partner2_name, tagline, slug, layout,
    hero_image_url, video_url
  FROM public.weddings;
