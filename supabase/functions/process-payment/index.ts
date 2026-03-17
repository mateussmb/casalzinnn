import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PaymentRequestSchema = z.object({
  weddingId: z.string().uuid(),
  orderId: z.string().uuid(),
  paymentMethodId: z.string().min(1).max(50),
  token: z.string().max(500).optional(),
  issuerId: z.string().max(50).optional(),
  installments: z.number().int().min(1).max(24).optional(),
  payerEmail: z.string().email().max(255),
  payerName: z.string().min(1).max(100).trim(),
  identificationType: z.string().max(20).optional(),
  identificationNumber: z.string().max(30).optional(),
  transactionAmount: z.number().positive().max(1000000),
  payerFirstName: z.string().max(100).optional(),
  payerLastName: z.string().max(100).optional(),
  payerZipCode: z.string().max(20).optional(),
  payerStreet: z.string().max(200).optional(),
  payerStreetNumber: z.string().max(10).optional(),
  payerNeighborhood: z.string().max(100).optional(),
  payerCity: z.string().max(100).optional(),
  payerState: z.string().max(5).optional(),
});

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
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]
  );
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv }, cryptoKey, cipherBytes
  );
  return new TextDecoder().decode(plainBuffer);
}

const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, "").replace(/javascript:/gi, "").trim();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limit by IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";

    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from("rate_limit_log")
      .select("id", { count: "exact", head: true })
      .eq("identifier", ip)
      .eq("action", "payment")
      .gte("created_at", oneMinuteAgo);

    if ((count ?? 0) >= 10) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Aguarde 1 minuto." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("rate_limit_log").insert({ identifier: ip, action: "payment" });

    const rawBody = await req.json();
    const validationResult = PaymentRequestSchema.safeParse(rawBody);

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

    const {
      weddingId, orderId, paymentMethodId, token, issuerId, installments,
      payerEmail, payerName, identificationType, identificationNumber,
      transactionAmount, payerFirstName, payerLastName,
      payerZipCode, payerStreet, payerStreetNumber, payerNeighborhood,
      payerCity, payerState,
    } = validationResult.data;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, wedding_id, total_amount, status")
      .eq("id", orderId)
      .eq("wedding_id", weddingId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serverAmount = Number(order.total_amount);
    if (Math.abs(serverAmount - transactionAmount) > 0.01) {
      return new Response(
        JSON.stringify({ error: "Valor inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.status === "paid" || order.status === "approved") {
      return new Response(
        JSON.stringify({ error: "Order already paid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("mp_access_token_encrypted, mp_access_token_iv, mercado_pago_access_token, couple_name")
      .eq("id", weddingId)
      .single();

    if (weddingError || !wedding) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago not configured" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken: string;
    if (wedding.mp_access_token_encrypted && wedding.mp_access_token_iv) {
      accessToken = await decryptValue(
        wedding.mp_access_token_encrypted,
        wedding.mp_access_token_iv,
        encryptionKey
      );
    } else if (wedding.mercado_pago_access_token) {
      accessToken = wedding.mercado_pago_access_token;
    } else {
      return new Response(
        JSON.stringify({ error: "Mercado Pago not configured for this wedding" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedPayerName = sanitizeString(payerName);
    const nameParts = sanitizedPayerName.split(" ").filter(Boolean);
    const firstName = payerFirstName ? sanitizeString(payerFirstName) : nameParts[0] || "Convidado";
    const lastName = payerLastName ? sanitizeString(payerLastName) : nameParts.slice(1).join(" ") || "Anônimo";

    let actualPaymentMethod = paymentMethodId;
    if (paymentMethodId === "bank_transfer") actualPaymentMethod = "pix";
    else if (paymentMethodId === "ticket") actualPaymentMethod = "bolbradesco";

    const isBoleto = ["bolbradesco", "ticket"].includes(paymentMethodId) || actualPaymentMethod === "bolbradesco";

    const payerObj: Record<string, unknown> = {
      email: payerEmail,
      first_name: firstName,
      last_name: lastName,
    };

    const idType = identificationType || "CPF";
    const idNumber = identificationNumber ? identificationNumber.replace(/[^\d]/g, "") : "";
    if (idNumber) {
      payerObj.identification = { type: idType, number: idNumber };
    }

    if (isBoleto && payerZipCode) {
      payerObj.address = {
        zip_code: payerZipCode.replace(/[^\d]/g, ""),
        street_name: payerStreet || "Não informado",
        street_number: payerStreetNumber || "S/N",
        neighborhood: payerNeighborhood || "Centro",
        city: payerCity || "São Paulo",
        federal_unit: payerState || "SP",
      };
    } else if (isBoleto) {
      payerObj.address = {
        zip_code: "01001000",
        street_name: "Praça da Sé",
        street_number: "1",
        neighborhood: "Sé",
        city: "São Paulo",
        federal_unit: "SP",
      };
    }

    const paymentData: Record<string, unknown> = {
      transaction_amount: serverAmount,
      payment_method_id: actualPaymentMethod,
      payer: payerObj,
      description: `Presente para ${sanitizeString(wedding.couple_name)}`,
      statement_descriptor: `Presente ${sanitizeString(wedding.couple_name)}`.substring(0, 22),
      external_reference: orderId,
    };

    if (token) paymentData.token = token;
    if (issuerId) paymentData.issuer_id = issuerId;
    if (installments) paymentData.installments = installments;

    console.log("Processing payment:", { orderId, method: actualPaymentMethod, amount: serverAmount });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let mpResponse: Response;
    try {
      mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-Idempotency-Key": `${orderId}-${Date.now()}`,
        },
        body: JSON.stringify(paymentData),
        signal: controller.signal,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const errorMessage = fetchError instanceof Error ? fetchError.message : "Unknown error";
      if (errorMessage.includes("abort")) {
        return new Response(
          JSON.stringify({ error: "Tempo limite excedido. Tente novamente." }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro de conexão com o Mercado Pago. Tente novamente." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timeoutId);

    const contentType = mpResponse.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Resposta inválida do Mercado Pago. Tente novamente." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Mercado Pago error:", mpData);
      let errorMessage = "Falha ao processar pagamento";
      if (mpData.cause?.length > 0) {
        errorMessage = mpData.cause[0].description || mpData.cause[0].code || errorMessage;
      } else if (mpData.message) {
        errorMessage = mpData.message;
      }
      return new Response(
        JSON.stringify({ error: errorMessage, details: mpData.cause?.[0]?.code || mpData.status || "unknown_error" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order status
    let status = "pending";
    if (mpData.status === "approved") status = "paid";
    else if (mpData.status === "rejected") status = "rejected";
    else if (mpData.status === "in_process") status = "processing";

    await supabase
      .from("orders")
      .update({ status, mercado_pago_payment_id: mpData.id?.toString() })
      .eq("id", orderId);

    // Build response — NEVER include access token
    const response: Record<string, unknown> = {
      id: mpData.id,
      status: mpData.status,
      status_detail: mpData.status_detail,
    };

    // PIX
    if ((actualPaymentMethod === "pix" || paymentMethodId === "bank_transfer") && mpData.point_of_interaction?.transaction_data) {
      response.pix = {
        qr_code: mpData.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64,
        ticket_url: mpData.point_of_interaction.transaction_data.ticket_url,
      };
    }

    // BOLETO — usa linha digitável formatada, nunca o código numérico bruto
    if (isBoleto) {
      const ticketUrl =
        mpData.transaction_details?.external_resource_url ||
        mpData.point_of_interaction?.transaction_data?.ticket_url;

      // Linha digitável formatada (ex: 37690.00104 00105.671002 00113.841696 1 13910000003990)
      // O Mercado Pago retorna em transaction_details.barcode.content (linha digitável)
      // e também em barcode.content (código numérico sem formatação)
      const digitableLine =
        mpData.transaction_details?.barcode?.content ||  // linha digitável formatada
        mpData.barcode?.content ||                       // fallback código numérico
        null;

      if (ticketUrl) {
        response.boleto = {
          ticket_url: ticketUrl,
          barcode: digitableLine,
        };
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
