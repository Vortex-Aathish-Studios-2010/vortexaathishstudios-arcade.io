import { Capacitor } from "@capacitor/core";
import { WifiOff, HardDriveDownload } from "lucide-react";
import { useOnline } from "@/lib/connectivity";

// In the launcher, never cover the game or its touch controls with a warning.
export function OfflineWarning() {
  const online = useOnline();
  if (!Capacitor.isNativePlatform() && online) return null;
  return (
    <div className="offline-ready" role="status">
      {online ? <HardDriveDownload size={16} /> : <WifiOff size={16} />}
      <span>
        {online
          ? "16 solo games installed · ready offline"
          : "Offline · all 16 solo games ready"}
      </span>
    </div>
  );
}
