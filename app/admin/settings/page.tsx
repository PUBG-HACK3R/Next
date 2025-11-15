'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Settings, 
  Save, 
  Users, 
  CreditCard,
  RefreshCw,
  MessageCircle,
  Clock,
  Calendar,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

interface AdminSettings {
  id: number
  referral_l1_percent: number
  referral_l1_deposit_percent: number
  referral_l2_percent: number
  referral_l3_percent: number
  min_deposit_amount: number
  min_withdrawal_amount: number
  withdrawal_fee_percent: number
  max_investment_amount: number
  whatsapp_support_number: string | null
  whatsapp_group_link: string | null
  usdt_wallet_address: string
  min_usdt_deposit: number
  usdt_to_pkr_rate: number
  usdt_chains: Array<{name: string, network: string, enabled: boolean}>
  announcement_enabled: boolean
  announcement_title: string
  announcement_text: string
  announcement_type: 'info' | 'warning' | 'success' | 'error'
  withdrawal_enabled: boolean
  withdrawal_start_time: string
  withdrawal_end_time: string
  withdrawal_days_enabled: string
  withdrawal_auto_schedule: boolean
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

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [referralL1, setReferralL1] = useState(0)
  const [referralL1Deposit, setReferralL1Deposit] = useState(0)
  const [referralL2, setReferralL2] = useState(0)
  const [referralL3, setReferralL3] = useState(0)
  const [minDepositAmount, setMinDepositAmount] = useState(500)
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState(100)
  const [withdrawalFeePercent, setWithdrawalFeePercent] = useState(3)
  const [maxInvestmentAmount, setMaxInvestmentAmount] = useState(5000)
  const [whatsappNumber, setWhatsappNumber] = useState('+1(753)528-2586')
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankTitle, setBankTitle] = useState('')
  const [easypaisaNumber, setEasypaisaNumber] = useState('')
  const [easypaisaTitle, setEasypaisaTitle] = useState('')
  
  // USDT settings
  const [usdtWalletAddress, setUsdtWalletAddress] = useState('')
  const [minUsdtDeposit, setMinUsdtDeposit] = useState(10)
  const [usdtToPkrRate, setUsdtToPkrRate] = useState(280)
  const [usdtChains, setUsdtChains] = useState([
    {name: 'TRC20', network: 'Tron', enabled: true},
    {name: 'BEP20', network: 'BSC', enabled: true},
    {name: 'Arbitrum', network: 'Arbitrum One', enabled: true}
  ])
  
  // Withdrawal time settings
  const [withdrawalEnabled, setWithdrawalEnabled] = useState(true)
  const [withdrawalAutoSchedule, setWithdrawalAutoSchedule] = useState(true)
  const [withdrawalStartTime, setWithdrawalStartTime] = useState('11:00')
  const [withdrawalEndTime, setWithdrawalEndTime] = useState('20:00')
  const [withdrawalDays, setWithdrawalDays] = useState<string[]>([
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (error) throw error

      if (data) {
        setSettings(data)
        setReferralL1(data.referral_l1_percent)
        setReferralL1Deposit(data.referral_l1_deposit_percent || 5)
        setReferralL2(data.referral_l2_percent)
        setReferralL3(data.referral_l3_percent)
        setMinDepositAmount(data.min_deposit_amount || 500)
        setMinWithdrawalAmount(data.min_withdrawal_amount || 100)
        setWithdrawalFeePercent(data.withdrawal_fee_percent || 3)
        setMaxInvestmentAmount(data.max_investment_amount || 5000)
        setWhatsappNumber(data.whatsapp_support_number || '')
        setWhatsappGroupLink(data.whatsapp_group_link || '')
        setBankName(data.deposit_details.bank.name)
        setBankAccount(data.deposit_details.bank.account)
        setBankTitle(data.deposit_details.bank.title)
        setEasypaisaNumber(data.deposit_details.easypaisa.number)
        setEasypaisaTitle(data.deposit_details.easypaisa.title)
        
        // USDT settings
        setUsdtWalletAddress(data.usdt_wallet_address || '')
        setMinUsdtDeposit(data.min_usdt_deposit || 10)
        setUsdtToPkrRate(data.usdt_to_pkr_rate || 280)
        if (data.usdt_chains) {
          setUsdtChains(data.usdt_chains)
        }
        
        // Withdrawal time settings
        setWithdrawalEnabled(data.withdrawal_enabled ?? true)
        setWithdrawalAutoSchedule(data.withdrawal_auto_schedule ?? true)
        if (data.withdrawal_start_time) {
          setWithdrawalStartTime(data.withdrawal_start_time.substring(0, 5))
        }
        if (data.withdrawal_end_time) {
          setWithdrawalEndTime(data.withdrawal_end_time.substring(0, 5))
        }
        if (data.withdrawal_days_enabled) {
          setWithdrawalDays(data.withdrawal_days_enabled.split(','))
        }
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error)
      setError('Failed to load settings')
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const updatedSettings = {
        referral_l1_percent: referralL1,
        referral_l1_deposit_percent: referralL1Deposit,
        referral_l2_percent: referralL2,
        referral_l3_percent: referralL3,
        min_deposit_amount: minDepositAmount,
        min_withdrawal_amount: minWithdrawalAmount,
        withdrawal_fee_percent: withdrawalFeePercent,
        max_investment_amount: maxInvestmentAmount,
        whatsapp_support_number: whatsappNumber || null,
        whatsapp_group_link: whatsappGroupLink || null,
        usdt_wallet_address: usdtWalletAddress,
        min_usdt_deposit: minUsdtDeposit,
        usdt_to_pkr_rate: usdtToPkrRate,
        usdt_chains: usdtChains,
        announcement_enabled: settings?.announcement_enabled || false,
        announcement_title: settings?.announcement_title || '',
        announcement_text: settings?.announcement_text || '',
        announcement_type: settings?.announcement_type || 'info',
        withdrawal_enabled: withdrawalEnabled,
        withdrawal_auto_schedule: withdrawalAutoSchedule,
        withdrawal_start_time: withdrawalStartTime + ':00',
        withdrawal_end_time: withdrawalEndTime + ':00',
        withdrawal_days_enabled: withdrawalDays.join(','),
        deposit_details: {
          bank: {
            name: bankName,
            account: bankAccount,
            title: bankTitle
          },
          easypaisa: {
            number: easypaisaNumber,
            title: easypaisaTitle
          },
          usdt: {
            wallet_address: usdtWalletAddress,
            chains: usdtChains,
            min_deposit: minUsdtDeposit,
            rate_pkr: usdtToPkrRate
          }
        }
      }

      const { error } = await supabase
        .from('admin_settings')
        .update(updatedSettings)
        .eq('id', 1)

      if (error) throw error

      setSettings(prev => prev ? { ...prev, ...updatedSettings } : null)
      setSuccess('Settings updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)

    } catch (error: any) {
      console.error('Error updating settings:', error)
      setError('Failed to update settings: ' + error.message)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Site Settings</h1>
        <div className="animate-pulse space-y-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-white/20 rounded w-full"></div>
              <div className="h-3 bg-white/20 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Site Settings</h1>
        <button
          onClick={fetchSettings}
          className="p-2 text-white/80 hover:text-white"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Referral Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Referral Commission Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Level 1 Earnings Commission (%)
              </label>
              <input
                type="number"
                value={referralL1}
                onChange={(e) => setReferralL1(parseFloat(e.target.value))}
                required
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-900 mt-1">Commission on earnings for L1</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Level 1 Deposit Commission (%)
              </label>
              <input
                type="number"
                value={referralL1Deposit}
                onChange={(e) => setReferralL1Deposit(parseFloat(e.target.value))}
                required
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-900 mt-1">Commission on deposits for L1</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Level 2 Earnings Commission (%)
              </label>
              <input
                type="number"
                value={referralL2}
                onChange={(e) => setReferralL2(parseFloat(e.target.value))}
                required
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-900 mt-1">Earnings commission only for L2</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Level 3 Earnings Commission (%)
              </label>
              <input
                type="number"
                value={referralL3}
                onChange={(e) => setReferralL3(parseFloat(e.target.value))}
                required
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-900 mt-1">Earnings commission only for L3</p>
            </div>
          </div>

        </div>

        {/* Deposit & Withdrawal Settings */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Deposit & Withdrawal Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Minimum Deposit Amount (PKR)
              </label>
              <input
                type="number"
                value={minDepositAmount}
                onChange={(e) => setMinDepositAmount(parseFloat(e.target.value))}
                required
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-white/80 mt-1">Minimum amount users can deposit</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Minimum Withdrawal Amount (PKR)
              </label>
              <input
                type="number"
                value={minWithdrawalAmount}
                onChange={(e) => setMinWithdrawalAmount(parseFloat(e.target.value))}
                required
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-white/80 mt-1">Minimum amount users can withdraw</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Withdrawal Fee (%)
              </label>
              <input
                type="number"
                value={withdrawalFeePercent}
                onChange={(e) => setWithdrawalFeePercent(parseFloat(e.target.value))}
                required
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-white/80 mt-1">Fee charged on withdrawals</p>
            </div>
          </div>
        </div>

        {/* Customer Support Settings */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Customer Support Settings
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              WhatsApp Support Number
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="e.g., +923001234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-white/80 mt-1">
              WhatsApp number for customer support (include country code, e.g., +923001234567)
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-white mb-2">
              WhatsApp Group Link
            </label>
            <input
              type="url"
              value={whatsappGroupLink}
              onChange={(e) => setWhatsappGroupLink(e.target.value)}
              placeholder="e.g., https://chat.whatsapp.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-white/80 mt-1">
              WhatsApp group invitation link for users to join community group
            </p>
          </div>
        </div>

        {/* Announcement Settings */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Dashboard Announcement
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="announcement_enabled"
                checked={settings?.announcement_enabled || false}
                onChange={(e) => setSettings(prev => prev ? {...prev, announcement_enabled: e.target.checked} : null)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="announcement_enabled" className="text-sm font-medium text-white">
                Enable Dashboard Announcement
              </label>
            </div>

            {settings?.announcement_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    value={settings?.announcement_title || ''}
                    onChange={(e) => setSettings(prev => prev ? {...prev, announcement_title: e.target.value} : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Welcome to SmartGrow!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Announcement Type
                  </label>
                  <select
                    value={settings?.announcement_type || 'info'}
                    onChange={(e) => setSettings(prev => prev ? {...prev, announcement_type: e.target.value as 'info' | 'warning' | 'success' | 'error'} : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="success">Success (Green)</option>
                    <option value="warning">Warning (Yellow)</option>
                    <option value="error">Error (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Announcement Text
                  </label>
                  <textarea
                    value={settings?.announcement_text || ''}
                    onChange={(e) => setSettings(prev => prev ? {...prev, announcement_text: e.target.value} : null)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your announcement message here..."
                  />
                  <p className="text-xs text-white/80 mt-1">
                    This message will appear as a popup every time users visit the dashboard
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Details
          </h3>
          
          <div className="space-y-6">
            {/* Bank Details */}
            <div>
              <h4 className="font-medium text-white mb-3">Bank Account Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., HBL Bank"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Account Title
                  </label>
                  <input
                    type="text"
                    value={bankTitle}
                    onChange={(e) => setBankTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SmartGrow Mining"
                  />
                </div>
              </div>
            </div>

            {/* Easypaisa Details */}
            <div>
              <h4 className="font-medium text-white mb-3">Easypaisa Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Easypaisa Number
                  </label>
                  <input
                    type="text"
                    value={easypaisaNumber}
                    onChange={(e) => setEasypaisaNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 03001234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Account Title
                  </label>
                  <input
                    type="text"
                    value={easypaisaTitle}
                    onChange={(e) => setEasypaisaTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SmartGrow Mining"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* USDT Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">USDT Cryptocurrency Settings</h3>
          
          <div className="space-y-6">
            {/* USDT Wallet Address */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                USDT Wallet Address
              </label>
              <input
                type="text"
                value={usdtWalletAddress}
                onChange={(e) => setUsdtWalletAddress(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., TXYZabc123..."
              />
            </div>

            {/* USDT Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Minimum USDT Deposit
                </label>
                <input
                  type="number"
                  value={minUsdtDeposit}
                  onChange={(e) => setMinUsdtDeposit(parseFloat(e.target.value))}
                  required
                  min="1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  USDT to PKR Rate
                </label>
                <input
                  type="number"
                  value={usdtToPkrRate}
                  onChange={(e) => setUsdtToPkrRate(parseFloat(e.target.value))}
                  required
                  min="1"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="280"
                />
              </div>
            </div>

            {/* Supported Chains */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Supported Blockchain Networks</h4>
              <div className="space-y-3">
                {usdtChains.map((chain, index) => (
                  <div key={chain.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                    <div>
                      <span className="font-medium text-gray-900">{chain.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({chain.network})</span>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={chain.enabled}
                        onChange={(e) => {
                          const newChains = [...usdtChains]
                          newChains[index].enabled = e.target.checked
                          setUsdtChains(newChains)
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enabled</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Time Restrictions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Clock className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Withdrawal Time Restrictions</h2>
          </div>

          <div className="space-y-6">
            {/* Master Toggle */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">Withdrawal System</h3>
                  <p className="text-sm text-gray-600">Enable or disable all withdrawals</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWithdrawalEnabled(!withdrawalEnabled)}
                  className="flex items-center space-x-2"
                >
                  {withdrawalEnabled ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>
              <div className={`text-sm font-medium ${
                withdrawalEnabled ? 'text-green-600' : 'text-red-600'
              }`}>
                Status: {withdrawalEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            {/* Auto Schedule Toggle */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">Auto Schedule</h3>
                  <p className="text-sm text-gray-600">Automatically restrict withdrawals by time and day</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWithdrawalAutoSchedule(!withdrawalAutoSchedule)}
                  className="flex items-center space-x-2"
                >
                  {withdrawalAutoSchedule ? (
                    <ToggleRight className="w-8 h-8 text-blue-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>
              <div className={`text-sm font-medium ${
                withdrawalAutoSchedule ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {withdrawalAutoSchedule 
                  ? 'Time restrictions active' 
                  : 'Manual control only (24/7 when enabled)'}
              </div>
            </div>

            {/* Time Settings */}
            {withdrawalAutoSchedule && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Time Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time (Pakistani Time)
                    </label>
                    <input
                      type="time"
                      value={withdrawalStartTime}
                      onChange={(e) => setWithdrawalStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time (Pakistani Time)
                    </label>
                    <input
                      type="time"
                      value={withdrawalEndTime}
                      onChange={(e) => setWithdrawalEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Allowed Days
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { key: 'monday', label: 'Monday' },
                      { key: 'tuesday', label: 'Tuesday' },
                      { key: 'wednesday', label: 'Wednesday' },
                      { key: 'thursday', label: 'Thursday' },
                      { key: 'friday', label: 'Friday' },
                      { key: 'saturday', label: 'Saturday' },
                      { key: 'sunday', label: 'Sunday' }
                    ].map(day => (
                      <label key={day.key} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={withdrawalDays.includes(day.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setWithdrawalDays([...withdrawalDays, day.key])
                            } else {
                              setWithdrawalDays(withdrawalDays.filter(d => d !== day.key))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Current Status Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Current Configuration</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>System: <span className="font-medium">{withdrawalEnabled ? 'Enabled' : 'Disabled'}</span></div>
                <div>Auto Schedule: <span className="font-medium">{withdrawalAutoSchedule ? 'Active' : 'Inactive'}</span></div>
                {withdrawalAutoSchedule && (
                  <>
                    <div>Hours: <span className="font-medium">{withdrawalStartTime} - {withdrawalEndTime} (Pakistani Time)</span></div>
                    <div>Days: <span className="font-medium">{withdrawalDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}</span></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Current Settings Preview */}
      {settings && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Settings Preview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Referral Commissions</h4>
              <div className="text-sm space-y-1">
                <div>L1 Earnings: <span className="font-medium">{settings.referral_l1_percent}%</span></div>
                <div>L1 Deposits: <span className="font-medium">{settings.referral_l1_deposit_percent || 5}%</span></div>
                <div>L2 Earnings: <span className="font-medium">{settings.referral_l2_percent}%</span></div>
                <div>L3 Earnings: <span className="font-medium">{settings.referral_l3_percent}%</span></div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
              <div className="text-sm space-y-1">
                <div>Bank: <span className="font-medium">{settings.deposit_details.bank.name}</span></div>
                <div>Account: <span className="font-medium">{settings.deposit_details.bank.account}</span></div>
                <div>Easypaisa: <span className="font-medium">{settings.deposit_details.easypaisa.number}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Bonus Management */}
      <BonusManagement />
    </div>
  )
}

// Bonus Management Component
function BonusManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [bonusAmount, setBonusAmount] = useState('')
  const [bonusReason, setBonusReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [bonusHistory, setBonusHistory] = useState<any[]>([])

  useEffect(() => {
    fetchUsers()
    fetchBonusHistory()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, balance')
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchBonusHistory = async () => {
    try {
      const response = await fetch('/api/admin/bonus')
      const data = await response.json()
      
      if (data.success) {
        setBonusHistory(data.bonuses || [])
      }
    } catch (error) {
      console.error('Error fetching bonus history:', error)
    }
  }

  const handleGiveBonus = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/bonus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser,
          amount: parseFloat(bonusAmount),
          reason: bonusReason || 'Admin bonus'
        })
      })

      const data = await response.json()

      console.log('Bonus API response:', data)

      if (data.success) {
        setSuccess(data.message)
        setBonusAmount('')
        setBonusReason('')
        setSelectedUser('')
        fetchUsers() // Refresh user balances
        fetchBonusHistory() // Refresh bonus history
      } else {
        console.error('Bonus error:', data)
        setError(data.error || 'Failed to give bonus')
        if (data.details) {
          setError(`${data.error}: ${data.details}`)
        }
      }
    } catch (error) {
      setError('Failed to give bonus')
      console.error('Error giving bonus:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <CreditCard className="w-5 h-5 mr-2" />
        User Bonus Management
      </h3>

      {/* Give Bonus Form */}
      <form onSubmit={handleGiveBonus} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} (Balance: PKR {user.balance})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Bonus Amount (PKR)
            </label>
            <input
              type="number"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              required
              min="1"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter bonus amount"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Reason (Optional)
          </label>
          <input
            type="text"
            value={bonusReason}
            onChange={(e) => setBonusReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Welcome bonus, Special reward, etc."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>{loading ? 'Processing...' : 'Give Bonus'}</span>
          </button>
        </div>
      </form>

      {/* Bonus History */}
      {bonusHistory.length > 0 && (
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 mb-4">Recent Bonus History</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bonusHistory.slice(0, 10).map((bonus) => (
                  <tr key={bonus.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bonus.user_profiles?.full_name || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      +PKR {bonus.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bonus.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bonus.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
