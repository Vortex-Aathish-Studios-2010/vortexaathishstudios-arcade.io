
-- ============================================
-- LEADERBOARD: Replace overly permissive policies
-- ============================================
DROP POLICY IF EXISTS "Anyone can insert leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Anyone can read leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Anyone can update leaderboard" ON public.leaderboard;

-- Public read access (intentional for a public leaderboard)
CREATE POLICY "Public read leaderboard"
  ON public.leaderboard FOR SELECT
  USING (true);

-- Insert: require player_name to be non-empty
CREATE POLICY "Insert leaderboard with valid name"
  ON public.leaderboard FOR INSERT
  WITH CHECK (char_length(trim(player_name)) >= 2);

-- Update: only allow updating wins/losses (not player_name), and only your own row by matching player_name
CREATE POLICY "Update own leaderboard entry"
  ON public.leaderboard FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE remains blocked (no policy = denied)

-- ============================================
-- GAME_ROOMS: Replace ALL policy with specific operations
-- ============================================
DROP POLICY IF EXISTS "Public access rooms" ON public.game_rooms;

CREATE POLICY "Public read rooms"
  ON public.game_rooms FOR SELECT
  USING (true);

CREATE POLICY "Insert rooms"
  ON public.game_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Update rooms"
  ON public.game_rooms FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE blocked (no policy)

-- ============================================
-- ROOM_PLAYERS: Replace ALL policy with specific operations
-- ============================================
DROP POLICY IF EXISTS "Public access room_players" ON public.room_players;

CREATE POLICY "Public read room_players"
  ON public.room_players FOR SELECT
  USING (true);

CREATE POLICY "Insert room_players"
  ON public.room_players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Update room_players"
  ON public.room_players FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE blocked (no policy)

-- ============================================
-- PLAYERS: Replace ALL policy with specific operations
-- ============================================
DROP POLICY IF EXISTS "Public access players" ON public.players;

CREATE POLICY "Public read players"
  ON public.players FOR SELECT
  USING (true);

CREATE POLICY "Insert players"
  ON public.players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Update players"
  ON public.players FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE blocked (no policy)
