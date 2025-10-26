'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  CreditCard, 
  Banknote, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  pendingDeposits: number
  pendingWithdrawals: number
  totalDeposits: number
  totalWithdrawals: number
  activePlans: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activePlans: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        usersResult,
        pendingDepositsResult,
        pendingWithdrawalsResult,
        totalDepositsResult,
        totalWithdrawalsResult,
        activePlansResult
      ] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('deposits').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('deposits').select('amount').eq('status', 'approved'),
        supabase.from('withdrawals').select('amount').eq('status', 'approved'),
        supabase.from('plans').select('id', { count: 'exact', head: true }).eq('status', 'Active')
      ])

      const totalDepositsAmount = totalDepositsResult.data?.reduce((sum, deposit) => sum + deposit.amount, 0) || 0
      const totalWithdrawalsAmount = totalWithdrawalsResult.data?.reduce((sum, withdrawal) => sum + withdrawal.amount, 0) || 0

      setStats({
        totalUsers: usersResult.count || 0,
        pendingDeposits: pendingDepositsResult.count || 0,
        pendingWithdrawals: pendingWithdrawalsResult.count || 0,
        totalDeposits: totalDepositsAmount,
        totalWithdrawals: totalWithdrawalsAmount,
        activePlans: activePlansResult.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/users'
    },
    {
      title: 'Pending Deposits',
      value: stats.pendingDeposits.toLocaleString(),
      icon: Clock,
      color: 'bg-yellow-500',
      href: '/admin/deposits'
    },
    {
      title: 'Pending Withdrawals',
      value: stats.pendingWithdrawals.toLocaleString(),
      icon: Clock,
      color: 'bg-orange-500',
      href: '/admin/withdrawals'
    },
    {
      title: 'Active Plans',
      value: stats.activePlans.toLocaleString(),
      icon: TrendingUp,
      color: 'bg-green-500',
      href: '/admin/plans'
    }
  ]

  const financialCards = [
    {
      title: 'Total Deposits',
      value: formatCurrency(stats.totalDeposits),
      icon: CheckCircle,
      color: 'bg-green-600'
    },
    {
      title: 'Total Withdrawals',
      value: formatCurrency(stats.totalWithdrawals),
      icon: XCircle,
      color: 'bg-red-600'
    },
    {
      title: 'Net Revenue',
      value: formatCurrency(stats.totalDeposits - stats.totalWithdrawals),
      icon: DollarSign,
      color: 'bg-purple-600'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-pulse">
              <div className="h-4 bg-white/20 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-white/20 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <div className="text-sm text-white/60">
          SmartGrow Mining Management Panel
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ title, value, icon: Icon, color, href }) => (
          <Link
            key={title}
            href={href}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className={`${color} rounded-lg p-3 mr-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Financial Overview */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {financialCards.map(({ title, value, icon: Icon, color }) => (
            <div
              key={title}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center">
                <div className={`${color} rounded-lg p-3 mr-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{title}</p>
                  <p className="text-xl font-bold text-white">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/deposits"
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 hover:bg-yellow-500/20 transition-colors backdrop-blur-xl"
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="font-medium text-white">Review Deposits</p>
                <p className="text-sm text-yellow-300">{stats.pendingDeposits} pending approval</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/withdrawals"
            className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 hover:bg-orange-500/20 transition-colors backdrop-blur-xl"
          >
            <div className="flex items-center space-x-3">
              <Banknote className="w-5 h-5 text-orange-400" />
              <div>
                <p className="font-medium text-white">Review Withdrawals</p>
                <p className="text-sm text-orange-300">{stats.pendingWithdrawals} pending approval</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/plans"
            className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 hover:bg-green-500/20 transition-colors backdrop-blur-xl"
          >
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <div>
                <p className="font-medium text-white">Manage Plans</p>
                <p className="text-sm text-green-300">{stats.activePlans} active plans</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* System Status */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium text-white">All systems operational</span>
          </div>
          <p className="text-sm text-white/80 mt-2">
            SmartGrow Mining platform is running smoothly. All services are available.
          </p>
        </div>
      </div>
    </div>
  )
}
