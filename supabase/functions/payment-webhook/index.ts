import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Mercado Pago webhook signature
const verifyWebhookSignature = (
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  webhookSecret: string
): boolean => {
  if (!xSignature || !xRequestId || !webhookSecret) return false;
  
  try {
    // Mercado Pago signature format: ts=timestamp,v1=signature
    const parts = xSignature.split(',');
    const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
    const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];
    
    if (!ts || !v1) return false;
    
    // Construct manifest: id + request-id + timestamp
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    // Calculate HMAC SHA256
    const hmac = createHmac('sha256', webhookSecret);
    hmac.update(manifest);
    const calculatedSignature = hmac.digest('hex');
    
    return calculatedSignature === v1;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

// Verify payment status directly with Mercado Pago API
const verifyPaymentWithMercadoPago = async (
  paymentId: string,
  accessToken: string
): Promise<{ status: string; externalReference: string } | null> => {
  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to verify payment with Mercado Pago:', response.status);
      return null;
    }

    const payment = await response.json();
    return {
      status: payment.status,
      externalReference: payment.external_reference,
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return null;
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse webhook body
    const body = await req.json().catch(() => ({}));
    
    // Log webhook for audit
    console.log('Webhook received:', {
      timestamp: new Date().toISOString(),
      headers: {
        'x-signature': req.headers.get('x-signature') ? '[PRESENT]' : '[MISSING]',
        'x-request-id': req.headers.get('x-request-id'),
      },
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
    });

    // Handle payment notification
    if (body.type === 'payment' || body.action?.startsWith('payment.')) {
      const paymentId = body.data?.id?.toString();
      
      if (!paymentId) {
        console.error('No payment ID in webhook');
        return new Response(
          JSON.stringify({ error: 'Missing payment ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Try to verify signature if webhook secret is configured
      const xSignature = req.headers.get('x-signature');
      const xRequestId = req.headers.get('x-request-id');
      const webhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET');
      
      if (webhookSecret) {
        const isValidSignature = verifyWebhookSignature(
          xSignature,
          xRequestId,
          paymentId,
          webhookSecret
        );
        
        if (!isValidSignature) {
          console.error('Invalid webhook signature');
          return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('Webhook signature verified successfully');
      } else {
        console.log('No webhook secret configured - using API verification only');
      }

      // Find the order by searching for orders with matching mercado_pago_payment_id
      // or by external_reference if this is a new payment
      let orderId: string | null = null;
      let weddingAccessToken: string | null = null;

      // First, try to find existing order with this payment ID
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, wedding_id')
        .eq('mercado_pago_payment_id', paymentId)
        .single();

      if (existingOrder) {
        orderId = existingOrder.id;
        
        // Get wedding access token
        const { data: wedding } = await supabase
          .from('weddings')
          .select('mercado_pago_access_token')
          .eq('id', existingOrder.wedding_id)
          .single();
        
        weddingAccessToken = wedding?.mercado_pago_access_token || null;
      }

      // If not found, we need to query all weddings with MP configured
      // and try to find the payment in their accounts
      if (!orderId) {
        const { data: weddings } = await supabase
          .from('weddings')
          .select('id, mercado_pago_access_token')
          .not('mercado_pago_access_token', 'is', null);

        if (weddings) {
          for (const wedding of weddings) {
            const paymentInfo = await verifyPaymentWithMercadoPago(
              paymentId,
              wedding.mercado_pago_access_token!
            );

            if (paymentInfo && paymentInfo.externalReference) {
              // Verify the order exists and belongs to this wedding
              const { data: order } = await supabase
                .from('orders')
                .select('id, wedding_id')
                .eq('id', paymentInfo.externalReference)
                .eq('wedding_id', wedding.id)
                .single();

              if (order) {
                orderId = order.id;
                weddingAccessToken = wedding.mercado_pago_access_token;
                break;
              }
            }
          }
        }
      }

      if (!orderId || !weddingAccessToken) {
        console.error('Order not found for payment:', paymentId);
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // CRITICAL: Always verify payment status with Mercado Pago API
      // Never trust the webhook body for status
      const verifiedPayment = await verifyPaymentWithMercadoPago(
        paymentId,
        weddingAccessToken
      );

      if (!verifiedPayment) {
        console.error('Could not verify payment with Mercado Pago');
        return new Response(
          JSON.stringify({ error: 'Payment verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify external_reference matches our order
      if (verifiedPayment.externalReference !== orderId) {
        console.error('External reference mismatch:', {
          expected: orderId,
          received: verifiedPayment.externalReference,
        });
        return new Response(
          JSON.stringify({ error: 'Reference mismatch' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Map verified status to order status
      let orderStatus = 'pending';
      if (verifiedPayment.status === 'approved') {
        orderStatus = 'approved';
      } else if (verifiedPayment.status === 'rejected' || verifiedPayment.status === 'cancelled') {
        orderStatus = 'rejected';
      } else if (verifiedPayment.status === 'in_process' || verifiedPayment.status === 'pending') {
        orderStatus = 'pending';
      }

      // Update order with verified status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: orderStatus,
          mercado_pago_payment_id: paymentId,
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
      } else {
        console.log('Order updated successfully:', {
          orderId,
          status: orderStatus,
          paymentId,
        });
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
