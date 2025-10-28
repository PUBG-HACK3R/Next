'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { ArrowLeft, Upload, Copy, Check, CreditCard, Wallet, Coins, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface AdminSettings {
  min_deposit_amount: number
  usdt_wallet_address: string
  min_usdt_deposit: number
  usdt_to_pkr_rate: number
  usdt_chains: Array<{name: string, network: string, enabled: boolean}>
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

type DepositType = 'bank' | 'easypaisa' | 'usdt'

export default function NewDepositPage() {
  const [depositType, setDepositType] = useState<DepositType>('bank')
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [user, setUser] = useState<any>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  // Form fields
  const [formData, setFormData] = useState({
    amount_pkr: '',
    sender_name: '',
    sender_account_last4: '',
    amount_usdt: '',
    chain_name: '',
    transaction_hash: '',
    proof_file: null as File | null
  })

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

      // Fetch admin settings
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const settingsData = await response.json()
          setSettings(settingsData)
          
          // Set default chain if USDT chains are available
          if (settingsData.usdt_chains && settingsData.usdt_chains.length > 0) {
            const enabledChain = settingsData.usdt_chains.find((chain: any) => chain.enabled)
            if (enabledChain) {
              setFormData(prev => ({ ...prev, chain_name: enabledChain.name }))
            }
          }
        } else {
          setError('Failed to load deposit settings')
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
        setError('Failed to load deposit settings')
      }
    }

    fetchData()
  }, [router])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const calculatePkrAmount = (usdtAmount: number) => {
    if (!settings) return 0
    return usdtAmount * settings.usdt_to_pkr_rate
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-calculate PKR amount for USDT deposits
    if (field === 'amount_usdt' && settings) {
      const usdtAmount = parseFloat(value) || 0
      const pkrAmount = calculatePkrAmount(usdtAmount)
      setFormData(prev => ({ ...prev, amount_pkr: pkrAmount.toString() }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      setFormData(prev => ({ ...prev, proof_file: file }))
      setError('')
    }
  }

  const uploadProof = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/deposits/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        return result.fileName
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !settings) return

    setLoading(true)
    setError('')

    try {
      // Validate form data
      const amount = parseFloat(formData.amount_pkr)
      
      if (depositType === 'usdt') {
        const usdtAmount = parseFloat(formData.amount_usdt)
        if (usdtAmount < settings.min_usdt_deposit) {
          throw new Error(`Minimum USDT deposit amount is ${settings.min_usdt_deposit} USDT`)
        }
        if (!formData.chain_name || !formData.transaction_hash) {
          throw new Error('Chain name and transaction hash are required for USDT deposits')
        }
      } else {
        if (amount < settings.min_deposit_amount) {
          throw new Error(`Minimum deposit amount is PKR ${settings.min_deposit_amount}`)
        }
        if (!formData.sender_name || !formData.sender_account_last4) {
          throw new Error('Sender name and account last 4 digits are required')
        }
      }

      // Upload proof if provided
      let proofUrl = null
      if (formData.proof_file) {
        try {
          proofUrl = await uploadProof(formData.proof_file)
        } catch (uploadError) {
          console.error('Proof upload failed:', uploadError)
          // Continue without proof for traditional deposits, but fail for USDT
          if (depositType === 'usdt') {
            throw new Error('Proof upload failed. Please try again.')
          }
        }
      }

      // Prepare deposit data
      const depositData: any = {
        deposit_type: depositType,
        amount_pkr: amount,
        proof_url: proofUrl
      }

      if (depositType === 'usdt') {
        depositData.amount_usdt = parseFloat(formData.amount_usdt)
        depositData.chain_name = formData.chain_name
        depositData.transaction_hash = formData.transaction_hash
      } else {
        depositData.sender_name = formData.sender_name
        depositData.sender_account_last4 = formData.sender_account_last4
      }

      // Submit deposit
      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(depositData)
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(true)
        toast.success('Deposit request submitted successfully!')
        
        // Reset form
        setFormData({
          amount_pkr: '',
          sender_name: '',
          sender_account_last4: '',
          amount_usdt: '',
          chain_name: formData.chain_name, // Keep selected chain
          transaction_hash: '',
          proof_file: null
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit deposit')
      }
      
    } catch (error: any) {
      setError(error.message)
      toast.error(error.message)
    }

    setLoading(false)
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="max-w-md mx-auto pt-20">
          <div className="animate-pulse bg-white/10 rounded-lg p-8">
            <div className="h-4 bg-white/20 rounded mb-4"></div>
            <div className="h-4 bg-white/20 rounded mb-4"></div>
            <div className="h-4 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="max-w-md mx-auto pt-20">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Deposit Submitted!</h2>
            <p className="text-white/80 mb-6">
              Your {depositType === 'usdt' ? 'USDT' : 'PKR'} deposit request has been submitted successfully. 
              It will be processed within 24 hours.
            </p>
            <div className="space-y-3">
              <Link 
                href="/dashboard"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={() => setSuccess(false)}
                className="block w-full px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Make Another Deposit
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link 
            href="/dashboard"
            className="mr-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Make Deposit</h1>
        </div>

        {/* Deposit Method Selection */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Choose Deposit Method</h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setDepositType('bank')}
              className={`p-4 rounded-xl border-2 transition-all ${
                depositType === 'bank'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <CreditCard className="w-8 h-8 text-white mx-auto mb-2" />
              <span className="text-white text-sm font-medium">Bank Transfer</span>
            </button>

            <button
              onClick={() => setDepositType('easypaisa')}
              className={`p-4 rounded-xl border-2 transition-all ${
                depositType === 'easypaisa'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <Wallet className="w-8 h-8 text-white mx-auto mb-2" />
              <span className="text-white text-sm font-medium">EasyPaisa</span>
            </button>

            <button
              onClick={() => setDepositType('usdt')}
              className={`p-4 rounded-xl border-2 transition-all ${
                depositType === 'usdt'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <Coins className="w-8 h-8 text-white mx-auto mb-2" />
              <span className="text-white text-sm font-medium">USDT Crypto</span>
            </button>
          </div>
        </div>

        {/* Deposit Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {depositType === 'bank' ? 'Bank Transfer' : 
             depositType === 'easypaisa' ? 'EasyPaisa' : 'USDT Cryptocurrency'} Details
          </h2>

          {/* Account Details */}
          {depositType !== 'usdt' && (
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <h3 className="text-white font-medium mb-3">
                {depositType === 'bank' ? 'Bank Account Details' : 'EasyPaisa Account Details'}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">
                    {depositType === 'bank' ? 'Bank Name:' : 'Account Title:'}
                  </span>
                  <div className="flex items-center">
                    <span className="text-white font-mono">
                      {depositType === 'bank' 
                        ? settings.deposit_details.bank.name 
                        : settings.deposit_details.easypaisa.title
                      }
                    </span>
                    <button
                      onClick={() => copyToClipboard(
                        depositType === 'bank' 
                          ? settings.deposit_details.bank.name 
                          : settings.deposit_details.easypaisa.title,
                        depositType === 'bank' ? 'bank-name' : 'easypaisa-title'
                      )}
                      className="ml-2 p-1 hover:bg-white/10 rounded"
                    >
                      {copiedField === (depositType === 'bank' ? 'bank-name' : 'easypaisa-title') ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">
                    {depositType === 'bank' ? 'Account Number:' : 'Mobile Number:'}
                  </span>
                  <div className="flex items-center">
                    <span className="text-white font-mono">
                      {depositType === 'bank' 
                        ? settings.deposit_details.bank.account 
                        : settings.deposit_details.easypaisa.number
                      }
                    </span>
                    <button
                      onClick={() => copyToClipboard(
                        depositType === 'bank' 
                          ? settings.deposit_details.bank.account 
                          : settings.deposit_details.easypaisa.number,
                        depositType === 'bank' ? 'bank-account' : 'easypaisa-number'
                      )}
                      className="ml-2 p-1 hover:bg-white/10 rounded"
                    >
                      {copiedField === (depositType === 'bank' ? 'bank-account' : 'easypaisa-number') ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                  </div>
                </div>
                {depositType === 'bank' && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Account Title:</span>
                    <div className="flex items-center">
                      <span className="text-white font-mono">
                        {settings.deposit_details.bank.title}
                      </span>
                      <button
                        onClick={() => copyToClipboard(settings.deposit_details.bank.title, 'bank-title')}
                        className="ml-2 p-1 hover:bg-white/10 rounded"
                      >
                        {copiedField === 'bank-title' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-white/60" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* USDT Wallet Details */}
          {depositType === 'usdt' && (
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <h3 className="text-white font-medium mb-3">USDT Wallet Address</h3>
              <div className="flex justify-between items-center mb-4">
                <span className="text-white/80">Wallet Address:</span>
                <div className="flex items-center">
                  <span className="text-white font-mono text-sm break-all">
                    {settings.usdt_wallet_address}
                  </span>
                  <button
                    onClick={() => copyToClipboard(settings.usdt_wallet_address, 'usdt-wallet')}
                    className="ml-2 p-1 hover:bg-white/10 rounded"
                  >
                    {copiedField === 'usdt-wallet' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-3 py-2 rounded-lg text-sm">
                <strong>Important:</strong> Only send USDT to this address using the selected network below.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* USDT specific fields */}
            {depositType === 'usdt' && (
              <>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Blockchain Network
                  </label>
                  <select
                    value={formData.chain_name}
                    onChange={(e) => handleInputChange('chain_name', e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Network</option>
                    {settings.usdt_chains
                      ?.filter(chain => chain.enabled)
                      .map(chain => (
                        <option key={chain.name} value={chain.name} className="bg-slate-800">
                          {chain.name} ({chain.network})
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    USDT Amount
                  </label>
                  <input
                    type="number"
                    value={formData.amount_usdt}
                    onChange={(e) => handleInputChange('amount_usdt', e.target.value)}
                    required
                    min={settings.min_usdt_deposit}
                    step="0.01"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Minimum: ${settings.min_usdt_deposit} USDT`}
                  />
                  {formData.amount_usdt && (
                    <p className="text-white/60 text-sm mt-2">
                      ≈ PKR {calculatePkrAmount(parseFloat(formData.amount_usdt)).toLocaleString()} 
                      <span className="text-white/40"> (Rate: 1 USDT = PKR {settings.usdt_to_pkr_rate})</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Transaction Hash
                  </label>
                  <input
                    type="text"
                    value={formData.transaction_hash}
                    onChange={(e) => handleInputChange('transaction_hash', e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter blockchain transaction hash"
                  />
                </div>
              </>
            )}

            {/* Traditional deposit fields */}
            {depositType !== 'usdt' && (
              <>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Deposit Amount (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.amount_pkr}
                    onChange={(e) => handleInputChange('amount_pkr', e.target.value)}
                    required
                    min={settings.min_deposit_amount}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Minimum: PKR ${settings.min_deposit_amount}`}
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={formData.sender_name}
                    onChange={(e) => handleInputChange('sender_name', e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name of person who sent money"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Last 4 Digits of Sender Account/Mobile
                  </label>
                  <input
                    type="text"
                    value={formData.sender_account_last4}
                    onChange={(e) => handleInputChange('sender_account_last4', e.target.value)}
                    required
                    maxLength={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last 4 digits"
                  />
                </div>
              </>
            )}

            {/* Proof upload */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Payment Proof (Screenshot) {depositType === 'usdt' && <span className="text-red-400">*</span>}
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="proof-upload"
                  required={depositType === 'usdt'}
                />
                <label
                  htmlFor="proof-upload"
                  className="flex items-center justify-center w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white cursor-pointer hover:bg-white/20 transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {formData.proof_file ? formData.proof_file.name : 
                   `Upload Screenshot ${depositType === 'usdt' ? '(Required)' : '(Optional)'}`}
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Submitting...' : 'Submit Deposit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
