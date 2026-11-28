ALTER TABLE arcade_players ADD COLUMN username_key TEXT;
CREATE UNIQUE INDEX arcade_unique_username ON arcade_players(username_key) WHERE username_key IS NOT NULL;
ALTER TABLE arcade_rooms ADD COLUMN matchmaking INTEGER NOT NULL DEFAULT 0;
ALTER TABLE arcade_rooms ADD COLUMN host_seen INTEGER NOT NULL DEFAULT 0;
ALTER TABLE arcade_rooms ADD COLUMN guest_seen INTEGER NOT NULL DEFAULT 0;
ALTER TABLE arcade_rooms ADD COLUMN live_state TEXT NOT NULL DEFAULT '';
ALTER TABLE arcade_rooms ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
CREATE INDEX arcade_match_queue ON arcade_rooms(game,matchmaking,expires) WHERE guest IS NULL;
CREATE UNIQUE INDEX arcade_one_queue ON arcade_rooms(host) WHERE matchmaking=1 AND guest IS NULL;
