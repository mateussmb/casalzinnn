import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function encryptValue(
  plainText: string,
  keyHex: string
): Promise<{ encrypted: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyBytes = hexToBytes(keyHex);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const encoded = new TextEncoder().encode(plainText);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encoded
  );
  return {
    encrypted: bytesToHex(new Uint8Array(cipherBuffer)),
    iv: bytesToHex(iv),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");

    if (!encryptionKey || encryptionKey.length !== 64) {
      console.error("ENCRYPTION_KEY not configured or invalid length");
      return new Response(
        JSON.stringify({ error: "Erro interno" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user session
    const { createClient: createAnonClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );
    const anonClient = createAnonClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await anonClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { wedding_id, access_token, secret_key, public_key } = body;

    if (!wedding_id || !access_token) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to verify ownership
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: wedding, error: weddingError } = await adminClient
      .from("weddings")
      .select("id, user_id")
      .eq("id", wedding_id)
      .eq("user_id", user.id)
      .single();

    if (weddingError || !wedding) {
      return new Response(
        JSON.stringify({ error: "Casamento não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Encrypt access token
    const encryptedToken = await encryptValue(access_token, encryptionKey);

    // Prepare update
    const updateData: Record<string, string | null> = {
      mp_access_token_encrypted: encryptedToken.encrypted,
      mp_access_token_iv: encryptedToken.iv,
      mercado_pago_access_token: null, // Clear plaintext
    };

    // Encrypt secret_key if provided
    if (secret_key) {
      const encryptedSecret = await encryptValue(secret_key, encryptionKey);
      updateData.mp_secret_key_encrypted = encryptedSecret.encrypted;
      updateData.mp_secret_key_iv = encryptedSecret.iv;
    }

    // Save public_key (it's a publishable key, safe in DB)
    if (public_key !== undefined) {
      updateData.mercado_pago_public_key = public_key || null;
    }

    const { error: updateError } = await adminClient
      .from("weddings")
      .update(updateData)
      .eq("id", wedding_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro interno" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Credenciais salvas com segurança" }),
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
