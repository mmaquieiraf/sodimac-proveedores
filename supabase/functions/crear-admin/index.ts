import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// 1. Configuración de CORS para permitir que tu web en Vercel se comunique con la función
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Respuesta rápida a las peticiones pre-flight (CORS) del navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Extraer los datos enviados desde React
    const { email, password } = await req.json()

    // 3. Crear un cliente Supabase básico para VALIDAR quién está haciendo la petición
    // Usamos el token JWT que viene en la cabecera 'Authorization' desde React
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verificar la sesión del usuario actual
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Sesión inválida.' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 4. BARRERA DE SEGURIDAD ABSOLUTA: Validación de SuperAdmin
    // Nadie más en el mundo, excepto este correo, podrá ejecutar la creación
    if (user.email !== 'mmaquieiraf@sodimac.cl') {
      return new Response(JSON.stringify({ error: 'Privilegios insuficientes. Solo el Super Admin puede crear usuarios.' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 5. Crear el cliente ADMIN (Poderes Absolutos) usando Service Role
    // Esta llave vive SOLO en el servidor de Supabase, nunca viaja al navegador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 6. Crear el nuevo usuario directamente en Auth y auto-confirmarlo
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Equivalente a lo que hicimos manual en el panel
    })

    if (createError) throw createError

    // 7. Retornar éxito
    return new Response(JSON.stringify({ success: true, user: newUser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})