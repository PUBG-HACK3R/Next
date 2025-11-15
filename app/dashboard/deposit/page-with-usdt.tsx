'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { ArrowLeft, Upload, Copy, Check, HelpCircle, Wallet, CreditCard, Coins } from 'lucide-react'
import Link from 'next/link'
import WhatsAppSupport from '@/components/WhatsAppSupport'

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
    usdt?: {
      wallet_address: string
      chains: Array<{name: string, network: string, enabled: boolean}>
      min_deposit: number
      rate_pkr: number
    }
  }
}

export default function DepositPage() {
  const [depositMethod, setDepositMethod] = useState<'bank' | 'easypaisa' | 'usdt'>('bank')
  
  // Traditional deposit fields
  const [amount, setAmount] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderLast4, setSenderLast4] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  
  // USDT deposit fields
  const [usdtAmount, setUsdtAmount] = useState('')
  const [selectedChain, setSelectedChain] = useState('')
  const [transactionHash, setTransactionHash] = useState('')
  const [usdtProofFile, setUsdtProofFile] = useState<File | null>(null)
  
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

      // Fetch admin settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (settingsError) {
        console.error('Error fetching settings:', settingsError)
        setError('Failed to load deposit settings')
        return
      }

      if (settingsData) {
        setSettings(settingsData)
        // Set default chain if USDT chains are available
        if (settingsData.usdt_chains && settingsData.usdt_chains.length > 0) {
          const enabledChain = settingsData.usdt_chains.find((chain: any) => chain.enabled)
          if (enabledChain) {
            setSelectedChain(enabledChain.name)
          }
        }
      }
    }

    fetchData()
  }, [router])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const calculatePkrAmount = (usdtAmount: number) => {
    if (!settings) return 0
    return usdtAmount * settings.usdt_to_pkr_rate
  }

  const handleTraditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !settings) return

    setLoading(true)
    setError('')

    try {
      const depositAmount = parseFloat(amount)
      
      if (depositAmount < settings.min_deposit_amount) {
        throw new Error(`Minimum deposit amount is PKR ${settings.min_deposit_amount}`)
      }

      let proofUrl = null
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop()
        const fileName = `${user.id}_${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('deposit_proofs')
          .upload(fileName, proofFile)

        if (uploadError) throw uploadError
        proofUrl = fileName
      }

      const { error } = await supabase
        .from('deposits')
        .insert([{
          user_id: user.id,
          amount: depositAmount,
          sender_name: senderName,
          sender_last_4_digits: senderLast4,
          proof_url: proofUrl,
          status: 'pending'
        }])

      if (error) throw error

      setSuccess(true)
      setAmount('')
      setSenderName('')
      setSenderLast4('')
      setProofFile(null)
      
    } catch (error: any) {
      setError(error.message)
    }

    setLoading(false)
  }

  const handleUsdtSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !settings) return

    setLoading(true)
    setError('')

    try {
      const usdtDepositAmount = parseFloat(usdtAmount)
      
      if (usdtDepositAmount < settings.min_usdt_deposit) {
        throw new Error(`Minimum USDT deposit amount is ${settings.min_usdt_deposit} USDT`)
      }

      const pkrAmount = calculatePkrAmount(usdtDepositAmount)

      let proofUrl = null
      if (usdtProofFile) {
        const fileExt = usdtProofFile.name.split('.').pop()
        const fileName = `usdt_${user.id}_${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('deposit_proofs')
          .upload(fileName, usdtProofFile)

        if (uploadError) throw uploadError
        proofUrl = fileName
      }

      const { error } = await supabase
        .from('usdt_deposits')
        .insert([{
          user_id: user.id,
          amount_usdt: usdtDepositAmount,
          amount_pkr: pkrAmount,
          usdt_rate: settings.usdt_to_pkr_rate,
          wallet_address: settings.usdt_wallet_address,
          chain_name: selectedChain,
          transaction_hash: transactionHash,
          proof_url: proofUrl,
          status: 'pending'
        }])

      if (error) throw error

      setSuccess(true)
      setUsdtAmount('')
      setTransactionHash('')
      setUsdtProofFile(null)
      
    } catch (error: any) {
      setError(error.message)
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
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Deposit Submitted!</h2>
            <p className="text-white/80 mb-6">
              Your {depositMethod === 'usdt' ? 'USDT' : 'PKR'} deposit request has been submitted successfully. 
              It will be processed within 24 hours.
            </p>
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </Link>
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
              onClick={() => setDepositMethod('bank')}
              className={`p-4 rounded-xl border-2 transition-all ${
                depositMethod === 'bank'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <CreditCard className="w-8 h-8 text-white mx-auto mb-2" />
              <span className="text-white text-sm font-medium">Bank Transfer</span>
            </button>

            <button
              onClick={() => setDepositMethod('easypaisa')}
              className={`p-4 rounded-xl border-2 transition-all ${
                depositMethod === 'easypaisa'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <Wallet className="w-8 h-8 text-white mx-auto mb-2" />
              <span className="text-white text-sm font-medium">EasyPaisa</span>
            </button>

            <button
              onClick={() => setDepositMethod('usdt')}
              className={`p-4 rounded-xl border-2 transition-all ${
                depositMethod === 'usdt'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <Coins className="w-8 h-8 text-white mx-auto mb-2" />
              <span className="text-white text-sm font-medium">USDT Crypto</span>
            </button>
          </div>
        </div>

        {/* Traditional Deposit Form (Bank/EasyPaisa) */}
        {(depositMethod === 'bank' || depositMethod === 'easypaisa') && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {depositMethod === 'bank' ? 'Bank Transfer' : 'EasyPaisa'} Details
            </h2>

            {/* Account Details */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <h3 className="text-white font-medium mb-3">
                {depositMethod === 'bank' ? 'Bank Account Details' : 'EasyPaisa Account Details'}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">
                    {depositMethod === 'bank' ? 'Bank Name:' : 'Account Title:'}
                  </span>
                  <div className="flex items-center">
                    <span className="text-white font-mono">
                      {depositMethod === 'bank' 
                        ? settings.deposit_details.bank.name 
                        : settings.deposit_details.easypaisa.title
                      }
                    </span>
                    <button
                      onClick={() => copyToClipboard(
                        depositMethod === 'bank' 
                          ? settings.deposit_details.bank.name 
                          : settings.deposit_details.easypaisa.title,
                        depositMethod === 'bank' ? 'bank-name' : 'easypaisa-title'
                      )}
                      className="ml-2 p-1 hover:bg-white/10 rounded"
                    >
                      {copiedField === (depositMethod === 'bank' ? 'bank-name' : 'easypaisa-title') ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">
                    {depositMethod === 'bank' ? 'Account Number:' : 'Mobile Number:'}
                  </span>
                  <div className="flex items-center">
                    <span className="text-white font-mono">
                      {depositMethod === 'bank' 
                        ? settings.deposit_details.bank.account 
                        : settings.deposit_details.easypaisa.number
                      }
                    </span>
                    <button
                      onClick={() => copyToClipboard(
                        depositMethod === 'bank' 
                          ? settings.deposit_details.bank.account 
                          : settings.deposit_details.easypaisa.number,
                        depositMethod === 'bank' ? 'bank-account' : 'easypaisa-number'
                      )}
                      className="ml-2 p-1 hover:bg-white/10 rounded"
                    >
                      {copiedField === (depositMethod === 'bank' ? 'bank-account' : 'easypaisa-number') ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                  </div>
                </div>
                {depositMethod === 'bank' && (
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

            <form onSubmit={handleTraditionalSubmit} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Deposit Amount (PKR)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
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
                  value={senderLast4}
                  onChange={(e) => setSenderLast4(e.target.value)}
                  required
                  maxLength={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Last 4 digits"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Payment Proof (Screenshot)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    accept="image/*"
                    className="hidden"
                    id="proof-upload"
                  />
                  <label
                    htmlFor="proof-upload"
                    className="flex items-center justify-center w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white cursor-pointer hover:bg-white/20 transition-colors"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {proofFile ? proofFile.name : 'Upload Screenshot'}
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl">
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
        )}

        {/* USDT Deposit Form */}
        {depositMethod === 'usdt' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">USDT Cryptocurrency Deposit</h2>

            {/* USDT Wallet Details */}
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

            <form onSubmit={handleUsdtSubmit} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Blockchain Network
                </label>
                <select
                  value={selectedChain}
                  onChange={(e) => setSelectedChain(e.target.value)}
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
                  value={usdtAmount}
                  onChange={(e) => setUsdtAmount(e.target.value)}
                  required
                  min={settings.min_usdt_deposit}
                  step="0.01"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Minimum: ${settings.min_usdt_deposit} USDT`}
                />
                {usdtAmount && (
                  <p className="text-white/60 text-sm mt-2">
                    ≈ PKR {calculatePkrAmount(parseFloat(usdtAmount)).toLocaleString()} 
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
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter blockchain transaction hash"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Transaction Proof (Screenshot)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => setUsdtProofFile(e.target.files?.[0] || null)}
                    accept="image/*"
                    className="hidden"
                    id="usdt-proof-upload"
                  />
                  <label
                    htmlFor="usdt-proof-upload"
                    className="flex items-center justify-center w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white cursor-pointer hover:bg-white/20 transition-colors"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {usdtProofFile ? usdtProofFile.name : 'Upload Transaction Screenshot'}
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Submitting...' : 'Submit USDT Deposit'}
              </button>
            </form>
          </div>
        )}

        <WhatsAppSupport variant="floating" />
      </div>
    </div>
  )
}
