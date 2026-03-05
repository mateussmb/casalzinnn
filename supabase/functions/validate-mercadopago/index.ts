import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ValidateRequest {
  accessToken: string;
  publicKey: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function is only called from the authenticated Dashboard
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ValidateRequest = await req.json();
    const { accessToken, publicKey } = body;

    if (!accessToken || !publicKey) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Credenciais não informadas. Informe a Public Key e o Access Token.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Access Token by calling Mercado Pago API
    // The /users/me endpoint returns the authenticated user's info
    const userResponse = await fetch('https://api.mercadopago.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}));
      console.error('Mercado Pago validation error:', errorData);
      
      if (userResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Access Token inválido ou expirado. Verifique suas credenciais no painel do Mercado Pago.' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Erro ao validar credenciais: ${errorData.message || 'Erro desconhecido'}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userData = await userResponse.json();

    // Validate that the public key matches the account
    // Public key format: APP_USR-XXXX or TEST-XXXX
    const isTestMode = accessToken.startsWith('TEST-') || publicKey.startsWith('TEST-');
    const isProdMode = accessToken.startsWith('APP_USR-') && publicKey.startsWith('APP_USR-');

    if (!isTestMode && !isProdMode) {
      // Mixed credentials (test + prod)
      const accessType = accessToken.startsWith('TEST-') ? 'teste' : 'produção';
      const publicType = publicKey.startsWith('TEST-') ? 'teste' : 'produção';
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Credenciais incompatíveis. O Access Token é de ${accessType} mas a Public Key é de ${publicType}. Use credenciais do mesmo ambiente.`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: `Credenciais validadas com sucesso! Conta: ${userData.email || userData.nickname || 'Verificada'}`,
        isTestMode,
        accountInfo: {
          email: userData.email,
          nickname: userData.nickname,
          countryId: userData.country_id,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: `Erro ao validar: ${errorMessage}` 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
