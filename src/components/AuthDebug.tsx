'use client'

import { useEffect, useState } from 'react'
import { getCurrentUserWithProfile } from '@/lib/auth'

export default function AuthDebug() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await getCurrentUserWithProfile()
        setAuthState(result)
        console.log('Auth Debug Result:', result)
      } catch (error) {
        console.error('Auth Debug Error:', error)
        setAuthState({ error: error })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return <div className="p-4 bg-yellow-100 text-yellow-800 rounded">Checking auth...</div>
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Auth Debug Info:</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify(authState, null, 2)}
      </pre>
    </div>
  )
}
