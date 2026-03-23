import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    console.error('Error fetching leaderboard:', error)
  } else {
    console.log('Leaderboard table exists. Count:', data)
  }
}

checkLeaderboard()
