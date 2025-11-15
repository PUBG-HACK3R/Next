import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export interface Investment {
  id: number
  user_id: string
  plan_id: number
  amount_invested: number
  status: string
  start_date: string
  end_date: string | null
  last_income_collection_date: string | null
  total_days_collected: number | null
  daily_profit_amount: number | null
  created_at: string
  updated_at: string
  plans: {
    name: string
    duration_days: number
    profit_percent: number
    capital_return: boolean
  }
}

export interface InvestmentStats {
  totalInvested: number
  activeInvestments: number
  completedInvestments: number
  totalEarnings: number
}

// Auto-update expired investments
const updateExpiredInvestments = async (userId: string) => {
  const now = new Date()
  await supabase
    .from('investments')
    .update({ status: 'completed' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .lte('end_date', now.toISOString())
}

// Fetch all investments
const fetchInvestments = async (): Promise<Investment[]> => {
  const { user } = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Update expired investments first
  await updateExpiredInvestments(user.id)

  const { data, error } = await supabase
    .from('investments')
    .select(`
      *,
      plans (
        name,
        duration_days,
        profit_percent,
        capital_return
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Fetch completed investments
const fetchCompletedInvestments = async (): Promise<Investment[]> => {
  const { user } = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Update expired investments first
  await updateExpiredInvestments(user.id)

  const { data, error } = await supabase
    .from('investments')
    .select(`
      *,
      plans (
        name,
        duration_days,
        profit_percent,
        capital_return
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['completed', 'expired'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Calculate investment statistics
const calculateStats = (investments: Investment[]): InvestmentStats => {
  return investments.reduce(
    (stats, investment) => {
      stats.totalInvested += investment.amount_invested
      
      if (investment.status === 'active') {
        stats.activeInvestments += 1
      } else if (investment.status === 'completed') {
        stats.completedInvestments += 1
        const earnings = (investment.amount_invested * investment.plans.profit_percent) / 100
        stats.totalEarnings += earnings
      }
      
      return stats
    },
    { totalInvested: 0, activeInvestments: 0, completedInvestments: 0, totalEarnings: 0 }
  )
}

// Custom hooks
export const useInvestments = () => {
  return useQuery({
    queryKey: ['investments'],
    queryFn: fetchInvestments,
    select: (data) => ({
      investments: data,
      stats: calculateStats(data)
    })
  })
}

export const useCompletedInvestments = () => {
  return useQuery({
    queryKey: ['completed-investments'],
    queryFn: fetchCompletedInvestments,
  })
}

// Collect daily income mutation
export const useCollectIncome = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ investmentId }: { investmentId: number }) => {
      const { user } = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase.rpc('collect_daily_income', {
        investment_id_param: investmentId,
        user_id_param: user.id
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch investment data
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['completed-investments'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    }
  })
}
