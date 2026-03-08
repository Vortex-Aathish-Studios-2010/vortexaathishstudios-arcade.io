import { motion } from "framer-motion";
import { EntertainmentGameInfo } from "@/lib/entertainmentData";
import { Lock } from "lucide-react";

const colorMap = {
  "sport-primary": "border-[hsl(var(--sport-primary))]/30 hover:border-[hsl(var(--sport-primary))]/60",
  "sport-secondary": "border-[hsl(var(--sport-secondary))]/30 hover:border-[hsl(var(--sport-secondary))]/60",
  "sport-accent": "border-[hsl(var(--sport-accent))]/30 hover:border-[hsl(var(--sport-accent))]/60",
};

export const EntertainmentCard = ({ game, index }: { game: EntertainmentGameInfo; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.5, type: "spring", stiffness: 120 }}
      whileHover={{ scale: 1.06, y: -6, transition: { type: "spring", stiffness: 300 } }}
      whileTap={{ scale: 0.97 }}
      className={`relative cursor-default rounded-2xl border-2 bg-white/80 backdrop-blur-sm p-6 transition-shadow duration-300 ${colorMap[game.color]} shadow-lg hover:shadow-xl overflow-hidden`}
    >
      {/* Coming soon overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.07 + 0.3 }}
        className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.07 + 0.4, type: "spring", stiffness: 200 }}
          className="flex items-center gap-2 bg-white/90 rounded-full px-4 py-2 shadow-md"
        >
          <Lock className="h-4 w-4 text-[hsl(var(--sport-primary))]" />
          <span className="font-sport text-sm font-bold text-[hsl(var(--sport-primary))]">COMING SOON</span>
        </motion.div>
      </motion.div>

      <motion.div
        className="text-4xl mb-3 relative z-10"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.07 + 0.15, type: "spring", stiffness: 200 }}
      >
        {game.icon}
      </motion.div>
      <h3 className="font-sport text-lg font-bold text-gray-800 mb-1 relative z-10">{game.name}</h3>
      <p className="text-sm text-gray-500 mb-3 relative z-10">{game.description}</p>
    </motion.div>
  );
};
