import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation schema
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
});

// Sanitize string for safe storage/display
const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    
    const validationResult = PaymentRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      weddingId, 
      orderId,
      paymentMethodId, 
      token,
      issuerId,
      installments,
      payerEmail, 
      payerName,
      identificationType,
      identificationNumber,
      transactionAmount 
    } = validationResult.data;

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order to verify it exists and get the correct amount
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, wedding_id, total_amount, status')
      .eq('id', orderId)
      .eq('wedding_id', weddingId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify transaction amount matches order total (prevent price manipulation)
    const serverAmount = Number(order.total_amount);
    if (Math.abs(serverAmount - transactionAmount) > 0.01) {
      console.error('Amount mismatch:', { serverAmount, clientAmount: transactionAmount });
      return new Response(
        JSON.stringify({ error: 'Transaction amount mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent double payment
    if (order.status === 'paid' || order.status === 'approved') {
      return new Response(
        JSON.stringify({ error: 'Order already paid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch wedding to get Mercado Pago credentials
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('mercado_pago_access_token, couple_name')
      .eq('id', weddingId)
      .single();

    if (weddingError || !wedding) {
      console.error('Wedding fetch error:', weddingError);
      return new Response(
        JSON.stringify({ error: 'Wedding not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wedding.mercado_pago_access_token) {
      return new Response(
        JSON.stringify({ error: 'Mercado Pago not configured for this wedding' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize user inputs
    const sanitizedPayerName = sanitizeString(payerName);
    const nameParts = sanitizedPayerName.split(' ');

    // Build payment request for Mercado Pago API
    const paymentData: Record<string, unknown> = {
      transaction_amount: serverAmount, // Use server-verified amount
      payment_method_id: paymentMethodId,
      payer: {
        email: payerEmail,
        first_name: nameParts[0] || sanitizedPayerName,
        last_name: nameParts.slice(1).join(' ') || sanitizedPayerName,
      },
      description: `Presente para ${sanitizeString(wedding.couple_name)}`,
      statement_descriptor: `Presente ${sanitizeString(wedding.couple_name)}`.substring(0, 22),
      external_reference: orderId,
    };

    // Add token for credit card payments
    if (token) {
      paymentData.token = token;
    }

    // Add issuer for credit card
    if (issuerId) {
      paymentData.issuer_id = issuerId;
    }

    // Add installments for credit card
    if (installments) {
      paymentData.installments = installments;
    }

    // Add identification if provided
    if (identificationType && identificationNumber) {
      (paymentData.payer as Record<string, unknown>).identification = {
        type: identificationType,
        number: identificationNumber.replace(/[^\d]/g, ''), // Sanitize to digits only
      };
    }

    console.log('Processing payment:', {
      orderId,
      method: paymentMethodId,
      amount: serverAmount,
    });

    // Call Mercado Pago API to create payment
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wedding.mercado_pago_access_token}`,
        'X-Idempotency-Key': `${orderId}-${Date.now()}`,
      },
      body: JSON.stringify(paymentData),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      return new Response(
        JSON.stringify({ 
          error: 'Payment processing failed', 
          details: mpData.message || mpData.cause?.[0]?.description || 'Unknown error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order status in database
    let status = 'pending';
    if (mpData.status === 'approved') {
      status = 'paid';
    } else if (mpData.status === 'rejected') {
      status = 'rejected';
    } else if (mpData.status === 'in_process') {
      status = 'processing';
    }

    await supabase
      .from('orders')
      .update({ 
        status,
        mercado_pago_payment_id: mpData.id?.toString(),
      })
      .eq('id', orderId);

    // Build response based on payment method
    const response: Record<string, unknown> = {
      id: mpData.id,
      status: mpData.status,
      status_detail: mpData.status_detail,
    };

    // For PIX payments, include QR code data
    if (paymentMethodId === 'pix' && mpData.point_of_interaction?.transaction_data) {
      response.pix = {
        qr_code: mpData.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64,
        ticket_url: mpData.point_of_interaction.transaction_data.ticket_url,
      };
    }

    // For boleto, include ticket URL
    if (paymentMethodId === 'bolbradesco' && mpData.transaction_details?.external_resource_url) {
      response.boleto = {
        ticket_url: mpData.transaction_details.external_resource_url,
        barcode: mpData.barcode?.content,
      };
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
