'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { 
  Users, 
  Search, 
  Edit, 
  Eye, 
  DollarSign,
  TrendingUp,
  Calendar,
  Shield,
  RefreshCw,
  Key,
  Lock,
  Unlock
} from 'lucide-react'

interface User {
  id: string
  full_name: string
  balance: number
  user_level: number
  referred_by: string | null
  withdrawal_account_type: string | null
  withdrawal_account_name: string | null
  withdrawal_account_number: string | null
  created_at: string
  email?: string
  suspended?: boolean
  suspended_at?: string
  suspension_reason?: string
}

interface UserStats {
  totalDeposits: number
  totalWithdrawals: number
  activeInvestments: number
  referralCount: number
}

interface PasswordInfo {
  user_id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  password_info: {
    has_password: boolean
    last_password_change: string
    note: string
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [editingBalance, setEditingBalance] = useState(false)
  const [newBalance, setNewBalance] = useState('')
  const [updating, setUpdating] = useState(false)
  const [editingWithdrawal, setEditingWithdrawal] = useState(false)
  const [withdrawalDetails, setWithdrawalDetails] = useState({
    type: '',
    name: '',
    number: ''
  })
  const [passwordInfo, setPasswordInfo] = useState<PasswordInfo | null>(null)
  const [showPasswordInfo, setShowPasswordInfo] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [suspending, setSuspending] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [showSuspensionModal, setShowSuspensionModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm])

