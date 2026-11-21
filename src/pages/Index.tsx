import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock3, Gamepad2, Play, Search, Ticket, X, Zap } from "lucide-react";
import { games } from "@/lib/gameData";
import { entertainmentGames } from "@/lib/entertainmentData";
import { playerPoints } from "@/lib/arcade";
import { getRecentGames } from "@/lib/recentGames";

const library = [
  ...games
    .filter((g) => g.available)
    .map((g) => ({ ...g, section: "Puzzles", url: "/game/" + g.id })),
  ...entertainmentGames
    .filter((g) => g.available)
    .map((g) => ({ ...g, section: "Action", url: "/entertainment/" + g.id })),
];
const filters = [
  { label: "All games", mode: "" },
  { label: "Puzzles", mode: "brain" },
  { label: "Action", mode: "action" },
];

export default function Index() {
  const [params, setParams] = useSearchParams();
  const category =
    filters.find((f) => f.mode === params.get("mode")) || filters[0];
  const search = params.get("q") || "";
  function updateFilter(key: "q" | "mode", value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }
  const [recent] = useState(() =>
    getRecentGames()
      .map((id) => library.find((g) => g.id === id))
      .filter((g) => g !== undefined),
  );
  const quick = recent.length
    ? recent
    : ["snake", "memory", "stack-tower"].map((id) =>
        library.find((g) => g.id === id)!,
      );
  const query = search.trim().toLowerCase();
  const visible = library.filter(
    (g) =>
      (!category.mode || category.label === g.section) &&
      g.name.toLowerCase().includes(query),
  );
  const points = playerPoints().toLocaleString();
  const QuickIcon = recent.length ? Clock3 : Zap;

  return (
    <main className="studio-main">
      <header className="screen-title">
        <h1>Game library</h1>
        <Link
          className="points-chip"
          to="/leaderboard"
          aria-label={points + " solo points. Open leaderboard"}
        >
          <Ticket size={17} />
          <strong>{points}</strong>
          <span>solo points</span>
        </Link>
      </header>
      {!category.mode && !query && (
        <div className="launcher-highlights">
          <section className="spotlight">
            <img src="/covers/gravity-flip.webp" alt="" loading="eager" />
            <div className="spotlight-copy">
              <span className="spotlight-label">
                <Gamepad2 size={16} /> Featured game
              </span>
              <h2>
                Gravity Flip
                <br />
                Runner
              </h2>
              <Link
                className="solid-button"
                to="/entertainment/gravity-flip"
                state={{ fromLibrary: true }}
              >
                <Play size={15} fill="currentColor" />
                Play game
              </Link>
            </div>
          </section>
          <section className="quick-launch" aria-labelledby="quick-title">
            <h2 id="quick-title">
              <QuickIcon size={17} />
              {recent.length ? "Recently played" : "Quick launch"}
            </h2>
            <div className="quick-list">
              {quick.map((g) => (
                <Link
                  state={{ fromLibrary: true }}
                  to={g.url}
                  key={g.id}
                  className="quick-game"
                >
                  <img src={"/covers/" + g.id + ".webp"} alt="" />
                  <div>
                    <strong>{g.name}</strong>
                    <small>{g.section}</small>
                  </div>
                  <Play size={14} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
      <section className="library-section" aria-labelledby="browse-title">
        <div className="browse-heading">
          <h2 id="browse-title">Browse games</h2>
          <label className="search-games">
            <Search size={17} />
            <input
              type="search"
              aria-label="Find a game"
              placeholder="Find a game"
              value={search}
              onChange={(e) => updateFilter("q", e.target.value)}
            />
          </label>
        </div>
        <div className="section-tabs" role="group" aria-label="Game category">
          {filters.map((f) => (
            <button
              key={f.label}
              aria-pressed={f === category}
              onClick={() => updateFilter("mode", f.mode)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="poster-grid">
          {visible.map((g) => (
            <Link
              key={g.id}
              state={{ fromLibrary: true }}
              to={g.url}
              className="game-poster"
            >
              <img
                src={"/covers/" + g.id + ".webp"}
                alt=""
                loading="lazy"
                width="600"
                height="324"
              />
              <div>
                <h3>{g.name}</h3>
                <span>
                  {g.section} · {g.difficulty}
                </span>
              </div>
            </Link>
          ))}
        </div>
        {!visible.length && (
          <div className="empty-result">
            <p>No games match “{search}”.</p>
            <button onClick={() => updateFilter("q", "")}>
              <X size={16} />
              Clear search
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
