import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export interface UserProfile {
  id: string
  full_name: string
  balance: number
  earned_balance: number
  user_level: number
  referral_code: string
  referred_by: string | null
}

export interface EarningsStats {
  todayEarnings: number
  yesterdayEarnings: number
  totalExpiredEarnings: number
}

// Fetch user profile
const fetchUserProfile = async (): Promise<UserProfile> => {
  const { user } = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, balance, earned_balance, user_level, referral_code, referred_by')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

// Fetch earnings statistics
const fetchEarningsStats = async (): Promise<EarningsStats> => {
  const { user } = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data: incomeData, error } = await supabase
    .from('income_transactions')
    .select('amount, created_at')
    .eq('user_id', user.id)

  if (error) throw error

  let todayEarnings = 0
  let yesterdayEarnings = 0
  let totalExpiredEarnings = 0

  if (incomeData) {
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const yesterday = new Date(today)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    incomeData.forEach(income => {
      const amount = income.amount
      const incomeDate = new Date(income.created_at)
      
      if (incomeDate >= today && incomeDate < tomorrow) {
        todayEarnings += amount
      } else if (incomeDate >= yesterday && incomeDate < today) {
        yesterdayEarnings += amount
      }
      
      totalExpiredEarnings += amount
    })
  }

  return {
    todayEarnings,
    yesterdayEarnings,
    totalExpiredEarnings
  }
}

// Custom hooks
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
  })
}

export const useEarningsStats = () => {
  return useQuery({
    queryKey: ['earnings-stats'],
    queryFn: fetchEarningsStats,
  })
}
