import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type NotificationType = "success" | "error" | "info";

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  duration: number;
}

interface GameNotificationContextType {
  notify: (message: string, type?: NotificationType, duration?: number) => void;
}

const GameNotificationContext = createContext<GameNotificationContextType | null>(null);

export const useGameNotification = () => {
  const context = useContext(GameNotificationContext);
  if (!context) throw new Error("useGameNotification must be used within GameNotificationProvider");
  return context;
};

/** Standalone callable – works after provider mounts */
let globalNotify: GameNotificationContextType["notify"] | null = null;
export const showNotification = (message: string, type: NotificationType = "info", duration?: number) => {
  globalNotify?.(message, type, duration);
};

const typeConfig: Record<NotificationType, { icon: typeof CheckCircle; bg: string; border: string; glow: string }> = {
  success: {
    icon: CheckCircle,
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    glow: "shadow-[0_4px_24px_-4px_rgba(16,185,129,0.35)]",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    glow: "shadow-[0_4px_24px_-4px_rgba(239,68,68,0.35)]",
  },
  info: {
    icon: Info,
    bg: "bg-primary/15",
    border: "border-primary/30",
    glow: "shadow-[0_4px_24px_-4px_hsl(185_100%_50%/0.3)]",
  },
};

const MAX_VISIBLE = 5;

export const GameNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback((message: string, type: NotificationType = "info", duration: number = 2500) => {
    const id = ++idRef.current;
    setNotifications((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, message, type, duration }]);
  }, []);

  // expose globally
  useEffect(() => {
    globalNotify = notify;
    return () => { globalNotify = null; };
  }, [notify]);

  return (
    <GameNotificationContext.Provider value={{ notify }}>
      {children}

      {/* Notification container – top-center, above everything */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4 md:max-w-md">
        <AnimatePresence mode="popLayout">
          {notifications.map((n) => (
            <NotificationToast key={n.id} notification={n} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </GameNotificationContext.Provider>
  );
};

const NotificationToast = ({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: number) => void;
}) => {
  const { id, message, type, duration } = notification;
  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -32, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }}
      transition={{ type: "spring", damping: 28, stiffness: 380 }}
      className={`pointer-events-auto w-full flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md ${config.bg} ${config.border} ${config.glow}`}
    >
      <Icon className="shrink-0 w-5 h-5" style={{ color: type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "hsl(185 100% 50%)" }} />
      <span className="flex-1 text-sm font-medium text-foreground leading-snug">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </motion.div>
  );
};
