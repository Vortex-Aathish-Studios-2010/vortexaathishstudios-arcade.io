import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link,useSearchParams } from "react-router-dom";
import { Chess } from "chess.js";
import { Users, Copy, Check, ArrowLeft, Play } from "lucide-react";
import { api, ArcadeError, Room, syncProfile } from "@/lib/arcade";
import { roomGames, roomGame } from "@/lib/roomCatalog.mjs";
import { publicAsset } from "@/lib/assets";
import { useOnline } from "@/lib/connectivity";
import { useGameOrientation } from "@/lib/DeviceContext";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { ChessBoard } from "@/components/ChessBoard";
const LiveRound=lazy(()=>import("@/components/LiveRound").then(m=>({default:m.LiveRound})));
const ChallengeRound = lazy(() =>
  import("@/components/ChallengeRound").then((m) => ({
    default: m.ChallengeRound,
  })),
);
export default function Rooms() {
  const [params] = useSearchParams();
  const online=useOnline();
  const requested =
    params.get("game") === "tictactoe" ? "trio" : params.get("game");
  const [active, setActive] = useState(
      () => sessionStorage.getItem("arcade.room") || "",
    ),
    [room, setRoom] = useState<Room | null>(null),
    [game, setGame] = useState(() => roomGame(requested)?.id || "trio"),
    [code, setCode] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [copied, setCopied] = useState(false),
    [now, setNow] = useState(Date.now());
  const revision = useRef(0),
    offset = useRef(0),
    inFlight = useRef(false);
  const config = roomGame(room?.game || game);
  useGameOrientation(room?.starts && !room.result ? room.game : null);
  function select(next: string) {
    revision.current++;
    sessionStorage.setItem("arcade.room", next);
    setActive(next);
    setRoom(null);
    setMessage("");
    setCopied(false);
  }
  function receive(next: Room) {
    offset.current = (next.serverNow || Date.now()) - Date.now();
    setRoom(previous=>previous?.code===next.code&&(previous.revision||0)>(next.revision||0)?previous:next);
  }
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + offset.current), 250);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!active) return;
    let disposed = false,
      timer: ReturnType<typeof setTimeout>;
    async function read() {
      const seq = revision.current;
      let finished = false;
      try {
        if (!document.hidden && !inFlight.current) {
          const next = await api<Room>("rooms/" + active);
          if (disposed || seq !== revision.current) return;
          if(next.matchmaking&&!next.guest&&next.me==='X'){
            const paired=await api<{code:string}>('quick-match',{game:next.game});
            if(disposed||seq!==revision.current)return;
            if(paired.code!==active){select(paired.code);return;}
          }
          receive(next);
          setMessage("");
          finished = Boolean(next.result);
        }
      } catch (e) {
        if (disposed || seq !== revision.current) return;
        if (e instanceof ArcadeError && e.status === 404) {
          select("");
          setMessage(e.message);
          finished = true;
        } else setMessage("Connection interrupted. Reconnecting…");
      } finally {
        if (!disposed && !finished) timer = setTimeout(read, 800);
      }
    }
    void read();
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [active]);
  async function action(run: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    revision.current++;
    setBusy(true);
    setMessage("");
    try {
      await run();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function command(actionName: string, body: object = {}) {
    await action(async () =>
      receive(await api<Room>("rooms/" + active + "/" + actionName, body)),
    );
  }
  async function enter(join: boolean,quick=false) {
    await action(async () => {
      await syncProfile();
      const next = join
        ? await api<Room>("rooms/" + code + "/join", {})
        : await api<{ code: string }>(quick?"quick-match":"rooms", { game });
      select(next.code);
    });
  }
  const chess = useMemo(() => {
    const c = new Chess();
    if (room?.game === "chess" && room.board) c.loadPgn(room.board);
    return c;
  }, [room?.board, room?.game]);
  const myTurn =
    room &&
    room.guest &&
    !room.result &&
    (room.game === "chess"
      ? chess.turn() === "w"
        ? "X"
        : "O"
      : room.board.replace(/\./g, "").length % 2
        ? "O"
        : "X") === room.me;
  const result = room?.result
    ? room.result === "draw"
      ? "Draw · 5 points each"
      : room.result === room.me
        ? "You won · +20 points"
        : "Opponent wins"
    : "";
  if(!online&&!active)return <main className="club-page"><section className="offline-room"><Users/><h1>Multiplayer needs internet.</h1><p>You can still play solo!</p><Link to="/" className="solid-button">Back to solo games</Link></section></main>;
  return (
    <main className={"club-page rooms-page" + (active ? " in-room" : "") + (room?.mode === "live" && room.starts ? " live-room" : "")}>
      <div className="club-wrap">
        <header className="club-title">
          <Users />
          <h1>
            {active ? config?.title || "Connecting…" : "Play with friends"}
          </h1>
          <p>
            {active
              ? "Room " + active
              : "Every game. One code. Choose your next match."}
          </p>
        </header>
        {!active ? (
          <>
            <form
              className="room-join-bar"
              onSubmit={(e) => {
                e.preventDefault();
                void enter(true);
              }}
            >
              <label htmlFor="join-code">Have a room code?</label>
              <input
                id="join-code"
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
              <button
                className="solid-button"
                disabled={busy || code.length !== 6}
              >
                Join room
              </button>
            </form>
            <div className="room-picker-heading">
              <h2>Choose a game</h2>
              <span>{roomGames.length} ways to compete</span>
            </div>
            <section className="room-create-bar">
              <div>
                <small>SELECTED GAME</small>
                <h2>{config.title}</h2>
                <p>
                  {config.mode === "live" ? "Play together in real time. See your opponent on the same screen." : config.mode === "challenge"
                    ? `Two players start together. One attempt, up to ${config.seconds / 60} minutes. Highest score wins.`
                    : "Take turns on the same board. Moves are checked by the server."}
                </p>
              </div>
              <button
                className="solid-button"
                disabled={busy}
                onClick={() => enter(false)}
              >
                <Play size={18} />
                {busy ? "Creating…" : "Create room"}
              </button>
              <button className="club-light" disabled={busy} onClick={()=>enter(false,true)}>Quick match</button>
            </section>
            <div
              className="room-game-picker"
              role="group"
              aria-label="Multiplayer games"
            >
              {roomGames.map((g) => (
                <button
                  key={g.id}
                  aria-pressed={game === g.id}
                  onClick={() => setGame(g.id)}
                >
                  <img src={publicAsset("covers/" + g.cover + ".webp")} alt="" />
                  <div>
                    <span>
                      {g.mode === "live" ? "LIVE MULTIPLAYER" : g.mode === "challenge"
                        ? "SCORE CHALLENGE"
                        : "SHARED BOARD"}
                    </span>
                    <strong>{g.title}</strong>
                    <small>{g.detail}</small>
                  </div>
                  {game === g.id && <Check size={19} />}
                </button>
              ))}
            </div>
          </>
        ) : (
          <section className="club-box room-arena">
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
                <Copy size={16} />
                {copied ? "Copied" : "Copy code"}
              </button>
            </div>
            {room && (
              <>
                <div className="room-players">
                  <span>
                    <PlayerAvatar id={room.hostAvatar} size={48} />
                    <span>
                      <b>{room.host}</b>
                      <small>
                        {room.game === "chess"
                          ? "White"
                          : (room.mode === "challenge" || room.mode === "live")
                            ? "Host"
                            : "X"}
                        {(room.mode === "challenge" || room.mode === "live")
                          ? " · " +
                            (room.hostDone
                              ? "Finished"
                              : room.hostReady
                                ? "Ready"
                                : "Not ready")
                          : ""}
                      </small>
                    </span>
                    {(room.mode === "challenge" || room.mode === "live") && (
                      <strong>{room.hostScore}</strong>
                    )}
                  </span>
                  <span>
                    <PlayerAvatar id={room.guestAvatar} size={48} />
                    <span>
                      <b>{room.guest || "Waiting for a friend…"}</b>
                      <small>
                        {room.guest
                          ? room.game === "chess"
                            ? "Black"
                            : (room.mode === "challenge" || room.mode === "live")
                              ? "Guest"
                              : "O"
                          : ""}
                        {(room.mode === "challenge" || room.mode === "live") && room.guest
                          ? " · " +
                            (room.guestDone
                              ? "Finished"
                              : room.guestReady
                                ? "Ready"
                                : "Not ready")
                          : ""}
                      </small>
                    </span>
                    {(room.mode === "challenge" || room.mode === "live") && (
                      <strong>{room.guestScore}</strong>
                    )}
                  </span>
                </div>
                <h2 className="room-status" aria-live="polite">
                  {result ||
                    (!room.guest
                      ? room.matchmaking ? "Finding another player…" : "Share the room code"
                      : (room.mode === "challenge" || room.mode === "live")
                        ? room.starts
                          ? now < room.starts
                            ? "Get ready"
                            : "Match in progress"
                          : "Ready up to play"
                        : myTurn
                          ? "Your turn"
                          : "Opponent’s turn")}
                </h2>
                {(room.mode === "challenge" || room.mode === "live") ? (
                  room.starts ? (
                    <Suspense fallback={<p>Loading game…</p>}>
                      {room.mode==='live'?<LiveRound key={room.code+room.starts} room={room} onSnapshot={receive}/>:<ChallengeRound key={room.code+room.starts} room={room} clockOffset={offset.current}/>}
                    </Suspense>
                  ) : (
                    <div className="room-ready">
                      <p>
                        {config.detail} Both players must be ready before the host starts.
                      </p>
                      <button
                        className="solid-button"
                        disabled={
                          busy ||
                          (room.me === "X" ? room.hostReady : room.guestReady)
                        }
                        onClick={() => command("ready")}
                      >
                        {(room.me === "X" ? room.hostReady : room.guestReady)
                          ? "Ready"
                          : "I’m ready"}
                      </button>
                      {room.me === "X" && (
                        <button
                          className="solid-button"
                          disabled={
                            busy ||
                            !room.guest ||
                            !room.hostReady ||
                            !room.guestReady
                          }
                          onClick={() => command("start")}
                        >
                          Start match
                        </button>
                      )}
                    </div>
                  )
                ) : room.game === "chess" ? (
                  <ChessBoard
                    chess={chess}
                    orientation={room.me === "X" ? "w" : "b"}
                    disabled={busy || !myTurn}
                    onMove={(from, to, promotion) =>
                      command("move", {
                        from,
                        to,
                        promotion,
                        board: room.board,
                      })
                    }
                  />
                ) : (
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
                          command("move", { cell: i, board: room.board })
                        }
                      >
                        {v === "." ? "" : v}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <button
              className="club-light room-leave"
              disabled={busy}
              onClick={() =>
                action(async () => {
                  try {
                    await api("rooms/" + active + "/leave", {});
                  } catch (e) {
                    // Leaving must always return to solo, even if the network vanished.
                    // The server expires waiting rooms and detects live disconnects.
                  }
                  select("");
                })
              }
            >
              <ArrowLeft size={17} />
              {room?.result ? "Back to games" : "Close room"}
            </button>
          </section>
        )}
        {message && (
          <p role="status" className="room-error">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
