import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

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

async function decryptValue(encryptedHex: string, ivHex: string, keyHex: string): Promise<string> {
  const keyBytes = hexToBytes(keyHex);
  const iv = hexToBytes(ivHex);
  const cipherBytes = hexToBytes(encryptedHex);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, cipherBytes);
  return new TextDecoder().decode(plainBuffer);
}

const verifyWebhookSignature = (
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  webhookSecret: string
): boolean => {
  if (!xSignature || !xRequestId || !webhookSecret) return false;
  try {
    const parts = xSignature.split(",");
    const ts = parts.find((p) => p.startsWith("ts="))?.split("=")[1];
    const v1 = parts.find((p) => p.startsWith("v1="))?.split("=")[1];
    if (!ts || !v1) return false;
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const hmac = createHmac("sha256", webhookSecret);
    hmac.update(manifest);
    const calculatedSignature = hmac.digest("hex");
    return calculatedSignature === v1;
  } catch {
    return false;
  }
};

const verifyPaymentWithMercadoPago = async (
  paymentId: string,
  accessToken: string
): Promise<{ status: string; externalReference: string } | null> => {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const payment = await response.json();
    return { status: payment.status, externalReference: payment.external_reference };
  } catch {
    return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));

    console.log("Webhook received:", {
      timestamp: new Date().toISOString(),
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
    });

    if (body.type === "payment" || body.action?.startsWith("payment.")) {
      const paymentId = body.data?.id?.toString();
      if (!paymentId) {
        return new Response(
          JSON.stringify({ error: "Missing payment ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const xSignature = req.headers.get("x-signature");
      const xRequestId = req.headers.get("x-request-id");
      const webhookSecret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");

      if (webhookSecret) {
        const isValid = verifyWebhookSignature(xSignature, xRequestId, paymentId, webhookSecret);
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid signature" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      let orderId: string | null = null;
      let accessToken: string | null = null;

      // Find order by payment ID
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, wedding_id")
        .eq("mercado_pago_payment_id", paymentId)
        .single();

      if (existingOrder) {
        orderId = existingOrder.id;
        const { data: wedding } = await supabase
          .from("weddings")
          .select("mp_access_token_encrypted, mp_access_token_iv, mercado_pago_access_token")
          .eq("id", existingOrder.wedding_id)
          .single();

        if (wedding?.mp_access_token_encrypted && wedding?.mp_access_token_iv) {
          accessToken = await decryptValue(wedding.mp_access_token_encrypted, wedding.mp_access_token_iv, encryptionKey);
        } else if (wedding?.mercado_pago_access_token) {
          accessToken = wedding.mercado_pago_access_token;
        }
      }

      // If not found, search all weddings
      if (!orderId) {
        const { data: weddings } = await supabase
          .from("weddings")
          .select("id, mp_access_token_encrypted, mp_access_token_iv, mercado_pago_access_token")
          .or("mp_access_token_encrypted.not.is.null,mercado_pago_access_token.not.is.null");

        if (weddings) {
          for (const w of weddings) {
            let token: string | null = null;
            if (w.mp_access_token_encrypted && w.mp_access_token_iv) {
              token = await decryptValue(w.mp_access_token_encrypted, w.mp_access_token_iv, encryptionKey);
            } else if (w.mercado_pago_access_token) {
              token = w.mercado_pago_access_token;
            }
            if (!token) continue;

            const paymentInfo = await verifyPaymentWithMercadoPago(paymentId, token);
            if (paymentInfo?.externalReference) {
              const { data: order } = await supabase
                .from("orders")
                .select("id, wedding_id")
                .eq("id", paymentInfo.externalReference)
                .eq("wedding_id", w.id)
                .single();
              if (order) {
                orderId = order.id;
                accessToken = token;
                break;
              }
            }
          }
        }
      }

      if (!orderId || !accessToken) {
        return new Response(
          JSON.stringify({ error: "Order not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const verifiedPayment = await verifyPaymentWithMercadoPago(paymentId, accessToken);
      if (!verifiedPayment || verifiedPayment.externalReference !== orderId) {
        return new Response(
          JSON.stringify({ error: "Payment verification failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let orderStatus = "pending";
      if (verifiedPayment.status === "approved") orderStatus = "approved";
      else if (verifiedPayment.status === "rejected" || verifiedPayment.status === "cancelled") orderStatus = "rejected";

      await supabase
        .from("orders")
        .update({ status: orderStatus, mercado_pago_payment_id: paymentId })
        .eq("id", orderId);

      console.log("Order updated:", { orderId, status: orderStatus, paymentId });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
