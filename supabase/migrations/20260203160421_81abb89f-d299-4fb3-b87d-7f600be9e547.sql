-- Add same_location column to weddings table
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS same_location boolean NOT NULL DEFAULT false;

-- Add story_photos column for couple's story section photos
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS story_photo_1 text DEFAULT NULL;

ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS story_photo_2 text DEFAULT NULL;

ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS story_photo_3 text DEFAULT NULL;