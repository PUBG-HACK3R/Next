'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestApisPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (title: string, data: any) => {
    setResults(prev => [...prev, { title, data, timestamp: new Date().toLocaleTimeString() }])
  }

  const testGetDeposits = async () => {
    setLoading(true)
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/deposits', { headers })
      const data = await response.json()
      addResult('GET /api/deposits', { status: response.status, data })
    } catch (error: any) {
      addResult('GET /api/deposits ERROR', error.message)
    } finally {
      setLoading(false)
    }
  }

  const testAdminDeposits = async () => {
    setLoading(true)
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/admin/deposits', { headers })
      const data = await response.json()
      addResult('GET /api/admin/deposits', { status: response.status, data })
    } catch (error: any) {
      addResult('GET /api/admin/deposits ERROR', error.message)
    } finally {
      setLoading(false)
    }
  }

  const testDirectDatabase = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      addResult('Direct Supabase Query', { data, error })
    } catch (error: any) {
      addResult('Direct Supabase Query ERROR', error.message)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Test Deposit APIs</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={testGetDeposits}
            disabled={loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Testing...' : 'Test GET /api/deposits'}
          </button>
          
          <button
            onClick={testAdminDeposits}
            disabled={loading}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Admin Deposits'}
          </button>
          
          <button
            onClick={testDirectDatabase}
            disabled={loading}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Direct DB'}
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Results
          </button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">{result.title}</h3>
                <span className="text-white/60 text-sm">{result.timestamp}</span>
              </div>
              <pre className="text-sm text-white/80 overflow-auto bg-black/20 p-4 rounded-lg">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ))}
          
          {results.length === 0 && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center">
              <p className="text-white/60">No test results yet. Click a button above to test the APIs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
