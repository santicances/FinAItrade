import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hxgzvdjupioyplamdafe.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_GbcO39yL5TVVN1AwCcfulg_c6q8VeQk'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_c_WZN4wWKj717ZxNpITZqg_KVQy3xaz'

// Client for browser (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server operations (uses service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Types for our database
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
