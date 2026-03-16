
-- Add missing columns to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT true;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS show_on_wall boolean NOT NULL DEFAULT true;

-- Add UPDATE policy for messages so couple can moderate
CREATE POLICY "Users can update messages from their wedding"
ON public.messages
FOR UPDATE
TO public
USING (EXISTS (
  SELECT 1 FROM weddings
  WHERE weddings.id = messages.wedding_id AND weddings.user_id = auth.uid()
));

-- Add gift_message column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_message text;

-- Add phone column to rsvp_responses  
ALTER TABLE public.rsvp_responses ADD COLUMN IF NOT EXISTS phone text;

-- Create checkout_abandonments table
CREATE TABLE IF NOT EXISTS public.checkout_abandonments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_email text,
  guest_phone text,
  gift_ids jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.checkout_abandonments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view abandonments for their wedding"
ON public.checkout_abandonments
FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM weddings
  WHERE weddings.id = checkout_abandonments.wedding_id AND weddings.user_id = auth.uid()
));

CREATE POLICY "Anyone can insert abandonments for public weddings"
ON public.checkout_abandonments
FOR INSERT
TO public
WITH CHECK (is_public_wedding(wedding_id));
