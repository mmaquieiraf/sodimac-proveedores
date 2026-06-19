import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vmpeuldqbeorltqfeaqv.supabase.co'
const supabaseKey = 'sb_publishable_09VlvwjashudTHU9x_RuzQ_-5jwJS0O'

export const supabase = createClient(supabaseUrl, supabaseKey)