'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft,
  Download,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface Withdrawal {
  id: number
  amount: number
  status: string
  created_at: string
  updated_at: string
  account_type: string
  account_name: string
  account_number: string
}

export default function WithdrawalRecordPage() {
  const [user, setUser] = useState<any>(null)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0
  })
  
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { user } = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Fetch withdrawals
      const { data: withdrawalData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (withdrawalData) {
        setWithdrawals(withdrawalData)
        
        // Calculate stats
        const total = withdrawalData.reduce((sum, w) => sum + w.amount, 0)
        const pending = withdrawalData.filter(w => w.status === 'pending').length
        const completed = withdrawalData.filter(w => w.status === 'completed').length
        const rejected = withdrawalData.filter(w => w.status === 'rejected').length
        
        setStats({ total, pending, completed, rejected })
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Karachi' // Pakistan timezone
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20 border-green-500/50'
      case 'rejected':
        return 'text-red-400 bg-red-500/20 border-red-500/50'
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-blue-900 border-b-2 border-blue-400 sticky top-0 z-40" style={{boxShadow: '0 2px 20px rgba(59, 130, 246, 0.5)'}}>
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/profile">
              <ArrowLeft className="w-6 h-6 text-white hover:text-blue-200 transition-colors" />
            </Link>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Withdrawal Record
              </h1>
              <p className="text-xs text-slate-400">View your withdrawal history</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Total Amount</p>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.total)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-sm text-slate-400">Pending</p>
                <p className="text-lg font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Completed</p>
                <p className="text-lg font-bold text-white">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-sm text-slate-400">Rejected</p>
                <p className="text-lg font-bold text-white">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Withdrawal History</h2>
          
          {withdrawals.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 border border-white/20 text-center">
              <Download className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">No withdrawals found</p>
              <p className="text-sm text-slate-500 mt-2">Your withdrawal history will appear here</p>
            </div>
          ) : (
            withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {getStatusIcon(withdrawal.status)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm">
                        {withdrawal.account_type?.toUpperCase()} Withdrawal
                      </h3>
                      <p className="text-xs text-slate-400">
                        {formatDate(withdrawal.created_at)} • {withdrawal.account_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-white text-sm">
                      {formatCurrency(withdrawal.amount)}
                    </p>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
