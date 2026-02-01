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
    const body = await req.json();
    const { type, data } = body;

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (type === 'payment') {
      const paymentId = data.id;
      const status = data.status;
      const externalReference = data.external_reference; // weddingId

      // Map Mercado Pago status to our status
      let orderStatus = 'pending';
      if (status === 'approved') {
        orderStatus = 'approved';
      } else if (status === 'rejected' || status === 'cancelled') {
        orderStatus = 'rejected';
      }

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: orderStatus,
          mercado_pago_payment_id: paymentId.toString(),
        })
        .eq('mercado_pago_preference_id', externalReference);

      if (error) {
        console.error('Error updating order:', error);
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
