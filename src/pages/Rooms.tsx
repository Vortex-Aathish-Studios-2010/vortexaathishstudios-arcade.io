import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { api, ArcadeError, Room, syncProfile } from "@/lib/arcade";

const titles = { trio: "Tic Tac Toe", four: "Four in a Row" };
export default function Rooms() {
  const [active, setActive] = useState(
    () => sessionStorage.getItem("arcade.room") || "",
  );
  const [room, setRoom] = useState<Room | null>(null);
  const [game, setGame] = useState<Room["game"]>("trio");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const revision = useRef(0);
  function select(next: string) {
    revision.current++;
    sessionStorage.setItem("arcade.room", next);
    setActive(next);
    setRoom(null);
    setMessage("");
    setCopied(false);
  }
  useEffect(() => {
    if (!active) return;
    let done = false;
    let timer: number;
    async function read() {
      const seq = revision.current;
      try {
        if (!document.hidden) {
          const latest = await api<Room>("rooms/" + active);
          if (done || seq !== revision.current) return;
          setRoom(latest);
          setMessage("");
          if (latest.result) return;
        }
      } catch (e) {
        if (done || seq !== revision.current) return;
        if (e instanceof ArcadeError && e.status === 404) {
          select("");
          setMessage(e.message);
          return;
        }
        setMessage("Connection interrupted. Reconnecting…");
      } finally {
        if (!done) timer = window.setTimeout(read, 1000);
      }
    }
    void read();
    return () => {
      done = true;
      window.clearTimeout(timer);
    };
  }, [active]);
  async function action(run: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await run();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const enter = (join: boolean) =>
    action(async () => {
      await syncProfile();
      const next = join
        ? await api<Room>("rooms/" + code + "/join", {})
        : await api<{ code: string }>("rooms", { game });
      select(next.code);
    });
  const myTurn =
    room &&
    room.guest &&
    !room.result &&
    (room.board.replace(/\./g, "").length % 2 ? "O" : "X") === room.me;
  return (
    <main className="club-page">
      <div className="club-wrap">
        <Link className="club-back" to="/">
          Arcade home
        </Link>
        <header className="club-title">
          <Users />
          <h1>{room ? titles[room.game] : "Play with friends"}</h1>
          <p>
            {active
              ? "Private match"
              : "Create a two-player room or enter a friend’s code."}
          </p>
        </header>
        {!active ? (
          <>
            <section className="club-box room-create">
              <h2>Create a room</h2>
              <label>
                Game
                <select
                  value={game}
                  onChange={(e) => setGame(e.target.value as Room["game"])}
                >
                  <option value="trio">Tic Tac Toe</option>
                  <option value="four">Four in a Row</option>
                </select>
              </label>
              <button
                className="club-cta"
                disabled={busy}
                onClick={() => enter(false)}
              >
                Create room
              </button>
            </section>
            <form
              className="club-box"
              onSubmit={(e) => {
                e.preventDefault();
                void enter(true);
              }}
            >
              <h2>Join a friend</h2>
              <label>
                Six-character code
                <input
                  value={code}
                  maxLength={6}
                  autoCapitalize="characters"
                  placeholder="ABC234"
                  onChange={(e) =>
                    setCode(
                      e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""),
                    )
                  }
                />
              </label>
              <button
                className="club-cta alt"
                disabled={busy || code.length !== 6}
              >
                Join room
              </button>
            </form>
          </>
        ) : (
          <section className="club-box">
            <div className="club-panel">
              <div>
                <small>ROOM CODE</small>
                <strong className="room-code">{active}</strong>
              </div>
              <button
                className="club-light"
                onClick={() =>
                  action(async () => {
                    await navigator.clipboard.writeText(active);
                    setCopied(true);
                  })
                }
              >
                {copied ? "Copied" : "Copy code"}
              </button>
            </div>
            {room && (
              <>
                <p>
                  {room.host} (X) ·{" "}
                  {room.guest ? room.guest + " (O)" : "Waiting for a friend…"}
                </p>
                <h2 aria-live="polite">
                  {room.result
                    ? room.result === "draw"
                      ? "Draw · 5 points each"
                      : room.result === room.me
                        ? "You won · +20 points"
                        : "Opponent wins"
                    : room.guest
                      ? myTurn
                        ? "Your turn"
                        : "Opponent’s turn"
                      : "Share the room code"}
                </h2>
                <div className={"room-board " + room.game}>
                  {[...room.board].map((v, i) => (
                    <button
                      key={i}
                      aria-label={
                        "Cell " + (i + 1) + ", " + (v === "." ? "empty" : v)
                      }
                      data-mark={v}
                      disabled={
                        busy ||
                        !myTurn ||
                        (room.game === "trio"
                          ? v !== "."
                          : room.board[i % 7] !== ".")
                      }
                      onClick={() =>
                        action(async () => {
                          const r = await api<Room>(
                            "rooms/" + active + "/move",
                            { cell: i, board: room.board },
                          );
                          revision.current++;
                          setRoom(r);
                        })
                      }
                    >
                      {v === "." ? "" : v}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button
              className="club-light"
              disabled={busy}
              onClick={() =>
                action(async () => {
                  try {
                    await api("rooms/" + active + "/leave", {});
                  } catch (e) {
                    if (!(e instanceof ArcadeError && e.status === 404))
                      throw e;
                  }
                  select("");
                })
              }
            >
              Close room
            </button>
          </section>
        )}
        {message && (
          <p role="status" className="club-help">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
