import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: 'C:/Users/aathi/Downloads/vortexaathishstudios-arcade.io/.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAll() {
  console.log("Checking leaderboard...");
  let res = await supabase.from('leaderboard').select('*').limit(1);
  if (res.error) console.error("Leaderboard Error:", res.error);
  else console.log("Leaderboard OK");

  console.log("Checking players...");
  res = await supabase.from('players').select('*').limit(1);
  if (res.error) console.error("Players Error:", res.error);
  else console.log("Players OK");

  console.log("Checking game_rooms...");
  res = await supabase.from('game_rooms').select('*').limit(1);
  if (res.error) console.error("Game_rooms Error:", res.error);
  else console.log("Game_rooms OK");

  console.log("Checking room_players...");
  res = await supabase.from('room_players').select('*').limit(1);
  if (res.error) console.error("Room_players Error:", res.error);
  else console.log("Room_players OK");
}
checkAll()
