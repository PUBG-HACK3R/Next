'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugDepositsPage() {
  const [apiResult, setApiResult] = useState<any>(null)
  const [dbResult, setDbResult] = useState<any>(null)
  const [authResult, setAuthResult] = useState<any>(null)

  useEffect(() => {
    const testEverything = async () => {
      // Test 1: Check auth
      const { data: { session } } = await supabase.auth.getSession()
      setAuthResult({
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: !!session?.access_token
      })

      // Test 2: Test API call
      try {
        const headers: Record<string, string> = {}
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        const response = await fetch('/api/deposits?page=1&limit=10', { headers })
        const apiData = await response.json()
        setApiResult({
          status: response.status,
          data: apiData
        })
      } catch (error: any) {
        setApiResult({ error: error.message })
      }

      // Test 3: Direct DB query
      try {
        const { data, error } = await supabase
          .from('deposits')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        setDbResult({ data, error })
      } catch (error: any) {
        setDbResult({ error: error.message })
      }
    }

    testEverything()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Debug Deposits</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Auth Status */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Auth Status</h2>
            <pre className="text-sm text-white/80 overflow-auto bg-black/20 p-4 rounded-lg">
              {JSON.stringify(authResult, null, 2)}
            </pre>
          </div>

          {/* API Result */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">API Call Result</h2>
            <pre className="text-sm text-white/80 overflow-auto bg-black/20 p-4 rounded-lg">
              {JSON.stringify(apiResult, null, 2)}
            </pre>
          </div>

          {/* Direct DB Result */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Direct DB Query</h2>
            <pre className="text-sm text-white/80 overflow-auto bg-black/20 p-4 rounded-lg">
              {JSON.stringify(dbResult, null, 2)}
            </pre>
          </div>
        </div>

        {/* Component Test */}
        <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">DepositHistory Component Test</h2>
          <div className="bg-black/20 p-4 rounded-lg">
            {/* Import and test the component directly */}
            <p className="text-white/60">Component will be rendered here...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
