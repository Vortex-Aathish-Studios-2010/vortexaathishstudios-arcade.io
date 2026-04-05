
-- Add user_id to players table
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS players_user_id_unique ON public.players(user_id);

-- Add user_id to leaderboard table
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_user_id_unique ON public.leaderboard(user_id);

-- ============================================
-- PLAYERS: Tighten policies
-- ============================================
DROP POLICY IF EXISTS "Public read players" ON public.players;
DROP POLICY IF EXISTS "Insert players" ON public.players;
DROP POLICY IF EXISTS "Update players" ON public.players;

CREATE POLICY "Anyone can read players"
  ON public.players FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users insert own player"
  ON public.players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own player"
  ON public.players FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- LEADERBOARD: Tighten policies
-- ============================================
DROP POLICY IF EXISTS "Public read leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Insert leaderboard with valid name" ON public.leaderboard;
DROP POLICY IF EXISTS "Update own leaderboard entry" ON public.leaderboard;

CREATE POLICY "Anyone can read leaderboard"
  ON public.leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users insert own leaderboard"
  ON public.leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id AND char_length(trim(player_name)) >= 2);

CREATE POLICY "Users update own leaderboard"
  ON public.leaderboard FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- GAME_ROOMS: Tighten policies
-- ============================================
DROP POLICY IF EXISTS "Public read rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Insert rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Update rooms" ON public.game_rooms;

CREATE POLICY "Anyone can read rooms"
  ON public.game_rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users create rooms"
  ON public.game_rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Room participants update rooms"
  ON public.game_rooms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.room_players rp
      JOIN public.players p ON rp.player_id = p.id
      WHERE rp.room_id = game_rooms.id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (true);

-- ============================================
-- ROOM_PLAYERS: Tighten policies
-- ============================================
DROP POLICY IF EXISTS "Public read room_players" ON public.room_players;
DROP POLICY IF EXISTS "Insert room_players" ON public.room_players;
DROP POLICY IF EXISTS "Update room_players" ON public.room_players;

CREATE POLICY "Anyone can read room_players"
  ON public.room_players FOR SELECT
  USING (true);

CREATE POLICY "Users insert own room_player"
  ON public.room_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = player_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own room_player"
  ON public.room_players FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = room_players.player_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = room_players.player_id AND p.user_id = auth.uid()
    )
  );
