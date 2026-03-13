import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limit by IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";

    const tenMinutesAgo = new Date(Date.now() - 600_000).toISOString();
    const { count } = await supabase
      .from("rate_limit_log")
      .select("id", { count: "exact", head: true })
      .eq("identifier", ip)
      .eq("action", "rsvp")
      .gte("created_at", tenMinutesAgo);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Muitas confirmações. Aguarde alguns minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log rate limit
    await supabase.from("rate_limit_log").insert({ identifier: ip, action: "rsvp" });

    const body = await req.json();
    const { wedding_id, guest_name, guest_email, attending, guest_count, companion_names, phone } = body;

    if (!wedding_id || !guest_name || attending === undefined || attending === null || attending === "") {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize
    const sanitizedName = String(guest_name).trim().replace(/[<>]/g, "").substring(0, 100);
    const sanitizedEmail = guest_email
      ? String(guest_email).trim().replace(/[<>]/g, "").substring(0, 200)
      : null;
    const sanitizedPhone = phone
      ? String(phone).trim().replace(/[<>]/g, "").substring(0, 20)
      : null;
    const clampedCount = Math.max(1, Math.min(20, parseInt(guest_count) || 1));

    // Validate email format if provided
    if (sanitizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        return new Response(
          JSON.stringify({ error: "Formato de e-mail inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Verify wedding exists
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id")
      .eq("id", wedding_id)
      .single();

    if (weddingError || !wedding) {
      return new Response(
        JSON.stringify({ error: "Casamento não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize companion names
    const sanitizedCompanions = Array.isArray(companion_names)
      ? companion_names
          .map((n: unknown) => String(n).trim().replace(/[<>]/g, "").substring(0, 200))
          .filter(Boolean)
      : [];

    // Map attending value
    const attendanceValue =
      attending === "yes" || attending === "confirmed" || attending === true
        ? "confirmed"
        : "declined";

    const { error: insertError } = await supabase.from("rsvp_responses").insert({
      wedding_id,
      guest_name: sanitizedName,
      guest_email: sanitizedEmail,
      guests_count: clampedCount,
      attendance: attendanceValue,
      companion_names: sanitizedCompanions,
      phone: sanitizedPhone,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao registrar confirmação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Confirmação registrada!" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
