import { motion } from "framer-motion";
import { EntertainmentGameInfo } from "@/lib/entertainmentData";
import { Lock } from "lucide-react";

const colorMap = {
  "sport-primary": "border-[hsl(var(--sport-primary))]/30 hover:border-[hsl(var(--sport-primary))]/60",
  "sport-secondary": "border-[hsl(var(--sport-secondary))]/30 hover:border-[hsl(var(--sport-secondary))]/60",
  "sport-accent": "border-[hsl(var(--sport-accent))]/30 hover:border-[hsl(var(--sport-accent))]/60",
};

const badgeMap = {
  "sport-primary": "bg-[hsl(var(--sport-primary))]/20 text-[hsl(var(--sport-primary))]",
  "sport-secondary": "bg-[hsl(var(--sport-secondary))]/20 text-[hsl(var(--sport-secondary))]",
  "sport-accent": "bg-[hsl(var(--sport-accent))]/20 text-[hsl(var(--sport-accent))]",
};

export const EntertainmentCard = ({ game, index }: { game: EntertainmentGameInfo; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ scale: 1.04, y: -4 }}
      className={`relative cursor-default rounded-2xl border-2 bg-white/80 backdrop-blur-sm p-6 transition-shadow duration-300 ${colorMap[game.color]} shadow-lg hover:shadow-xl overflow-hidden`}
    >
      {/* Coming soon overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl">
        <div className="flex items-center gap-2 bg-white/90 rounded-full px-4 py-2 shadow-md">
          <Lock className="h-4 w-4 text-[hsl(var(--sport-primary))]" />
          <span className="font-sport text-sm font-bold text-[hsl(var(--sport-primary))]">COMING SOON</span>
        </div>
      </div>

      <div className="text-4xl mb-3 relative z-10">{game.icon}</div>
      <h3 className="font-sport text-lg font-bold text-gray-800 mb-1 relative z-10">{game.name}</h3>
      <p className="text-sm text-gray-500 mb-3 relative z-10">{game.description}</p>
      <div className="flex items-center justify-between relative z-10">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeMap[game.color]}`}>
          {game.difficulty}
        </span>
      </div>
    </motion.div>
  );
};
