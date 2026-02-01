import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  accessToken: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { weddingId, items, guestName, guestEmail, accessToken }: CreatePreferenceRequest = await req.json();

    if (!weddingId || !items || items.length === 0 || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

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
        success: `${req.headers.get('origin')}/payment-success`,
        failure: `${req.headers.get('origin')}/payment-failure`,
        pending: `${req.headers.get('origin')}/payment-pending`,
      },
      auto_return: "approved",
      external_reference: weddingId,
      statement_descriptor: "CASAMENTO",
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
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

    return new Response(
      JSON.stringify({
        preferenceId: mpData.id,
        initPoint: mpData.init_point,
        sandboxInitPoint: mpData.sandbox_init_point,
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
