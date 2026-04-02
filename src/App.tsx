import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SplashScreen } from "@/components/SplashScreen";
import { DeviceSelector, getDeviceType, DeviceType } from "@/components/DeviceSelector";
import { AuthGate } from "@/components/AuthGate";
import { DeviceProvider } from "@/lib/DeviceContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import GamePage from "./pages/GamePage";
import EntertainmentPage from "./pages/EntertainmentPage";
import EntertainmentGamePage from "./pages/EntertainmentGamePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import NotFound from "./pages/NotFound";
import { BigNotificationProvider } from "./components/BigNotification";

const queryClient = new QueryClient();

const AppFlow = () => {
  const { user, isGuest, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [ready, setReady] = useState(false);

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (!getDeviceType()) {
      setShowDeviceSelector(true);
    } else {
      // Device already selected, go to auth
      if (!user && !isGuest) {
        setShowAuthGate(true);
      } else {
        setReady(true);
      }
    }
  };

  const handleDeviceSelect = (_device: DeviceType) => {
    setShowDeviceSelector(false);
    if (!user && !isGuest) {
      setShowAuthGate(true);
    } else {
      setReady(true);
    }
  };

  const handleAuthComplete = () => {
    setShowAuthGate(false);
    setReady(true);
  };

  // If user logs in via OAuth redirect (page reload), skip gates
  useEffect(() => {
    if (!loading && user && !ready && !showSplash) {
      setShowDeviceSelector(false);
      setShowAuthGate(false);
      setReady(true);
    }
  }, [user, loading]);

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
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {showDeviceSelector && <DeviceSelector onSelect={handleDeviceSelect} />}
      {showAuthGate && <AuthGate onComplete={handleAuthComplete} />}
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
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DeviceProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppFlow />
          </TooltipProvider>
        </DeviceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
