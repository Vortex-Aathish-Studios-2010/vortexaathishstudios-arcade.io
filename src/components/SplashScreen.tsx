import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 600);
    }, 3200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        >
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 40, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              className="text-6xl md:text-8xl font-display font-black mb-6"
            >
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-primary text-glow-primary"
              >
                ARCADE
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-secondary text-glow-secondary"
              >
                .IO
              </motion.span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="space-y-1"
            >
              <p className="text-sm text-muted-foreground font-display tracking-wider">
                Founded by — <span className="text-foreground font-semibold">Aathish Kannayil Ajesh</span>
              </p>
              <p className="text-sm text-muted-foreground font-display tracking-wider">
                Co-Founded by — <span className="text-foreground font-semibold">Aagney Kannayil Ajesh</span>
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              className="mt-4 text-xs text-muted-foreground/70 font-display italic"
            >
              (A.K.A — The Kannayil Brothers)
            </motion.p>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 2.2, duration: 0.8, ease: "easeOut" }}
              className="mt-8 mx-auto w-48 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-full origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
