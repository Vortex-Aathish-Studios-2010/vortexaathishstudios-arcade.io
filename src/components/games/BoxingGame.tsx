import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addEntertainmentPoints } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";

type Action = "jab" | "hook" | "dodge";

export const BoxingGame = ({ onComplete }: { onComplete?: (score: number) => void }) => {
  const [playerHp, setPlayerHp] = useState(100);
  const [botHp, setBotHp] = useState(100);
  const [round, setRound] = useState(1);
  const [playerAction, setPlayerAction] = useState<Action | null>(null);
  const [botAction, setBotAction] = useState<Action | null>(null);
  const [message, setMessage] = useState("Ready to fight!");
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const cooldown = useRef(false);

  const attack = useCallback((action: Action) => {
    if (cooldown.current || gameOver) return;
    cooldown.current = true;
    sfx.click();

    setPlayerAction(action);

    // Bot randomly acts
    const botActs: Action[] = ["jab", "hook", "dodge"];
    const bot = botActs[Math.floor(Math.random() * botActs.length)];
    setBotAction(bot);

    let playerDmg = 0;
    let botDmg = 0;
    let msg = "";

    if (action === "dodge") {
      if (bot === "dodge") {
        msg = "Both dodged! No action.";
        setCombo(0);
      } else {
        msg = `You dodged the ${bot}! Counter opportunity!`;
        setCombo(prev => prev + 1);
      }
    } else {
      // Player attacks
      const baseDmg = action === "jab" ? 8 : 15;
      const comboBonus = Math.min(combo * 3, 15);

      if (bot === "dodge") {
        msg = `Bot dodged your ${action}!`;
        setCombo(0);
      } else {
        playerDmg = baseDmg + comboBonus;
        setCombo(prev => prev + 1);
        msg = `Your ${action} hit for ${playerDmg} damage!`;
      }

      // Bot attacks back if not dodging
      if (bot !== "dodge") {
        botDmg = bot === "jab" ? 5 + Math.floor(Math.random() * 5) : 10 + Math.floor(Math.random() * 8);
        msg += ` Bot ${bot} hits for ${botDmg}!`;
      }
    }

    setMessage(msg);

    if (playerDmg > 0) {
      setBotHp(prev => {
        const next = Math.max(0, prev - playerDmg);
        if (next <= 0) {
          setGameOver(true);
          setMessage("🏆 KNOCKOUT! You win!");
          addEntertainmentPoints(100 - (100 - playerHp));
          sfx.levelComplete();
          onComplete?.(100);
        }
        return next;
      });
    }

    if (botDmg > 0) {
      setPlayerHp(prev => {
        const next = Math.max(0, prev - botDmg);
        if (next <= 0) {
          setGameOver(true);
          setMessage("💀 You got knocked out!");
          sfx.error();
          onComplete?.(0);
        }
        return next;
      });
    }

    setTimeout(() => {
      setPlayerAction(null);
      setBotAction(null);
      cooldown.current = false;
    }, 500);
  }, [gameOver, combo, playerHp, onComplete]);

  const restart = () => {
    setPlayerHp(100);
    setBotHp(100);
    setRound(1);
    setGameOver(false);
    setMessage("Ready to fight!");
    setCombo(0);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* HP Bars */}
      <div className="w-full max-w-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-sport text-xs text-[hsl(var(--sport-text))] w-10">YOU</span>
          <div className="flex-1 h-4 bg-[hsl(var(--sport-card))] rounded-full overflow-hidden border border-[hsl(var(--sport-border))]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: playerHp > 30 ? "hsl(var(--sport-primary))" : "#ef4444" }}
              animate={{ width: `${playerHp}%` }}
              transition={{ type: "spring", stiffness: 200 }}
            />
          </div>
          <span className="font-sport text-xs text-[hsl(var(--sport-accent))] w-8">{playerHp}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-sport text-xs text-[hsl(var(--sport-muted))] w-10">BOT</span>
          <div className="flex-1 h-4 bg-[hsl(var(--sport-card))] rounded-full overflow-hidden border border-[hsl(var(--sport-border))]">
            <motion.div
              className="h-full rounded-full bg-red-500"
              animate={{ width: `${botHp}%` }}
              transition={{ type: "spring", stiffness: 200 }}
            />
          </div>
          <span className="font-sport text-xs text-red-400 w-8">{botHp}</span>
        </div>
      </div>

      {/* Ring */}
      <div
        className="relative w-72 h-56 rounded-2xl overflow-hidden border-2 border-[hsl(var(--sport-border))]"
        style={{
          background: "linear-gradient(180deg, #1a0a2e 0%, #2d1040 50%, #8B0000 90%, #660000 100%)",
        }}
      >
        {/* Ring ropes */}
        <div className="absolute left-0 right-0 top-[20%] h-[2px] bg-white/20" />
        <div className="absolute left-0 right-0 top-[40%] h-[2px] bg-red-500/30" />
        <div className="absolute left-0 right-0 top-[60%] h-[2px] bg-white/20" />

        {/* Fighters */}
        <div className="absolute bottom-8 left-12 flex flex-col items-center">
          <motion.div
            animate={playerAction === "jab" ? { x: 30 } : playerAction === "hook" ? { x: 40, rotate: 15 } : playerAction === "dodge" ? { y: 15, x: -10 } : {}}
            transition={{ duration: 0.2 }}
            className="text-5xl"
          >
            🥊
          </motion.div>
          <span className="font-sport text-[10px] text-[hsl(var(--sport-text))] mt-1">YOU</span>
        </div>

        <div className="absolute bottom-8 right-12 flex flex-col items-center">
          <motion.div
            animate={botAction === "jab" ? { x: -30 } : botAction === "hook" ? { x: -40, rotate: -15 } : botAction === "dodge" ? { y: 15, x: 10 } : {}}
            transition={{ duration: 0.2 }}
            className="text-5xl scale-x-[-1]"
          >
            🥊
          </motion.div>
          <span className="font-sport text-[10px] text-[hsl(var(--sport-muted))] mt-1">BOT</span>
        </div>

        {/* Combo indicator */}
        {combo > 1 && (
          <motion.div
            key={combo}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2 right-2 bg-[hsl(var(--sport-accent))]/20 text-[hsl(var(--sport-accent))] px-2 py-1 rounded font-sport text-xs"
          >
            {combo}x COMBO!
          </motion.div>
        )}
      </div>

      {/* Message */}
      <motion.p
        key={message}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-sport-body text-sm text-[hsl(var(--sport-text))] text-center max-w-xs"
      >
        {message}
      </motion.p>

      {/* Controls */}
      {!gameOver && (
        <div className="flex gap-3">
          <button
            onClick={() => attack("jab")}
            className="px-5 py-3 bg-[hsl(var(--sport-primary))]/20 border border-[hsl(var(--sport-primary))]/50 text-[hsl(var(--sport-primary))] rounded-xl font-sport tracking-wider hover:bg-[hsl(var(--sport-primary))]/30 transition-all"
          >
            👊 JAB
          </button>
          <button
            onClick={() => attack("hook")}
            className="px-5 py-3 bg-[hsl(var(--sport-accent))]/20 border border-[hsl(var(--sport-accent))]/50 text-[hsl(var(--sport-accent))] rounded-xl font-sport tracking-wider hover:bg-[hsl(var(--sport-accent))]/30 transition-all"
          >
            💥 HOOK
          </button>
          <button
            onClick={() => attack("dodge")}
            className="px-5 py-3 bg-[hsl(var(--sport-secondary))]/20 border border-[hsl(var(--sport-secondary))]/50 text-[hsl(var(--sport-secondary))] rounded-xl font-sport tracking-wider hover:bg-[hsl(var(--sport-secondary))]/30 transition-all"
          >
            🛡️ DODGE
          </button>
        </div>
      )}

      {gameOver && (
        <button onClick={restart} className="px-6 py-2 bg-[hsl(var(--sport-primary))]/20 border border-[hsl(var(--sport-primary))]/50 text-[hsl(var(--sport-primary))] rounded-xl font-sport tracking-wider">
          FIGHT AGAIN
        </button>
      )}
    </div>
  );
};
