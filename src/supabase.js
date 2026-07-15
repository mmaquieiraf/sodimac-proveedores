import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://zpxptembhqlmpkbctvml.supabase.co';
const supabaseKey = 'sb_publishable_KGTeAmtcEyxPx1CMN_vmXw_akhi8aH5';

export const supabase = createClient(supabaseUrl, supabaseKey);