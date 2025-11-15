'use client'

import { useState } from 'react'
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  CheckCircle,
  Archive,
  Lock
} from 'lucide-react'

export default function StatsCardsDevZone() {
  const [selectedDesign, setSelectedDesign] = useState<string>('design1')

  // Sample stats data matching the screenshot
  const stats = {
    totalInvested: 8000,
    activeInvestments: 2,
    completedInvestments: 0,
    totalEarnings: 0,
    lockedEarnings: 436,
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-3 md:p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 animate-pulse" />
              Dev Zone - Stats Cards
            </h1>
            <p className="text-sm md:text-base text-blue-200 mt-1">Preview different stats card designs</p>
          </div>
          <a 
            href="/dashboard/my-investments"
            className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all border border-white/20 text-sm md:text-base text-center"
          >
            Back to Investments
          </a>
        </div>

        {/* Design Selector */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <h2 className="text-white font-semibold mb-3">Select Stats Card Design:</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDesign('design1')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDesign === 'design1'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Design 1 - Current (White)
            </button>
            <button
              onClick={() => setSelectedDesign('design2')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDesign === 'design2'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Design 2 - Dark Modern
            </button>
            <button
              onClick={() => setSelectedDesign('design3')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDesign === 'design3'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Design 3 - Gradient Cards
            </button>
            <button
              onClick={() => setSelectedDesign('design4')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDesign === 'design4'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Design 4 - Glassmorphism
            </button>
            <button
              onClick={() => setSelectedDesign('design5')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDesign === 'design5'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Design 5 - Neumorphism (Match Card)
            </button>
          </div>
        </div>
      </div>

      {/* Design Previews */}
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Design 1 - Current White Cards */}
        {selectedDesign === 'design1' && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Design 1 - Current (White Cards) 📊</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
              {/* Total Invested */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Total Invested</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalInvested)}</p>
              </div>

              {/* Active */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Active</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{stats.activeInvestments}</p>
              </div>

              {/* Completed */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Completed</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{stats.completedInvestments}</p>
              </div>

              {/* Total Earnings */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Archive className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Total Earnings</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
              </div>

              {/* Locked Earnings */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <Lock className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Locked Earnings</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.lockedEarnings)}</p>
                <p className="text-[10px] text-gray-500 mt-1">Available on Completion</p>
              </div>
            </div>
          </div>
        )}

        {/* Design 2 - Dark Modern */}
        {selectedDesign === 'design2' && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Design 2 - Dark Modern 🌙</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
              {/* Total Invested */}
              <div className="bg-slate-800 rounded-lg p-3 border border-blue-500/30 hover:border-blue-500/60 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <p className="text-xs text-gray-400 font-medium">Total Invested</p>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.totalInvested)}</p>
              </div>

              {/* Active */}
              <div className="bg-slate-800 rounded-lg p-3 border border-green-500/30 hover:border-green-500/60 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <p className="text-xs text-gray-400 font-medium">Active</p>
                </div>
                <p className="text-lg font-bold text-white">{stats.activeInvestments}</p>
              </div>

              {/* Completed */}
              <div className="bg-slate-800 rounded-lg p-3 border border-purple-500/30 hover:border-purple-500/60 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                  <p className="text-xs text-gray-400 font-medium">Completed</p>
                </div>
                <p className="text-lg font-bold text-white">{stats.completedInvestments}</p>
              </div>

              {/* Total Earnings */}
              <div className="bg-slate-800 rounded-lg p-3 border border-orange-500/30 hover:border-orange-500/60 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Archive className="w-5 h-5 text-orange-400" />
                  <p className="text-xs text-gray-400 font-medium">Total Earnings</p>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.totalEarnings)}</p>
              </div>

              {/* Locked Earnings */}
              <div className="bg-slate-800 rounded-lg p-3 border border-red-500/30 hover:border-red-500/60 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-red-400" />
                  <p className="text-xs text-gray-400 font-medium">Locked Earnings</p>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.lockedEarnings)}</p>
                <p className="text-[10px] text-gray-500 mt-1">Available on Completion</p>
              </div>
            </div>
          </div>
        )}

        {/* Design 3 - Gradient Cards */}
        {selectedDesign === 'design3' && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Design 3 - Gradient Cards 🎨</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
              {/* Total Invested */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-white" />
                  <p className="text-xs text-white/80 font-medium">Total Invested</p>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.totalInvested)}</p>
              </div>

              {/* Active */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-white" />
                  <p className="text-xs text-white/80 font-medium">Active</p>
                </div>
                <p className="text-lg font-bold text-white">{stats.activeInvestments}</p>
              </div>

              {/* Completed */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-700 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <p className="text-xs text-white/80 font-medium">Completed</p>
                </div>
                <p className="text-lg font-bold text-white">{stats.completedInvestments}</p>
              </div>

              {/* Total Earnings */}
              <div className="bg-gradient-to-br from-orange-500 to-red-700 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Archive className="w-5 h-5 text-white" />
                  <p className="text-xs text-white/80 font-medium">Total Earnings</p>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.totalEarnings)}</p>
              </div>

              {/* Locked Earnings */}
              <div className="bg-gradient-to-br from-red-500 to-rose-700 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-white" />
                  <p className="text-xs text-white/80 font-medium">Locked Earnings</p>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.lockedEarnings)}</p>
                <p className="text-[10px] text-white/70 mt-1">Available on Completion</p>
              </div>
            </div>
          </div>
        )}

        {/* Design 4 - Glassmorphism */}
        {selectedDesign === 'design4' && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Design 4 - Glassmorphism 💎</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
              {/* Total Invested */}
              <div className="bg-white/10 backdrop-blur-xl rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <DollarSign className="w-4 h-4 text-blue-300" />
                  </div>
                  <p className="text-xs text-white/80 font-medium">Total Invested</p>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.totalInvested)}</p>
              </div>

              {/* Active */}
              <div className="bg-white/10 backdrop-blur-xl rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <TrendingUp className="w-4 h-4 text-green-300" />
                  </div>
                  <p className="text-xs text-white/80 font-medium">Active</p>
                </div>
                <p className="text-lg font-bold text-white">{stats.activeInvestments}</p>
              </div>

              {/* Completed */}
              <div className="bg-white/10 backdrop-blur-xl rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <CheckCircle className="w-4 h-4 text-purple-300" />
                  </div>
                  <p className="text-xs text-white/80 font-medium">Completed</p>
                </div>
                <p className="text-lg font-bold text-white">{stats.completedInvestments}</p>
              </div>

              {/* Total Earnings */}
              <div className="bg-white/10 backdrop-blur-xl rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Archive className="w-4 h-4 text-orange-300" />
                  </div>
                  <p className="text-xs text-white/80 font-medium">Total Earnings</p>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.totalEarnings)}</p>
              </div>

              {/* Locked Earnings */}
              <div className="bg-white/10 backdrop-blur-xl rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Lock className="w-4 h-4 text-red-300" />
                  </div>
                  <p className="text-xs text-white/80 font-medium">Locked Earnings</p>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(stats.lockedEarnings)}</p>
                <p className="text-[10px] text-white/60 mt-1">Available on Completion</p>
              </div>
            </div>
          </div>
        )}

        {/* Design 5 - Neumorphism (Matches Active Investment Card) */}
        {selectedDesign === 'design5' && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Design 5 - Neumorphism (Matches Investment Card) 🎯</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {/* Total Invested */}
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2.5 shadow-[3px_3px_6px_#b8b9be,-3px_-3px_6px_#b8b9be] hover:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#b8b9be] transition-all duration-300">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="p-1 bg-blue-500 rounded-md shadow-md">
                    <DollarSign className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-[9px] text-gray-600 font-semibold">Total Invested</p>
                </div>
                <p className="text-sm font-black text-gray-900">{formatCurrency(stats.totalInvested)}</p>
              </div>

              {/* Active */}
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2.5 shadow-[3px_3px_6px_#b8b9be,-3px_-3px_6px_#b8b9be] hover:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#b8b9be] transition-all duration-300">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="p-1 bg-green-500 rounded-md shadow-md">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-[9px] text-gray-600 font-semibold">Active</p>
                </div>
                <p className="text-sm font-black text-gray-900">{stats.activeInvestments}</p>
              </div>

              {/* Completed */}
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2.5 shadow-[3px_3px_6px_#b8b9be,-3px_-3px_6px_#b8b9be] hover:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#b8b9be] transition-all duration-300">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="p-1 bg-purple-500 rounded-md shadow-md">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-[9px] text-gray-600 font-semibold">Completed</p>
                </div>
                <p className="text-sm font-black text-gray-900">{stats.completedInvestments}</p>
              </div>

              {/* Total Earnings */}
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2.5 shadow-[3px_3px_6px_#b8b9be,-3px_-3px_6px_#b8b9be] hover:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#b8b9be] transition-all duration-300">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="p-1 bg-orange-500 rounded-md shadow-md">
                    <Archive className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-[9px] text-gray-600 font-semibold">Total Earnings</p>
                </div>
                <p className="text-sm font-black text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
              </div>

              {/* Locked Earnings */}
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2.5 shadow-[3px_3px_6px_#b8b9be,-3px_-3px_6px_#b8b9be] hover:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#b8b9be] transition-all duration-300">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="p-1 bg-gradient-to-br from-red-500 to-rose-600 rounded-md shadow-lg">
                    <Lock className="w-3.5 h-3.5 text-yellow-300 stroke-[2.5]" />
                  </div>
                  <p className="text-[9px] text-gray-600 font-semibold">Locked Earnings</p>
                </div>
                <p className="text-sm font-black text-gray-900">{formatCurrency(stats.lockedEarnings)}</p>
                <p className="text-[8px] text-gray-600 mt-1">Available on Completion</p>
              </div>
            </div>
            
            <div className="bg-green-500/10 backdrop-blur-xl rounded-xl p-4 border border-green-500/30 mt-4">
              <p className="text-green-300 text-sm">✅ <strong>Perfect Match!</strong> This design uses the same neumorphism style as your active investment cards with soft shadows and gray gradient backgrounds.</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 mt-8">
          <h3 className="text-xl font-bold text-white mb-4">📝 How to Use</h3>
          <div className="space-y-2 text-white/80 text-sm">
            <p>1. <strong className="text-white">Select a design</strong> from the buttons above</p>
            <p>2. <strong className="text-white">Review the stats cards</strong> with sample data</p>
            <p>3. <strong className="text-white">Tell me which design you prefer</strong> and I'll apply it to your investments page</p>
            <p>4. All designs show the same data - just different visual styles!</p>
            <p>5. <strong className="text-green-400">Design 5 (Neumorphism)</strong> perfectly matches your active investment card style!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
