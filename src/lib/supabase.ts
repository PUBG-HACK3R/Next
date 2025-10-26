import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          balance: number
          referred_by: string | null
          referral_code: string
          user_level: number
          withdrawal_account_type: string | null
          withdrawal_account_name: string | null
          withdrawal_account_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          balance?: number
          referred_by?: string | null
          referral_code?: string
          user_level?: number
          withdrawal_account_type?: string | null
          withdrawal_account_name?: string | null
          withdrawal_account_number?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          balance?: number
          referred_by?: string | null
          referral_code?: string
          user_level?: number
          withdrawal_account_type?: string | null
          withdrawal_account_name?: string | null
          withdrawal_account_number?: string | null
        }
      }
      plans: {
        Row: {
          id: number
          name: string
          duration_days: number
          profit_percent: number
          min_investment: number
          capital_return: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          duration_days: number
          profit_percent: number
          min_investment: number
          capital_return?: boolean
          status?: string
        }
        Update: {
          name?: string
          duration_days?: number
          profit_percent?: number
          min_investment?: number
          capital_return?: boolean
          status?: string
        }
      }
      investments: {
        Row: {
          id: number
          user_id: string
          plan_id: number
          amount_invested: number
          status: string
          start_date: string
          end_date: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          plan_id: number
          amount_invested: number
          status?: string
          start_date?: string
          end_date?: string | null
        }
        Update: {
          user_id?: string
          plan_id?: number
          amount_invested?: number
          status?: string
          start_date?: string
          end_date?: string | null
        }
      }
      deposits: {
        Row: {
          id: number
          user_id: string
          amount: number
          sender_name: string
          sender_last_4_digits: string
          proof_url: string | null
          status: string
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          amount: number
          sender_name: string
          sender_last_4_digits: string
          proof_url?: string | null
          status?: string
          rejection_reason?: string | null
        }
        Update: {
          user_id?: string
          amount?: number
          sender_name?: string
          sender_last_4_digits?: string
          proof_url?: string | null
          status?: string
          rejection_reason?: string | null
        }
      }
      withdrawals: {
        Row: {
          id: number
          user_id: string
          amount: number
          status: string
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          amount: number
          status?: string
          rejection_reason?: string | null
        }
        Update: {
          user_id?: string
          amount?: number
          status?: string
          rejection_reason?: string | null
        }
      }
      admin_settings: {
        Row: {
          id: number
          referral_l1_percent: number
          referral_l2_percent: number
          referral_l3_percent: number
          min_deposit_amount: number
          min_withdrawal_amount: number
          withdrawal_fee_percent: number
          max_investment_amount: number
          deposit_details: any
          whatsapp_support_number: string | null
          whatsapp_group_link: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          referral_l1_percent?: number
          referral_l2_percent?: number
          referral_l3_percent?: number
          min_deposit_amount?: number
          min_withdrawal_amount?: number
          withdrawal_fee_percent?: number
          max_investment_amount?: number
          deposit_details?: any
          whatsapp_support_number?: string | null
          whatsapp_group_link?: string | null
        }
        Update: {
          id?: number
          referral_l1_percent?: number
          referral_l2_percent?: number
          referral_l3_percent?: number
          min_deposit_amount?: number
          min_withdrawal_amount?: number
          withdrawal_fee_percent?: number
          max_investment_amount?: number
          deposit_details?: any
          whatsapp_support_number?: string | null
          whatsapp_group_link?: string | null
        }
      }
      referral_commissions: {
        Row: {
          id: number
          user_id: string
          referrer_id: string
          deposit_id: number
          commission_amount: number
          commission_level: number
          commission_percent: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          referrer_id: string
          deposit_id: number
          commission_amount: number
          commission_level: number
          commission_percent: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          referrer_id?: string
          deposit_id?: number
          commission_amount?: number
          commission_level?: number
          commission_percent?: number
          created_at?: string
        }
      }
    }
  }
}
