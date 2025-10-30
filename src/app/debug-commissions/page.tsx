'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function DebugCommissionsPage() {
  const [user, setUser] = useState<any>(null)
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const fetchData = async () => {
      const { user } = await getCurrentUser()
      if (!user) {
        console.log('No user found')
        setLoading(false)
        return
      }
      setUser(user)

      // Fetch all commissions
      const { data: commissionData, error } = await supabase
        .from('referral_commissions')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching commissions:', error)
        setLoading(false)
        return
      }

      setCommissions(commissionData || [])

      // Calculate debug info using UTC to match database timestamps
      const now = new Date()
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      const yesterday = new Date(today)
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)
      const tomorrow = new Date(today)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

      let todayTotal = 0
      let yesterdayTotal = 0
      let grandTotal = 0

      const processedCommissions = (commissionData || []).map(commission => {
        const amount = commission.commission_amount
        const commissionDate = new Date(commission.created_at)
        const isToday = commissionDate >= today && commissionDate < tomorrow
        const isYesterday = commissionDate >= yesterday && commissionDate < today

        grandTotal += amount
        if (isToday) todayTotal += amount
        if (isYesterday) yesterdayTotal += amount

        return {
          ...commission,
          commissionDate,
          isToday,
          isYesterday,
          dateString: commissionDate.toDateString(),
          isoString: commissionDate.toISOString()
        }
      })

      setDebugInfo({
        now: now.toISOString(),
        today: today.toISOString(),
        yesterday: yesterday.toISOString(),
        tomorrow: tomorrow.toISOString(),
        todayTotal,
        yesterdayTotal,
        grandTotal,
        processedCommissions
      })

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Debug Commissions</h1>
      
      {user && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">User Info</h2>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      )}

      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Date Debug Info</h2>
        <p><strong>Current Time:</strong> {debugInfo.now}</p>
        <p><strong>Today Start:</strong> {debugInfo.today}</p>
        <p><strong>Yesterday Start:</strong> {debugInfo.yesterday}</p>
        <p><strong>Tomorrow Start:</strong> {debugInfo.tomorrow}</p>
      </div>

      <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Totals</h2>
        <p><strong>Today Total:</strong> PKR {debugInfo.todayTotal}</p>
        <p><strong>Yesterday Total:</strong> PKR {debugInfo.yesterdayTotal}</p>
        <p><strong>Grand Total:</strong> PKR {debugInfo.grandTotal}</p>
        <p><strong>Total Commissions:</strong> {commissions.length}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">All Commissions</h2>
        {commissions.length === 0 ? (
          <p className="text-gray-500">No commissions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border-b text-left">Amount</th>
                  <th className="px-4 py-2 border-b text-left">Level</th>
                  <th className="px-4 py-2 border-b text-left">Created At</th>
                  <th className="px-4 py-2 border-b text-left">Date Object</th>
                  <th className="px-4 py-2 border-b text-left">Is Today?</th>
                  <th className="px-4 py-2 border-b text-left">Is Yesterday?</th>
                  <th className="px-4 py-2 border-b text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {debugInfo.processedCommissions?.map((commission: any, index: number) => (
                  <tr key={index} className={commission.isToday ? 'bg-green-100' : commission.isYesterday ? 'bg-yellow-100' : ''}>
                    <td className="px-4 py-2 border-b">PKR {commission.commission_amount}</td>
                    <td className="px-4 py-2 border-b">Level {commission.level}</td>
                    <td className="px-4 py-2 border-b text-sm">{commission.created_at}</td>
                    <td className="px-4 py-2 border-b text-sm">{commission.isoString}</td>
                    <td className="px-4 py-2 border-b">
                      <span className={`px-2 py-1 rounded text-sm ${commission.isToday ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        {commission.isToday ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b">
                      <span className={`px-2 py-1 rounded text-sm ${commission.isYesterday ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-600'}`}>
                        {commission.isYesterday ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b text-sm">{commission.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Raw Commission Data:</h3>
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(commissions, null, 2)}
        </pre>
      </div>
    </div>
  )
}
