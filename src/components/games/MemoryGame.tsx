import {
  Anchor,
  Bell,
  Bolt,
  Bone,
  Book,
  Camera,
  Cherry,
  Cloud,
  Compass,
  Crown,
  Diamond,
  Dice5,
  Feather,
  Fish,
  Flag,
  Flame,
  Flower,
  Gem,
  Guitar,
  Hammer,
  Heart,
  Hourglass,
  Key,
  Leaf,
  Moon,
  Mountain,
  Music,
  Rocket,
  Scissors,
  Shell,
  Snowflake,
  Star,
  Sun,
  Tent,
  Trophy,
  Umbrella,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  addPoints,
  updateStreak,
  getGameLevel,
  incrementLevel,
  addWin,
} from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { toast } from "sonner";

const faces = {
  Anchor,
  Bell,
  Bolt,
  Bone,
  Book,
  Camera,
  Cherry,
  Cloud,
  Compass,
  Crown,
  Diamond,
  Dice5,
  Feather,
  Fish,
  Flag,
  Flame,
  Flower,
  Gem,
  Guitar,
  Hammer,
  Heart,
  Hourglass,
  Key,
  Leaf,
  Moon,
  Mountain,
  Music,
  Rocket,
  Scissors,
  Shell,
  Snowflake,
  Star,
  Sun,
  Tent,
  Trophy,
  Umbrella,
};

const symbols = Object.entries(faces);

// Level 1 = 8 cards (4 pairs), Level 2 = 16 cards (8 pairs), etc.
const getLevelConfig = (level: number) => {
  const pairs = Math.min(level * 4, symbols.length);
  const total = pairs * 2;
  const cols =
    total <= 8
      ? 4
      : total <= 16
        ? 4
        : total <= 24
          ? 6
          : total <= 32
            ? 8
            : total <= 42
              ? 7
              : 8;
  return { cols, pairs };
};

interface Card {
  id: number;
  symbol: number;
  flipped: boolean;
  matched: boolean;
}

interface Props {
  level?: number;
  onComplete?: (score: number) => void;
}

export const MemoryGame = ({ level: propLevel, onComplete }: Props) => {
  const [currentLevel, setCurrentLevel] = useState(
    propLevel || getGameLevel("memory"),
  );
  const [config, setConfig] = useState(() => getLevelConfig(currentLevel));
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  const initGame = (lvl: number) => {
    const cfg = getLevelConfig(lvl);
    setConfig(cfg);
    const symbolsInRound = Array.from({ length: cfg.pairs }, (_, i) => i);
    const shuffled = [...symbolsInRound, ...symbolsInRound]
      .sort(() => Math.random() - 0.5)
      .map((symbol, i) => ({ id: i, symbol, flipped: false, matched: false }));
    setCards(shuffled);
    setFlipped([]);
    setMoves(0);
    setGameWon(false);
  };

  useEffect(() => {
    initGame(currentLevel);
  }, [currentLevel]);

  const handleFlip = (id: number) => {
    if (flipped.length === 2 || gameWon) return;
    const card = cards[id];
    if (card.flipped || card.matched) return;

    const newCards = [...cards];
    newCards[id].flipped = true;
    setCards(newCards);
    sfx.flip();

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newFlipped;
      if (newCards[a].symbol === newCards[b].symbol) {
        newCards[a].matched = true;
        newCards[b].matched = true;
        setCards([...newCards]);
        setFlipped([]);
        sfx.match();
        if (newCards.every((c) => c.matched)) {
          setGameWon(true);
          const pts = Math.max(150 - moves * 2, 30) + currentLevel * 20;
          addPoints(pts);
          updateStreak("memory");
          addWin("memory");
          incrementLevel("memory");
          sfx.levelComplete();
          toast.success(`Level complete! +${pts} points`);
          onComplete?.(pts);
        }
      } else {
        sfx.mismatch();
        setTimeout(() => {
          newCards[a].flipped = false;
          newCards[b].flipped = false;
          setCards([...newCards]);
          setFlipped([]);
        }, 800);
      }
    }
  };

  const handleNextLevel = () => {
    const next = currentLevel + 1;
    setCurrentLevel(next);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-6 text-sm">
        <span className="text-muted-foreground">
          Moves: <span className="font-display text-foreground">{moves}</span>
        </span>
        <span className="text-muted-foreground">
          Cards:{" "}
          <span className="font-display text-primary">{config.pairs * 2}</span>
        </span>
      </div>
      <div
        className="memory-grid"
        style={
          {
            "--board-width": config.cols * 60 + "px",
            gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
          } as React.CSSProperties
        }
      >
        {cards.map((card) => {
          const [name, Symbol] = symbols[card.symbol];
          const revealed = card.flipped || card.matched;
          return (
            <motion.button
              type="button"
              aria-label={revealed ? name : "Turn card " + (card.id + 1)}
              disabled={revealed || flipped.length === 2}
              key={card.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFlip(card.id)}
              className={`memory-card rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 border-2 ${
                card.matched
                  ? "bg-primary/20 border-primary glow-primary"
                  : card.flipped
                    ? "bg-accent/20 border-accent/50"
                    : "bg-card border-border hover:border-primary/40 hover:glow-primary"
              }`}
            >
              {revealed ? (
                <Symbol aria-hidden="true" />
              ) : (
                <span aria-hidden="true">?</span>
              )}
            </motion.button>
          );
        })}
      </div>
      {gameWon && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={handleNextLevel}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-display text-sm glow-primary hover:brightness-110 transition-all"
        >
          NEXT LEVEL →
        </motion.button>
      )}
    </div>
  );
};
