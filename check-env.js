// Check environment variables
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Environment Variables Check')
console.log('=============================')

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

let allPresent = true

requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`❌ ${varName}: Missing`)
    allPresent = false
  }
})

if (!allPresent) {
  console.log('\n❌ Some environment variables are missing!')
  console.log('Create a .env.local file with:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')
} else {
  console.log('\n✅ All environment variables are present')
}

// Also check if .env.local exists
const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists')
} else {
  console.log('❌ .env.local file not found')
}
