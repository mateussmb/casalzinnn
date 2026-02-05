import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
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
  guestEmail: z.string().email().max(255).optional().or(z.literal('')).transform(val => val || undefined),
});

// Sanitize string for safe storage/display
const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
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
    
    const validationResult = CreatePaymentSchema.safeParse(rawBody);
    
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

    const { weddingId, items, guestName, guestEmail } = validationResult.data;

    // Sanitize user-provided strings
    const sanitizedGuestName = sanitizeString(guestName);
    const sanitizedGuestEmail = guestEmail ? sanitizeString(guestEmail) : undefined;

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

    // Verify items against the gift database to prevent price manipulation
    const giftIds = items.filter(i => !i.id.startsWith('envelope')).map(i => i.id);
    
    if (giftIds.length > 0) {
      const { data: gifts, error: giftsError } = await supabase
        .from('gifts')
        .select('id, price, name')
        .in('id', giftIds)
        .eq('wedding_id', weddingId);

      if (giftsError) {
        console.error('Gifts fetch error:', giftsError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify gift prices' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify each gift price matches database
      for (const item of items) {
        if (item.id.startsWith('envelope')) continue; // Custom envelope amounts
        
        const gift = gifts?.find(g => g.id === item.id);
        if (!gift) {
          return new Response(
            JSON.stringify({ error: `Gift not found: ${item.id}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Allow small floating point differences
        if (Math.abs(Number(gift.price) - item.unit_price) > 0.01) {
          console.error('Price mismatch:', { item, dbPrice: gift.price });
          return new Response(
            JSON.stringify({ error: 'Price mismatch detected' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Calculate total server-side (don't trust client)
    const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        wedding_id: weddingId,
        guest_name: sanitizedGuestName,
        guest_email: sanitizedGuestEmail || null,
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

    // Create order items with sanitized names
    const orderItems = items.map(item => ({
      order_id: order.id,
      gift_id: item.id.startsWith('envelope') ? null : item.id,
      gift_name: sanitizeString(item.name),
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
        title: sanitizeString(item.name),
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: item.unit_price,
      })),
      payer: {
        name: sanitizedGuestName,
        email: sanitizedGuestEmail || undefined,
      },
      back_urls: {
        success: `${req.headers.get('origin')}/payment-success?order=${order.id}`,
        failure: `${req.headers.get('origin')}/payment-failure?order=${order.id}`,
        pending: `${req.headers.get('origin')}/payment-pending?order=${order.id}`,
      },
      auto_return: "approved",
      external_reference: order.id,
      statement_descriptor: `Presente ${sanitizeString(wedding.couple_name)}`.substring(0, 22),
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
        JSON.stringify({ error: 'Failed to create payment preference' }),
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
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
