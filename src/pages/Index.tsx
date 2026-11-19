import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Play,
  Search,
  Ticket,
  UsersRound,
  ChevronRight,
  X,
} from "lucide-react";
import { games } from "@/lib/gameData";
import { entertainmentGames } from "@/lib/entertainmentData";
import { playerPoints } from "@/lib/arcade";
import { ContactModal } from "@/components/ContactModal";
const library = [
  ...games
    .filter((g) => g.available)
    .map((g) => ({ ...g, section: "Puzzles", url: "/game/" + g.id })),
  ...entertainmentGames
    .filter((g) => g.available)
    .map((g) => ({ ...g, section: "Action", url: "/entertainment/" + g.id })),
];
export default function Index() {
  const [params, setParams] = useSearchParams();
  const category =
    params.get("mode") === "brain"
      ? "Puzzles"
      : params.get("mode") === "action"
        ? "Action"
        : "All games";
  const [search, setSearch] = useState("");
  const visible = library.filter(
    (g) =>
      (category === "All games" || category === g.section) &&
      g.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <main className="studio-main">
      <div className="feature-grid">
        <section className="feature-poster">
          <img
            src="/covers/gravity-flip.webp"
            loading="eager"
            alt="A pixel runner suspended above a canyon of floating platforms at sunset"
          />
          <div className="feature-copy">
            <p className="poster-label">Featured game</p>
            <h1>
              GRAVITY FLIP
              <br />
              RUNNER
            </h1>
            <p>Flip gravity. Dodge the obstacles.</p>
            <Link className="solid-button" to="/entertainment/gravity-flip">
              <Play size={15} fill="currentColor" />
              Play game
            </Link>
          </div>
        </section>
        <Link to="/rooms" className="room-poster">
          <img src="/covers/rooms.webp" alt="" />
          <div>
            <span className="poster-label">
              <UsersRound size={15} />
              Multiplayer
            </span>
            <h2>PLAY WITH FRIENDS</h2>
            <p>
              Create or join a room <ChevronRight size={15} />
            </p>
          </div>
        </Link>
      </div>
      <section className="library-section" aria-labelledby="library-title">
        <div className="library-heading">
          <h2 id="library-title">GAME LIBRARY</h2>
          <span>
            <Ticket size={17} />
            {playerPoints().toLocaleString()} solo points
          </span>
        </div>
        <div className="library-tools">
          <div className="section-tabs">
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
          <label className="search-games">
            <Search size={17} />
            <input
              type="search"
              aria-label="Find a game"
              placeholder="Find a game"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="poster-grid">
          {visible.map((g) => (
            <Link key={g.url} to={g.url} className="game-poster">
              <img
                src={"/covers/" + g.id + ".webp"}
                alt=""
                loading="lazy"
                width="600"
                height="324"
              />
              <div>
                <span>
                  {g.section} · {g.difficulty}
                </span>
                <h3>{g.name}</h3>
              </div>
            </Link>
          ))}
        </div>
        {!visible.length && (
          <div className="empty-result">
            <p>No games match “{search}”.</p>
            <button onClick={() => setSearch("")}>
              <X size={14} />
              Clear search
            </button>
          </div>
        )}
      </section>
      <footer className="studio-footer">
        <span>Vortex Aathish Studios</span>
        <ContactModal />
      </footer>
    </main>
  );
}
