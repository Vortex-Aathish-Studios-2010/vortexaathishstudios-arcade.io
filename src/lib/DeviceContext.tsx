import { Capacitor } from "@capacitor/core";
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  DeviceType,
  getDeviceType,
  setDeviceType as saveDeviceType,
} from "@/components/DeviceSelector";

interface DeviceContextType {
  device: DeviceType | null;
  setDevice: (device: DeviceType) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

function detectDevice(): DeviceType {
  const touch =
    Capacitor.isNativePlatform() ||
    window.matchMedia("(pointer: coarse)").matches;
  if (
    window.innerWidth < 600 ||
    (touch && Math.min(window.innerWidth, window.innerHeight) < 600)
  )
    return "phone";
  return touch || window.innerWidth < 1024 ? "tablet" : "laptop";
}

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [device, setDeviceState] = useState<DeviceType>(
    () => getDeviceType() || detectDevice(),
  );
  useEffect(() => {
    const resized = () => {
      if (!getDeviceType()) setDeviceState(detectDevice());
    };
    window.addEventListener("resize", resized);
    return () => window.removeEventListener("resize", resized);
  }, []);

  const setDevice = (newDevice: DeviceType) => {
    saveDeviceType(newDevice);
    setDeviceState(newDevice);
  };

  return (
    <DeviceContext.Provider value={{ device, setDevice }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return context;
};
