import { createClient } from '@supabase/supabase-js'

// USAR SOLO LAS VARIABLES DE ENTORNO. NO PONGAS LAS LLAVES REALES AQUÍ.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Fallback seguro para que el Build no explote
const fallbackUrl = 'https://placeholder-project.supabase.co'

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || 'placeholder-key'
)

export const supabaseAdmin = createClient(
  supabaseUrl || fallbackUrl,
  supabaseServiceKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
// --- Tus Tipos (Se mantienen igual) ---
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          credits: number
          free_credits: number
          tokens_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string
          credits?: number
          free_credits?: number
          tokens_used?: number
        }
        Update: {
          name?: string
          credits?: number
          free_credits?: number
          tokens_used?: number
        }
      }
      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          operation_type: string
          status: string
          model: string
          model_id: string
          asset: string
          asset_id: string
          asset_type: string
          prompt: string
          tv_symbol: string
          provider: string
          timeframe: string
          candle_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          operation_type: string
          status?: string
          model: string
          model_id: string
          asset: string
          asset_id: string
          asset_type: string
          prompt?: string
          tv_symbol: string
          provider: string
          timeframe: string
          candle_count?: number
        }
        Update: {
          name?: string
          type?: string
          operation_type?: string
          status?: string
          model?: string
          model_id?: string
          prompt?: string
          timeframe?: string
          candle_count?: number
        }
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          agent_name: string
          asset: string
          tv_symbol: string
          provider: string
          direction: string
          confidence: number
          entry: number
          stop_loss: number
          take_profit: number
          risk_reward: number
          analysis: string
          timeframe: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          agent_name: string
          asset: string
          tv_symbol: string
          provider: string
          direction: string
          confidence: number
          entry: number
          stop_loss: number
          take_profit: number
          risk_reward: number
          analysis: string
          timeframe: string
        }
      }
    }
  }
}