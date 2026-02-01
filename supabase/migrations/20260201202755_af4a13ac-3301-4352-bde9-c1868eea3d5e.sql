-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weddings table for couple configuration
CREATE TABLE public.weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  couple_name TEXT NOT NULL,
  partner1_name TEXT NOT NULL DEFAULT '',
  partner2_name TEXT NOT NULL DEFAULT '',
  wedding_date DATE,
  tagline TEXT,
  slug TEXT UNIQUE,
  layout TEXT NOT NULL DEFAULT 'classic' CHECK (layout IN ('classic', 'modern', 'minimalist')),
  
  -- Sections toggle
  section_about BOOLEAN NOT NULL DEFAULT true,
  section_wedding_info BOOLEAN NOT NULL DEFAULT true,
  section_gifts BOOLEAN NOT NULL DEFAULT true,
  section_rsvp BOOLEAN NOT NULL DEFAULT true,
  section_message_wall BOOLEAN NOT NULL DEFAULT true,
  section_gallery BOOLEAN NOT NULL DEFAULT true,
  section_video BOOLEAN NOT NULL DEFAULT false,
  section_dress_code BOOLEAN NOT NULL DEFAULT true,
  
  -- Media
  hero_image_url TEXT,
  video_url TEXT,
  
  -- Wedding info
  ceremony_date TEXT,
  ceremony_time TEXT,
  ceremony_location TEXT,
  ceremony_address TEXT,
  reception_location TEXT,
  reception_address TEXT,
  reception_time TEXT,
  
  -- About section
  about_text TEXT,
  
  -- Dress code
  dress_code_text TEXT,
  colors_to_avoid TEXT,
  additional_info TEXT,
  
  -- Mercado Pago credentials (encrypted at rest by Supabase)
  mercado_pago_public_key TEXT,
  mercado_pago_access_token TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gifts table
CREATE TABLE public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  external_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RSVP responses table
CREATE TABLE public.rsvp_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guests_count INTEGER NOT NULL DEFAULT 1,
  attendance TEXT NOT NULL CHECK (attendance IN ('confirmed', 'declined', 'maybe')),
  dietary_restrictions TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for message wall
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE NOT NULL,
  guest_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gallery images table
CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table for gift purchases
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  mercado_pago_payment_id TEXT,
  mercado_pago_preference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  gift_id UUID REFERENCES public.gifts(id) ON DELETE SET NULL,
  gift_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weddings policies
CREATE POLICY "Users can view their own wedding" ON public.weddings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view wedding by slug" ON public.weddings
  FOR SELECT USING (slug IS NOT NULL);

CREATE POLICY "Users can insert their own wedding" ON public.weddings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wedding" ON public.weddings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wedding" ON public.weddings
  FOR DELETE USING (auth.uid() = user_id);

-- Gifts policies
CREATE POLICY "Anyone can view gifts for public weddings" ON public.gifts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND slug IS NOT NULL)
  );

CREATE POLICY "Users can manage their wedding gifts" ON public.gifts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND user_id = auth.uid())
  );

-- RSVP policies
CREATE POLICY "Anyone can insert RSVP for public weddings" ON public.rsvp_responses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND slug IS NOT NULL)
  );

CREATE POLICY "Users can view RSVPs for their wedding" ON public.rsvp_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND user_id = auth.uid())
  );

-- Messages policies
CREATE POLICY "Anyone can insert messages for public weddings" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND slug IS NOT NULL)
  );

CREATE POLICY "Anyone can view messages for public weddings" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND slug IS NOT NULL)
  );

CREATE POLICY "Users can delete messages from their wedding" ON public.messages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND user_id = auth.uid())
  );

-- Gallery policies
CREATE POLICY "Anyone can view gallery for public weddings" ON public.gallery_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND slug IS NOT NULL)
  );

CREATE POLICY "Users can manage their wedding gallery" ON public.gallery_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND user_id = auth.uid())
  );

-- Orders policies
CREATE POLICY "Anyone can create orders for public weddings" ON public.orders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND slug IS NOT NULL)
  );

CREATE POLICY "Users can view orders for their wedding" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update orders for their wedding" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_id AND user_id = auth.uid())
  );

-- Order items policies
CREATE POLICY "Anyone can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.weddings w ON o.wedding_id = w.id
      WHERE o.id = order_id AND w.slug IS NOT NULL
    )
  );

CREATE POLICY "Users can view order items for their wedding" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.weddings w ON o.wedding_id = w.id
      WHERE o.id = order_id AND w.user_id = auth.uid()
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weddings_updated_at
  BEFORE UPDATE ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate slug from couple name
CREATE OR REPLACE FUNCTION public.generate_wedding_slug(couple_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Normalize: lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(couple_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM public.weddings WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql SET search_path = public;