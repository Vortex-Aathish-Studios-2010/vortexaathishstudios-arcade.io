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
      setShowDeviceSelector(true);
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
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) {
        import("@/lib/sounds").then(({ sfx }) => sfx.click?.());
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DeviceProvider>
        <BigNotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            {showDeviceSelector && <DeviceSelector onSelect={handleDeviceSelect} />}
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

export default App;
