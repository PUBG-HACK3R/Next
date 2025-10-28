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
  const features = [
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Advanced security measures to protect your investments and personal data.'
    },
    {
      icon: TrendingUp,
      title: 'High Returns',
      description: 'Competitive returns on your cryptocurrency mining investments.'
    },
    {
      icon: Users,
      title: 'Referral System',
      description: 'Earn commissions by referring friends to our platform.'
    },
    {
      icon: Award,
      title: 'Proven Track Record',
      description: 'Years of experience in cryptocurrency mining and investment.'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Serving investors worldwide with 24/7 support.'
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Quick deposit approvals and withdrawal processing.'
    }
  ]

  const stats = [
    { label: 'Active Users', value: '10,000+' },
    { label: 'Total Invested', value: '$5M+' },
    { label: 'Countries', value: '50+' },
    { label: 'Success Rate', value: '99.9%' }
  ]

  const team = [
    {
      name: 'John Smith',
      role: 'CEO & Founder',
      description: '10+ years in cryptocurrency and blockchain technology.'
    },
    {
      name: 'Sarah Johnson',
      role: 'CTO',
      description: 'Expert in mining infrastructure and platform development.'
    },
    {
      name: 'Mike Chen',
      role: 'Head of Operations',
      description: 'Specialized in investment management and user experience.'
    }
  ]

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

      <div className="p-4 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Welcome to SmartGrow Mining
          </h2>
          <p className="text-green-100 leading-relaxed">
            Your trusted partner in cryptocurrency mining investments. We provide secure, 
            profitable, and transparent mining solutions for investors worldwide.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 text-center">
              <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Why Choose SmartGrow?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">{feature.title}</h4>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">How It Works</h3>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Create Account', description: 'Sign up and verify your account to get started.' },
              { step: 2, title: 'Make Deposit', description: 'Fund your account using various payment methods.' },
              { step: 3, title: 'Choose Plan', description: 'Select an investment plan that suits your goals.' },
              { step: 4, title: 'Earn Daily', description: 'Collect daily profits from your mining investments.' },
              { step: 5, title: 'Withdraw', description: 'Withdraw your earnings anytime to your preferred account.' }
            ].map((item, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Our Team</h3>
          <div className="space-y-4">
            {team.map((member, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{member.name}</h4>
                    <p className="text-blue-400 text-sm mb-2">{member.role}</p>
                    <p className="text-sm text-slate-400">{member.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Trust */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Security & Trust</h3>
          <div className="space-y-3">
            {[
              'SSL encryption for all data transmission',
              'Multi-factor authentication support',
              'Regular security audits and updates',
              'Segregated user funds protection',
              'Compliance with international standards',
              '24/7 monitoring and support'
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-4">Get In Touch</h3>
          <p className="text-blue-100 mb-4">
            Have questions? Our support team is here to help you 24/7.
          </p>
          <div className="space-y-2 text-blue-100">
            <p>📧 support@smartgrow.com</p>
            <p>📱 WhatsApp: +1 (555) 123-4567</p>
            <p>🌐 www.smartgrow.com</p>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center text-slate-500 text-sm">
          <p>SmartGrow Mining Platform v2.0</p>
          <p>© 2024 SmartGrow. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
