import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { addPoints, updateStreak, getGameLevel, incrementLevel, addWin } from "@/lib/streaks";
import { sfx } from "@/lib/sounds";
import { toast } from "sonner";

const allEmojis = ["🎯", "🚀", "⚡", "🔥", "💎", "🌟", "🎪", "🎨", "🎵", "🎮", "🏆", "🧩", "🔮", "🌈", "🎲", "🎸", "🦄", "🍀"];

const getLevelConfig = (level: number) => {
  const pairs = Math.min(5 + level, 18);
  const total = pairs * 2;
  const cols = total <= 12 ? 4 : total <= 20 ? 5 : total <= 30 ? 6 : 7;
  return { cols, pairs };
};

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

interface Props {
  level?: number;
  onComplete?: (score: number) => void;
}

export const MemoryGame = ({ level: propLevel, onComplete }: Props) => {
  const currentLevel = propLevel || getGameLevel("memory");
  const config = getLevelConfig(currentLevel);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  const initGame = () => {
    const emojis = allEmojis.slice(0, config.pairs);
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(shuffled);
    setFlipped([]);
    setMoves(0);
    setGameWon(false);
  };

  useEffect(() => { initGame(); }, [currentLevel]);

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
      if (newCards[a].emoji === newCards[b].emoji) {
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

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-6 text-sm">
        <span className="text-muted-foreground">Moves: <span className="font-display text-foreground">{moves}</span></span>
      </div>
      <div className={`grid gap-2.5`} style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` }}>
        {cards.map((card) => (
          <motion.div
            key={card.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleFlip(card.id)}
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl cursor-pointer transition-all duration-300 border-2 ${
              card.matched
                ? "bg-primary/20 border-primary glow-primary"
                : card.flipped
                ? "bg-accent/20 border-accent/50"
                : "bg-card border-border hover:border-primary/40 hover:glow-primary"
            }`}
          >
            <span className={`transition-transform duration-300 ${card.flipped || card.matched ? "scale-100" : "scale-0"}`}>
              {card.emoji}
            </span>
            {!card.flipped && !card.matched && (
              <span className="text-muted-foreground font-display text-lg">?</span>
            )}
          </motion.div>
        ))}
      </div>
      {gameWon && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={initGame}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-display text-sm glow-primary hover:brightness-110 transition-all"
        >
          NEXT LEVEL →
        </motion.button>
      )}
    </div>
  );
};
