import { getPlayerName } from "@/lib/streaks";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { api, playerPoints, Rank, syncProfile } from "@/lib/arcade";

function cached(): Rank[] {
  try {
    return JSON.parse(localStorage.getItem("arcade.ranks") || "[]");
  } catch {
    return [];
  }
}
export default function LeaderboardPage() {
  const [rows, setRows] = useState<Rank[]>(cached);
  const [status, setStatus] = useState("Connecting…");
  useEffect(() => {
    let stop = false;
    let timer: number;
    async function read() {
      try {
        if (!document.hidden) {
          const ranks = await api<Rank[]>("leaders");
          if (stop) return;
          localStorage.setItem("arcade.ranks", JSON.stringify(ranks));
          setRows(ranks);
          setStatus("Live · updates every 2 seconds");
        }
      } catch {
        if (!stop) setStatus("Offline · last saved rankings");
      }
      if (!stop) timer = window.setTimeout(read, 2000);
    }
    (getPlayerName() ? syncProfile() : Promise.resolve())
      .catch(() => {})
      .finally(() => {
        if (!stop) void read();
      });
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, []);
  return (
    <main className="club-page">
      <div className="club-wrap">
        <Link className="club-back" to="/">
          Arcade home
        </Link>
        <header className="club-title">
          <Trophy />
          <h1>Leaderboard</h1>
          <p>{status}</p>
        </header>
        <div className="club-panel">
          <strong>Your solo points</strong>
          <b>{playerPoints().toLocaleString()}</b>
        </div>
        <p className="club-help">
          Ranked by total arcade points. Room wins earn 20 points. Draws earn 5
          each.
        </p>
        {rows.length ? (
          <ol className="club-ranks">
            {rows.map((r, i) => (
              <li key={i}>
                <span>{i + 1}</span>
                <strong>{r.name}</strong>
                <b>{r.score.toLocaleString()}</b>
              </li>
            ))}
          </ol>
        ) : (
          <p>Play a round to start the rankings.</p>
        )}
      </div>
    </main>
  );
}
