'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader,
  DollarSign,
  Calendar,
  TrendingUp
} from 'lucide-react'

interface User {
  id: string
  full_name: string
  email: string
  balance: number
}

interface Plan {
  id: number
  name: string
  duration_days: number
  profit_percent: number
  min_investment: number
  max_investment: number
  capital_return: boolean
  status: string
}

interface Assignment {
  id: string
  user_id: string
  plan_id: number
  amount_invested: number
  status: string
  start_date: string
  end_date: string
  user?: User
  plan?: Plan
}

export default function AssignPlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await getUserProfile(user.id)
      if (!profileData || profileData.user_level < 999) {
        router.push('/dashboard')
        return
      }

      await fetchData()
    }

    checkAuth()
  }, [router])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch all users
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, balance')
        .order('created_at', { ascending: false })

      setUsers(usersData || [])

      // Fetch all plans
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false })

      setPlans(plansData || [])

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      setAssignments(assignmentsData || [])

      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAssignPlan = async () => {
    console.log('Assign Plan clicked', { selectedUser, selectedPlan, investmentAmount })
    
    if (!selectedUser || !selectedPlan || !investmentAmount) {
      setMessage({ type: 'error', text: 'Please select user, plan, and enter amount' })
      return
    }

    const amount = parseFloat(investmentAmount)
    console.log('Amount:', amount, 'Min:', selectedPlan.min_investment, 'Max:', selectedPlan.max_investment)
    
    if (isNaN(amount)) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' })
      return
    }

    if (amount < selectedPlan.min_investment || amount > selectedPlan.max_investment) {
      setMessage({
        type: 'error',
        text: `Amount must be between ${selectedPlan.min_investment} and ${selectedPlan.max_investment} PKR`
      })
      return
    }

    if (amount > selectedUser.balance) {
      setMessage({ type: 'error', text: 'User does not have sufficient balance' })
      return
    }

    try {
      setSubmitting(true)

      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + selectedPlan.duration_days)

      console.log('Creating investment:', {
        user_id: selectedUser.id,
        plan_id: selectedPlan.id,
        amount_invested: amount,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })

      // Create investment
      const { data: investment, error: investError } = await supabase
        .from('investments')
        .insert({
          user_id: selectedUser.id,
          plan_id: selectedPlan.id,
          amount_invested: amount,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        })
        .select()
        .single()

      if (investError) {
        console.error('Investment error:', investError)
        throw investError
      }

      console.log('Investment created:', investment)

      // Deduct from user balance
      const { error: balanceError } = await supabase.rpc('increment_user_balance', {
        user_id: selectedUser.id,
        amount: -amount
      })

      if (balanceError) {
        console.error('Balance error:', balanceError)
        throw balanceError
      }

      setMessage({ type: 'success', text: `Plan assigned successfully to ${selectedUser.full_name}` })
      
      // Reset form
      setSelectedUser(null)
      setSelectedPlan(null)
      setInvestmentAmount('')
      
      // Refresh data
      await fetchData()
    } catch (error: any) {
      console.error('Error assigning plan:', error)
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return

    try {
      setDeleting(assignmentId)

      const assignment = assignments.find(a => a.id === assignmentId)
      if (!assignment) return

      // Delete investment
      const { error: deleteError } = await supabase
        .from('investments')
        .delete()
        .eq('id', assignmentId)

      if (deleteError) throw deleteError

      // Refund to user balance
      const { error: refundError } = await supabase.rpc('increment_user_balance', {
        user_id: assignment.user_id,
        amount: assignment.amount_invested
      })

      if (refundError) throw refundError

      setMessage({ type: 'success', text: 'Assignment deleted and amount refunded' })
      await fetchData()
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Assign Plans to Users</h1>
        <p className="text-slate-400">Directly activate investment plans for users</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-900/30 border border-green-500 text-green-200'
              : 'bg-red-900/30 border border-red-500 text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Assignment Form */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Create New Assignment</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Select User</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {searchQuery && (
              <div className="mt-2 max-h-48 overflow-y-auto bg-slate-700 rounded-lg border border-slate-600">
                {filteredUsers.length === 0 ? (
                  <p className="p-3 text-slate-400 text-sm">No users found</p>
                ) : (
                  filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user)
                        setSearchQuery('')
                      }}
                      className="w-full text-left p-3 hover:bg-slate-600 border-b border-slate-600 last:border-b-0 transition"
                    >
                      <p className="font-medium text-white">{user.full_name}</p>
                      <p className="text-xs text-slate-300">{user.email}</p>
                      <p className="text-xs text-green-400">Balance: {user.balance} PKR</p>
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedUser && (
              <div className="mt-3 p-3 bg-blue-900/30 border border-blue-500 rounded-lg">
                <p className="font-medium text-white">{selectedUser.full_name}</p>
                <p className="text-sm text-slate-300">{selectedUser.email}</p>
                <p className="text-sm text-green-400">Balance: {selectedUser.balance} PKR</p>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="mt-2 text-xs text-blue-300 hover:text-blue-200"
                >
                  Change user
                </button>
              </div>
            )}
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Select Plan</label>
            <select
              value={selectedPlan?.id || ''}
              onChange={(e) => {
                const plan = plans.find(p => p.id === parseInt(e.target.value))
                setSelectedPlan(plan || null)
              }}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Choose a plan...</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.duration_days} days ({plan.profit_percent}%)
                </option>
              ))}
            </select>

            {selectedPlan && (
              <div className="mt-3 p-3 bg-purple-900/30 border border-purple-500 rounded-lg space-y-2">
                <p className="font-medium text-white">{selectedPlan.name}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4" />
                    {selectedPlan.duration_days} days
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <TrendingUp className="w-4 h-4" />
                    {selectedPlan.profit_percent}% profit
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <DollarSign className="w-4 h-4" />
                    Min: {selectedPlan.min_investment} PKR
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <DollarSign className="w-4 h-4" />
                    Max: {selectedPlan.max_investment} PKR
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Investment Amount */}
        {selectedPlan && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-white mb-2">Investment Amount (PKR)</label>
            <input
              type="number"
              min={selectedPlan.min_investment}
              max={selectedPlan.max_investment}
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              placeholder={`Enter amount between ${selectedPlan.min_investment} and ${selectedPlan.max_investment}`}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <p className="mt-2 text-xs text-slate-400">
              Range: {selectedPlan.min_investment} - {selectedPlan.max_investment} PKR
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleAssignPlan}
            disabled={!selectedUser || !selectedPlan || !investmentAmount || submitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Assign Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Assignments</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">User</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Plan</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Amount</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Start Date</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => {
                const user = users.find(u => u.id === assignment.user_id)
                const plan = plans.find(p => p.id === assignment.plan_id)

                return (
                  <tr key={assignment.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white">{user?.full_name || 'Unknown'}</td>
                    <td className="py-3 px-4 text-white">{plan?.name || 'Unknown'}</td>
                    <td className="py-3 px-4 text-green-400">{assignment.amount_invested} PKR</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          assignment.status === 'active'
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(assignment.start_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        disabled={deleting === assignment.id}
                        className="text-red-400 hover:text-red-300 disabled:text-slate-500"
                      >
                        {deleting === assignment.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {assignments.length === 0 && (
          <p className="text-center text-slate-400 py-8">No assignments yet</p>
        )}
      </div>
    </div>
  )
}
