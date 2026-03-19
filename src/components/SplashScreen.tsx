import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  dur: Math.random() * 3 + 1.5,
  delay: Math.random() * 3,
  opacity: Math.random() * 0.5 + 0.2,
}));

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<"logo" | "founders" | "exit">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("founders"), 3200);
    const t2 = setTimeout(() => setPhase("exit"), 7400);
    const t3 = setTimeout(() => onComplete(), 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08, filter: "blur(24px)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden"
        >
          {/* Starfield */}
          <div className="absolute inset-0 pointer-events-none">
            {STARS.map(s => (
              <motion.div
                key={s.id}
                className="absolute rounded-full bg-white"
                style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
                animate={{ opacity: [s.opacity, s.opacity * 0.2, s.opacity] }}
                transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
              />
            ))}
          </div>

          {/* Cinematic letterbox bars */}
          <motion.div
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="absolute top-0 left-0 right-0 h-[12vh] bg-black z-10 origin-top"
          />
          <motion.div
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="absolute bottom-0 left-0 right-0 h-[12vh] bg-black z-10 origin-bottom"
          />

          <AnimatePresence mode="wait">
            {/* PHASE 1: ARCADE.IO */}
            {phase === "logo" && (
              <motion.div
                key="logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -60, filter: "blur(20px)" }}
                transition={{ exit: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } }}
                className="text-center relative z-10 select-none"
              >
                {/* Scanline flash */}
                <motion.div
                  initial={{ scaleX: 0, opacity: 1 }}
                  animate={{ scaleX: 1, opacity: 0 }}
                  transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                  className="absolute inset-x-0 h-[3px] bg-primary/60 blur-sm"
                  style={{ top: "50%" }}
                />

                <motion.h1
                  initial={{ opacity: 0, scale: 0.4, filter: "blur(30px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ delay: 0.4, duration: 1.1, type: "spring", stiffness: 60, damping: 12 }}
                  className="text-[clamp(4rem,18vw,11rem)] font-display font-black leading-none tracking-tight"
                >
                  <span className="text-primary" style={{ textShadow: "0 0 60px hsl(185 100% 50% / 0.8), 0 0 120px hsl(185 100% 50% / 0.4)" }}>
                    ARCADE
                  </span>
                  <span className="text-secondary" style={{ textShadow: "0 0 60px hsl(300 80% 60% / 0.8), 0 0 120px hsl(300 80% 60% / 0.4)" }}>
                    .IO
                  </span>
                </motion.h1>

                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
                  className="mt-5 mx-auto h-[2px] w-72 bg-gradient-to-r from-transparent via-primary to-transparent"
                />

                <motion.p
                  initial={{ opacity: 0, letterSpacing: "1em" }}
                  animate={{ opacity: 1, letterSpacing: "0.5em" }}
                  transition={{ delay: 1.7, duration: 0.8 }}
                  className="mt-4 font-display text-[0.6rem] md:text-xs text-muted-foreground/70 uppercase"
                >
                  Your world of games
                </motion.p>
              </motion.div>
            )}

            {/* PHASE 2: FOUNDERS */}
            {phase === "founders" && (
              <motion.div
                key="founders"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(16px)" }}
                transition={{ duration: 0.5 }}
                className="relative z-10 px-6 w-full max-w-3xl text-center"
              >
                {/* Founder cards */}
                <div className="flex justify-center gap-6 md:gap-12 mb-10">
                  {/* Founder */}
                  <motion.div
                    initial={{ opacity: 0, x: -80, rotateY: -25 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    transition={{ delay: 0.1, duration: 0.9, type: "spring", stiffness: 80 }}
                    className="text-center flex-shrink-0"
                  >
                    <motion.div
                      animate={{ boxShadow: ["0 0 20px hsl(185 100% 50% / 0.2)", "0 0 50px hsl(185 100% 50% / 0.5)", "0 0 20px hsl(185 100% 50% / 0.2)"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-28 h-28 md:w-40 md:h-40 rounded-2xl border-2 border-primary/60 bg-gradient-to-br from-primary/20 to-primary/5 mx-auto mb-4 flex items-center justify-center overflow-hidden"
                    >
                      <span className="font-display text-[10px] text-primary/50 tracking-wider">PHOTO</span>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      className="font-display text-[9px] tracking-[0.4em] text-primary uppercase mb-1"
                    >
                      Founder
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.4 }}
                      className="font-display text-sm md:text-base font-bold text-foreground"
                    >
                      Aathish Kannayil Ajesh
                    </motion.p>
                  </motion.div>

                  {/* Co-Founder */}
                  <motion.div
                    initial={{ opacity: 0, x: 80, rotateY: 25 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    transition={{ delay: 0.25, duration: 0.9, type: "spring", stiffness: 80 }}
                    className="text-center flex-shrink-0"
                  >
                    <motion.div
                      animate={{ boxShadow: ["0 0 20px hsl(300 80% 60% / 0.2)", "0 0 50px hsl(300 80% 60% / 0.5)", "0 0 20px hsl(300 80% 60% / 0.2)"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="w-28 h-28 md:w-40 md:h-40 rounded-2xl border-2 border-secondary/60 bg-gradient-to-br from-secondary/20 to-secondary/5 mx-auto mb-4 flex items-center justify-center overflow-hidden"
                    >
                      <span className="font-display text-[10px] text-secondary/50 tracking-wider">PHOTO</span>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65, duration: 0.4 }}
                      className="font-display text-[9px] tracking-[0.4em] text-secondary uppercase mb-1"
                    >
                      Co-Founder
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.75, duration: 0.4 }}
                      className="font-display text-sm md:text-base font-bold text-foreground"
                    >
                      Aagney Kannayil Ajesh
                    </motion.p>
                  </motion.div>
                </div>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
                  className="mx-auto w-48 h-[1px] bg-gradient-to-r from-transparent via-muted-foreground/40 to-transparent mb-8"
                />

                {/* A.K.A big */}
                <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.1, duration: 0.9, type: "spring", stiffness: 90 }}
                >
                  <p className="font-display text-[10px] tracking-[0.6em] text-muted-foreground/60 uppercase mb-3">
                    Presented by
                  </p>
                  <motion.h2
                    animate={{ textShadow: ["0 0 20px hsl(45 100% 60% / 0.4)", "0 0 60px hsl(45 100% 60% / 0.8)", "0 0 20px hsl(45 100% 60% / 0.4)"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-3xl md:text-5xl lg:text-6xl font-display font-black text-accent leading-tight"
                  >
                    THE KANNAYIL BROTHERS
                  </motion.h2>
                </motion.div>

                {/* Bottom line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.7, duration: 1, ease: "easeOut" }}
                  className="mt-8 mx-auto h-[2px] w-64 bg-gradient-to-r from-primary via-accent to-secondary"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
