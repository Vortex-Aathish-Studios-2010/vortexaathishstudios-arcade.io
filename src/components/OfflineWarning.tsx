import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineWarning = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await Network.getStatus();
        setIsOffline(!status.connected);
      } catch (e) {}
    };
    checkStatus();

    let listener: any;
    try {
      Network.addListener('networkStatusChange', status => {
        setIsOffline(!status.connected);
      }).then(l => listener = l);
    } catch(e) {}

    return () => {
      if (listener) listener.remove();
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-[env(safe-area-inset-top,1rem)] left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 bg-destructive/90 backdrop-blur text-destructive-foreground rounded-full shadow-lg border border-destructive/50 pointer-events-none"
        >
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-display font-medium">Offline Mode</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
