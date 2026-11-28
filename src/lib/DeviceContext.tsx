import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  DeviceType,
  getDeviceType,
  setDeviceType as saveDeviceType,
} from "@/components/DeviceSelector";
import {
  detectDevice,
  preferredOrientation,
  orientationController,
} from "./deviceLayout";

interface DeviceContextType {
  device: DeviceType;
  setDevice: (device: DeviceType) => void;
  setActiveGame: (id: string | null) => void;
}
const DeviceContext = createContext<DeviceContextType | undefined>(undefined);
const rotateNative = orientationController(ScreenOrientation);
function metrics() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    touch: window.matchMedia("(pointer: coarse)").matches,
    native: Capacitor.isNativePlatform(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
}
export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [viewport, setViewport] = useState(metrics);
  const [override, setOverride] = useState(getDeviceType);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const detected = detectDevice(viewport),
    device = override || detected;
  const posture = viewport.width > viewport.height ? "landscape" : "portrait";
  const orientation = preferredOrientation(detected, activeGame);
  useEffect(() => {
    const resize = () => setViewport(metrics());
    window.addEventListener("resize", resize);
    window.screen.orientation?.addEventListener("change", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.screen.orientation?.removeEventListener("change", resize);
    };
  }, []);
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.device = device;
    root.dataset.posture = posture;
    root.dataset.game = activeGame || "lobby";
    return () => {
      delete root.dataset.device;
      delete root.dataset.posture;
      delete root.dataset.game;
    };
  }, [device, posture, activeGame]);
  useEffect(() => {
    if (Capacitor.isNativePlatform())
      void rotateNative(orientation).catch(() => {});
  }, [orientation]);
  useEffect(
    () => () => {
      if (Capacitor.isNativePlatform())
        void rotateNative("any").catch(() => {});
    },
    [],
  );
  const setDevice = useCallback((next: DeviceType) => {
    saveDeviceType(next);
    setOverride(next);
  }, []);
  return (
    <DeviceContext.Provider value={{ device, setDevice, setActiveGame }}>
      {children}
    </DeviceContext.Provider>
  );
};
export function useDevice() {
  const value = useContext(DeviceContext);
  if (!value) throw new Error("useDevice must be used within a DeviceProvider");
  return value;
}
export function useGameOrientation(game?: string | null) {
  const { setActiveGame } = useDevice();
  useEffect(() => {
    setActiveGame(game || null);
    return () => setActiveGame(null);
  }, [game, setActiveGame]);
}
