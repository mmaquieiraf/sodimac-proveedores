import { createClient } from '@supabase/supabase-js'

// 1. Vite lee la URL desde tu archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// 2. Vite lee la API Key desde tu archivo .env
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);