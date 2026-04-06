import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pmchfdifassjxhlopexy.supabase.co'
const supabaseKey = 'sb_publishable_h_MrP3EPQuD_7FZghmf9nQ_zA8OFkpp'

export const supabase = createClient(supabaseUrl, supabaseKey)
