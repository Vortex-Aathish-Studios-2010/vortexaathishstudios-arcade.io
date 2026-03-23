import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const ScreenBreaker = ({ trigger, onComplete }: { trigger: boolean, onComplete: () => void }) => {
  const [isBreaking, setIsBreaking] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsBreaking(true);
      const timer = setTimeout(() => {
        setIsBreaking(false);
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  // Procedural shards
  const shards = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const dist = 50 + Math.random() * 50;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      rotate: Math.random() * 360,
      size: 40 + Math.random() * 60,
    };
  });

  return (
    <AnimatePresence>
      {isBreaking && (
        <div className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center overflow-hidden">
          {shards.map((s) => (
            <motion.div
              key={s.id}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ 
                scale: 1.5, 
                x: s.x * 10, 
                y: s.y * 10 + 500, 
                rotate: s.rotate * 2,
                opacity: 0
              }}
              transition={{ duration: 0.8, ease: "easeIn" }}
              className="absolute bg-white/30 backdrop-blur-sm border border-white/50"
              style={{
                width: s.size,
                height: s.size,
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)", // Triangles
              }}
            />
          ))}
          {/* Flash */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white z-[10001]"
          />
        </div>
      )}
    </AnimatePresence>
  );
};
