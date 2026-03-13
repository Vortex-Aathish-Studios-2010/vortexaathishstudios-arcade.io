import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SplashScreen } from "@/components/SplashScreen";
import { DeviceSelector, getDeviceType, DeviceType } from "@/components/DeviceSelector";
import Index from "./pages/Index";
import GamePage from "./pages/GamePage";
import EntertainmentPage from "./pages/EntertainmentPage";
import EntertainmentGamePage from "./pages/EntertainmentGamePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [ready, setReady] = useState(!!getDeviceType() ? false : false); // will be set after flow

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (!getDeviceType()) {
      setShowDeviceSelector(true);
    } else {
      setReady(true);
    }
  };

  const handleDeviceSelect = (_device: DeviceType) => {
    setShowDeviceSelector(false);
    setReady(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
};

export default App;
