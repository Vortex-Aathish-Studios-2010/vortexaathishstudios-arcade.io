import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationContextType {
  showNotification: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useBigNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useBigNotification must be used within a BigNotificationProvider");
  return context;
};

export const BigNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notification, setNotification] = useState<{ message: string; duration: number } | null>(null);

  const showNotification = useCallback((message: string, duration: number = 4000) => {
    setNotification({ message, duration });
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-xl bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 1.1, y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="px-12 py-8 rounded-3xl bg-white/10 border border-white/20 shadow-2xl text-center max-w-lg mx-4"
            >
              <h2 className="text-4xl md:text-5xl font-display font-black text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {notification.message.toUpperCase()}
              </h2>
              <div className="mt-6 flex justify-center gap-1">
                <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: notification.duration / 1000, ease: "linear" }}
                    className="h-1 bg-primary rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};
