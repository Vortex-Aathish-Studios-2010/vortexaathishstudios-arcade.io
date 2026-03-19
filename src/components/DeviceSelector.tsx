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
    { type: "phone" as DeviceType, icon: Smartphone, label: "Phone", desc: "Touch controls", color: "primary" },
    { type: "tablet" as DeviceType, icon: Tablet, label: "Tablet", desc: "Touch + larger screen", color: "secondary" },
    { type: "laptop" as DeviceType, icon: Monitor, label: "Laptop", desc: "Mouse & keyboard", color: "accent" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(16px)" }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background p-6 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="text-center max-w-lg w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-display font-black text-foreground mb-3">
            What are you <span className="text-primary text-glow-primary">playing on?</span>
          </h2>
          <p className="text-sm text-muted-foreground font-display tracking-wider">
            We'll optimize the controls for your device
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {devices.map((d, i) => (
            <motion.button
              key={d.type}
              initial={{ opacity: 0, y: 30, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.12, type: "spring", stiffness: 140, damping: 14 }}
              whileHover={{ scale: 1.08, y: -6 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                setDeviceType(d.type);
                onSelect(d.type);
              }}
              className={`relative rounded-2xl border-2 bg-card overflow-hidden py-8 px-4 text-center transition-all duration-300
                ${d.color === "primary" ? "border-primary/30 hover:border-primary hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)]" : ""}
                ${d.color === "secondary" ? "border-secondary/30 hover:border-secondary hover:shadow-[0_0_40px_hsl(var(--secondary)/0.3)]" : ""}
                ${d.color === "accent" ? "border-accent/30 hover:border-accent hover:shadow-[0_0_40px_hsl(var(--accent)/0.3)]" : ""}
              `}
            >
              <d.icon className={`h-14 w-14 mx-auto mb-4
                ${d.color === "primary" ? "text-primary" : ""}
                ${d.color === "secondary" ? "text-secondary" : ""}
                ${d.color === "accent" ? "text-accent" : ""}
              `} />
              <h3 className="font-display text-base font-bold text-foreground mb-1">{d.label}</h3>
              <p className="text-[10px] text-muted-foreground font-display">{d.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
