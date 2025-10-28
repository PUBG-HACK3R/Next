'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testUpload = async () => {
    if (!file) return
    
    setUploading(true)
    setResult(null)
    
    try {
      // Test 1: Direct Supabase Storage upload
      console.log('Testing direct Supabase upload...')
      const fileName = `test/${Date.now()}.${file.name.split('.').pop()}`
      
      const { data, error } = await supabase.storage
        .from('deposit_proofs')
        .upload(fileName, file)
      
      if (error) {
        setResult({ 
          method: 'Direct Supabase', 
          success: false, 
          error: error.message,
          details: error
        })
        return
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('deposit_proofs')
        .getPublicUrl(fileName)
      
      setResult({ 
        method: 'Direct Supabase', 
        success: true, 
        data, 
        publicUrl,
        fileName 
      })
      
    } catch (error: any) {
      setResult({ 
        method: 'Direct Supabase', 
        success: false, 
        error: error.message 
      })
    } finally {
      setUploading(false)
    }
  }

  const testAPI = async () => {
    if (!file) return
    
    setUploading(true)
    setResult(null)
    
    try {
      // Test 2: API endpoint upload
      console.log('Testing API upload...')
      const formData = new FormData()
      formData.append('file', file)
      
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/deposits/upload', {
        method: 'POST',
        headers,
        body: formData
      })
      
      const data = await response.json()
      
      setResult({ 
        method: 'API Endpoint', 
        success: response.ok, 
        status: response.status,
        data 
      })
      
    } catch (error: any) {
      setResult({ 
        method: 'API Endpoint', 
        success: false, 
        error: error.message 
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Test File Upload</h1>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Upload Test</h2>
          
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-white bg-white/10 border border-white/20 rounded-lg p-3"
              />
            </div>
            
            {file && (
              <div className="text-white/80 text-sm">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
            
            <div className="flex space-x-4">
              <button
                onClick={testUpload}
                disabled={!file || uploading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Testing...' : 'Test Direct Upload'}
              </button>
              
              <button
                onClick={testAPI}
                disabled={!file || uploading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {uploading ? 'Testing...' : 'Test API Upload'}
              </button>
            </div>
          </div>
        </div>
        
        {result && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Result: {result.method}</h2>
            <pre className="text-sm text-white/80 overflow-auto bg-black/20 p-4 rounded-lg">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.success && result.publicUrl && (
              <div className="mt-4">
                <h3 className="text-white font-medium mb-2">Uploaded Image:</h3>
                <img 
                  src={result.publicUrl} 
                  alt="Uploaded" 
                  className="max-w-md rounded-lg border border-white/20"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
