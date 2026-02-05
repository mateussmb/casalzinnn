import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
const RequestSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    // Validate input
    const validationResult = RequestSchema.safeParse({ slug });
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid slug format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch wedding with ONLY public fields - explicitly exclude sensitive data
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select(`
        id,
        couple_name,
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
        partner1_name,
        partner2_name,
        mercado_pago_public_key
      `)
      .eq('slug', validationResult.data.slug)
      .single();

    if (weddingError || !wedding) {
      return new Response(
        JSON.stringify({ error: 'Wedding not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch gifts for this wedding
    const { data: gifts } = await supabase
      .from('gifts')
      .select('id, name, category, price, image_url, external_link')
      .eq('wedding_id', wedding.id);

    // Fetch gallery images
    const { data: galleryImages } = await supabase
      .from('gallery_images')
      .select('id, image_url, caption, display_order')
      .eq('wedding_id', wedding.id)
      .order('display_order');

    // Return sanitized public data
    return new Response(
      JSON.stringify({
        wedding: {
          ...wedding,
          // Ensure mercado_pago_public_key is available for payment SDK
          // but mercado_pago_access_token is NEVER exposed
        },
        gifts: gifts || [],
        galleryImages: galleryImages || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
