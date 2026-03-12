import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ValidateRequest {
  accessToken: string;
  publicKey: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ valid: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ valid: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ValidateRequest = await req.json();
    const { accessToken, publicKey } = body;

    if (!accessToken || !publicKey) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Credenciais não informadas. Informe a Public Key e o Access Token.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userResponse = await fetch("https://api.mercadopago.com/users/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      if (userResponse.status === 401) {
        return new Response(
          JSON.stringify({
            valid: false,
            error: "Access Token inválido ou expirado. Verifique suas credenciais.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Erro ao validar credenciais. Verifique suas credenciais.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userData = await userResponse.json();

    const isTestMode = accessToken.startsWith("TEST-") || publicKey.startsWith("TEST-");
    const isProdMode = accessToken.startsWith("APP_USR-") && publicKey.startsWith("APP_USR-");

    if (!isTestMode && !isProdMode) {
      const accessType = accessToken.startsWith("TEST-") ? "teste" : "produção";
      const publicType = publicKey.startsWith("TEST-") ? "teste" : "produção";
      return new Response(
        JSON.stringify({
          valid: false,
          error: `Credenciais incompatíveis. O Access Token é de ${accessType} mas a Public Key é de ${publicType}. Use credenciais do mesmo ambiente.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        message: `Credenciais validadas com sucesso! Conta: ${userData.email || userData.nickname || "Verificada"}`,
        isTestMode,
        accountInfo: {
          email: userData.email,
          nickname: userData.nickname,
          countryId: userData.country_id,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({
        valid: false,
        error: "Erro interno ao validar credenciais. Tente novamente mais tarde.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
