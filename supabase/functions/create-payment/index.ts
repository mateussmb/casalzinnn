import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

interface CreatePreferenceRequest {
  weddingId: string;
  items: CartItem[];
  guestName: string;
  guestEmail?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { weddingId, items, guestName, guestEmail }: CreatePreferenceRequest = await req.json();

    if (!weddingId || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role to access wedding credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the wedding to get Mercado Pago credentials
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

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        wedding_id: weddingId,
        guest_name: guestName,
        guest_email: guestEmail || null,
        total_amount: total,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      gift_id: item.id.startsWith('envelope') ? null : item.id,
      gift_name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items error:', itemsError);
    }

    // Create Mercado Pago preference
    const preference = {
      items: items.map(item => ({
        id: item.id,
        title: item.name,
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: item.unit_price,
      })),
      payer: {
        name: guestName,
        email: guestEmail || undefined,
      },
      back_urls: {
        success: `${req.headers.get('origin')}/payment-success?order=${order.id}`,
        failure: `${req.headers.get('origin')}/payment-failure?order=${order.id}`,
        pending: `${req.headers.get('origin')}/payment-pending?order=${order.id}`,
      },
      auto_return: "approved",
      external_reference: order.id,
      statement_descriptor: `Presente ${wedding.couple_name}`.substring(0, 22),
      notification_url: `${supabaseUrl}/functions/v1/payment-webhook`,
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wedding.mercado_pago_access_token}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error('Mercado Pago error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment preference', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mpData = await mpResponse.json();

    // Update order with preference ID
    await supabase
      .from('orders')
      .update({ mercado_pago_preference_id: mpData.id })
      .eq('id', order.id);

    return new Response(
      JSON.stringify({
        preferenceId: mpData.id,
        initPoint: mpData.init_point,
        sandboxInitPoint: mpData.sandbox_init_point,
        orderId: order.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
