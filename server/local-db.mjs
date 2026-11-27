import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
// The preview uses the same queries and schema as the hosted D1 database.
export function openArcadeDB(filename = ":memory:") {
  const sqlite = new DatabaseSync(filename);
  if (
    !sqlite
      .prepare("SELECT name FROM sqlite_master WHERE name='arcade_rooms'")
      .get()
  ) {
    sqlite.exec(
      readFileSync(
        new URL("../migrations/0001_arcade.sql", import.meta.url),
        "utf8",
      ),
    );
  }
  if (!sqlite.prepare("PRAGMA table_info(arcade_players)").all().some(c => c.name === "avatar")) {
    sqlite.exec(readFileSync(new URL("../migrations/0002_avatars.sql", import.meta.url), "utf8"));
  }
  if (!sqlite.prepare("PRAGMA table_info(arcade_rooms)").all().some(c => c.name === "starts")) {
    sqlite.exec(readFileSync(new URL("../migrations/0003_all_games.sql", import.meta.url), "utf8"));
  }
  return {
    prepare(sql) {
      const query = sqlite.prepare(sql);
      const bind = (...values) => ({
        first: () => query.get(...values),
        all: () => ({ results: query.all(...values) }),
        run: () => ({ meta: query.run(...values) }),
      });
      return { ...bind(), bind };
    },
  };
}
