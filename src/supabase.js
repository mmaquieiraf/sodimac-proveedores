import { createClient } from '@supabase/supabase-js'

// 1. URL base limpia (cortada justo antes del /rest)
const supabaseUrl = 'https://zpxptembhqlmpkbctvml.supabase.co' 

// 2. Tu nueva API Key
const supabaseKey = 'sb_publishable_KGTeAmtcEyxPx1CMN_vmXw_akhi8aH5' 

export const supabase = createClient(supabaseUrl, supabaseKey)