import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RequestSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    const validationResult = RequestSchema.safeParse({ slug });
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid slug format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use wedding_config_safe view (no sensitive fields)
    const { data: wedding, error: weddingError } = await supabase
      .from("wedding_config_safe")
      .select("*")
      .eq("slug", validationResult.data.slug)
      .single();

    if (weddingError || !wedding) {
      return new Response(
        JSON.stringify({ error: "Wedding not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: gifts } = await supabase
      .from("gifts")
      .select("id, name, category, price, image_url, external_link")
      .eq("wedding_id", wedding.id);

    const { data: galleryImages } = await supabase
      .from("gallery_images")
      .select("id, image_url, caption, display_order")
      .eq("wedding_id", wedding.id)
      .order("display_order");

    return new Response(
      JSON.stringify({
        wedding,
        gifts: gifts || [],
        galleryImages: galleryImages || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
