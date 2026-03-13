import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CartItemSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200).trim(),
  quantity: z.number().int().min(1).max(100),
  unit_price: z.number().positive().max(1000000),
});

const CreatePaymentSchema = z.object({
  weddingId: z.string().uuid(),
  items: z.array(CartItemSchema).min(1).max(50),
  guestName: z.string().min(1).max(100).trim(),
  guestEmail: z.string().email().max(255).optional().or(z.literal("")).transform((val) => val || undefined),
  giftMessage: z.string().max(300).optional().transform((val) => val?.trim() || undefined),
});

const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, "").replace(/javascript:/gi, "").trim();
};

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function decryptValue(encryptedHex: string, ivHex: string, keyHex: string): Promise<string> {
  const keyBytes = hexToBytes(keyHex);
  const iv = hexToBytes(ivHex);
  const cipherBytes = hexToBytes(encryptedHex);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, cipherBytes);
  return new TextDecoder().decode(plainBuffer);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const validationResult = CreatePaymentSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: validationResult.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { weddingId, items, guestName, guestEmail, giftMessage } = validationResult.data;
    const sanitizedGuestName = sanitizeString(guestName);
    const sanitizedGuestEmail = guestEmail ? sanitizeString(guestEmail) : undefined;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch wedding credentials (prefer encrypted)
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("mp_access_token_encrypted, mp_access_token_iv, mercado_pago_access_token, couple_name")
      .eq("id", weddingId)
      .single();

    if (weddingError || !wedding) {
      return new Response(
        JSON.stringify({ error: "Wedding not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decrypt access token
    let accessToken: string;
    if (wedding.mp_access_token_encrypted && wedding.mp_access_token_iv) {
      accessToken = await decryptValue(wedding.mp_access_token_encrypted, wedding.mp_access_token_iv, encryptionKey);
    } else if (wedding.mercado_pago_access_token) {
      accessToken = wedding.mercado_pago_access_token;
    } else {
      return new Response(
        JSON.stringify({ error: "Mercado Pago not configured for this wedding" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify gift prices
    const giftIds = items.filter((i) => !i.id.startsWith("envelope")).map((i) => i.id);
    if (giftIds.length > 0) {
      const { data: gifts, error: giftsError } = await supabase
        .from("gifts")
        .select("id, price, name")
        .in("id", giftIds)
        .eq("wedding_id", weddingId);

      if (giftsError) {
        return new Response(
          JSON.stringify({ error: "Failed to verify gift prices" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      for (const item of items) {
        if (item.id.startsWith("envelope")) continue;
        const gift = gifts?.find((g) => g.id === item.id);
        if (!gift) {
          return new Response(
            JSON.stringify({ error: `Gift not found: ${item.id}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (Math.abs(Number(gift.price) - item.unit_price) > 0.01) {
          return new Response(
            JSON.stringify({ error: "Price mismatch detected" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        wedding_id: weddingId,
        guest_name: sanitizedGuestName,
        guest_email: sanitizedGuestEmail || null,
        total_amount: total,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      gift_id: item.id.startsWith("envelope") ? null : item.id,
      gift_name: sanitizeString(item.name),
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));
    await supabase.from("order_items").insert(orderItems);

    // Create MP preference
    const preference = {
      items: items.map((item) => ({
        id: item.id,
        title: sanitizeString(item.name),
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: item.unit_price,
      })),
      payer: { name: sanitizedGuestName, email: sanitizedGuestEmail || undefined },
      back_urls: {
        success: `${req.headers.get("origin")}/payment-success?order=${order.id}`,
        failure: `${req.headers.get("origin")}/payment-failure?order=${order.id}`,
        pending: `${req.headers.get("origin")}/payment-pending?order=${order.id}`,
      },
      auto_return: "approved",
      external_reference: order.id,
      statement_descriptor: `Presente ${sanitizeString(wedding.couple_name)}`.substring(0, 22),
      notification_url: `${supabaseUrl}/functions/v1/payment-webhook`,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to create payment preference" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mpData = await mpResponse.json();
    await supabase.from("orders").update({ mercado_pago_preference_id: mpData.id }).eq("id", order.id);

    return new Response(
      JSON.stringify({
        preferenceId: mpData.id,
        initPoint: mpData.init_point,
        sandboxInitPoint: mpData.sandbox_init_point,
        orderId: order.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
