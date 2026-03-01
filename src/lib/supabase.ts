import { createClient } from '@supabase/supabase-js'

// Estas variables se leerán de Vercel o de tu archivo .env local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validación de seguridad para que sepas si te falta configurar algo
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '⚠️ Alerta: Faltan las variables de entorno de Supabase. ' +
        'Asegúrate de configurarlas en el panel de Vercel.'
    )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)