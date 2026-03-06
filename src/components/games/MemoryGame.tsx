import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { addPoints, updateStreak } from "@/lib/streaks";
import { toast } from "sonner";

const emojis = ["🎯", "🚀", "⚡", "🔥", "💎", "🌟", "🎪", "🎨"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

export const MemoryGame = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  const initGame = () => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(shuffled);
    setFlipped([]);
    setMoves(0);
    setGameWon(false);
  };

  useEffect(() => { initGame(); }, []);

  const handleFlip = (id: number) => {
    if (flipped.length === 2) return;
    const card = cards[id];
    if (card.flipped || card.matched) return;

    const newCards = [...cards];
    newCards[id].flipped = true;
    setCards(newCards);

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
        if (newCards.every((c) => c.matched)) {
          setGameWon(true);
          const pts = Math.max(100 - moves * 3, 20);
          addPoints(pts);
          updateStreak();
          toast.success(`You won! +${pts} points`);
        }
      } else {
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
      <div className="grid grid-cols-4 gap-3 max-w-xs">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleFlip(card.id)}
            className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl cursor-pointer transition-all duration-300 border-2 ${
              card.flipped || card.matched
                ? "bg-primary/20 border-primary/50"
                : "bg-muted border-border hover:border-primary/30"
            }`}
          >
            {(card.flipped || card.matched) ? card.emoji : "?"}
          </motion.div>
        ))}
      </div>
      {gameWon && (
        <button onClick={initGame} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm">
          PLAY AGAIN
        </button>
      )}
    </div>
  );
};
