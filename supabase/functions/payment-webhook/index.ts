import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle IPN notification (from query params)
    if (topic === 'payment' && paymentId) {
      console.log('Processing IPN for payment:', paymentId);
      
      // We need to fetch payment details from Mercado Pago to get the preference and status
      // For now, we'll just log it - the actual status update happens via body
    }

    // Handle webhook notification (from body)
    const body = await req.json().catch(() => ({}));
    console.log('Webhook body:', JSON.stringify(body));

    if (body.type === 'payment' || body.action === 'payment.created' || body.action === 'payment.updated') {
      const paymentData = body.data;
      
      if (paymentData?.id) {
        // The external_reference in MP should be the order ID
        // We need to query Mercado Pago to get the full payment details
        // For simplicity, we handle this through the preference/order relationship
        
        console.log('Payment notification received:', paymentData.id);
      }
    }

    // Handle by external reference (order ID)
    if (body.external_reference) {
      const orderId = body.external_reference;
      const status = body.status || 'pending';

      let orderStatus = 'pending';
      if (status === 'approved') {
        orderStatus = 'approved';
      } else if (status === 'rejected' || status === 'cancelled') {
        orderStatus = 'rejected';
      } else if (status === 'in_process' || status === 'pending') {
        orderStatus = 'pending';
      }

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: orderStatus,
          mercado_pago_payment_id: body.id?.toString() || null,
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order:', error);
      } else {
        console.log('Order updated:', orderId, 'status:', orderStatus);
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
