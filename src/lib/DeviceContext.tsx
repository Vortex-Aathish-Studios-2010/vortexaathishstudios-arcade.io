import React, { createContext, useContext, useState } from "react";
import { DeviceType, getDeviceType, setDeviceType as saveDeviceType } from "@/components/DeviceSelector";

interface DeviceContextType {
  device: DeviceType | null;
  setDevice: (device: DeviceType) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [device, setDeviceState] = useState<DeviceType | null>(() => getDeviceType());

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
