import { motion } from "framer-motion";
import { Monitor, Smartphone, Tablet } from "lucide-react";

export type DeviceType = "laptop" | "phone" | "tablet";

const DEVICE_KEY = "arcade_device_type";

export const getDeviceType = (): DeviceType | null => {
  return localStorage.getItem(DEVICE_KEY) as DeviceType | null;
};

export const setDeviceType = (device: DeviceType) => {
  localStorage.setItem(DEVICE_KEY, device);
};

interface DeviceSelectorProps {
  onSelect: (device: DeviceType) => void;
}

export const DeviceSelector = ({ onSelect }: DeviceSelectorProps) => {
  const devices = [
    { type: "phone" as DeviceType, icon: Smartphone, label: "Phone", desc: "Touch controls" },
    { type: "tablet" as DeviceType, icon: Tablet, label: "Tablet", desc: "Touch + larger screen" },
    { type: "laptop" as DeviceType, icon: Monitor, label: "Laptop", desc: "Mouse & keyboard" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(12px)" }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background p-6"
    >
      <div className="text-center max-w-md w-full">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-display font-black text-foreground mb-2"
        >
          What are you playing on?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground mb-8"
        >
          We'll optimize controls for your device
        </motion.p>

        <div className="grid grid-cols-3 gap-3">
          {devices.map((d, i) => (
            <motion.button
              key={d.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 120 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setDeviceType(d.type);
                onSelect(d.type);
              }}
              className="rounded-2xl border-2 border-primary/30 bg-card p-5 text-center hover:border-primary hover:glow-primary transition-all"
            >
              <d.icon className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-display text-sm font-bold text-foreground mb-1">{d.label}</h3>
              <p className="text-[10px] text-muted-foreground">{d.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
