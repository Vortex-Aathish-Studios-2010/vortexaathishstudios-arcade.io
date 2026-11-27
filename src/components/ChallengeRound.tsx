import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, Room } from "@/lib/arcade";
import { MatchContext, seededRandom } from "@/lib/matchPlay";
import { MemoryGame } from "./games/MemoryGame";
import { SlidingPuzzle } from "./games/SlidingPuzzle";
import { BlockStack } from "./games/BlockStack";
import { SudokuGame } from "./games/SudokuGame";
import { KonoodleGame } from "./games/KonoodleGame";
import { WordSearchGame } from "./games/WordSearchGame";
import { SnakeGame } from "./games/SnakeGame";
import { TapRushGame } from "./games/TapRushGame";
import { ColorSwitchTapGame } from "./games/ColorSwitchTapGame";
import { StackTowerGame } from "./games/StackTowerGame";
import { OneShotAimGame } from "./games/OneShotAimGame";
import { AvoidTheWallsGame } from "./games/AvoidTheWallsGame";
import { ThreeCupsGame } from "./games/ThreeCupsGame";
import { GravityFlipRunner } from "./games/GravityFlipRunner";
export const challengeComponents = {
  memory: MemoryGame,
  sliding: SlidingPuzzle,
  tetris: BlockStack,
  sudoku: SudokuGame,
  konoodle: KonoodleGame,
  wordsearch: WordSearchGame,
  snake: SnakeGame,
  "tap-rush": TapRushGame,
  "color-switch": ColorSwitchTapGame,
  "stack-tower": StackTowerGame,
  "one-shot": OneShotAimGame,
  "avoid-walls": AvoidTheWallsGame,
  "three-cups": ThreeCupsGame,
  "gravity-flip": GravityFlipRunner,
};
const Game = memo(
  ({ game, complete }: { game: string; complete: (score: number) => void }) => {
    const Component = challengeComponents[game];
    return Component ? <Component level={1} onComplete={complete} /> : null;
  },
);
export function ChallengeRound({
  room,
  clockOffset,
}: {
  room: Room;
  clockOffset: number;
}) {
  const storageKey = "arcade.challenge." + room.code + "." + room.starts;
  const saved = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey) || "null");
    } catch {
      return null;
    }
  }, [storageKey]);
  const initialDone =
    Boolean(saved) || (room.me === "X" ? room.hostDone : room.guestDone);
  const [now, setNow] = useState(() => Date.now() + clockOffset),
    [localDone, setLocalDone] = useState(initialDone),
    [connection, setConnection] = useState(""),
    [localScore, setLocalScore] = useState(saved?.score || 0);
  const score = useRef(saved?.score || 0),
    done = useRef(initialDone),
    latest = useRef(room);
  latest.current = room;
  const resumed = useRef(Boolean(saved)),
    clock = useRef(clockOffset);
  clock.current = clockOffset;
  const progress = useCallback(
    (value: number) => {
      if (done.current) return;
      score.current = Math.max(score.current, Math.floor(value));
      setLocalScore(score.current);
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ score: score.current, done: false }),
      );
    },
    [storageKey],
  );
  const complete = useCallback(
    (value: number) => {
      if (done.current) return;
      progress(value);
      done.current = true;
      setLocalDone(true);
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ score: score.current, done: true }),
      );
    },
    [progress, storageKey],
  );
  const session = useMemo(
    () => ({ progress, random: seededRandom(room.code + ":" + room.starts) }),
    [progress, room.code, room.starts],
  );
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + clock.current), 100);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let stopped = false,
      timer: ReturnType<typeof setTimeout>;
    async function send() {
      const r = latest.current;
      if (!r.result && Date.now() + clock.current >= r.starts) {
        try {
          await api<Room>("rooms/" + r.code + "/progress", {
            score: score.current,
            done: done.current,
          });
          if (!stopped) setConnection("");
        } catch {
          if (!stopped)
            setConnection(
              "Reconnecting. Your last score is kept on this device.",
            );
        }
      }
      if (!stopped && !latest.current.result) timer = setTimeout(send, 750);
    }
    void send();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [room.code, room.starts]);
  useEffect(() => {
    if (now >= room.ends && !done.current) {
      done.current = true;
      setLocalDone(true);
    }
  }, [now, room.ends]);
  const seconds = Math.max(0, Math.ceil((room.ends - now) / 1000));
  return (
    <div className="challenge-round">
      <div className="challenge-clock">
        <span>{localDone ? "ATTEMPT FINISHED" : "LIVE CHALLENGE"}</span>
        <strong>
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
        </strong>
        <span>
          YOUR SCORE <b>{localScore}</b>
        </span>
      </div>
      {room.result ? (
        <div className="challenge-finished">
          <h2>Round complete</h2>
          <p>
            {room.host}: {room.hostScore} · {room.guest}: {room.guestScore}
          </p>
        </div>
      ) : now < room.starts ? (
        <div className="match-countdown" role="status">
          <strong>{Math.ceil((room.starts - now) / 1000)}</strong>
          <p>Get ready. Your round starts together.</p>
        </div>
      ) : localDone ? (
        <div className="challenge-finished">
          <h2>Score locked in: {localScore}</h2>
          <p>
            {resumed.current
              ? "You rejoined the room. Your saved attempt is being submitted."
              : "Waiting for your friend to finish. Results update automatically."}
          </p>
        </div>
      ) : (
        <MatchContext.Provider value={session}>
          <div className="game-stage challenge-game">
            <Game game={room.game} complete={complete} />
          </div>
        </MatchContext.Provider>
      )}
      {!localDone && !room.result && now >= room.starts && (
        <button className="club-light" onClick={() => complete(score.current)}>
          Finish with this score
        </button>
      )}
      {connection && (
        <p role="status" className="club-help">
          {connection}
        </p>
      )}
    </div>
  );
}
