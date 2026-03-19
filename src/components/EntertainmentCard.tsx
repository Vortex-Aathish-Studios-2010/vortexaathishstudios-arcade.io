import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { EntertainmentGameInfo } from "@/lib/entertainmentData";
import { Lock } from "lucide-react";
import { sfx } from "@/lib/sounds";

const colorMap = {
  "sport-primary": "border-[hsl(145,70%,40%)]/40 hover:border-[hsl(145,70%,40%)]/80 hover:shadow-[0_0_40px_hsl(145,70%,40%,0.3)] bg-[hsl(145,70%,40%)]/5",
  "sport-secondary": "border-[hsl(210,90%,55%)]/40 hover:border-[hsl(210,90%,55%)]/80 hover:shadow-[0_0_40px_hsl(210,90%,55%,0.3)] bg-[hsl(210,90%,55%)]/5",
  "sport-accent": "border-[hsl(35,95%,55%)]/40 hover:border-[hsl(35,95%,55%)]/80 hover:shadow-[0_0_40px_hsl(35,95%,55%,0.3)] bg-[hsl(35,95%,55%)]/5",
};

const glowColors = {
  "sport-primary": "hsl(145 70% 40%)",
  "sport-secondary": "hsl(210 90% 55%)",
  "sport-accent": "hsl(35 95% 55%)",
};

const badgeColors = {
  "sport-primary": "text-[hsl(145,70%,50%)] bg-[hsl(145,70%,40%)]/10",
  "sport-secondary": "text-[hsl(210,90%,60%)] bg-[hsl(210,90%,55%)]/10",
  "sport-accent": "text-[hsl(35,95%,55%)] bg-[hsl(35,95%,55%)]/10",
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
      initial={{ opacity: 0, y: 40, scale: 0.88 }}
      animate={clicked
        ? { scale: 0.92, opacity: 0, filter: "blur(14px)" }
        : { opacity: 1, y: 0, scale: 1 }
      }
      transition={clicked
        ? { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
        : { delay: index * 0.07, duration: 0.5, type: "spring", stiffness: 120 }
      }
      whileHover={!clicked ? { scale: 1.05, y: -6, transition: { type: "spring", stiffness: 300 } } : undefined}
      whileTap={!clicked && game.available ? { scale: 0.97 } : undefined}
      onClick={handleClick}
      className={`relative ${game.available ? "cursor-pointer" : "cursor-default"} rounded-2xl border bg-[hsl(var(--sport-card))]/80 backdrop-blur-sm overflow-hidden transition-all duration-300 ${colorMap[game.color]} shadow-lg`}
      style={clicked ? { zIndex: 50 } : undefined}
    >
      {/* Glow effect on click */}
      <AnimatePresence>
        {clicked && (
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 8, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full z-10"
            style={{ backgroundColor: glowColors[game.color] }}
          />
        )}
      </AnimatePresence>

      {/* Coming soon overlay */}
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

      {/* Sporty pattern */}
      <div className="absolute inset-0 sporty-pattern pointer-events-none opacity-30 mix-blend-overlay" />

      {/* Background blob */}
      <div className="absolute top-0 right-0 w-24 h-24 -mt-6 -mr-6 bg-white/5 blur-3xl rounded-full pointer-events-none" />

      {/* Icon fills top */}
      <motion.div
        className="relative w-full flex items-center justify-center pt-8 pb-4"
        initial={{ scale: 0, rotate: -15 }}
        animate={clicked ? { scale: 1.3, y: -8 } : { scale: 1, rotate: 0 }}
        transition={clicked ? { type: "spring", stiffness: 300 } : { delay: index * 0.07 + 0.15, type: "spring", stiffness: 200 }}
      >
        <div className="w-20 h-20 flex items-center justify-center">
          {game.icon}
        </div>
      </motion.div>

      {/* Text */}
      <div className="px-5 pb-5 relative z-10">
        <h3 className="font-sport text-base font-bold text-[hsl(var(--sport-text))] mb-1">{game.name}</h3>
        <p className="text-xs text-[hsl(var(--sport-muted))] mb-3 leading-relaxed">{game.description}</p>
        <span className={`text-[10px] font-display px-2 py-0.5 rounded-full ${badgeColors[game.color]}`}>
          {game.difficulty}
        </span>
      </div>
    </motion.div>
  );
};
