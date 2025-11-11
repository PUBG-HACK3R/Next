'use client'

import { useState } from 'react'
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award,
  Zap,
  Target,
  Crown,
  Gift,
  Star,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Calendar
} from 'lucide-react'

export default function DevZonePage() {
  const [selectedDesign, setSelectedDesign] = useState<string>('design1')

  // Add custom animations
  const customStyles = `
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes gradient {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    @keyframes pulse-slow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    .animate-shimmer {
      animation: shimmer 2s infinite;
    }
    .animate-gradient {
      background-size: 200% 200%;
      animation: gradient 3s ease infinite;
    }
    .animate-pulse-slow {
      animation: pulse-slow 2s ease-in-out infinite;
    }
  `

  // Sample data for testing - Stats Cards
  const sampleStats = {
    totalInvested: 8000,
    activeInvestments: 2,
    completedInvestments: 0,
    totalEarnings: 0,
    lockedEarnings: 436,
  }

  // Sample data for testing
  const sampleData = {
    balance: 15000,
    todayEarnings: 500,
    yesterdayEarnings: 450,
    totalEarnings: 12000,
    activeInvestments: 3,
    completedInvestments: 5,
    level1Count: 25,
    level2Count: 15,
    level3Count: 8,
    level1Earnings: 3000,
    level2Earnings: 1500,
    level3Earnings: 800
  }

  // Sample investment data
  const sampleInvestment = {
    id: 1,
    planName: 'Premium Growth Plan',
    amountInvested: 10000,
    profitPercent: 30,
    duration: 30,
    daysCollected: 15,
    dailyProfit: 100,
    totalProfit: 3000,
    totalReturn: 13000,
    startDate: '2024-11-01',
    lastCollection: '2024-11-09',
    daysRemaining: 15,
    progress: 50,
    canCollect: true,
    capitalReturn: true
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-3 md:p-4">
      <style>{customStyles}</style>
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 animate-pulse" />
              Dev Zone - Stats Cards
            </h1>
            <p className="text-sm md:text-base text-blue-200 mt-1">Test and preview new stats card designs</p>
          </div>
          <a 
            href="/dashboard"
            className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all border border-white/20 text-sm md:text-base text-center"
          >
            Back to Dashboard
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
              Design 1 - Current (White Cards)
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
          </div>
        </div>
      </div>

      {/* Design Previews */}
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Design 1 - Current White Stats Cards */}
        {selectedDesign === 'design1' && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Design 1 - Current (White Cards) 📊</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-black text-white mb-0.5">{sampleInvestment.planName}</h3>
                    <p className="text-[10px] md:text-xs text-gray-400">Started {sampleInvestment.startDate}</p>
                  </div>
                  <div className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                    <span className="text-green-400 text-[10px] md:text-xs font-bold flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Active</span>
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 hover:border-blue-500/50 transition-all duration-200">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="p-1 bg-blue-500/20 rounded-md">
                        <DollarSign className="w-2.5 h-2.5 md:w-3 md:h-3 text-blue-400" />
                      </div>
                      <p className="text-gray-400 text-[8px] md:text-[9px] font-semibold">Invested</p>
                    </div>
                    <p className="text-white font-black text-[10px] md:text-xs truncate">{formatCurrency(sampleInvestment.amountInvested)}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 hover:border-green-500/50 transition-all duration-200">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="p-1 bg-green-500/20 rounded-md">
                        <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-400" />
                      </div>
                      <p className="text-gray-400 text-[8px] md:text-[9px] font-semibold">Profit</p>
                    </div>
                    <p className="text-green-400 font-black text-[10px] md:text-xs">{sampleInvestment.profitPercent}%</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 hover:border-purple-500/50 transition-all duration-200">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="p-1 bg-purple-500/20 rounded-md">
                        <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 text-purple-400" />
                      </div>
                      <p className="text-gray-400 text-[8px] md:text-[9px] font-semibold">Days</p>
                    </div>
                    <p className="text-white font-black text-[10px] md:text-xs">{sampleInvestment.duration}d</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 hover:border-pink-500/50 transition-all duration-200">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="p-1 bg-pink-500/20 rounded-md">
                        <Award className="w-2.5 h-2.5 md:w-3 md:h-3 text-pink-400" />
                      </div>
                      <p className="text-gray-400 text-[8px] md:text-[9px] font-semibold">Profit</p>
                    </div>
                    <p className="text-blue-400 font-black text-[10px] md:text-xs truncate">{formatCurrency(sampleInvestment.totalProfit)}</p>
                  </div>
                </div>

                {/* Daily Collection Section */}
                <div className="bg-slate-800 border border-green-500/30 rounded-lg md:rounded-xl p-3 md:p-4 mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                        <p className="text-green-400 text-[10px] md:text-xs font-bold">Daily Profit Available</p>
                      </div>
                      <p className="text-white font-black text-lg md:text-xl mb-2">{formatCurrency(sampleInvestment.dailyProfit)}</p>
                      <div className="flex flex-wrap gap-1.5 text-[9px] md:text-[10px] text-gray-400">
                        <span className="flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" />
                          {sampleInvestment.daysCollected}/{sampleInvestment.duration}
                        </span>
                        <span>•</span>
                        <span>Last: {sampleInvestment.lastCollection}</span>
                      </div>
                    </div>
                    <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-xs md:text-sm">
                      COLLECT
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-[10px] md:text-xs font-bold">Progress</span>
                    <span className="text-white font-black text-[10px] md:text-xs">{sampleInvestment.daysRemaining} days left</span>
                  </div>
                  <div className="bg-slate-800 rounded-full h-3 md:h-3.5 overflow-hidden border border-slate-700">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${sampleInvestment.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-blue-400 font-bold text-[9px] md:text-[10px]">{sampleInvestment.progress}%</span>
                  </div>
                </div>
            </div>
          </div>
        )}

        {/* Design 2 - Glass Morphism */}
        {selectedDesign === 'design2' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Design 2 - Premium Glass Morphism</h2>
            
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{sampleInvestment.planName}</h3>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Calendar className="w-4 h-4" />
                    <span>Started {sampleInvestment.startDate}</span>
                  </div>
                </div>
                <div className="px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
                  <span className="text-green-300 text-sm font-semibold flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Active
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-5">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                      <DollarSign className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-white/60 text-xs">Invested</p>
                  </div>
                  <p className="text-white font-bold text-lg">{formatCurrency(sampleInvestment.amountInvested)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-500/20 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-white/60 text-xs">Profit Rate</p>
                  </div>
                  <p className="text-green-400 font-bold text-lg">{sampleInvestment.profitPercent}%</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-purple-500/20 rounded-lg">
                      <Clock className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-white/60 text-xs">Duration</p>
                  </div>
                  <p className="text-white font-bold text-lg">{sampleInvestment.duration} days</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-pink-500/20 rounded-lg">
                      <Award className="w-4 h-4 text-pink-400" />
                    </div>
                    <p className="text-white/60 text-xs">Total Profit</p>
                  </div>
                  <p className="text-blue-400 font-bold text-lg">{formatCurrency(sampleInvestment.totalProfit)}</p>
                </div>
              </div>

              {/* Daily Collection */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-400/20 rounded-2xl p-5 mb-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-green-400" />
                      <p className="text-green-300 text-sm font-medium">Daily Profit Available</p>
                    </div>
                    <p className="text-white font-bold text-2xl mb-3">{formatCurrency(sampleInvestment.dailyProfit)}</p>
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span>Collected: {sampleInvestment.daysCollected}/{sampleInvestment.duration}</span>
                      <span>•</span>
                      <span>Last: {sampleInvestment.lastCollection}</span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:shadow-green-500/50 transition-all duration-200 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Collect Now
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-white/70 font-medium">Investment Progress</span>
                  <span className="text-white font-bold">{sampleInvestment.daysRemaining} days remaining</span>
                </div>
                <div className="relative">
                  <div className="w-full bg-white/10 backdrop-blur-sm rounded-full h-3 overflow-hidden border border-white/20">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 relative"
                      style={{ width: `${sampleInvestment.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <span className="absolute -top-6 right-0 text-xs text-white/80 font-semibold">{sampleInvestment.progress}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Design 3 - Clean Minimal White */}
        {selectedDesign === 'design3' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Design 3 - Clean Minimal White Card</h2>
            
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{sampleInvestment.planName}</h3>
                  <p className="text-sm text-gray-500 mt-1">Started {sampleInvestment.startDate}</p>
                </div>
                <div className="px-4 py-2 bg-green-100 rounded-full">
                  <span className="text-green-700 text-sm font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Active
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs mb-1">Invested</p>
                  <p className="text-gray-900 font-bold text-lg">{formatCurrency(sampleInvestment.amountInvested)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs mb-1">Profit Rate</p>
                  <p className="text-green-600 font-bold text-lg">{sampleInvestment.profitPercent}%</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs mb-1">Duration</p>
                  <p className="text-gray-900 font-bold text-lg">{sampleInvestment.duration}d</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Award className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs mb-1">Total Profit</p>
                  <p className="text-blue-600 font-bold text-lg">{formatCurrency(sampleInvestment.totalProfit)}</p>
                </div>
              </div>

              {/* Daily Collection */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-medium mb-1">Daily Profit Available</p>
                    <p className="text-gray-900 font-bold text-2xl mb-2">{formatCurrency(sampleInvestment.dailyProfit)}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>Collected: {sampleInvestment.daysCollected}/{sampleInvestment.duration}</span>
                      <span>•</span>
                      <span>Last: {sampleInvestment.lastCollection}</span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Collect
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-600 font-medium">Progress</span>
                  <span className="text-gray-900 font-bold">{sampleInvestment.daysRemaining} days remaining</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${sampleInvestment.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Design 4 - Neon Cyberpunk */}
        {selectedDesign === 'design4' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Design 4 - Neon Cyberpunk Style</h2>
            
            <div className="bg-black rounded-2xl p-6 border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.6)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{sampleInvestment.planName}</h3>
                  <p className="text-sm text-cyan-400">◢ {sampleInvestment.startDate} ◣</p>
                </div>
                <div className="px-4 py-2 bg-green-500/20 border border-green-400 rounded-lg shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                  <span className="text-green-400 text-sm font-bold flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,1)]"></div>
                    ACTIVE
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                <div className="bg-slate-900 border border-blue-500 rounded-lg p-3 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  <DollarSign className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-blue-300 text-[10px] mb-1">INVESTED</p>
                  <p className="text-white font-bold text-sm">{formatCurrency(sampleInvestment.amountInvested)}</p>
                </div>
                <div className="bg-slate-900 border border-green-500 rounded-lg p-3 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                  <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
                  <p className="text-green-300 text-[10px] mb-1">PROFIT RATE</p>
                  <p className="text-green-400 font-bold text-sm">{sampleInvestment.profitPercent}%</p>
                </div>
                <div className="bg-slate-900 border border-purple-500 rounded-lg p-3 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                  <Clock className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-purple-300 text-[10px] mb-1">DURATION</p>
                  <p className="text-white font-bold text-sm">{sampleInvestment.duration}D</p>
                </div>
                <div className="bg-slate-900 border border-pink-500 rounded-lg p-3 shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                  <Award className="w-5 h-5 text-pink-400 mb-2" />
                  <p className="text-pink-300 text-[10px] mb-1">TOTAL PROFIT</p>
                  <p className="text-cyan-400 font-bold text-sm">{formatCurrency(sampleInvestment.totalProfit)}</p>
                </div>
              </div>

              {/* Daily Collection */}
              <div className="bg-slate-900 border-2 border-green-500 rounded-xl p-5 mb-5 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-green-400 animate-pulse" />
                      <p className="text-green-400 text-sm font-bold">DAILY PROFIT READY</p>
                    </div>
                    <p className="text-white font-bold text-3xl mb-2">{formatCurrency(sampleInvestment.dailyProfit)}</p>
                    <div className="flex items-center gap-3 text-xs text-cyan-400 font-mono">
                      <span>[{sampleInvestment.daysCollected}/{sampleInvestment.duration}]</span>
                      <span>|</span>
                      <span>LAST: {sampleInvestment.lastCollection}</span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-black px-8 py-3 rounded-lg font-black shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:shadow-[0_0_30px_rgba(34,197,94,0.8)] transition-all duration-200 flex items-center gap-2 border-2 border-green-400">
                    <TrendingUp className="w-5 h-5" />
                    COLLECT
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-cyan-400 font-mono text-xs">PROGRESS</span>
                  <span className="text-white font-bold">{sampleInvestment.daysRemaining} DAYS LEFT</span>
                </div>
                <div className="relative">
                  <div className="w-full bg-slate-900 border border-cyan-500 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full transition-all duration-500 relative"
                      style={{ width: `${sampleInvestment.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <span className="absolute -top-6 right-0 text-xs text-cyan-400 font-mono font-bold">{sampleInvestment.progress}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Design 5 - Card Stack 3D */}
        {selectedDesign === 'design5' && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Design 5 - 3D Card Stack 🎴</h2>
            
            <div className="relative">
              {/* Shadow cards for 3D effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl md:rounded-3xl transform translate-y-3 translate-x-3 opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl md:rounded-3xl transform translate-y-1.5 translate-x-1.5 opacity-40"></div>
              
              {/* Main card */}
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl border border-white/10 hover:transform hover:-translate-y-2 transition-all duration-300">
                {/* Floating badge */}
                <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg transform rotate-12 hover:rotate-0 transition-all duration-300">
                  <span className="text-white text-xs md:text-sm font-black flex items-center gap-1">
                    <Star className="w-3 h-3 md:w-4 md:h-4" />
                    ACTIVE
                  </span>
                </div>

                {/* Header */}
                <div className="mb-5 pt-2">
                  <h3 className="text-xl md:text-2xl font-black text-white mb-2">{sampleInvestment.planName}</h3>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Since {sampleInvestment.startDate}</span>
                  </div>
                </div>

                {/* Stats in horizontal scroll on mobile */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-3 md:p-4 shadow-lg transform hover:scale-105 transition-all">
                    <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-blue-200 mb-2" />
                    <p className="text-blue-200 text-[9px] md:text-xs font-medium mb-1">INVESTED</p>
                    <p className="text-white font-black text-xs md:text-base truncate">{formatCurrency(sampleInvestment.amountInvested)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-xl p-3 md:p-4 shadow-lg transform hover:scale-105 transition-all">
                    <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-200 mb-2" />
                    <p className="text-green-200 text-[9px] md:text-xs font-medium mb-1">RATE</p>
                    <p className="text-white font-black text-xs md:text-base">{sampleInvestment.profitPercent}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-600 to-pink-800 rounded-xl p-3 md:p-4 shadow-lg transform hover:scale-105 transition-all">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-purple-200 mb-2" />
                    <p className="text-purple-200 text-[9px] md:text-xs font-medium mb-1">DURATION</p>
                    <p className="text-white font-black text-xs md:text-base">{sampleInvestment.duration} DAYS</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-600 to-red-800 rounded-xl p-3 md:p-4 shadow-lg transform hover:scale-105 transition-all">
                    <Award className="w-5 h-5 md:w-6 md:h-6 text-orange-200 mb-2" />
                    <p className="text-orange-200 text-[9px] md:text-xs font-medium mb-1">PROFIT</p>
                    <p className="text-white font-black text-xs md:text-base truncate">{formatCurrency(sampleInvestment.totalProfit)}</p>
                  </div>
                </div>

                {/* Collection Box */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl md:rounded-2xl p-4 md:p-6 mb-5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-white/80 text-xs md:text-sm font-semibold mb-1">💰 Daily Profit</p>
                        <p className="text-white font-black text-2xl md:text-4xl mb-3">{formatCurrency(sampleInvestment.dailyProfit)}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] md:text-xs text-white/80">
                          <span className="bg-white/20 px-2 py-1 rounded-full">{sampleInvestment.daysCollected}/{sampleInvestment.duration} collected</span>
                          <span className="bg-white/20 px-2 py-1 rounded-full">Last: {sampleInvestment.lastCollection}</span>
                        </div>
                      </div>
                      <button className="bg-white hover:bg-gray-100 text-green-600 px-6 md:px-10 py-3 md:py-4 rounded-xl font-black shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm md:text-base">
                        COLLECT NOW
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-white/5 rounded-xl p-3 md:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/70 text-xs md:text-sm font-semibold">Progress</span>
                    <span className="text-white font-bold text-xs md:text-sm">{sampleInvestment.daysRemaining} days remaining</span>
                  </div>
                  <div className="relative h-3 md:h-4 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${sampleInvestment.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right mt-2">
                    <span className="text-yellow-400 font-bold text-xs md:text-sm">{sampleInvestment.progress}% Complete</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Design 6 - Neumorphism */}
        {selectedDesign === 'design6' && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Design 6 - Soft Neumorphism 🎨</h2>
            
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#b8b9be]">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-black text-gray-800 mb-1">{sampleInvestment.planName}</h3>
                  <p className="text-xs md:text-sm text-gray-600">Started {sampleInvestment.startDate}</p>
                </div>
                <div className="px-4 py-2 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]">
                  <span className="text-green-600 text-xs md:text-sm font-bold flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Active
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl p-3 md:p-4 shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-500 rounded-lg shadow-md">
                      <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <p className="text-gray-600 text-[9px] md:text-xs font-semibold">Invested</p>
                  </div>
                  <p className="text-gray-900 font-black text-xs md:text-base truncate">{formatCurrency(sampleInvestment.amountInvested)}</p>
                </div>
                <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl p-3 md:p-4 shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-500 rounded-lg shadow-md">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <p className="text-gray-600 text-[9px] md:text-xs font-semibold">Profit</p>
                  </div>
                  <p className="text-green-600 font-black text-xs md:text-base">{sampleInvestment.profitPercent}%</p>
                </div>
                <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl p-3 md:p-4 shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-purple-500 rounded-lg shadow-md">
                      <Clock className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <p className="text-gray-600 text-[9px] md:text-xs font-semibold">Days</p>
                  </div>
                  <p className="text-gray-900 font-black text-xs md:text-base">{sampleInvestment.duration}d</p>
                </div>
                <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl p-3 md:p-4 shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] hover:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-pink-500 rounded-lg shadow-md">
                      <Award className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                    <p className="text-gray-600 text-[9px] md:text-xs font-semibold">Profit</p>
                  </div>
                  <p className="text-blue-600 font-black text-xs md:text-base truncate">{formatCurrency(sampleInvestment.totalProfit)}</p>
                </div>
              </div>

              {/* Collection Section */}
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl md:rounded-2xl p-4 md:p-6 mb-5 shadow-[inset_6px_6px_12px_#b8b9be,inset_-6px_-6px_12px_#ffffff]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                      <p className="text-gray-700 text-xs md:text-sm font-bold">Daily Profit Available</p>
                    </div>
                    <p className="text-gray-900 font-black text-2xl md:text-3xl mb-3">{formatCurrency(sampleInvestment.dailyProfit)}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] md:text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {sampleInvestment.daysCollected}/{sampleInvestment.duration}
                      </span>
                      <span>•</span>
                      <span>Last: {sampleInvestment.lastCollection}</span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-black shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm md:text-base">
                    COLLECT
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-700 text-xs md:text-sm font-bold">Progress</span>
                  <span className="text-gray-900 font-black text-xs md:text-sm">{sampleInvestment.daysRemaining} days left</span>
                </div>
                <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-full h-4 md:h-5 shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${sampleInvestment.progress}%` }}
                  ></div>
                </div>
                <div className="text-right mt-2">
                  <span className="text-blue-600 font-bold text-xs md:text-sm">{sampleInvestment.progress}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 mt-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-yellow-400" />
            How to Use Dev Zone
          </h3>
          <div className="space-y-3 text-white/80">
            <p>1. <strong className="text-white">Select a design</strong> from the buttons above to preview different card styles</p>
            <p>2. <strong className="text-white">Review the design</strong> and see how it looks with sample data</p>
            <p>3. <strong className="text-white">Tell me which design you like</strong> and I'll replace the existing cards</p>
            <p>4. <strong className="text-white">Request modifications</strong> - I can adjust colors, sizes, layouts, animations, etc.</p>
            <p>5. <strong className="text-white">Test multiple designs</strong> before making a final decision</p>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-yellow-500/10 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/20">
          <h3 className="text-xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
            <Star className="w-6 h-6" />
            Design Notes
          </h3>
          <div className="space-y-2 text-yellow-100 text-sm">
            <p><strong>Design 1 (Gradient Glow):</strong> Modern gradient border with dark background - premium and eye-catching ✨</p>
            <p><strong>Design 2 (Glass Morphism):</strong> Elegant frosted glass effect - professional and sophisticated 💎</p>
            <p><strong>Design 3 (Clean White):</strong> Minimal white card - clean, simple, easy to read 🤍</p>
            <p><strong>Design 4 (Neon Cyberpunk):</strong> Futuristic neon borders with glow effects - bold and energetic ⚡</p>
            <p><strong>Design 5 (3D Card Stack):</strong> Layered 3D effect with floating badge - playful and dynamic 🎴</p>
            <p><strong>Design 6 (Neumorphism):</strong> Soft shadows and light theme - modern and tactile 🎨</p>
          </div>
        </div>
      </div>
    </div>
  )
}
