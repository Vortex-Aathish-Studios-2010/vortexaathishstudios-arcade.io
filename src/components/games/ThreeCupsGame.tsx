import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Flame, Play, RotateCcw } from "lucide-react";
import { sfx } from "@/lib/sounds";
import { addEntertainmentPoints, getGameLevel, setGameLevel, getStreak, updateStreak } from "@/lib/streaks";
import { nextShellLevel, shellSettings } from "@/lib/shellGame";

type Phase = "ready" | "showing" | "covering" | "shuffling" | "guessing" | "result";
const position = ["17%", "50%", "83%"];
export const ThreeCupsGame = ({ onComplete }: { onComplete?: (score: number, won?: boolean) => void }) => {
  const [phase, setPhase] = useState<Phase>("ready");
  const phaseRef = useRef<Phase>("ready");
  const [level, setLevel] = useState(() => getGameLevel("three-cups"));
  const [roundLevel, setRoundLevel] = useState(level);
  const [cups, setCups] = useState([0, 1, 2]);
  const [ball, setBall] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [swap, setSwap] = useState({ pair: [-1, -1], count: 0 });
  const [streak, setStreak] = useState(() => getStreak("three-cups"));
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const mounted = useRef(true);
  function change(next: Phase) { phaseRef.current = next; setPhase(next); }
  function later(callback: () => void, ms: number) {
    timer.current = setTimeout(() => { if (mounted.current) callback(); }, ms);
  }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  function start() {
    if (!["ready", "result"].includes(phaseRef.current)) return;
    clearTimeout(timer.current);
    const config = shellSettings(level);
    setRoundLevel(level); setSelected(null); setCups([0, 1, 2]); setSwap({pair:[-1,-1],count:0});
    setBall(Math.floor(Math.random() * 3));
    change("showing");
    let order = [0, 1, 2];
    let completed = 0;
    function shuffle() {
      if (completed === config.swaps) { change("guessing"); return; }
      const a = Math.floor(Math.random() * 3);
      const b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
      const pair = [order[a], order[b]];
      order = [...order]; [order[a], order[b]] = [order[b], order[a]];
      completed++;
      setSwap({ pair, count: completed }); setCups(order); change("shuffling");
      sfx.place();
      later(shuffle, config.duration + 160);
    }
    later(() => { change("covering"); later(shuffle, 500); }, 1800);
  }
  function choose(cup: number) {
    if (phaseRef.current !== "guessing") return;
    change("result"); setSelected(cup);
    const won = cup === ball;
    const points = won ? roundLevel * 10 : 0;
    const next = nextShellLevel(roundLevel, won);
    setGameLevel("three-cups", next); setLevel(next);
    updateStreak("three-cups"); setStreak(getStreak("three-cups"));
    if (won) { addEntertainmentPoints(points); sfx.correct(); } else sfx.error();
    onComplete?.(points, won);
  }
  const won = selected === ball;
  const config = shellSettings(roundLevel);
  const status = phase === "ready" ? "Follow the ball. Trust your eyes." : phase === "showing" ? "The ball starts here" : phase === "covering" ? "Keep watching…" : phase === "shuffling" ? "Follow the cups" : phase === "guessing" ? "Your move. Find the ball." : won ? "Found it. Level cleared!" : "Missed it. Take it one level slower.";
  return <section className="shell-game" aria-label="Shell Game">
    <div className="shell-stats">
      <div><span>LEVEL</span><strong>{phase === "result" ? roundLevel : level}</strong></div>
      <div><Flame size={20}/><strong>{streak}</strong><span>DAY STREAK</span></div>
      <div><span>ROUND REWARD</span><strong>+{(phase === "result" ? roundLevel : level) * 10}</strong></div>
    </div>
    <div className="shell-heading"><p className="eyebrow">THE SHELL CLUB</p><h2 aria-live="polite">{status}</h2><p>{phase === "ready" ? "Three cups. Three slow swaps to start. Win to go up, miss to drop one level." : phase === "shuffling" ? `Swap ${swap.count} of ${config.swaps}` : phase === "guessing" ? "Tap a cup or use Tab and Enter." : phase === "result" ? `Next up: level ${level}${won ? ` · ${roundLevel * 10} points saved` : " · your earned points stay safe"}` : "Watch where the coral ball goes."}</p></div>
    <div className="shell-table" data-phase={phase}>
      <div className="shell-table-line"/>
      {phase !== "ready" && <div className="shell-ball" style={{left: position[cups.indexOf(ball)], visibility: phase === "showing" || phase === "result" ? "visible" : "hidden"}} aria-hidden="true"/>}
      {[0,1,2].map(id => {
        const lifted = phase === "showing" && id === ball || phase === "result" && (id === ball || id === selected);
        const front = swap.pair[0] === id;
        const moving = phase === "shuffling" && swap.pair.includes(id);
        return <motion.button key={id} className="shell-cup" aria-label={`Cup ${cups.indexOf(id)+1}`} disabled={phase !== "guessing"} onClick={()=>choose(id)}
          initial={false} animate={{left:position[cups.indexOf(id)], y:lifted ? -90 : moving ? [0, front ? -28 : 24, 0] : 0, rotate: moving ? [0,front ? -8 : 8,0] : 0}}
          transition={{left:{duration:config.duration/1000,ease:"easeInOut"},y:{duration:moving ? config.duration/1000 : .35},rotate:{duration:config.duration/1000}}}
          style={{zIndex:front ? 3 : 2}} whileHover={phase === "guessing" ? {scale:1.05} : {}} whileTap={phase === "guessing" ? {scale:.96} : {}}>
          <svg viewBox="0 0 120 150" aria-hidden="true"><ellipse cx="60" cy="141" rx="52" ry="7" fill="#111b18"/><path d="M24 15 Q60 3 96 15 L112 128 Q60 150 8 128 Z" fill="#d7b577" stroke="#f4d9a4" strokeWidth="2"/><path d="M24 15 L8 128 L26 133 L36 17Z" fill="#b48d51"/><path d="M84 18 L94 130 L104 128 L92 17Z" fill="#ecd19a"/><ellipse cx="60" cy="16" rx="36" ry="10" fill="#f0d29a"/><ellipse cx="60" cy="16" rx="27" ry="5" fill="#b48d51"/><path d="M13 116 Q60 134 107 116" fill="none" stroke="#94703d" strokeWidth="5"/><path d="M50 64 L60 53 L70 64 L60 75Z" fill="#79562f"/></svg>
          <span className="shell-cup-number">{cups.indexOf(id)+1}</span>
        </motion.button>;
      })}
    </div>
    <div className="shell-footer">
      {(phase === "ready" || phase === "result") ? <button className="solid-button" onClick={start}>{phase === "ready" ? <Play size={18}/> : won ? <Check size={18}/> : <RotateCcw size={18}/>} {phase === "ready" ? `Play level ${level}` : `Continue · level ${level}`}</button> : <div className="shell-round-progress" aria-label="Round in progress"><span style={{width:`${phase === "guessing" ? 100 : swap.count / config.swaps * 100}%`}}/></div>}
      <p>Progress saves on this device. Complete a round each day to keep your streak.</p>
    </div>
  </section>;
};
