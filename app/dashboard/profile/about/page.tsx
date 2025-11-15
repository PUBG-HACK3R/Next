'use client'

import Link from 'next/link'
import { 
  ArrowLeft,
  Shield,
  TrendingUp,
  Users,
  Award,
  Globe,
  Zap,
  Heart,
  Star,
  CheckCircle
} from 'lucide-react'

export default function AboutPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-blue-900 border-b-2 border-blue-400 sticky top-0 z-40" style={{boxShadow: '0 2px 20px rgba(59, 130, 246, 0.5)'}}>
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/profile">
              <ArrowLeft className="w-6 h-6 text-white hover:text-blue-200 transition-colors" />
            </Link>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                About SmartGrow
              </h1>
              <p className="text-xs text-slate-400">Learn more about our platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="prose prose-invert max-w-none">
            <div className="text-white leading-relaxed space-y-6">
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  🏆 SmartGrow Mining — The Future of Trusted Crypto Mining
                </h2>
                <p className="text-slate-300 mb-4">
                  Welcome to SmartGrow Mining, a genuine and transparent crypto mining and investment platform built to help you grow your digital wealth securely and efficiently.
                </p>
                <p className="text-slate-300 mb-4">
                  We believe in real mining, real profits, and real trust.
                  At SmartGrow Mining, every process — from investment to profit withdrawal — is fully transparent, easy to track, and powered by cutting-edge blockchain technology.
                </p>
              </div>

              <hr className="border-slate-600" />

              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  ⚙️ What We Do
                </h3>
                <p className="text-slate-300 mb-4">
                  We run a network of high-performance crypto mining machines and ASIC rigs that operate 24/7 to mine top cryptocurrencies such as Bitcoin, Ethereum, and Litecoin.
                  Our mining farms are equipped with advanced cooling systems and real-time monitoring tools, ensuring maximum uptime and consistent profit generation for all investors.
                </p>
                <p className="text-slate-300 mb-4">
                  Every investor at SmartGrow Mining earns a daily income based on their chosen investment plan.
                  The system automatically calculates your profit, updates your dashboard, and allows you to withdraw your earnings securely anytime you wish.
                </p>
              </div>

              <hr className="border-slate-600" />

              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  💠 Our Vision
                </h3>
                <p className="text-slate-300 mb-4">
                  Our vision is to make crypto mining accessible to everyone, not just tech experts.
                  We aim to create a reliable, global platform where anyone can start earning from crypto mining with minimal effort and complete peace of mind.
                </p>
                <p className="text-slate-300 mb-4">
                  We believe in honesty, growth, and innovation — and these are the values that drive SmartGrow Mining forward.
                </p>
              </div>

              <hr className="border-slate-600" />

              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  💎 Why Choose SmartGrow Mining?
                </h3>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>100% Genuine & Verified Mining Setup</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Guaranteed Daily Profit Based on Plan</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Transparent and User-Friendly Dashboard</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Secure Withdrawals with Instant Processing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Real-Time Profit Tracking & Notifications</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>24/7 Professional Support Team</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>No Hidden Fees or Fake Promises</span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-600" />

              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  💰 Your Investment, Our Responsibility
                </h3>
                <p className="text-slate-300 mb-4">
                  When you invest with SmartGrow Mining, you're joining a platform built on trust and technology.
                  Your capital is used to power our real mining infrastructure, and your profits are distributed fairly according to your selected plan.
                </p>
                <p className="text-slate-300 mb-4">
                  We're not just another investment site — we're a real mining ecosystem, designed for long-term sustainability and genuine investor success.
                </p>
                <p className="text-slate-300 font-semibold">
                  Join SmartGrow Mining today and start earning from the power of crypto mining — safely, transparently, and profitably.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
