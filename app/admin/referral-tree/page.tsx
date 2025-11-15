'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  Users,
  TrendingUp,
  DollarSign,
  Mail,
  Phone,
  Calendar,
  Loader
} from 'lucide-react'

interface UserData {
  id: string
  full_name: string
  email: string
  balance: number
  referral_code: string
  referred_by: string | null
  user_level: number
  created_at: string
}

interface ReferralUser extends UserData {
  referrals: ReferralUser[]
}

interface TreeNode {
  user: ReferralUser
  level: number
  children: TreeNode[]
}

export default function ReferralTreePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [allUsers, setAllUsers] = useState<ReferralUser[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReferrals: 0,
    totalEarnings: 0,
    topReferrer: null as any
  })

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

      await fetchReferralTree()
    }

    checkAuth()
  }, [router])

  const fetchReferralTree = async () => {
    try {
      setLoading(true)

      // Fetch all users with referral info
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, balance, referral_code, referred_by, user_level, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      const userData = (users || []) as UserData[]
      
      // Build tree structure
      const usersMap = new Map<string, ReferralUser>(
        userData.map(u => [u.id, { ...u, referrals: [] }])
      )
      const rootNodes: ReferralUser[] = []

      userData.forEach(user => {
        if (user.referred_by) {
          const referrer = usersMap.get(user.referred_by)
          if (referrer) {
            const child = usersMap.get(user.id)
            if (child) {
              referrer.referrals.push(child)
            }
          }
        } else {
          const rootUser = usersMap.get(user.id)
          if (rootUser) {
            rootNodes.push(rootUser)
          }
        }
      })

      // Convert to tree nodes
      const tree = rootNodes.map(user => buildTreeNode(user, 0))
      setTreeData(tree)

      // Calculate stats
      const totalReferrals = userData.filter(u => u.referred_by).length
      const totalEarnings = userData.reduce((sum, u) => sum + (u.balance || 0), 0)
      
      let topReferrer: (UserData & { count: number }) | null = null
      userData.forEach(u => {
        const referralCount = userData.filter(x => x.referred_by === u.id).length
        if (referralCount > (topReferrer?.count || 0)) {
          topReferrer = { ...u, count: referralCount }
        }
      })

      setStats({
        totalUsers: userData.length,
        totalReferrals,
        totalEarnings,
        topReferrer
      })

      setLoading(false)
    } catch (error) {
      console.error('Error fetching referral tree:', error)
      setLoading(false)
    }
  }

  const buildTreeNode = (user: ReferralUser, level: number): TreeNode => {
    return {
      user,
      level,
      children: (user.referrals || []).map(child => buildTreeNode(child, level + 1))
    }
  }

  const toggleNode = (userId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedNodes(newExpanded)
  }

  const filterTreeNode = (node: TreeNode, query: string): TreeNode | null => {
    const matches = 
      node.user.full_name.toLowerCase().includes(query) ||
      node.user.email.toLowerCase().includes(query) ||
      node.user.referral_code.toLowerCase().includes(query)

    const filteredChildren = node.children
      .map(child => filterTreeNode(child, query))
      .filter(Boolean) as TreeNode[]

    if (matches || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren
      }
    }

    return null
  }

  const filteredTree = treeData.map(node => filterTreeNode(node, searchQuery.toLowerCase())).filter(Boolean) as TreeNode[]

  const TreeNodeComponent = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => {
    const isExpanded = expandedNodes.has(node.user.id)
    const hasChildren = node.children.length > 0

    return (
      <div key={node.user.id} className="mb-2">
        <div
          className={`flex items-center p-3 rounded-lg border transition-all ${
            depth === 0
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500 shadow-lg'
              : 'bg-slate-800 border-slate-700 hover:border-slate-600'
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.user.id)}
              className="mr-2 p-1 hover:bg-white/10 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-white" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6 mr-2" />}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">{node.user.full_name}</p>
                <p className="text-xs text-white/70">{node.user.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            <div className="text-right">
              <p className="text-xs text-white/70">Balance</p>
              <p className="font-semibold text-white">{node.user.balance.toFixed(2)} PKR</p>
            </div>
            {hasChildren && (
              <div className="text-right">
                <p className="text-xs text-white/70">Referrals</p>
                <p className="font-semibold text-white">{node.children.length}</p>
              </div>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-2">
            {node.children.map(child => (
              <TreeNodeComponent key={child.user.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white">Loading referral tree...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Referral Tree</h1>
        <p className="text-slate-400">View and manage the complete referral network</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 border border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4 border border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4 border border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Balance</p>
              <p className="text-2xl font-bold text-white">{stats.totalEarnings.toFixed(0)} PKR</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-4 border border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Top Referrer</p>
              <p className="text-lg font-bold text-white">{stats.topReferrer?.full_name || 'N/A'}</p>
              <p className="text-xs text-orange-100">{stats.topReferrer?.count || 0} referrals</p>
            </div>
            <Users className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, or referral code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Referral Tree */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Referral Network</h2>
        
        {filteredTree.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No referral data found</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredTree.map(node => (
              <TreeNodeComponent key={node.user.id} node={node} />
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">How to use:</h3>
        <ul className="text-sm text-slate-400 space-y-2">
          <li>• Click the arrow (▼/▶) to expand/collapse referral branches</li>
          <li>• Use the search box to find users by name, email, or referral code</li>
          <li>• Blue cards show root referrers (no parent referrer)</li>
          <li>• Gray cards show referred users in the network</li>
          <li>• Each card shows the user's balance and number of direct referrals</li>
        </ul>
      </div>
    </div>
  )
}