  const fetchUsers = async () => {
    try {
      // Method 1: Try to use the admin view with emails
      const { data: usersWithEmail, error: viewError } = await supabase
        .from('admin_users_with_email')
        .select('*')
        .order('created_at', { ascending: false })

      if (!viewError && usersWithEmail) {
        // Map auth_email to email for consistency
        const usersWithCorrectEmail = usersWithEmail.map(user => ({
          ...user,
          email: user.auth_email || user.email || 'No email'
        }))
        setUsers(usersWithCorrectEmail)
        setLoading(false)
        return
      }

      console.log('View method failed, trying alternatives:', viewError)

      // Method 2: Try RPC function
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      if (profiles) {
        try {
          const { data: emailData, error: rpcError } = await supabase
            .rpc('get_user_emails', { user_ids: profiles.map(p => p.id) })

          if (!rpcError && emailData) {
            const usersWithEmailFromRPC = profiles.map(profile => {
              const emailInfo = emailData.find((e: any) => e.id === profile.id)
              return {
                ...profile,
                email: emailInfo?.email || 'No email found'
              }
            })
            setUsers(usersWithEmailFromRPC)
            setLoading(false)
            return
          }
        } catch (rpcError) {
          console.log('RPC method failed:', rpcError)
        }

        // Method 3: Try admin API
        try {
          const { data: authData } = await supabase.auth.admin.listUsers()
          if (authData?.users) {
            const usersWithEmailFromAdmin = profiles.map(profile => {
              const authUser = authData.users.find(u => u.id === profile.id)
              return {
                ...profile,
                email: authUser?.email || 'Email unavailable'
              }
            })
            setUsers(usersWithEmailFromAdmin)
            setLoading(false)
            return
          }
        } catch (adminError) {
          console.log('Admin API failed:', adminError)
        }

        // Fallback: Use profiles without email
        setUsers(profiles.map(p => ({ ...p, email: 'Run SQL setup for emails' })))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    }
    setLoading(false)
  }

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users)
      return
    }

    const filtered = users.filter(user =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }

  const fetchUserStats = async (userId: string) => {
    try {
      // Fetch deposits
      const { data: deposits } = await supabase
        .from('deposits')
        .select('amount_pkr')
        .eq('user_id', userId)
        .eq('status', 'approved')

      // Fetch withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'approved')

      // Fetch active investments
      const { count: activeInvestments } = await supabase
        .from('investments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')

      // Fetch referral count
      const { count: referralCount } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', userId)

      const totalDeposits = deposits?.reduce((sum, d) => sum + d.amount_pkr, 0) || 0
      const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0

      setUserStats({
        totalDeposits,
        totalWithdrawals,
        activeInvestments: activeInvestments || 0,
        referralCount: referralCount || 0
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const updateUserBalance = async () => {
    if (!selectedUser || !newBalance) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ balance: parseFloat(newBalance) })
        .eq('id', selectedUser.id)

      if (error) throw error

      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, balance: parseFloat(newBalance) }
          : u
      ))
      setSelectedUser({ ...selectedUser, balance: parseFloat(newBalance) })
      setEditingBalance(false)
      setNewBalance('')

    } catch (error: any) {
      console.error('Error updating balance:', error)
      alert('Failed to update balance: ' + error.message)
    }
    setUpdating(false)
  }

  const updateWithdrawalDetails = async () => {
    if (!selectedUser) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          withdrawal_account_type: withdrawalDetails.type || null,
          withdrawal_account_name: withdrawalDetails.name || null,
          withdrawal_account_number: withdrawalDetails.number || null
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      // Update local state
      const updatedUser = {
        ...selectedUser,
        withdrawal_account_type: withdrawalDetails.type || null,
        withdrawal_account_name: withdrawalDetails.name || null,
        withdrawal_account_number: withdrawalDetails.number || null
      }
      
      setUsers(users.map(u => 
        u.id === selectedUser.id ? updatedUser : u
      ))
      setSelectedUser(updatedUser)
      setEditingWithdrawal(false)

    } catch (error) {
      console.error('Error updating withdrawal details:', error)
    }
    setUpdating(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getUserLevelBadge = (level: number) => {
    if (level >= 999) {
      return { text: 'Admin', color: 'bg-purple-100 text-purple-800' }
    } else if (level >= 10) {
      return { text: 'VIP', color: 'bg-yellow-100 text-yellow-800' }
    } else if (level >= 5) {
      return { text: 'Premium', color: 'bg-blue-100 text-blue-800' }
    } else {
      return { text: 'Basic', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const fetchPasswordInfo = async (userId: string) => {
    setPasswordLoading(true)
    try {
      // Get current user session to pass to API
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Please log in again')
        return
      }

      const response = await fetch(`/api/admin/users/password?userId=${userId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPasswordInfo(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch password info:', errorData)
        alert('Failed to fetch password information: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error fetching password info:', error)
      alert('Error fetching password information')
    }
    setPasswordLoading(false)
  }

  const resetUserPassword = async () => {
    if (!selectedUser || !newPassword) return

    setResettingPassword(true)
    try {
      // Get current user session to pass to API
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Please log in again')
        return
      }

      const response = await fetch('/api/admin/users/password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newPassword
        })
      })

      if (response.ok) {
        alert('Password reset successfully!')
        setShowPasswordReset(false)
        setNewPassword('')
      } else {
        const error = await response.json()
        alert('Failed to reset password: ' + error.error)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Error resetting password')
    }
    setResettingPassword(false)
  }

  const suspendUser = async () => {
    if (!selectedUser) return

    setSuspending(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          suspended: true,
          suspended_at: new Date().toISOString(),
          suspension_reason: suspensionReason || 'Suspended by admin'
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      // Update local state
      const updatedUser = {
        ...selectedUser,
        suspended: true,
        suspended_at: new Date().toISOString(),
        suspension_reason: suspensionReason
      }
      
      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u))
      setSelectedUser(updatedUser)
      setShowSuspensionModal(false)
      setSuspensionReason('')
      alert('User suspended successfully!')
    } catch (error: any) {
      console.error('Error suspending user:', error)
      alert('Failed to suspend user: ' + error.message)
    }
    setSuspending(false)
  }

  const unsuspendUser = async () => {
    if (!selectedUser) return

    setSuspending(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          suspended: false,
          suspended_at: null,
          suspension_reason: null
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      // Update local state
      const updatedUser = {
        ...selectedUser,
        suspended: false,
        suspended_at: undefined,
        suspension_reason: undefined
      }
      
      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u))
      setSelectedUser(updatedUser)
      alert('User unsuspended successfully!')
    } catch (error: any) {
      console.error('Error unsuspending user:', error)
      alert('Failed to unsuspend user: ' + error.message)
    }
    setSuspending(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {filteredUsers.length} Users
          </div>
          <button
            onClick={fetchUsers}
            className="p-2 text-gray-800 hover:text-gray-900"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const levelBadge = getUserLevelBadge(user.user_level)
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-700">{user.email}</div>
                        <div className="text-xs text-gray-800">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(user.balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${levelBadge.color}`}>
                        {levelBadge.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          fetchUserStats(user.id)
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-700">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No users have registered yet.'}
            </p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-full overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">User Details</h3>
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setUserStats(null)
                    setEditingBalance(false)
                    setNewBalance('')
                    setPasswordInfo(null)
                    setShowPasswordInfo(false)
                    setShowPasswordReset(false)
                    setNewPassword('')
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-900 font-medium">Name:</span> <span className="font-medium">{selectedUser.full_name}</span></div>
                    <div><span className="text-gray-900 font-medium">Email:</span> <span className="font-medium">{selectedUser.email}</span></div>
                    <div><span className="text-gray-900 font-medium">User ID:</span> <span className="font-mono text-xs">{selectedUser.id}</span></div>
                    <div><span className="text-gray-900 font-medium">Level:</span> <span className="font-medium">{selectedUser.user_level}</span></div>
                    <div><span className="text-gray-900 font-medium">Joined:</span> <span className="font-medium">{formatDate(selectedUser.created_at)}</span></div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Account Balance</h4>
                  <div className="flex items-center space-x-3">
                    {editingBalance ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={newBalance}
                          onChange={(e) => setNewBalance(e.target.value)}
                          placeholder={selectedUser.balance.toString()}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={updateUserBalance}
                          disabled={updating}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {updating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingBalance(false)
                            setNewBalance('')
                          }}
                          className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(selectedUser.balance)}
                        </span>
                        <button
                          onClick={() => {
                            setEditingBalance(true)
                            setNewBalance(selectedUser.balance.toString())
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Withdrawal Account */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Withdrawal Account</h4>
                  <button
                    onClick={() => {
                      setEditingWithdrawal(true)
                      setWithdrawalDetails({
                        type: selectedUser.withdrawal_account_type || '',
                        name: selectedUser.withdrawal_account_name || '',
                        number: selectedUser.withdrawal_account_number || ''
                      })
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                {editingWithdrawal ? (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                      <select
                        value={withdrawalDetails.type}
                        onChange={(e) => setWithdrawalDetails({...withdrawalDetails, type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Select Type</option>
                        <option value="bank">Bank Account</option>
                        <option value="easypaisa">EasyPaisa</option>
                        <option value="jazzcash">JazzCash</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                      <input
                        type="text"
                        value={withdrawalDetails.name}
                        onChange={(e) => setWithdrawalDetails({...withdrawalDetails, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Account holder name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={withdrawalDetails.number}
                        onChange={(e) => setWithdrawalDetails({...withdrawalDetails, number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Account number or mobile number"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={updateWithdrawalDetails}
                        disabled={updating}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingWithdrawal(false)}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedUser.withdrawal_account_type ? (
                      <div className="space-y-1 text-sm">
                        <div><span className="text-gray-900 font-medium">Type:</span> <span className="font-medium">{selectedUser.withdrawal_account_type?.toUpperCase()}</span></div>
                        <div><span className="text-gray-900 font-medium">Name:</span> <span className="font-medium">{selectedUser.withdrawal_account_name}</span></div>
                        <div><span className="text-gray-900 font-medium">Number:</span> <span className="font-medium">{selectedUser.withdrawal_account_number}</span></div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No withdrawal account set</p>
                    )}
                  </div>
                )}
              </div>

              {/* Password Management */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Password Management</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setShowPasswordInfo(true)
                        fetchPasswordInfo(selectedUser.id)
                      }}
                      disabled={passwordLoading}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{passwordLoading ? 'Loading...' : 'Show Password Info'}</span>
                    </button>
                    <button
                      onClick={() => setShowPasswordReset(true)}
                      className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                    >
                      <Key className="w-4 h-4" />
                      <span>Reset Password</span>
                    </button>
                  </div>

                  {/* Password Info Modal */}
                  {showPasswordInfo && passwordInfo && (
                    <div className="mt-4 p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">Password Information</h5>
                        <button
                          onClick={() => {
                            setShowPasswordInfo(false)
                            setPasswordInfo(null)
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium text-gray-700">Email:</span> {passwordInfo.email}</div>
                        <div><span className="font-medium text-gray-700">Account Created:</span> {formatDate(passwordInfo.created_at)}</div>
                        <div><span className="font-medium text-gray-700">Last Sign In:</span> {passwordInfo.last_sign_in_at ? formatDate(passwordInfo.last_sign_in_at) : 'Never'}</div>
                        <div><span className="font-medium text-gray-700">Email Confirmed:</span> {passwordInfo.email_confirmed_at ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium text-gray-700">Password Status:</span> {passwordInfo.password_info.has_password ? 'Set' : 'Not Set'}</div>
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-xs text-yellow-800">{passwordInfo.password_info.note}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Password Reset Modal */}
                  {showPasswordReset && (
                    <div className="mt-4 p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">Reset User Password</h5>
                        <button
                          onClick={() => {
                            setShowPasswordReset(false)
                            setNewPassword('')
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min 6 characters)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={resetUserPassword}
                            disabled={resettingPassword || !newPassword || newPassword.length < 6}
                            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            {resettingPassword ? 'Resetting...' : 'Reset Password'}
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordReset(false)
                              setNewPassword('')
                            }}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-xs text-red-800">⚠️ This will immediately change the user's password. The user will need to use the new password to log in.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Stats */}
              {userStats && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-600">{formatCurrency(userStats.totalDeposits)}</div>
                      <div className="text-xs text-gray-900 font-medium">Total Deposits</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-red-600">{formatCurrency(userStats.totalWithdrawals)}</div>
                      <div className="text-xs text-gray-900 font-medium">Total Withdrawals</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">{userStats.activeInvestments}</div>
                      <div className="text-xs text-gray-900 font-medium">Active Investments</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-purple-600">{userStats.referralCount}</div>
                      <div className="text-xs text-gray-900 font-medium">Referrals</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
