import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SplashScreen } from "@/components/SplashScreen";
import { DeviceSelector, getDeviceType, DeviceType } from "@/components/DeviceSelector";
import { UsernameGate } from "@/components/UsernameGate";
import { DeviceProvider } from "@/lib/DeviceContext";
import Index from "./pages/Index";
import GamePage from "./pages/GamePage";
import EntertainmentPage from "./pages/EntertainmentPage";
import EntertainmentGamePage from "./pages/EntertainmentGamePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import NotFound from "./pages/NotFound";
import { BigNotificationProvider } from "./components/BigNotification";
import { ensureAnonymousAuth } from "@/lib/auth";
import { getPlayerName } from "@/lib/streaks";
import { OfflineWarning } from "./components/OfflineWarning";
import { App as CapApp } from '@capacitor/app';
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

const queryClient = new QueryClient();

const AppFlow = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [showUsernameGate, setShowUsernameGate] = useState(false);
  const [ready, setReady] = useState(false);

  const handleSplashComplete = async () => {
    setShowSplash(false);
    // Ensure anonymous auth session exists for returning users
    try { await ensureAnonymousAuth(); } catch { /* handled later */ }
    if (!getDeviceType()) {
      import("@/components/DeviceSelector").then(({ setDeviceType }) => {
        // Auto-detect based on screen width
        // Common thresholds: < 768px = phone, >= 768px = tablet/laptop
        // But since this is building an Android app, laptops are practically tablets
        const width = window.innerWidth;
        const isCapacitor = Capacitor.isNativePlatform();
        
        let autoDevice: DeviceType = "laptop";
        if (isCapacitor) {
          autoDevice = width < 600 ? "phone" : "tablet";
        } else {
          if (width < 600) autoDevice = "phone";
          else if (width < 1024) autoDevice = "tablet";
          else autoDevice = "laptop";
        }
        
        setDeviceType(autoDevice);
        if (!getPlayerName()) {
          setShowUsernameGate(true);
        } else {
          setReady(true);
        }
      });
    } else if (!getPlayerName()) {
      setShowUsernameGate(true);
    } else {
      setReady(true);
    }
  };

  const handleDeviceSelect = (_device: DeviceType) => {
    setShowDeviceSelector(false);
    if (!getPlayerName()) {
      setShowUsernameGate(true);
    } else {
      setReady(true);
    }
  };

  const handleUsernameComplete = (_username: string) => {
    setShowUsernameGate(false);
    setReady(true);
  };

  useEffect(() => {
    const initCapacitor = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: true });
        await CapSplashScreen.hide();
      } catch (e) {
        // Not running in Capacitor / error
      }

      try {
        CapApp.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            CapApp.exitApp();
          } else {
            window.history.back();
          }
        });
      } catch(e) {}
    };
    initCapacitor();

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) {
        import("@/lib/sounds").then(({ sfx }) => sfx.click?.());
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      CapApp.removeAllListeners();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DeviceProvider>
        <BigNotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineWarning />
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            {/* DeviceSelector removed in favor of auto-detect on splash completion */}
            {showUsernameGate && <UsernameGate onComplete={handleUsernameComplete} />}
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/game/:id" element={<GamePage />} />
                <Route path="/entertainment" element={<EntertainmentPage />} />
                <Route path="/entertainment/:id" element={<EntertainmentGamePage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </BigNotificationProvider>
      </DeviceProvider>
    </QueryClientProvider>
  );
};

export default AppFlow;
