import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { EntertainmentGameInfo } from "@/lib/entertainmentData";
import { Lock } from "lucide-react";
import { sfx } from "@/lib/sounds";

const colorMap = {
  "sport-primary": "border-[hsl(var(--sport-primary))]/30 hover:border-[hsl(var(--sport-primary))]/60",
  "sport-secondary": "border-[hsl(var(--sport-secondary))]/30 hover:border-[hsl(var(--sport-secondary))]/60",
  "sport-accent": "border-[hsl(var(--sport-accent))]/30 hover:border-[hsl(var(--sport-accent))]/60",
};

const glowColors = {
  "sport-primary": "hsl(145 70% 40%)",
  "sport-secondary": "hsl(210 90% 55%)",
  "sport-accent": "hsl(35 95% 55%)",
};

export const EntertainmentCard = ({ game, index }: { game: EntertainmentGameInfo; index: number }) => {
  const navigate = useNavigate();
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (!game.available || clicked) return;
    setClicked(true);
    sfx.click();
    setTimeout(() => navigate(`/entertainment/${game.id}`), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={clicked
        ? { scale: 0.95, opacity: 0, filter: "blur(12px)" }
        : { opacity: 1, y: 0, scale: 1 }
      }
      transition={clicked
        ? { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
        : { delay: index * 0.07, duration: 0.5, type: "spring", stiffness: 120 }
      }
      whileHover={!clicked ? { scale: 1.06, y: -6, transition: { type: "spring", stiffness: 300 } } : undefined}
      whileTap={!clicked && game.available ? { scale: 0.97 } : undefined}
      onClick={handleClick}
      className={`relative ${game.available ? "cursor-pointer" : "cursor-default"} rounded-2xl border-2 bg-[hsl(var(--sport-card))]/80 backdrop-blur-sm p-6 transition-shadow duration-300 ${colorMap[game.color]} shadow-lg hover:shadow-xl overflow-hidden`}
      style={clicked ? { zIndex: 50 } : undefined}
    >
      {/* Glow effect on click */}
      <AnimatePresence>
        {clicked && (
          <motion.div
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 6, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full"
            style={{ backgroundColor: glowColors[game.color] }}
          />
        )}
      </AnimatePresence>

      {/* Coming soon overlay for unavailable games */}
      {!game.available && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.07 + 0.3 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.07 + 0.4, type: "spring", stiffness: 200 }}
            className="flex items-center gap-2 bg-[hsl(var(--sport-card))]/90 rounded-full px-4 py-2 shadow-md border border-[hsl(var(--sport-border))]"
          >
            <Lock className="h-4 w-4 text-[hsl(var(--sport-primary))]" />
            <span className="font-sport text-sm font-bold text-[hsl(var(--sport-primary))]">COMING SOON</span>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        className="text-4xl mb-3 relative z-10"
        initial={{ scale: 0, rotate: -20 }}
        animate={clicked ? { scale: 1.4, y: -10 } : { scale: 1, rotate: 0 }}
        transition={clicked ? { type: "spring", stiffness: 300 } : { delay: index * 0.07 + 0.15, type: "spring", stiffness: 200 }}
      >
        {game.icon}
      </motion.div>
      <h3 className="font-sport text-lg font-bold text-[hsl(var(--sport-text))] mb-1 relative z-10">{game.name}</h3>
      <p className="text-sm text-[hsl(var(--sport-muted))] mb-3 relative z-10">{game.description}</p>
    </motion.div>
  );
};
