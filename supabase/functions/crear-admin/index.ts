import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  // Reemplazamos el asterisco por tu dominio de producción real
  'Access-Control-Allow-Origin': 'https://sodimac-proveedores-tau.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Manejo de CORS (Respuesta pre-vuelo para el navegador)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    // 2. EXTRAER EL TOKEN DE SEGURIDAD EXPLICITAMENTE
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Acceso denegado: No se recibió el token de seguridad desde la web.')
    }
    
    // Limpiamos el prefijo 'Bearer ' para obtener solo la llave limpia
    const token = authHeader.replace('Bearer ', '')

    // 3. Crear cliente básico
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // 4. SOLUCIÓN RAÍZ: Inyectar el token directo a la función getUser
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error("Rechazo por Token inválido:", userError)
      return new Response(JSON.stringify({ error: 'Credencial inválida o expirada.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 5. Barrera de Privilegios (Verificamos que seas tú)
    const esSuperAdmin = user.email === 'mmaquieiraf@sodimac.cl' || user.email === 'matiasignaciof01@gmail.com';
    if (!esSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Privilegios insuficientes.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 6. Cliente Admin Absoluto (Solo existe en el servidor para crear la cuenta)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })

    if (createError) throw createError

    return new Response(JSON.stringify({ success: true, user: newUser }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error) {
    console.error("Error General del Servidor:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})