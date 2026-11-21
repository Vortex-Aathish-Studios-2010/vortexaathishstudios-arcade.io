CREATE TABLE arcade_players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  solo INTEGER NOT NULL DEFAULT 0,
  bonus INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE arcade_rooms (
  code TEXT PRIMARY KEY,
  game TEXT NOT NULL,
  host TEXT NOT NULL REFERENCES arcade_players(id),
  guest TEXT REFERENCES arcade_players(id),
  board TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT '',
  expires INTEGER NOT NULL
);
CREATE INDEX arcade_room_expiry ON arcade_rooms(expires);
CREATE INDEX arcade_rank ON arcade_players((solo + bonus) DESC);
CREATE TRIGGER arcade_award AFTER UPDATE OF result ON arcade_rooms
WHEN OLD.result = '' AND NEW.result != ''
BEGIN
  UPDATE arcade_players SET bonus = bonus + CASE
    WHEN NEW.result = 'draw' THEN 5
    WHEN (id = NEW.host AND NEW.result = 'X') OR (id = NEW.guest AND NEW.result = 'O') THEN 20
    ELSE 0 END
  WHERE id IN (NEW.host, NEW.guest);
END;
