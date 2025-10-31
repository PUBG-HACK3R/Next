const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
let envConfig = {}
try {
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        envConfig[key.trim()] = value.trim()
      }
    })
  }
} catch (error) {
  console.log('⚠️  Could not load .env.local file')
}

// Initialize Supabase client
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

class DatabaseManager {
  constructor() {
    this.tables = []
    this.tableCounts = {}
  }

  // Check database structure
  async checkDatabaseStructure() {
    console.log('🔍 Checking database structure...\n')
    
    try {
      // Use direct method to check common tables
      console.log('Checking common tables...')
      await this.checkCommonTables()
      
    } catch (error) {
      console.error('❌ Error checking database structure:', error.message)
    }
  }

  // Fallback method to check common tables
  async checkCommonTables() {
    const commonTables = [
      'profiles', 'investments', 'plans', 'deposits', 
      'withdrawals', 'referrals', 'referral_commissions', 
      'daily_incomes', 'admin_settings'
    ]

    console.log('🔍 Checking common tables...')
    this.tables = []

    for (const table of commonTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          this.tables.push(table)
          this.tableCounts[table] = count || 0
          console.log(`✅ ${table}: ${count || 0} records`)
        }
      } catch (err) {
        console.log(`❌ ${table}: Table not found`)
      }
    }
  }

  // Get record counts for all tables
  async getTableCounts() {
    console.log('\n📊 Getting record counts...')
    
    for (const table of this.tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          this.tableCounts[table] = count || 0
          console.log(`📋 ${table}: ${count || 0} records`)
        }
      } catch (error) {
        console.log(`❌ Error counting ${table}:`, error.message)
      }
    }
  }

  // Display current database state
  displayDatabaseState() {
    console.log('\n🗄️  CURRENT DATABASE STATE')
    console.log('='.repeat(40))
    
    Object.entries(this.tableCounts).forEach(([table, count]) => {
      const status = count > 0 ? '🔵' : '⚪'
      console.log(`${status} ${table.padEnd(20)} ${count} records`)
    })
    
    const totalRecords = Object.values(this.tableCounts).reduce((a, b) => a + b, 0)
    console.log('-'.repeat(40))
    console.log(`📊 Total Records: ${totalRecords}`)
  }

  // Clean user data (safe method)
  async cleanUserData(options = {}) {
    const {
      keepAdminUsers = true,
      adminEmails = ['admin@smartgrow.com'],
      dryRun = false
    } = options

    console.log('\n🧹 CLEANING USER DATA')
    console.log('=' .repeat(40))
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No actual deletions will be performed')
    }

    const deletionOrder = [
      'daily_incomes',      // Delete first (has foreign keys)
      'referral_commissions', // Delete before referrals
      'investments',        // User investments
      'withdrawals',        // User withdrawals
      'deposits',          // User deposits  
      'referrals',         // User referrals
      'profiles'           // User profiles (last)
    ]

    let totalDeleted = 0

    for (const table of deletionOrder) {
      if (!this.tables.includes(table)) {
        console.log(`⏭️  Skipping ${table} (table not found)`)
        continue
      }

      try {
        let query = supabase.from(table)

        // Special handling for profiles table
        if (table === 'profiles' && keepAdminUsers) {
          if (adminEmails.length > 0) {
            query = query.delete().not('email', 'in', `(${adminEmails.map(e => `"${e}"`).join(',')})`)
          } else {
            console.log(`⏭️  Skipping ${table} (keeping admin users, but no admin emails specified)`)
            continue
          }
        } else {
          query = query.delete().neq('id', 0) // Delete all records
        }

        if (!dryRun) {
          const { data, error, count } = await query
          
          if (error) {
            console.log(`❌ Error deleting from ${table}:`, error.message)
          } else {
            console.log(`✅ Deleted from ${table}: ${count || 'unknown'} records`)
            totalDeleted += count || 0
          }
        } else {
          const currentCount = this.tableCounts[table] || 0
          console.log(`🔍 Would delete from ${table}: ${currentCount} records`)
          totalDeleted += currentCount
        }

      } catch (error) {
        console.log(`❌ Error processing ${table}:`, error.message)
      }
    }

    console.log('-'.repeat(40))
    console.log(`🗑️  Total ${dryRun ? 'would delete' : 'deleted'}: ${totalDeleted} records`)

    if (!dryRun) {
      // Reset sequences
      await this.resetSequences()
      
      // Update admin settings
      await this.resetAdminStats()
    }
  }

  // Reset auto-increment sequences
  async resetSequences() {
    console.log('\n🔄 Resetting sequences...')
    console.log('⚠️  Sequence reset requires manual SQL execution in Supabase dashboard')
    console.log('Run these commands in your Supabase SQL editor:')
    
    const sequences = [
      'deposits_id_seq',
      'withdrawals_id_seq', 
      'investments_id_seq',
      'daily_incomes_id_seq',
      'referrals_id_seq',
      'referral_commissions_id_seq'
    ]

    sequences.forEach(seq => {
      console.log(`ALTER SEQUENCE IF EXISTS ${seq} RESTART WITH 1;`)
    })
  }

  // Reset admin statistics
  async resetAdminStats() {
    console.log('\n📊 Resetting admin statistics...')
    
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({
          total_users: 0,
          total_deposits: 0,
          total_withdrawals: 0,
          total_investments: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)

      if (!error) {
        console.log('✅ Admin statistics reset')
      } else {
        console.log('⚠️  Could not reset admin statistics:', error.message)
      }
    } catch (error) {
      console.log('⚠️  Admin settings table may not exist')
    }
  }

  // Verify cleanup
  async verifyCleanup() {
    console.log('\n✅ VERIFICATION - POST CLEANUP')
    console.log('=' .repeat(40))
    
    await this.getTableCounts()
    this.displayDatabaseState()

    // Show what should remain
    await this.showRemainingData()
  }

  // Show remaining important data
  async showRemainingData() {
    console.log('\n📋 REMAINING IMPORTANT DATA')
    console.log('=' .repeat(40))

    // Show investment plans
    try {
      const { data: plans, error } = await supabase
        .from('plans')
        .select('id, name, duration_days, profit_percent, min_investment, max_investment')
        .order('id')

      if (!error && plans) {
        console.log('\n💼 Investment Plans (should remain):')
        plans.forEach(plan => {
          console.log(`  📈 ${plan.name} - ${plan.duration_days} days - ${plan.profit_percent}%`)
        })
      }
    } catch (error) {
      console.log('⚠️  Could not fetch investment plans')
    }

    // Show remaining profiles
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .order('created_at')

      if (!error && profiles) {
        console.log('\n👥 Remaining Profiles:')
        profiles.forEach(profile => {
          console.log(`  👤 ${profile.email} - ${profile.full_name || 'No name'} - ${profile.role || 'user'}`)
        })
      }
    } catch (error) {
      console.log('⚠️  Could not fetch remaining profiles')
    }
  }
}

