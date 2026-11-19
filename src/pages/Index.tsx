import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Gamepad2, Users, Trophy, Pencil, Search } from "lucide-react";
import { games } from "@/lib/gameData";
import { entertainmentGames } from "@/lib/entertainmentData";
import { getPlayerName, setPlayerName } from "@/lib/streaks";
import { playerPoints } from "@/lib/arcade";
import { ContactModal } from "@/components/ContactModal";

const library = [
  ...games.map((g) => ({ ...g, section: "Puzzles", url: "/game/" + g.id })),
  ...entertainmentGames
    .filter((g) => g.available)
    .map((g) => ({ ...g, section: "Action", url: "/entertainment/" + g.id })),
];
export default function Index() {
  const [params, setParams] = useSearchParams();
  const mode = params.get("mode");
  const category =
    mode === "brain" ? "Puzzles" : mode === "action" ? "Action" : "All games";
  const [search, setSearch] = useState("");
  const [name, setName] = useState(getPlayerName);
  const [edit, setEdit] = useState(false);
  const visible = library.filter(
    (g) =>
      (category === "All games" || category === g.section) &&
      g.name.toLowerCase().includes(search.toLowerCase().trim()),
  );
  return (
    <main className="arcade-home">
      <div className="arcade-shell">
        <nav className="arcade-nav">
          <div>
            <Gamepad2 />
            <strong>VORTEX ARCADE</strong>
          </div>
          <button aria-label="Edit player name" onClick={() => setEdit(!edit)}>
            {getPlayerName()} <Pencil size={14} />
          </button>
        </nav>
        {edit && (
          <form
            className="club-box"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length < 2) return;
              setPlayerName(name.trim());
              setEdit(false);
            }}
          >
            <label>
              Player name
              <input
                value={name}
                minLength={2}
                maxLength={20}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <button className="club-cta">Save name</button>
          </form>
        )}
        <section className="arcade-hero">
          <div>
            <h1>
              Arcade<span>.io</span>
            </h1>
            <p>Mini Games</p>
            <div className="hero-actions">
              <Link to="/rooms">
                <Users size={18} />
                Play with friends
              </Link>
              <Link to="/leaderboard">
                <Trophy size={18} />
                Leaderboard
              </Link>
            </div>
          </div>
          <img src="/arcade-icon.png" alt="Arcade.io brain and gamepad logo" />
        </section>
        <div className="shelf-heading">
          <h2>Game library</h2>
          <span>{playerPoints().toLocaleString()} solo points</span>
        </div>
        <div className="shelf-tools">
          <div className="filters">
            {["All games", "Puzzles", "Action"].map((v) => (
              <button
                key={v}
                aria-pressed={category === v}
                onClick={() =>
                  setParams(
                    v === "All games"
                      ? {}
                      : { mode: v === "Puzzles" ? "brain" : "action" },
                  )
                }
              >
                {v}
              </button>
            ))}
          </div>
          <label className="game-search">
            <Search size={16} />
            <input
              placeholder="Find a game"
              aria-label="Find a game"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="game-shelf">
          {visible.map((g) => (
            <Link key={g.url} to={g.url}>
              <div className={"tile-art " + g.section.toLowerCase()}>
                {g.icon}
              </div>
              <strong>{g.name}</strong>
              <small>
                {g.section} · {g.difficulty}
              </small>
            </Link>
          ))}
        </div>
        {!visible.length && <p>No games match your search.</p>}
        <ContactModal />
      </div>
    </main>
  );
}
