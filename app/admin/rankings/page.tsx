'use client'

import { useEffect, useState } from 'react'
import { Trophy, TrendingUp, Users, DollarSign, Medal, Award } from 'lucide-react'

interface RankingUser {
  user_id: string
  full_name: string
  email: string
  total_amount?: number
  referral_count?: number
}

interface RankingsData {
  deposits: RankingUser[]
  withdrawals: RankingUser[]
  referrals: RankingUser[]
}

export default function AdminRankingsPage() {
  const [rankings, setRankings] = useState<RankingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'referrals'>('deposits')

  useEffect(() => {
    fetchRankings()
  }, [])

  const fetchRankings = async () => {
    try {
      const response = await fetch('/api/admin/rankings')
      if (response.ok) {
        const data = await response.json()
        setRankings(data)
      } else {
        console.error('Failed to fetch rankings')
      }
    } catch (error) {
      console.error('Error fetching rankings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-white/60">#{rank}</span>
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const tabs = [
    { id: 'deposits', label: 'Top Deposits', icon: DollarSign },
    { id: 'withdrawals', label: 'Top Withdrawals', icon: TrendingUp },
    { id: 'referrals', label: 'Top Referrals', icon: Users },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-blue-400 mx-auto"></div>
          <p className="mt-4 text-white">Loading Rankings...</p>
        </div>
      </div>
    )
  }

  const getCurrentData = () => {
    if (!rankings) return []
    return rankings[activeTab] || []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Trophy className="w-8 h-8 text-yellow-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">User Rankings</h1>
          <p className="text-white/60">Top performing users across different categories</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Rankings Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            {(() => {
              const currentTab = tabs.find(tab => tab.id === activeTab)
              const Icon = currentTab?.icon
              return Icon ? <Icon className="w-5 h-5" /> : null
            })()}
            <span>{tabs.find(tab => tab.id === activeTab)?.label}</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-6 text-sm font-medium text-white/60">Rank</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-white/60">User</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-white/60">Email</th>
                <th className="text-right py-3 px-6 text-sm font-medium text-white/60">
                  {activeTab === 'referrals' ? 'Referrals' : 'Amount'}
                </th>
              </tr>
            </thead>
            <tbody>
              {getCurrentData().length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-white/60">
                    No data available for {activeTab}
                  </td>
                </tr>
              ) : (
                getCurrentData().map((user, index) => {
                  const rank = index + 1
                  return (
                    <tr
                      key={user.user_id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                        rank <= 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(rank)}
                          <span className="text-white font-medium">#{rank}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white font-medium">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-white/60">{user.email}</td>
                      <td className="py-4 px-6 text-right">
                        {activeTab === 'referrals' ? (
                          <span className="text-white font-semibold">
                            {user.referral_count || 0} referrals
                          </span>
                        ) : (
                          <span className="text-green-400 font-semibold">
                            {formatAmount(user.total_amount || 0)}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {getCurrentData().length > 0 && (
          <div className="p-4 bg-slate-800/30 border-t border-white/10">
            <p className="text-sm text-white/60 text-center">
              Showing top {getCurrentData().length} users in {activeTab} category
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-400/20 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-white/60">Total Deposits</p>
              <p className="text-xl font-bold text-white">
                {rankings?.deposits.length || 0} users
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-400/20 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-white/60">Total Withdrawals</p>
              <p className="text-xl font-bold text-white">
                {rankings?.withdrawals.length || 0} users
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-400/20 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-sm text-white/60">Active Referrers</p>
              <p className="text-xl font-bold text-white">
                {rankings?.referrals.length || 0} users
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
