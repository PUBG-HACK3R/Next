'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  Clock,
  DollarSign,
  Save,
  X
} from 'lucide-react'

interface Plan {
  id: number
  name: string
  duration_days: number
  profit_percent: number
  min_investment: number
  max_investment: number
  capital_return: boolean
  status: string
  created_at: string
  updated_at: string
}

interface PlanForm {
  name: string
  duration_days: number
  profit_percent: number
  min_investment: number
  max_investment: number
  capital_return: boolean
  status: string
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  
  const [formData, setFormData] = useState<PlanForm>({
    name: '',
    duration_days: 15,
    profit_percent: 5,
    min_investment: 10000,
    max_investment: 50000,
    capital_return: true,
    status: 'Active'
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setPlans(data)
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      duration_days: 15,
      profit_percent: 5,
      min_investment: 10000,
      max_investment: 50000,
      capital_return: true,
      status: 'Active'
    })
    setEditingPlan(null)
    setShowForm(false)
  }

  const handleEdit = (plan: Plan) => {
    setFormData({
      name: plan.name,
      duration_days: plan.duration_days,
      profit_percent: plan.profit_percent,
      min_investment: plan.min_investment,
      max_investment: plan.max_investment || 50000,
      capital_return: plan.capital_return,
      status: plan.status
    })
    setEditingPlan(plan)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingPlan) {
        // Update existing plan
        const { error } = await supabase
          .from('plans')
          .update(formData)
          .eq('id', editingPlan.id)

        if (error) throw error

        setPlans(plans.map(p => 
          p.id === editingPlan.id 
            ? { ...p, ...formData, updated_at: new Date().toISOString() }
            : p
        ))
      } else {
        // Create new plan
        const { data, error } = await supabase
          .from('plans')
          .insert([formData])
          .select()
          .single()

        if (error) throw error

        setPlans([data, ...plans])
      }

      resetForm()
    } catch (error: any) {
      console.error('Error saving plan:', error)
      alert('Failed to save plan: ' + error.message)
    }

    setSaving(false)
  }

  const handleDelete = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return
    }

    setDeleting(planId)

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId)

      if (error) throw error

      setPlans(plans.filter(p => p.id !== planId))
    } catch (error: any) {
      console.error('Error deleting plan:', error)
      alert('Failed to delete plan: ' + error.message)
    }

    setDeleting(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Premium':
        return 'bg-yellow-100 text-yellow-800'
      case 'Inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage Plans</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Plans</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add New Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusColor(plan.status)}`}>
                  {plan.status}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  disabled={deleting === plan.id}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-700" />
                  <span className="text-sm text-gray-900 font-medium">Duration</span>
                </div>
                <span className="font-medium">{plan.duration_days} days</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-900 font-medium">Profit</span>
                </div>
                <span className="font-medium text-green-600">{plan.profit_percent}%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-900 font-medium">Min Investment</span>
                </div>
                <span className="font-medium">{formatCurrency(plan.min_investment)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-900 font-medium">Max Investment</span>
                </div>
                <span className="font-medium">{formatCurrency(plan.max_investment || 50000)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 font-medium">Capital Return</span>
                <span className={`text-sm font-medium ${plan.capital_return ? 'text-green-600' : 'text-red-600'}`}>
                  {plan.capital_return ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-700">
                Created: {formatDate(plan.created_at)}
              </p>
              {plan.updated_at !== plan.created_at && (
                <p className="text-xs text-gray-700">
                  Updated: {formatDate(plan.updated_at)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No investment plans</h3>
          <p className="text-gray-700 mb-4">Create your first investment plan to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add New Plan
          </button>
        </div>
      )}

      {/* Plan Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editingPlan ? 'Edit Plan' : 'Add New Plan'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-700 hover:text-gray-900"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Basic Plan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Profit (%)
                    </label>
                    <input
                      type="number"
                      value={formData.profit_percent}
                      onChange={(e) => setFormData({ ...formData, profit_percent: parseFloat(e.target.value) })}
                      required
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Minimum Investment (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.min_investment}
                    onChange={(e) => setFormData({ ...formData, min_investment: parseInt(e.target.value) })}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Maximum Investment (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.max_investment}
                    onChange={(e) => setFormData({ ...formData, max_investment: parseInt(e.target.value) })}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Premium">Premium</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="capital_return"
                    checked={formData.capital_return}
                    onChange={(e) => setFormData({ ...formData, capital_return: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="capital_return" className="ml-2 block text-sm text-gray-900">
                    Return capital with profit
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
