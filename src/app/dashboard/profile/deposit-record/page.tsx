'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft,
  Upload,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Smartphone,
  Building2
} from 'lucide-react'

interface Deposit {
  id: number
  amount_pkr: number
  deposit_type: string
  status: string
  created_at: string
  updated_at: string
  proof_url?: string
  admin_notes?: string
}

export default function DepositRecordPage() {
  const [user, setUser] = useState<any>(null)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
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

      // Fetch deposits using API
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/deposits?page=1&limit=100', { headers })
      
      if (response.ok) {
        const data = await response.json()
        const depositData = data.deposits || []
        setDeposits(depositData)
        
        // Calculate stats
        const total = depositData.reduce((sum: number, d: Deposit) => sum + d.amount_pkr, 0)
        const pending = depositData.filter((d: Deposit) => d.status === 'pending').length
        const approved = depositData.filter((d: Deposit) => d.status === 'approved').length
        const rejected = depositData.filter((d: Deposit) => d.status === 'rejected').length
        
        setStats({ total, pending, approved, rejected })
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
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
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
      case 'approved':
        return 'text-green-400 bg-green-500/20 border-green-500/50'
      case 'rejected':
        return 'text-red-400 bg-red-500/20 border-red-500/50'
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/50'
    }
  }

  const getDepositTypeIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-5 h-5 text-blue-400" />
      case 'easypaisa':
      case 'jazzcash':
        return <Smartphone className="w-5 h-5 text-green-400" />
      case 'usdt':
        return <CreditCard className="w-5 h-5 text-purple-400" />
      default:
        return <DollarSign className="w-5 h-5 text-gray-400" />
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
                Deposit Record
              </h1>
              <p className="text-xs text-slate-400">View your deposit history</p>
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
                <p className="text-sm text-slate-400">Approved</p>
                <p className="text-lg font-bold text-white">{stats.approved}</p>
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

        {/* Deposits List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Deposit History</h2>
          
          {deposits.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 border border-white/20 text-center">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">No deposits found</p>
              <p className="text-sm text-slate-500 mt-2">Your deposit history will appear here</p>
            </div>
          ) : (
            deposits.map((deposit) => (
              <div key={deposit.id} className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getStatusIcon(deposit.status)}
                      <div>
                        <h3 className="font-semibold text-white">
                          {formatCurrency(deposit.amount_pkr)}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {getDepositTypeIcon(deposit.deposit_type)}
                          <p className="text-sm text-slate-400">
                            {deposit.deposit_type?.toUpperCase()} Deposit
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Deposit ID</p>
                        <p className="text-white font-medium">#{deposit.id}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Date</p>
                        <p className="text-white font-medium">{formatDate(deposit.created_at)}</p>
                      </div>
                    </div>

                    {deposit.admin_notes && (
                      <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-slate-400 text-xs">Admin Notes:</p>
                        <p className="text-white text-sm">{deposit.admin_notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(deposit.status)}`}>
                    {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
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
