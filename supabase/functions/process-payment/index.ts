import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
  // Address fields for boleto
  payerZipCode: z.string().max(20).optional(),
  payerStreet: z.string().max(200).optional(),
  payerStreetNumber: z.string().max(10).optional(),
  payerNeighborhood: z.string().max(100).optional(),
  payerCity: z.string().max(100).optional(),
  payerState: z.string().max(5).optional(),
});

const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, '').replace(/javascript:/gi, '').trim();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      weddingId, orderId, paymentMethodId, token, issuerId, installments,
      payerEmail, payerName, identificationType, identificationNumber,
      transactionAmount, payerFirstName, payerLastName,
      payerZipCode, payerStreet, payerStreetNumber, payerNeighborhood,
      payerCity, payerState,
    } = validationResult.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, wedding_id, total_amount, status')
      .eq('id', orderId)
      .eq('wedding_id', weddingId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serverAmount = Number(order.total_amount);
    if (Math.abs(serverAmount - transactionAmount) > 0.01) {
      return new Response(
        JSON.stringify({ error: 'Transaction amount mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.status === 'paid' || order.status === 'approved') {
      return new Response(
        JSON.stringify({ error: 'Order already paid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch wedding
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('mercado_pago_access_token, couple_name')
      .eq('id', weddingId)
      .single();

    if (weddingError || !wedding || !wedding.mercado_pago_access_token) {
      return new Response(
        JSON.stringify({ error: 'Mercado Pago not configured for this wedding' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare names
    const sanitizedPayerName = sanitizeString(payerName);
    const nameParts = sanitizedPayerName.split(' ').filter(Boolean);
    const firstName = payerFirstName ? sanitizeString(payerFirstName) : (nameParts[0] || 'Convidado');
    const lastName = payerLastName ? sanitizeString(payerLastName) : (nameParts.slice(1).join(' ') || 'Anônimo');

    // Map payment method
    let actualPaymentMethod = paymentMethodId;
    if (paymentMethodId === 'bank_transfer') {
      actualPaymentMethod = 'pix';
    } else if (paymentMethodId === 'ticket') {
      actualPaymentMethod = 'bolbradesco';
    }

    const isCreditCard = !!token && !['pix', 'bank_transfer', 'bolbradesco', 'ticket'].includes(paymentMethodId);
    const isBoleto = ['bolbradesco', 'ticket'].includes(paymentMethodId) || actualPaymentMethod === 'bolbradesco';

    console.log('Payment method mapping:', { original: paymentMethodId, mapped: actualPaymentMethod, isCreditCard, isBoleto });

    // Build payer object
    const payerObj: Record<string, unknown> = {
      email: payerEmail,
      first_name: firstName,
      last_name: lastName,
    };

    // Add identification
    const idType = identificationType || 'CPF';
    const idNumber = identificationNumber ? identificationNumber.replace(/[^\d]/g, '') : '';
    if (idNumber) {
      payerObj.identification = { type: idType, number: idNumber };
    }

    // Add address for boleto (REQUIRED by Mercado Pago)
    if (isBoleto && payerZipCode) {
      payerObj.address = {
        zip_code: payerZipCode.replace(/[^\d]/g, ''),
        street_name: payerStreet || 'Não informado',
        street_number: payerStreetNumber || 'S/N',
        neighborhood: payerNeighborhood || 'Centro',
        city: payerCity || 'São Paulo',
        federal_unit: payerState || 'SP',
      };
    } else if (isBoleto) {
      // Provide default address if none given (required by MP API)
      payerObj.address = {
        zip_code: '01001000',
        street_name: 'Praça da Sé',
        street_number: '1',
        neighborhood: 'Sé',
        city: 'São Paulo',
        federal_unit: 'SP',
      };
    }

    // Build payment data
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

    console.log('Processing payment:', { orderId, method: actualPaymentMethod, amount: serverAmount });

    // Call Mercado Pago API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    
    let mpResponse: Response;
    try {
      mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wedding.mercado_pago_access_token}`,
          'X-Idempotency-Key': `${orderId}-${Date.now()}`,
        },
        body: JSON.stringify(paymentData),
        signal: controller.signal,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      console.error('Mercado Pago fetch error:', errorMessage);
      
      if (errorMessage.includes('abort')) {
        return new Response(
          JSON.stringify({ error: 'Tempo limite excedido. Tente novamente.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro de conexão com o Mercado Pago. Tente novamente.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    clearTimeout(timeoutId);

    const contentType = mpResponse.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const textResponse = await mpResponse.text();
      console.error('Mercado Pago returned non-JSON:', textResponse.substring(0, 200));
      return new Response(
        JSON.stringify({ error: 'Resposta inválida do Mercado Pago. Tente novamente.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      let errorMessage = 'Falha ao processar pagamento';
      if (mpData.cause && mpData.cause.length > 0) {
        errorMessage = mpData.cause[0].description || mpData.cause[0].code || errorMessage;
      } else if (mpData.message) {
        errorMessage = mpData.message;
      } else if (mpData.error) {
        errorMessage = mpData.error;
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: mpData.cause?.[0]?.code || mpData.status || 'unknown_error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order status
    let status = 'pending';
    if (mpData.status === 'approved') status = 'paid';
    else if (mpData.status === 'rejected') status = 'rejected';
    else if (mpData.status === 'in_process') status = 'processing';

    await supabase
      .from('orders')
      .update({ status, mercado_pago_payment_id: mpData.id?.toString() })
      .eq('id', orderId);

    // Build response
    const response: Record<string, unknown> = {
      id: mpData.id,
      status: mpData.status,
      status_detail: mpData.status_detail,
    };

    // PIX data
    if ((actualPaymentMethod === 'pix' || paymentMethodId === 'bank_transfer') && mpData.point_of_interaction?.transaction_data) {
      response.pix = {
        qr_code: mpData.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64,
        ticket_url: mpData.point_of_interaction.transaction_data.ticket_url,
      };
    }

    // Boleto data
    if (isBoleto) {
      const ticketUrl = mpData.transaction_details?.external_resource_url || 
                        mpData.point_of_interaction?.transaction_data?.ticket_url;
      if (ticketUrl) {
        response.boleto = {
          ticket_url: ticketUrl,
          barcode: mpData.barcode?.content,
        };
      }
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
