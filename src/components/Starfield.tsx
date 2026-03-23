import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const Starfield = () => {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate 150 random stars
    const newStars = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100, // Percentage
      size: Math.random() * 2 + 1, // 1 to 3px
      delay: Math.random() * 5, // 0 to 5s stagger
      duration: Math.random() * 3 + 2, // 2 to 5s cycle
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black flex items-center justify-center">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          initial={{ opacity: 0.1, scale: 1 }}
          animate={{
            opacity: [0.1, 0.8, 1, 0.8, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Small subtle central gradient to avoid harsh total blackness */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,20,40,0.5)_0%,rgba(0,0,0,1)_100%)] opacity-80" />
    </div>
  );
};
