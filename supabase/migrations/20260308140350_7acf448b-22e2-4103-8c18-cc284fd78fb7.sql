
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  game_id text NOT NULL,
  host_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  status text DEFAULT 'waiting',
  difficulty integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  finished boolean DEFAULT false,
  finished_at timestamptz,
  is_winner boolean DEFAULT false,
  UNIQUE(room_id, player_id)
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access players" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access rooms" ON public.game_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access room_players" ON public.room_players FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