// Main execution function
async function main() {
  console.log('🚀 SmartGrow Database Manager')
  console.log('=' .repeat(50))

  const dbManager = new DatabaseManager()

  try {
    // Check current state
    await dbManager.checkDatabaseStructure()
    dbManager.displayDatabaseState()

    // Get user input for what to do
    const args = process.argv.slice(2)
    const command = args[0]

    switch (command) {
      case 'check':
        console.log('\n✅ Database structure check complete!')
        break

      case 'clean':
        const dryRun = args.includes('--dry-run')
        const keepAdmin = !args.includes('--delete-all')
        
        await dbManager.cleanUserData({
          keepAdminUsers: keepAdmin,
          adminEmails: ['admin@smartgrow.com'], // Add your admin emails here
          dryRun: dryRun
        })

        if (!dryRun) {
          await dbManager.verifyCleanup()
        }
        break

      case 'verify':
        await dbManager.verifyCleanup()
        break

      default:
        console.log('\n📖 USAGE:')
        console.log('node database-manager.js check           # Check database structure')
        console.log('node database-manager.js clean --dry-run # Preview what would be deleted')
        console.log('node database-manager.js clean          # Clean database (keep admin users)')
        console.log('node database-manager.js clean --delete-all # Clean everything')
        console.log('node database-manager.js verify         # Verify current state')
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = DatabaseManager
