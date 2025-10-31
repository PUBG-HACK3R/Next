#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up SmartGrow Database Manager...\n')

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Make sure you\'re in the project root directory.')
  process.exit(1)
}

// Check if .env.local exists
if (!fs.existsSync('.env.local')) {
  console.log('⚠️  Warning: .env.local not found. Make sure you have your Supabase credentials configured.')
}

try {
  // Install required dependencies
  console.log('📦 Installing required dependencies...')
  execSync('npm install @supabase/supabase-js dotenv', { stdio: 'inherit' })
  
  console.log('\n✅ Dependencies installed successfully!')
  
  // Check if database-manager.js exists
  if (fs.existsSync('database-manager.js')) {
    console.log('\n🎯 Ready to use! Try these commands:')
    console.log('  node database-manager.js check           # Check database structure')
    console.log('  node database-manager.js clean --dry-run # Preview cleanup')
    console.log('  node database-manager.js clean          # Clean database')
    
    console.log('\n📖 For full documentation, see: database-setup.md')
  } else {
    console.log('❌ Error: database-manager.js not found in current directory')
  }
  
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message)
  console.log('\n💡 Try running manually:')
  console.log('  npm install @supabase/supabase-js dotenv')
}
