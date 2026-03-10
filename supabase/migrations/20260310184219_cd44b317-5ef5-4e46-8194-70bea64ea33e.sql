
CREATE TABLE public.leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard" ON public.leaderboard FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert leaderboard" ON public.leaderboard FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update leaderboard" ON public.leaderboard FOR UPDATE TO public USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
