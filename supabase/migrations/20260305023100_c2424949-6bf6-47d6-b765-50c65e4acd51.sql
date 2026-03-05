
-- Create SECURITY DEFINER function to check if a wedding is public
CREATE OR REPLACE FUNCTION public.is_public_wedding(w_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.weddings WHERE id = w_id AND slug IS NOT NULL);
$$;

-- Drop the broad SELECT policy on weddings if it exists
DROP POLICY IF EXISTS "Anyone can view wedding by slug" ON public.weddings;

-- Update gifts policies
DROP POLICY IF EXISTS "Anyone can view gifts for public weddings" ON public.gifts;
CREATE POLICY "Anyone can view gifts for public weddings"
  ON public.gifts FOR SELECT
  USING (public.is_public_wedding(wedding_id));

-- Update gallery_images policies
DROP POLICY IF EXISTS "Anyone can view gallery for public weddings" ON public.gallery_images;
CREATE POLICY "Anyone can view gallery for public weddings"
  ON public.gallery_images FOR SELECT
  USING (public.is_public_wedding(wedding_id));

-- Update messages policies
DROP POLICY IF EXISTS "Anyone can insert messages for public weddings" ON public.messages;
CREATE POLICY "Anyone can insert messages for public weddings"
  ON public.messages FOR INSERT
  WITH CHECK (public.is_public_wedding(wedding_id));

DROP POLICY IF EXISTS "Anyone can view messages for public weddings" ON public.messages;
CREATE POLICY "Anyone can view messages for public weddings"
  ON public.messages FOR SELECT
  USING (public.is_public_wedding(wedding_id));

-- Update orders policies
DROP POLICY IF EXISTS "Anyone can create orders for public weddings" ON public.orders;
CREATE POLICY "Anyone can create orders for public weddings"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_public_wedding(wedding_id));

-- Update order_items policies
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
    AND public.is_public_wedding(o.wedding_id)
  ));

-- Update rsvp_responses policies
DROP POLICY IF EXISTS "Anyone can insert RSVP for public weddings" ON public.rsvp_responses;
CREATE POLICY "Anyone can insert RSVP for public weddings"
  ON public.rsvp_responses FOR INSERT
  WITH CHECK (public.is_public_wedding(wedding_id));
