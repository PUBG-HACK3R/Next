'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Sparkles, ArrowRight, Shield, TrendingUp, Users, HelpCircle } from 'lucide-react'
import WhatsAppSupport from '@/components/WhatsAppSupport'
import WelcomePopup from '@/components/WelcomePopup'
import AppInstallPrompt from '@/components/AppInstallPrompt'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [userName, setUserName] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      // Check if user is suspended
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('suspended, suspension_reason')
        .eq('id', data.user.id)
        .single()

      if (profileData?.suspended) {
        setError(`Your account is suspended. ${profileData.suspension_reason ? 'Reason: ' + profileData.suspension_reason : 'Please contact customer support for assistance.'}`)
        setLoading(false)
        return
      }

      // Get user name from metadata or email
      const displayName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User'
      setUserName(displayName)
      setShowWelcomePopup(true)
      setLoading(false)
    }
  }

  const handleCloseWelcomePopup = () => {
    setShowWelcomePopup(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
      {/* Static Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl opacity-20" />
      </div>

      {/* Left Side - Welcome Content */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 relative z-10">
        <div className="max-w-lg">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="relative">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mr-4 border border-white/20 relative">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-500"></div>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">SmartGrow</span>
          </div>
          
          {/* Welcome Badge */}
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/20">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Welcome Back Investor!
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl font-bold text-white mb-6">
            Continue Your
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Mining Journey
            </span>
          </h1>
          
          {/* Description */}
          <motion.p 
            className="text-slate-300 mb-10 text-lg leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Access your cryptocurrency mining dashboard and track your{' '}
            <span className="text-blue-400 font-medium">daily mining rewards</span> from premium
            mining operations.
          </motion.p>
          
          {/* Features */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            {[
              { icon: TrendingUp, text: "Track mining performance", color: "from-green-400 to-emerald-500" },
              { icon: Shield, text: "Secure mining platform", color: "from-blue-400 to-cyan-500" },
              { icon: Users, text: "Community-driven insights", color: "from-purple-400 to-pink-500" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center text-slate-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.2 }}
              >
                <div className={`w-10 h-10 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 lg:px-12 relative z-10">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 shadow-lg shadow-blue-500/25 border border-white/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg relative">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-500"></div>
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              SmartGrow Mining
            </h1>
          </div>
          
          {/* Login Card */}
          <motion.div 
            className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
              <p className="text-slate-400">Sign in to your mining account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <label htmlFor="email" className="block text-sm font-medium text-white mb-3">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm"
                  placeholder="Enter your email"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <label htmlFor="password" className="block text-sm font-medium text-white mb-3">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm"
                    placeholder="Enter your password"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </motion.button>
                </div>
              </motion.div>

              {error && (
                <motion.div 
                  className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:from-blue-400 hover:to-purple-500"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </div>
              </motion.button>
            </form>

            <motion.div 
              className="mt-8 text-center space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <div className="text-sm text-slate-400">
                Don't have an account?{' '}
                <Link href="/signup" className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors">
                  Create account
                </Link>
              </div>

              {/* Customer Support */}
              <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                <div className="flex items-center mb-2">
                  <HelpCircle className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="text-sm font-medium text-white">Need Help?</span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Having trouble logging in? Contact our support team for assistance.
                </p>
                <WhatsAppSupport variant="button" className="w-full text-sm py-2" />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Welcome Popup */}
      <WelcomePopup
        isOpen={showWelcomePopup}
        onClose={handleCloseWelcomePopup}
        userName={userName}
      />

      {/* App Install Prompt */}
      <AppInstallPrompt showOnPages={['login']} />
    </div>
  )
}
