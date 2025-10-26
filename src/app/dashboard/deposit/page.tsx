'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { ArrowLeft, Upload, Copy, Check, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import WhatsAppSupport from '@/components/WhatsAppSupport'

interface AdminSettings {
  min_deposit_amount: number
  deposit_details: {
    bank: {
      name: string
      account: string
      title: string
    }
    easypaisa: {
      number: string
      title: string
    }
  }
}

export default function DepositPage() {
  const [amount, setAmount] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderLast4, setSenderLast4] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [user, setUser] = useState<any>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { user, profile, error } = await getCurrentUserWithProfile()
      if (!user || error) {
        router.push('/login')
        return
      }
      
      if (!profile) {
        setError('User profile not found. Please contact support.')
        return
      }
      
      setUser(user)

      const { data } = await supabase
        .from('admin_settings')
        .select('deposit_details, min_deposit_amount')
        .eq('id', 1)
        .single()

      if (data) {
        setSettings(data)
      }
    }

    fetchData()
  }, [router])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }
      setProofFile(file)
      setError('')
    }
  }

  const uploadProof = async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('deposit_proofs')
      .upload(fileName, file)

    if (error) throw error
    return data.path
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!user) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    if (!proofFile) {
      setError('Please upload payment proof')
      setLoading(false)
      return
    }

    if (senderLast4.length !== 4) {
      setError('Please enter exactly 4 digits for account last 4 digits')
      setLoading(false)
      return
    }

    // Check minimum deposit amount
    const depositAmount = parseFloat(amount)
    const minAmount = settings?.min_deposit_amount || 500
    if (depositAmount < minAmount) {
      setError(`Minimum deposit amount is PKR ${minAmount}`)
      setLoading(false)
      return
    }

    try {
      // Upload proof file
      const proofUrl = await uploadProof(proofFile, user.id)

      // Create deposit record
      const { error: insertError } = await supabase
        .from('deposits')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          sender_name: senderName,
          sender_last_4_digits: senderLast4,
          proof_url: proofUrl,
          status: 'pending'
        })

      if (insertError) throw insertError

      setSuccess(true)
      
      // Reset form
      setAmount('')
      setSenderName('')
      setSenderLast4('')
      setProofFile(null)
      
    } catch (err: any) {
      setError(err.message || 'Failed to submit deposit request')
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Deposit Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your deposit request has been submitted successfully. It will be reviewed by our team within 24 hours.
          </p>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/dashboard/history"
              className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              View Transaction History
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-3">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Deposit Funds</h1>
      </div>

      {/* Deposit Information */}
      {settings && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Payment Information</h3>
          
          {/* Bank Details */}
          <div className="mb-4">
            <h4 className="font-medium text-blue-800 mb-2">Bank Transfer</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-white p-2 rounded">
                <span className="text-gray-600">Bank:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{settings.deposit_details.bank.name}</span>
                  <button
                    onClick={() => copyToClipboard(settings.deposit_details.bank.name, 'bank')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {copiedField === 'bank' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded">
                <span className="text-gray-600">Account:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{settings.deposit_details.bank.account}</span>
                  <button
                    onClick={() => copyToClipboard(settings.deposit_details.bank.account, 'account')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {copiedField === 'account' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded">
                <span className="text-gray-600">Title:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{settings.deposit_details.bank.title}</span>
                  <button
                    onClick={() => copyToClipboard(settings.deposit_details.bank.title, 'title')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {copiedField === 'title' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Easypaisa Details */}
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Easypaisa</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-white p-2 rounded">
                <span className="text-gray-600">Number:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{settings.deposit_details.easypaisa.number}</span>
                  <button
                    onClick={() => copyToClipboard(settings.deposit_details.easypaisa.number, 'easypaisa')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {copiedField === 'easypaisa' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded">
                <span className="text-gray-600">Title:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{settings.deposit_details.easypaisa.title}</span>
                  <button
                    onClick={() => copyToClipboard(settings.deposit_details.easypaisa.title, 'easypaisa-title')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {copiedField === 'easypaisa-title' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Submit Deposit Request</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (PKR)
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={settings?.min_deposit_amount || 500}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={`Enter deposit amount (Min: PKR ${settings?.min_deposit_amount || 500})`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum deposit amount is PKR {settings?.min_deposit_amount || 500}
            </p>
          </div>

          <div>
            <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name
            </label>
            <input
              id="senderName"
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter account holder name"
            />
          </div>

          <div>
            <label htmlFor="senderLast4" className="block text-sm font-medium text-gray-700 mb-2">
              Account Number (Last 4 Digits)
            </label>
            <input
              id="senderLast4"
              type="text"
              value={senderLast4}
              onChange={(e) => setSenderLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
              maxLength={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter last 4 digits"
            />
          </div>

          <div>
            <label htmlFor="proof" className="block text-sm font-medium text-gray-700 mb-2">
              Upload Payment Proof
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
              <input
                id="proof"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="hidden"
              />
              <label
                htmlFor="proof"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {proofFile ? proofFile.name : 'Click to upload payment screenshot'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Deposit Request'}
          </button>
        </form>
      </div>

      {/* Customer Support for Deposit Help */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <HelpCircle className="w-5 h-5 mr-2" />
          Need Help with Deposit?
        </h3>
        <div className="space-y-4">
          <p className="text-gray-600">
            Having trouble with your deposit? Contact our support team for assistance with payment methods, account details, or deposit verification.
          </p>
          <WhatsAppSupport variant="button" />
        </div>
      </div>
    </div>
  )
}
