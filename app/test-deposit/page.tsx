'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestDepositPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAuth = async () => {
    setLoading(true)
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      // Test the API with auth headers
      const response = await fetch('/api/test-auth', { headers })
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testDeposit = async () => {
    setLoading(true)
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      // Test deposit API
      const response = await fetch('/api/deposits', { 
        method: 'POST',
        headers,
        body: JSON.stringify({
          deposit_type: 'bank',
          amount_pkr: 1000,
          sender_name: 'Test User',
          sender_account_last4: '1234'
        })
      })
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/check-db')
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Deposit System Test</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testAuth}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Auth'}
          </button>
          
          <button
            onClick={checkDatabase}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 ml-4"
          >
            {loading ? 'Checking...' : 'Check Database'}
          </button>
          
          <button
            onClick={testDeposit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            {loading ? 'Testing...' : 'Test Deposit'}
          </button>
        </div>

        {result && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Result:</h2>
            <pre className="text-sm overflow-auto bg-gray-100 p-4 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
