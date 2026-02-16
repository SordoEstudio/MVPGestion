import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltan variables de Supabase. Creá .env.local en la raíz del proyecto (junto a package.json) con:\n\n' +
    'NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key\n\n' +
    'Obtenelas en supabase.com → Tu proyecto → Settings → API. Reiniciá el servidor después de guardar.'
  )
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)
